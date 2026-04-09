import { FastifyInstance } from 'fastify'

export default async function aiRoutes(app: FastifyInstance) {
  app.post('/spec', async (request) => {
    const body = request.body as { featureId: string; prompt: string }
    return {
      data: {
        contentMd: `# Feature Spec\n\n${body.prompt}\n\n## User Stories\n\n- As a user, I want to...\n`,
      },
      message: 'Spec generated - mock',
    }
  })

  app.post('/plan', async (request) => {
    const body = request.body as { featureId: string; specId: string }
    return {
      data: {
        contentMd: `# Technical Plan\n\n## Architecture\n\n...\n\n## Tasks\n\n- [ ] Task 1\n- [ ] Task 2\n`,
      },
      message: 'Plan generated - mock',
    }
  })

  app.post('/tasks', async (request) => {
    const body = request.body as { featureId: string; planId: string }
    return {
      data: {
        tasks: [
          { title: 'Task 1', description: 'First task', priority: 'high', agent: 'copilot' },
          { title: 'Task 2', description: 'Second task', priority: 'medium', agent: 'copilot' },
        ],
      },
      message: 'Tasks generated - mock',
    }
  })
}
