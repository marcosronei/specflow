import { FastifyInstance } from 'fastify'

export default async function projectRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    return { data: [], message: 'List projects - mock' }
  })

  app.get('/:id', async (request) => {
    const { id } = request.params as { id: string }
    return { data: { id }, message: 'Get project - mock' }
  })

  app.post('/', async (request) => {
    const body = request.body as Record<string, unknown>
    return { data: { id: crypto.randomUUID(), ...body }, message: 'Project created - mock' }
  })

  app.put('/:id', async (request) => {
    const { id } = request.params as { id: string }
    const body = request.body as Record<string, unknown>
    return { data: { id, ...body }, message: 'Project updated - mock' }
  })

  app.delete('/:id', async (request) => {
    const { id } = request.params as { id: string }
    return { data: { id }, message: 'Project deleted - mock' }
  })
}
