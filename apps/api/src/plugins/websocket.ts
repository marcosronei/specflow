import { FastifyInstance } from 'fastify'
import websocket from '@fastify/websocket'
import { agentRunner } from '../services/agentRunner.js'

// Track WebSocket connections per task
const taskConnections = new Map<string, Set<any>>()

export function broadcastToTask(taskId: string, message: object) {
  const conns = taskConnections.get(taskId)
  if (conns) {
    const data = JSON.stringify(message)
    conns.forEach((conn) => {
      try {
        conn.send(data)
      } catch {}
    })
  }
}

export async function registerWebSocket(app: FastifyInstance) {
  await app.register(websocket)

  app.get('/ws/tasks/:taskId/terminal', { websocket: true }, (socket, request) => {
    const { taskId } = request.params as { taskId: string }

    if (!taskConnections.has(taskId)) {
      taskConnections.set(taskId, new Set())
    }
    taskConnections.get(taskId)!.add(socket)

    socket.on('message', async (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString())
        if (msg.type === 'stop') {
          await agentRunner.stopAgent(taskId)
          socket.send(JSON.stringify({ type: 'complete', exitCode: -1 }))
        }
      } catch {}
    })

    socket.on('close', () => {
      taskConnections.get(taskId)?.delete(socket)
    })
  })
}

