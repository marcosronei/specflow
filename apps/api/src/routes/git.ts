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
}
