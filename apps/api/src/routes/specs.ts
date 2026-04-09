import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function specRoutes(app: FastifyInstance) {
  // GET /specs/:id — get spec by id
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      const spec = await prisma.spec.findUnique({ where: { id } })
      if (!spec) return reply.status(404).send({ error: 'Spec not found' })
      return reply.send({ data: spec })
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to fetch spec' })
    }
  })

  // PUT /specs/:id — update spec by id
  app.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = request.body as { contentMd?: string; status?: string }
    try {
      const spec = await prisma.spec.update({
        where: { id },
        data: {
          ...(body.contentMd !== undefined && { contentMd: body.contentMd }),
          ...(body.status && { status: body.status as 'draft' | 'in_review' | 'approved' }),
          version: { increment: 1 },
        },
      })
      return reply.send({ data: spec, message: 'Spec updated' })
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code: string }).code === 'P2025'
      ) {
        return reply.status(404).send({ error: 'Spec not found' })
      }
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to update spec' })
    }
  })
}
