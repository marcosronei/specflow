import { FastifyInstance } from 'fastify'

export default async function featureRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    return { data: [], message: 'List features - mock' }
  })

  app.get('/:id', async (request) => {
    const { id } = request.params as { id: string }
    return { data: { id }, message: 'Get feature - mock' }
  })

  app.post('/', async (request) => {
    const body = request.body as Record<string, unknown>
    return { data: { id: crypto.randomUUID(), ...body }, message: 'Feature created - mock' }
  })

  app.put('/:id', async (request) => {
    const { id } = request.params as { id: string }
    const body = request.body as Record<string, unknown>
    return { data: { id, ...body }, message: 'Feature updated - mock' }
  })

  app.delete('/:id', async (request) => {
    const { id } = request.params as { id: string }
    return { data: { id }, message: 'Feature deleted - mock' }
  })
}
