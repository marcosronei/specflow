import simpleGit, { SimpleGit } from 'simple-git'

export class GitService {
  private git: SimpleGit

  constructor(repoPath: string = process.cwd()) {
    this.git = simpleGit(repoPath)
  }

  async getStatus() {
    return this.git.status()
  }

  async getCurrentBranch(): Promise<string> {
    const branch = await this.git.branch()
    return branch.current
  }

  async createBranch(name: string): Promise<void> {
    await this.git.checkoutLocalBranch(name)
  }

  async commit(message: string, files?: string[]): Promise<string> {
    if (files && files.length > 0) {
      await this.git.add(files)
    } else {
      await this.git.add('.')
    }
    const result = await this.git.commit(message)
    return result.commit
  }

  async push(remote = 'origin', branch?: string): Promise<void> {
    const currentBranch = branch || (await this.getCurrentBranch())
    await this.git.push(remote, currentBranch)
  }

  async getDiff(from?: string, to?: string): Promise<string> {
    if (from && to) {
      return this.git.diff([from, to])
    }
    return this.git.diff()
  }
}

export const gitService = new GitService()
