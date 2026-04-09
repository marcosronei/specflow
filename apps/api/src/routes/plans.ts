import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function planRoutes(app: FastifyInstance) {
  // GET /plans/:id — get plan by id
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      const plan = await prisma.plan.findUnique({ where: { id } })
      if (!plan) return reply.status(404).send({ error: 'Plan not found' })
      return reply.send({ data: plan })
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to fetch plan' })
    }
  })

  // PUT /plans/:id — update plan by id
  app.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = request.body as { contentMd?: string; dataModel?: string; apiSpec?: string }
    try {
      const plan = await prisma.plan.update({ where: { id }, data: body })
      return reply.send({ data: plan, message: 'Plan updated' })
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code: string }).code === 'P2025'
      ) {
        return reply.status(404).send({ error: 'Plan not found' })
      }
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to update plan' })
    }
  })
}
