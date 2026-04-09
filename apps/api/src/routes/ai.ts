import { FastifyInstance } from 'fastify'
import { aiService } from '../services/aiService.js'

export default async function aiRoutes(app: FastifyInstance) {
  app.post('/spec', async (request, reply) => {
    const body = request.body as { featureId: string; prompt: string }
    try {
      const contentMd = await aiService.generateSpec(body.prompt)
      return reply.send({ data: { contentMd } })
    } catch (err) {
      app.log.error(err)
      return reply.status(503).send({ error: 'AI service unavailable' })
    }
  })

  app.post('/plan', async (request, reply) => {
    const body = request.body as { featureId: string; spec: string }
    try {
      const contentMd = await aiService.generatePlan(body.spec)
      return reply.send({ data: { contentMd } })
    } catch (err) {
      app.log.error(err)
      return reply.status(503).send({ error: 'AI service unavailable' })
    }
  })

  app.post('/tasks', async (request, reply) => {
    const body = request.body as { featureId: string; plan: string }
    try {
      const tasks = await aiService.generateTasks(body.plan)
      return reply.send({ data: { tasks } })
    } catch (err) {
      app.log.error(err)
      return reply.status(503).send({ error: 'AI service unavailable' })
    }
  })
}
