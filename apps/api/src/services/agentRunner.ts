import { spawn, ChildProcess } from 'child_process'

export interface AgentRunOptions {
  taskId: string
  projectPath: string
  worktreePath: string
  agent: 'claude' | 'copilot'
  prompt: string
  onOutput: (line: string) => void
  onComplete: (exitCode: number) => void
}

interface RunningAgent {
  pid: number
  process: ChildProcess
  kill: () => void
}

class AgentRunner {
  private runningAgents: Map<string, RunningAgent> = new Map()

  buildPrompt(options: {
    constitution?: string
    specContent?: string
    planContent?: string
    taskTitle: string
    taskDescription?: string
  }): string {
    return `Context:
- Project Constitution: ${options.constitution || 'Not defined'}
- Feature Spec: ${options.specContent || 'Not available'}
- Technical Plan: ${options.planContent || 'Not available'}

Task to implement:
Title: ${options.taskTitle}
Description: ${options.taskDescription || 'No description provided'}

Please implement this task completely. Create/modify all necessary files.`
  }

  async runAgent(options: AgentRunOptions): Promise<{ pid: number; kill: () => void }> {
    const { taskId, worktreePath, agent, prompt, onOutput, onComplete } = options

    // Stop any existing agent for this task
    await this.stopAgent(taskId)

    let command: string
    let args: string[]

    if (agent === 'claude') {
      command = 'claude'
      args = ['-p', prompt]
    } else {
      command = 'gh'
      args = ['copilot', 'suggest', prompt]
    }

    const proc = spawn(command, args, {
      cwd: worktreePath,
      shell: false,
      env: { ...process.env },
    })

    const running: RunningAgent = {
      pid: proc.pid || 0,
      process: proc,
      kill: () => {
        try {
          proc.kill('SIGTERM')
        } catch {}
      },
    }

    this.runningAgents.set(taskId, running)

    proc.stdout?.on('data', (data: Buffer) => {
      const lines = data.toString().split('\n')
      lines.forEach((line) => {
        if (line) onOutput(line)
      })
    })

    proc.stderr?.on('data', (data: Buffer) => {
      const lines = data.toString().split('\n')
      lines.forEach((line) => {
        if (line) onOutput(`[stderr] ${line}`)
      })
    })

    proc.on('close', (code) => {
      this.runningAgents.delete(taskId)
      onComplete(code ?? 1)
    })

    proc.on('error', (err) => {
      this.runningAgents.delete(taskId)
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        if (agent === 'claude') {
          onOutput('ERROR: Claude Code CLI not found. Install with: npm install -g @anthropic-ai/claude-code')
        } else {
          onOutput('ERROR: GitHub Copilot CLI not found. Install with: gh extension install github/gh-copilot')
        }
      } else {
        onOutput(`ERROR: ${err.message}`)
      }
      onComplete(1)
    })

    return { pid: running.pid, kill: running.kill }
  }

  async stopAgent(taskId: string): Promise<void> {
    const running = this.runningAgents.get(taskId)
    if (running) {
      running.kill()
      this.runningAgents.delete(taskId)
    }
  }

  isRunning(taskId: string): boolean {
    return this.runningAgents.has(taskId)
  }
}

export const agentRunner = new AgentRunner()

// Cleanup on process shutdown
process.on('SIGTERM', () => {
  agentRunner['runningAgents'].forEach((agent) => agent.kill())
})
process.on('SIGINT', () => {
  agentRunner['runningAgents'].forEach((agent) => agent.kill())
})
