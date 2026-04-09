import axios from 'axios'

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000'

export class AIService {
  private client = axios.create({
    baseURL: AI_SERVICE_URL,
    headers: { 'Content-Type': 'application/json' },
  })

  async generateSpec(prompt: string, context?: string): Promise<string> {
    const response = await this.client.post('/spec/generate', { prompt, context })
    return response.data.content
  }

  async generatePlan(spec: string, context?: string): Promise<string> {
    const response = await this.client.post('/plan/generate', { spec, context })
    return response.data.content
  }

  async generateTasks(plan: string): Promise<Array<{ title: string; description: string }>> {
    const response = await this.client.post('/tasks/generate', { plan })
    return response.data.tasks
  }

  async reviewCode(diff: string): Promise<string> {
    const response = await this.client.post('/review/code', { diff })
    return response.data.review
  }
}

export const aiService = new AIService()
