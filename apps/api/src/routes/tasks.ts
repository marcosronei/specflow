import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function taskRoutes(app: FastifyInstance) {
  // GET /tasks/:id — get task by id
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      const task = await prisma.task.findUnique({
        where: { id },
        include: { attempts: true },
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
}
