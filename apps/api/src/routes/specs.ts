import { FastifyInstance } from 'fastify'

export default async function specRoutes(app: FastifyInstance) {
  app.get('/:featureId', async (request) => {
    const { featureId } = request.params as { featureId: string }
    return { data: { featureId, contentMd: '', version: 1, status: 'draft' }, message: 'Get spec - mock' }
  })

  app.post('/', async (request) => {
    const body = request.body as Record<string, unknown>
    return { data: { id: crypto.randomUUID(), ...body }, message: 'Spec created - mock' }
  })

  app.put('/:id', async (request) => {
    const { id } = request.params as { id: string }
    const body = request.body as Record<string, unknown>
    return { data: { id, ...body }, message: 'Spec updated - mock' }
  })
}
