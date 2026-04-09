import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { agentRunner } from '../services/agentRunner.js'
import { workspaceService } from '../services/workspaceService.js'
import { broadcastToTask } from '../plugins/websocket.js'

const prisma = new PrismaClient()

export default async function taskRoutes(app: FastifyInstance) {
  // GET /tasks/:id — get task by id
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      const task = await prisma.task.findUnique({
        where: { id },
        include: { attempts: true, workspace: true },
      })
      if (!task) return reply.status(404).send({ error: 'Task not found' })
      return reply.send({ data: task })
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to fetch task' })
    }
  })

  // PUT /tasks/:id — update task
  app.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = request.body as {
      title?: string
      description?: string
      status?: string
      priority?: string
      agent?: 'copilot' | 'claude'
      isParallel?: boolean
      order?: number
    }

    try {
      const task = await prisma.task.update({
        where: { id },
        data: {
          ...(body.title !== undefined && { title: body.title }),
          ...(body.description !== undefined && { description: body.description }),
          ...(body.status && { status: body.status as 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' }),
          ...(body.priority && { priority: body.priority }),
          ...(body.agent && { agent: body.agent }),
          ...(body.isParallel !== undefined && { isParallel: body.isParallel }),
          ...(body.order !== undefined && { order: body.order }),
        },
      })
      return reply.send({ data: task, message: 'Task updated' })
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code: string }).code === 'P2025'
      ) {
        return reply.status(404).send({ error: 'Task not found' })
      }
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to update task' })
    }
  })

  // DELETE /tasks/:id — delete task
  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      await prisma.task.delete({ where: { id } })
      return reply.send({ message: 'Task deleted' })
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code: string }).code === 'P2025'
      ) {
        return reply.status(404).send({ error: 'Task not found' })
      }
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to delete task' })
    }
  })

  // POST /tasks/:id/execute — start task execution
  app.post('/:id/execute', async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = request.body as { agent?: 'claude' | 'copilot' }
    const agentType = body.agent || 'claude'

    try {
      const task = await prisma.task.findUnique({
        where: { id },
        include: {
          feature: {
            include: {
              project: true,
              spec: true,
              plan: true,
            },
          },
          workspace: true,
        },
      })
      if (!task) return reply.status(404).send({ error: 'Task not found' })

      const project = task.feature.project
      const worktreePath = workspaceService.getWorktreePath(project.path, id)
      const branch = workspaceService.getBranchName(id, task.title)

      // Create or get workspace
      let workspace = task.workspace
      if (!workspace) {
        workspace = await prisma.workspace.create({
          data: {
            taskId: id,
            worktreePath,
            branch,
            status: 'running',
          },
        })
      } else {
        workspace = await prisma.workspace.update({
          where: { id: workspace.id },
          data: { status: 'running', worktreePath, branch },
        })
      }

      // Create worktree (ignore error if already exists)
      try {
        await workspaceService.createWorktree(project.path, branch, worktreePath)
      } catch {
        // worktree may already exist
      }

      // Build prompt
      const prompt = agentRunner.buildPrompt({
        constitution: project.constitution || undefined,
        specContent: task.feature.spec?.contentMd,
        planContent: task.feature.plan?.contentMd,
        taskTitle: task.title,
        taskDescription: task.description || undefined,
      })

      // Create attempt
      const attempt = await prisma.taskAttempt.create({
        data: {
          taskId: id,
          agent: agentType,
          status: 'running',
          startedAt: new Date(),
          prompt,
        },
      })

      // Update task status to in_progress
      await prisma.task.update({
        where: { id },
        data: { status: 'in_progress', agent: agentType },
      })

      let logBuffer = ''

      // Start agent asynchronously
      agentRunner.runAgent({
        taskId: id,
        projectPath: project.path,
        worktreePath,
        agent: agentType,
        prompt,
        onOutput: (line) => {
          logBuffer += line + '\n'
          broadcastToTask(id, { type: 'output', data: line })
        },
        onComplete: async (exitCode) => {
          broadcastToTask(id, { type: 'complete', exitCode })
          const status = exitCode === 0 ? 'completed' : 'failed'
          await prisma.taskAttempt.update({
            where: { id: attempt.id },
            data: {
              status,
              finishedAt: new Date(),
              exitCode,
              log: logBuffer,
            },
          })
          await prisma.workspace.update({
            where: { id: workspace!.id },
            data: { status },
          })
          if (exitCode === 0) {
            await prisma.task.update({
              where: { id },
              data: { status: 'in_review' },
            })
          }
        },
      })

      const wsUrl = `ws://localhost:${process.env.API_PORT || 3001}/ws/tasks/${id}/terminal`
      return reply.send({ data: { attemptId: attempt.id, wsUrl, workspaceId: workspace.id } })
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to start execution' })
    }
  })

  // POST /tasks/:id/stop — stop execution
  app.post('/:id/stop', async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      await agentRunner.stopAgent(id)
      await prisma.workspace.updateMany({
        where: { taskId: id, status: 'running' },
        data: { status: 'idle' },
      })
      await prisma.taskAttempt.updateMany({
        where: { taskId: id, status: 'running' },
        data: { status: 'stopped', finishedAt: new Date(), exitCode: -1 },
      })
      return reply.send({ message: 'Agent stopped' })
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to stop agent' })
    }
  })

  // GET /tasks/:id/attempts — list attempts
  app.get('/:id/attempts', async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      const attempts = await prisma.taskAttempt.findMany({
        where: { taskId: id },
        orderBy: { createdAt: 'desc' },
      })
      return reply.send({ data: attempts })
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to fetch attempts' })
    }
  })

  // GET /tasks/:id/workspace — get workspace
  app.get('/:id/workspace', async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      const workspace = await prisma.workspace.findUnique({
        where: { taskId: id },
        include: { diffs: true, commits: true },
      })
      if (!workspace) return reply.status(404).send({ error: 'Workspace not found' })
      return reply.send({ data: workspace })
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to fetch workspace' })
    }
  })
}

