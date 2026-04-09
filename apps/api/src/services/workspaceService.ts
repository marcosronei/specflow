import simpleGit from 'simple-git'
import * as fs from 'fs'
import * as path from 'path'

export interface WorktreeInfo {
  path: string
  branch: string
  commit: string
}

export class WorkspaceService {
  async createWorktree(projectPath: string, branch: string, worktreePath: string): Promise<void> {
    const git = simpleGit(projectPath)
    fs.mkdirSync(path.dirname(worktreePath), { recursive: true })
    await git.raw(['worktree', 'add', '-b', branch, worktreePath, 'HEAD'])
  }

  async removeWorktree(projectPath: string, worktreePath: string): Promise<void> {
    const git = simpleGit(projectPath)
    await git.raw(['worktree', 'remove', '--force', worktreePath])
  }

  async listWorktrees(projectPath: string): Promise<WorktreeInfo[]> {
    const git = simpleGit(projectPath)
    const result = await git.raw(['worktree', 'list', '--porcelain'])
    const worktrees: WorktreeInfo[] = []
    const blocks = result.trim().split('\n\n')
    for (const block of blocks) {
      const lines = block.split('\n')
      const pathLine = lines.find((l) => l.startsWith('worktree '))
      const branchLine = lines.find((l) => l.startsWith('branch '))
      const commitLine = lines.find((l) => l.startsWith('HEAD '))
      if (pathLine) {
        worktrees.push({
          path: pathLine.replace('worktree ', ''),
          branch: branchLine ? branchLine.replace('branch refs/heads/', '') : 'detached',
          commit: commitLine ? commitLine.replace('HEAD ', '') : '',
        })
      }
    }
    return worktrees
  }

  slugify(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 40)
  }

  getWorktreePath(projectPath: string, taskId: string): string {
    return path.join(projectPath, '.specflow-worktrees', taskId)
  }

  getBranchName(taskId: string, title: string): string {
    return `task/${taskId.substring(0, 8)}-${this.slugify(title)}`
  }

  async getDiff(projectPath: string, baseBranch: string, worktreeBranch: string): Promise<string> {
    const git = simpleGit(projectPath)
    return git.diff([`${baseBranch}...${worktreeBranch}`])
  }

  parseDiff(diff: string): Array<{ filePath: string; content: string; status: 'added' | 'modified' | 'deleted' }> {
    const files: Array<{ filePath: string; content: string; status: 'added' | 'modified' | 'deleted' }> = []
    if (!diff) return files

    const fileDiffs = diff.split(/^diff --git /m).filter(Boolean)
    for (const fileDiff of fileDiffs) {
      const lines = fileDiff.split('\n')
      const headerLine = lines[0]
      const match = headerLine.match(/a\/(.+) b\/(.+)/)
      if (!match) continue

      const filePath = match[2]
      let status: 'added' | 'modified' | 'deleted' = 'modified'
      if (fileDiff.includes('\nnew file mode')) status = 'added'
      if (fileDiff.includes('\ndeleted file mode')) status = 'deleted'

      files.push({ filePath, content: 'diff --git ' + fileDiff, status })
    }
    return files
  }

  async mergeWorktree(projectPath: string, worktreeBranch: string, targetBranch: string): Promise<void> {
    const git = simpleGit(projectPath)
    await git.checkout(targetBranch)
    await git.merge([worktreeBranch, '--no-ff', '-m', `Merge ${worktreeBranch} into ${targetBranch}`])
  }
}

export const workspaceService = new WorkspaceService()
