import axios from 'axios'

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000'

export class AIService {
  private client = axios.create({
    baseURL: AI_SERVICE_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 60000,
  })

  private async post<T>(path: string, data: unknown): Promise<T> {
    try {
      const response = await this.client.post<T>(path, data)
      return response.data
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && !err.response) {
        throw new Error('AI service is offline. Please check that the AI service is running.')
      }
      throw err
    }
  }

  async generateSpec(prompt: string, context?: string): Promise<string> {
    const response = await this.post<{ content: string }>('/spec/generate', { prompt, context })
    return response.content
  }

  async generatePlan(spec: string, context?: string): Promise<string> {
    const response = await this.post<{ content: string }>('/plan/generate', { spec, context })
    return response.content
  }

  async generateTasks(plan: string): Promise<Array<{ title: string; description: string; priority?: string }>> {
    const response = await this.post<{ tasks: Array<{ title: string; description: string; priority?: string }> }>(
      '/tasks/generate',
      { plan },
    )
    return response.tasks
  }

  async reviewCode(diff: string): Promise<string> {
    const response = await this.post<{ review: string }>('/review/code', { diff })
    return response.review
  }
}

export const aiService = new AIService()
