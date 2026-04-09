import { FastifyInstance } from 'fastify'

export default async function taskRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    return { data: [], message: 'List tasks - mock' }
  })

  app.get('/:id', async (request) => {
    const { id } = request.params as { id: string }
    return { data: { id }, message: 'Get task - mock' }
  })

  app.post('/', async (request) => {
    const body = request.body as Record<string, unknown>
    return { data: { id: crypto.randomUUID(), ...body }, message: 'Task created - mock' }
  })

  app.put('/:id', async (request) => {
    const { id } = request.params as { id: string }
    const body = request.body as Record<string, unknown>
    return { data: { id, ...body }, message: 'Task updated - mock' }
  })

  app.delete('/:id', async (request) => {
    const { id } = request.params as { id: string }
    return { data: { id }, message: 'Task deleted - mock' }
  })
}
