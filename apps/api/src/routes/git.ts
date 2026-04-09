import { FastifyInstance } from 'fastify'

export default async function gitRoutes(app: FastifyInstance) {
  app.get('/status', async () => {
    return { data: { status: 'clean', branch: 'main', files: [] }, message: 'Git status - mock' }
  })

  app.post('/commit', async (request) => {
    const body = request.body as { message: string; files?: string[] }
    return { data: { hash: 'abc123', message: body.message }, message: 'Commit created - mock' }
  })

  app.post('/push', async () => {
    return { data: { pushed: true }, message: 'Pushed - mock' }
  })

  app.post('/branch', async (request) => {
    const body = request.body as { name: string }
    return { data: { branch: body.name }, message: 'Branch created - mock' }
  })
}
