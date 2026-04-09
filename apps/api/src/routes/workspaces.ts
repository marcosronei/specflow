import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { workspaceService } from '../services/workspaceService.js'
import simpleGit from 'simple-git'

const prisma = new PrismaClient()

export default async function workspaceRoutes(app: FastifyInstance) {
  // GET /workspaces/:id — details
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      const ws = await prisma.workspace.findUnique({
        where: { id },
        include: { task: { include: { feature: { include: { project: true } } } } },
      })
      if (!ws) return reply.status(404).send({ error: 'Workspace not found' })
      return reply.send({ data: ws })
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to fetch workspace' })
    }
  })

  // GET /workspaces/:id/diff — get diff
  app.get('/:id/diff', async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      const ws = await prisma.workspace.findUnique({
        where: { id },
        include: { task: { include: { feature: { include: { project: true } } } } },
      })
      if (!ws) return reply.status(404).send({ error: 'Workspace not found' })

      const projectPath = ws.task.feature.project.path
      const baseBranch = ws.task.feature.project.mainBranch || 'main'
      const worktreeBranch = ws.branch || ''

      if (!worktreeBranch) return reply.send({ data: { raw: '', files: [] } })

      const raw = await workspaceService.getDiff(projectPath, baseBranch, worktreeBranch)
      const files = workspaceService.parseDiff(raw)
      return reply.send({ data: { raw, files } })
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to get diff' })
    }
  })

  // POST /workspaces/:id/commit — stage all + commit
  app.post('/:id/commit', async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = request.body as { message: string }
    try {
      const ws = await prisma.workspace.findUnique({
        where: { id },
        include: { task: { include: { feature: { include: { project: true } } } } },
      })
      if (!ws) return reply.status(404).send({ error: 'Workspace not found' })
      if (!ws.worktreePath) return reply.status(400).send({ error: 'Workspace has no worktree path' })

      const git = simpleGit(ws.worktreePath)
      await git.add('-A')
      const result = await git.commit(body.message)

      await prisma.commit.create({
        data: { workspaceId: id, message: body.message, hash: result.commit },
      })

      return reply.send({ data: { hash: result.commit }, message: 'Committed' })
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to commit' })
    }
  })

  // POST /workspaces/:id/push — push branch to origin
  app.post('/:id/push', async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      const ws = await prisma.workspace.findUnique({
        where: { id },
        include: { task: { include: { feature: { include: { project: true } } } } },
      })
      if (!ws) return reply.status(404).send({ error: 'Workspace not found' })
      if (!ws.worktreePath) return reply.status(400).send({ error: 'Workspace has no worktree path' })
      if (!ws.branch) return reply.status(400).send({ error: 'Workspace has no branch' })

      const git = simpleGit(ws.worktreePath)
      await git.push('origin', ws.branch, ['--set-upstream'])

      await prisma.commit.updateMany({
        where: { workspaceId: id, pushedAt: null },
        data: { pushedAt: new Date() },
      })

      return reply.send({ message: 'Pushed successfully' })
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to push' })
    }
  })

  // POST /workspaces/:id/merge — merge worktree branch
  app.post('/:id/merge', async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      const ws = await prisma.workspace.findUnique({
        where: { id },
        include: { task: { include: { feature: { include: { project: true } } } } },
      })
      if (!ws) return reply.status(404).send({ error: 'Workspace not found' })
      if (!ws.branch) return reply.status(400).send({ error: 'Workspace has no branch' })

      const projectPath = ws.task.feature.project.path
      const featureBranch = ws.task.feature.branch || ws.task.feature.project.mainBranch || 'main'

      await workspaceService.mergeWorktree(projectPath, ws.branch, featureBranch)
      await prisma.workspace.update({
        where: { id },
        data: { status: 'merged', mergedAt: new Date() },
      })

      return reply.send({ message: 'Merged successfully' })
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to merge' })
    }
  })

  // POST /workspaces/:id/discard — discard worktree
  app.post('/:id/discard', async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      const ws = await prisma.workspace.findUnique({
        where: { id },
        include: { task: { include: { feature: { include: { project: true } } } } },
      })
      if (!ws) return reply.status(404).send({ error: 'Workspace not found' })

      const projectPath = ws.task.feature.project.path
      if (ws.worktreePath) {
        try {
          await workspaceService.removeWorktree(projectPath, ws.worktreePath)
        } catch (err) {
          app.log.warn({ err }, 'Failed to remove worktree, continuing with discard')
        }
        if (ws.branch) {
          try {
            const git = simpleGit(projectPath)
            await git.deleteLocalBranch(ws.branch, true)
          } catch (err) {
            app.log.warn({ err }, 'Failed to delete local branch, continuing with discard')
          }
        }
      }

      await prisma.workspace.update({
        where: { id },
        data: { status: 'discarded', discardedAt: new Date() },
      })

      return reply.send({ message: 'Workspace discarded' })
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to discard workspace' })
    }
  })
}
