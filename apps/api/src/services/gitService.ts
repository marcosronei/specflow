import simpleGit, { SimpleGit } from 'simple-git'
import * as fs from 'fs'

export class GitService {
  private getGit(repoPath: string): SimpleGit {
    return simpleGit(repoPath)
  }

  async validateRepo(path: string): Promise<boolean> {
    try {
      if (!fs.existsSync(path)) return false
      const git = this.getGit(path)
      await git.status()
      return true
    } catch {
      return false
    }
  }

  async createBranch(repoPath: string, branchName: string): Promise<void> {
    const git = this.getGit(repoPath)
    await git.checkoutLocalBranch(branchName)
  }

  async getCurrentBranch(repoPath: string): Promise<string> {
    const git = this.getGit(repoPath)
    const branch = await git.branch()
    return branch.current
  }

  async getStatus(repoPath: string) {
    const git = this.getGit(repoPath)
    return git.status()
  }

  async getDiff(repoPath: string, branch?: string): Promise<string> {
    const git = this.getGit(repoPath)
    if (branch) {
      return git.diff([branch])
    }
    return git.diff()
  }

  async stageAll(repoPath: string): Promise<void> {
    const git = this.getGit(repoPath)
    await git.add('-A')
  }

  async commit(repoPath: string, message: string): Promise<string> {
    const git = this.getGit(repoPath)
    const result = await git.commit(message)
    return result.commit
  }

  async push(repoPath: string, remote = 'origin', branch?: string): Promise<void> {
    const git = this.getGit(repoPath)
    const currentBranch = branch || (await this.getCurrentBranch(repoPath))
    await git.push(remote, currentBranch)
  }

  async listBranches(repoPath: string): Promise<string[]> {
    const git = this.getGit(repoPath)
    const result = await git.branch()
    return result.all
  }
}

export const gitService = new GitService()
