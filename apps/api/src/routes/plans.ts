import { FastifyInstance } from 'fastify'

export default async function planRoutes(app: FastifyInstance) {
  app.get('/:featureId', async (request) => {
    const { featureId } = request.params as { featureId: string }
    return { data: { featureId, contentMd: '', dataModel: null, apiSpec: null }, message: 'Get plan - mock' }
  })

  app.post('/', async (request) => {
    const body = request.body as Record<string, unknown>
    return { data: { id: crypto.randomUUID(), ...body }, message: 'Plan created - mock' }
  })

  app.put('/:id', async (request) => {
    const { id } = request.params as { id: string }
    const body = request.body as Record<string, unknown>
    return { data: { id, ...body }, message: 'Plan updated - mock' }
  })
}
