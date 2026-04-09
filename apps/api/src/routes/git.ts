import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { gitService } from '../services/gitService.js'

const prisma = new PrismaClient()

export default async function gitRoutes(app: FastifyInstance) {
  // GET /git/projects/:id/status — git status for project repo
  app.get('/projects/:id/status', async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      const project = await prisma.project.findUnique({ where: { id } })
      if (!project) return reply.status(404).send({ error: 'Project not found' })

      const status = await gitService.getStatus(project.path)
      return reply.send({ data: status })
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to get git status' })
    }
  })

  // GET /git/projects/:id/branches — list branches
  app.get('/projects/:id/branches', async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      const project = await prisma.project.findUnique({ where: { id } })
      if (!project) return reply.status(404).send({ error: 'Project not found' })

      const branches = await gitService.listBranches(project.path)
      return reply.send({ data: branches })
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to list branches' })
    }
  })

  // POST /git/projects/:id/branch — create branch
  app.post('/projects/:id/branch', async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = request.body as { name: string }

    if (!body.name) return reply.status(400).send({ error: 'Branch name is required' })

    try {
      const project = await prisma.project.findUnique({ where: { id } })
      if (!project) return reply.status(404).send({ error: 'Project not found' })

      await gitService.createBranch(project.path, body.name)
      return reply.send({ data: { branch: body.name }, message: 'Branch created' })
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to create branch' })
    }
  })

  // GET /git/projects/:id/diff — get diff
  app.get('/projects/:id/diff', async (request, reply) => {
    const { id } = request.params as { id: string }
    const { branch } = request.query as { branch?: string }
    try {
      const project = await prisma.project.findUnique({ where: { id } })
      if (!project) return reply.status(404).send({ error: 'Project not found' })

      const diff = await gitService.getDiff(project.path, branch)
      return reply.send({ data: { diff } })
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to get diff' })
    }
  })

  // POST /git/projects/:id/commit — stage all and commit
  app.post('/projects/:id/commit', async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = request.body as { message: string }

    if (!body.message) return reply.status(400).send({ error: 'Commit message is required' })

    try {
      const project = await prisma.project.findUnique({ where: { id } })
      if (!project) return reply.status(404).send({ error: 'Project not found' })

      await gitService.stageAll(project.path)
      const hash = await gitService.commit(project.path, body.message)
      return reply.send({ data: { hash, message: body.message }, message: 'Committed' })
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to commit' })
    }
  })

  // POST /git/projects/:id/push — push to origin
  app.post('/projects/:id/push', async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = request.body as { remote?: string; branch?: string }
    try {
      const project = await prisma.project.findUnique({ where: { id } })
      if (!project) return reply.status(404).send({ error: 'Project not found' })

      await gitService.push(project.path, body.remote || 'origin', body.branch)
      return reply.send({ data: { pushed: true }, message: 'Pushed' })
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to push' })
    }
  })

  // GET /git/status?path=... — git status by path
  app.get('/status', async (request, reply) => {
    const { path } = request.query as { path: string }
    if (!path) return reply.status(400).send({ error: 'path required' })
    try {
      const status = await gitService.getStatus(path)
      return reply.send({ data: status })
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to get status' })
    }
  })

  // GET /git/branches?path=... — list branches by path
  app.get('/branches', async (request, reply) => {
    const { path } = request.query as { path: string }
    if (!path) return reply.status(400).send({ error: 'path required' })
    try {
      const branches = await gitService.listBranches(path)
      const current = await gitService.getCurrentBranch(path)
      return reply.send({ data: { branches, current } })
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to list branches' })
    }
  })

  // GET /git/diff?path=...&branch=...
  app.get('/diff', async (request, reply) => {
    const { path, branch } = request.query as { path: string; branch?: string }
    if (!path) return reply.status(400).send({ error: 'path required' })
    try {
      const diff = await gitService.getDiff(path, branch)
      return reply.send({ data: { diff } })
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to get diff' })
    }
  })

  // POST /git/stage — stage all by path
  app.post('/stage', async (request, reply) => {
    const { path } = request.body as { path: string }
    if (!path) return reply.status(400).send({ error: 'path required' })
    try {
      await gitService.stageAll(path)
      return reply.send({ message: 'All files staged' })
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to stage files' })
    }
  })

  // POST /git/commit — commit by path
  app.post('/commit', async (request, reply) => {
    const { path, message } = request.body as { path: string; message: string }
    if (!path || !message) return reply.status(400).send({ error: 'path and message required' })
    try {
      const hash = await gitService.commit(path, message)
      return reply.send({ data: { hash }, message: 'Committed' })
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to commit' })
    }
  })

  // POST /git/push — push by path
  app.post('/push', async (request, reply) => {
    const { path, branch } = request.body as { path: string; branch?: string }
    if (!path) return reply.status(400).send({ error: 'path required' })
    try {
      await gitService.push(path, 'origin', branch)
      return reply.send({ message: 'Pushed successfully' })
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to push' })
    }
  })

  // POST /git/branch — create branch by path
  app.post('/branch', async (request, reply) => {
    const { path, branch } = request.body as { path: string; branch: string }
    if (!path || !branch) return reply.status(400).send({ error: 'path and branch required' })
    try {
      await gitService.createBranch(path, branch)
      return reply.send({ message: `Branch "${branch}" created` })
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to create branch' })
    }
  })
}
