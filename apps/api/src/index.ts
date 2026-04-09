import Fastify from 'fastify'
import cors from '@fastify/cors'
import { registerWebSocket } from './plugins/websocket.js'

const app = Fastify({
  logger: true,
})

// Register plugins
app.register(cors, {
  origin: ['http://localhost:3000'],
  credentials: true,
})

// Register routes
app.register(import('./routes/projects.js'), { prefix: '/api/projects' })
app.register(import('./routes/features.js'), { prefix: '/api/features' })
app.register(import('./routes/specs.js'), { prefix: '/api/specs' })
app.register(import('./routes/plans.js'), { prefix: '/api/plans' })
app.register(import('./routes/tasks.js'), { prefix: '/api/tasks' })
app.register(import('./routes/workspaces.js'), { prefix: '/api/workspaces' })
app.register(import('./routes/git.js'), { prefix: '/api/git' })
app.register(import('./routes/ai.js'), { prefix: '/api/ai' })

// Health check
app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

const start = async () => {
  try {
    const port = Number(process.env.API_PORT) || 3001
    await registerWebSocket(app)
    await app.listen({ port, host: '0.0.0.0' })
    console.log(`🚀 API Server running on port ${port}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
