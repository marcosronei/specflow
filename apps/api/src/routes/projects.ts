import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'
import simpleGit from 'simple-git'
import * as fs from 'fs'

const prisma = new PrismaClient()

async function isValidGitRepo(path: string): Promise<boolean> {
  try {
    if (!fs.existsSync(path)) return false
    const git = simpleGit(path)
    await git.status()
    return true
  } catch {
    return false
  }
}

export default async function projectRoutes(app: FastifyInstance) {
  // GET /projects — list all projects with feature count
  app.get('/', async (_request, reply) => {
    try {
      const projects = await prisma.project.findMany({
        include: {
          _count: { select: { features: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
      return reply.send({ data: projects })
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to fetch projects' })
    }
  })

  // GET /projects/:id — get project by id
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          features: {
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { tasks: true } } },
          },
          _count: { select: { features: true } },
        },
      })
      if (!project) return reply.status(404).send({ error: 'Project not found' })
      return reply.send({ data: project })
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to fetch project' })
    }
  })

  // POST /projects — create project
  app.post('/', async (request, reply) => {
    const body = request.body as {
      name: string
      path: string
      description?: string
      defaultAgent?: 'copilot' | 'claude'
      mainBranch?: string
    }

    if (!body.name || !body.path) {
      return reply.status(400).send({ error: 'Name and path are required' })
    }

    const isGitRepo = await isValidGitRepo(body.path)
    if (!isGitRepo) {
      return reply.status(400).send({
        error: `Path "${body.path}" is not a valid Git repository`,
      })
    }

    try {
      const project = await prisma.project.create({
        data: {
          name: body.name,
          path: body.path,
          description: body.description,
          defaultAgent: body.defaultAgent || 'copilot',
          mainBranch: body.mainBranch || 'main',
        },
      })
      return reply.status(201).send({ data: project, message: 'Project created' })
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code: string }).code === 'P2002'
      ) {
        return reply.status(400).send({ error: 'A project with this path already exists' })
      }
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to create project' })
    }
  })

  // PUT /projects/:id — update project
  app.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = request.body as {
      name?: string
      description?: string
      defaultAgent?: 'copilot' | 'claude'
      mainBranch?: string
      constitution?: string
    }

    try {
      const project = await prisma.project.update({
        where: { id },
        data: body,
      })
      return reply.send({ data: project, message: 'Project updated' })
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code: string }).code === 'P2025'
      ) {
        return reply.status(404).send({ error: 'Project not found' })
      }
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to update project' })
    }
  })

  // DELETE /projects/:id — delete project and cascade
  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      await prisma.project.delete({ where: { id } })
      return reply.send({ message: 'Project deleted' })
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code: string }).code === 'P2025'
      ) {
        return reply.status(404).send({ error: 'Project not found' })
      }
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to delete project' })
    }
  })
}
