import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function generateSlug(name: string, index?: number): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
  if (index !== undefined) {
    return `${String(index).padStart(3, '0')}-${slug}`
  }
  return slug
}

export default async function featureRoutes(app: FastifyInstance) {
  // GET /features?projectId=... — list features for a project
  app.get('/', async (request, reply) => {
    const { projectId } = request.query as { projectId?: string }
    try {
      const features = await prisma.feature.findMany({
        where: projectId ? { projectId } : undefined,
        include: {
          spec: true,
          plan: true,
          _count: { select: { tasks: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
      return reply.send({ data: features })
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to fetch features' })
    }
  })

  // GET /features/:id — get feature by id
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      const feature = await prisma.feature.findUnique({
        where: { id },
        include: {
          spec: true,
          plan: true,
          tasks: { orderBy: { order: 'asc' } },
          project: true,
        },
      })
      if (!feature) return reply.status(404).send({ error: 'Feature not found' })
      return reply.send({ data: feature })
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to fetch feature' })
    }
  })

  // POST /features — create feature
  app.post('/', async (request, reply) => {
    const body = request.body as {
      projectId: string
      name: string
      slug?: string
    }

    if (!body.projectId || !body.name) {
      return reply.status(400).send({ error: 'projectId and name are required' })
    }

    try {
      // Count existing features in project for slug prefix
      const count = await prisma.feature.count({ where: { projectId: body.projectId } })
      const slug = body.slug || generateSlug(body.name, count + 1)
      const branch = slug

      const feature = await prisma.feature.create({
        data: {
          projectId: body.projectId,
          name: body.name,
          slug,
          branch,
          status: 'draft',
        },
        include: {
          spec: true,
          plan: true,
          _count: { select: { tasks: true } },
        },
      })
      return reply.status(201).send({ data: feature, message: 'Feature created' })
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to create feature' })
    }
  })

  // PUT /features/:id — update feature
  app.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = request.body as {
      name?: string
      status?: 'draft' | 'in_progress' | 'completed'
      branch?: string
    }

    try {
      const feature = await prisma.feature.update({
        where: { id },
        data: body,
        include: { spec: true, plan: true },
      })
      return reply.send({ data: feature, message: 'Feature updated' })
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code: string }).code === 'P2025'
      ) {
        return reply.status(404).send({ error: 'Feature not found' })
      }
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to update feature' })
    }
  })

  // DELETE /features/:id — delete feature
  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      await prisma.feature.delete({ where: { id } })
      return reply.send({ message: 'Feature deleted' })
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code: string }).code === 'P2025'
      ) {
        return reply.status(404).send({ error: 'Feature not found' })
      }
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to delete feature' })
    }
  })

  // GET /features/:featureId/spec — get spec for feature
  app.get('/:featureId/spec', async (request, reply) => {
    const { featureId } = request.params as { featureId: string }
    try {
      const spec = await prisma.spec.findUnique({ where: { featureId } })
      if (!spec) return reply.status(404).send({ error: 'Spec not found' })
      return reply.send({ data: spec })
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to fetch spec' })
    }
  })

  // POST /features/:featureId/spec — create spec
  app.post('/:featureId/spec', async (request, reply) => {
    const { featureId } = request.params as { featureId: string }
    const body = request.body as { contentMd?: string; status?: string }
    try {
      const spec = await prisma.spec.create({
        data: {
          featureId,
          contentMd: body.contentMd || '',
          status: (body.status as 'draft' | 'in_review' | 'approved') || 'draft',
        },
      })
      return reply.status(201).send({ data: spec, message: 'Spec created' })
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code: string }).code === 'P2002'
      ) {
        return reply.status(400).send({ error: 'Spec already exists for this feature' })
      }
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to create spec' })
    }
  })

  // PUT /features/:featureId/spec — update spec
  app.put('/:featureId/spec', async (request, reply) => {
    const { featureId } = request.params as { featureId: string }
    const body = request.body as { contentMd?: string; status?: string }
    try {
      const spec = await prisma.spec.upsert({
        where: { featureId },
        create: {
          featureId,
          contentMd: body.contentMd || '',
          status: (body.status as 'draft' | 'in_review' | 'approved') || 'draft',
        },
        update: {
          ...(body.contentMd !== undefined && { contentMd: body.contentMd }),
          ...(body.status && { status: body.status as 'draft' | 'in_review' | 'approved' }),
          version: { increment: 1 },
        },
      })
      return reply.send({ data: spec, message: 'Spec updated' })
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to update spec' })
    }
  })

  // POST /features/:featureId/spec/generate — generate spec via AI
  app.post('/:featureId/spec/generate', async (request, reply) => {
    const { featureId } = request.params as { featureId: string }
    const body = request.body as { description: string; agent?: string }

    if (!body.description) {
      return reply.status(400).send({ error: 'description is required' })
    }

    try {
      const feature = await prisma.feature.findUnique({
        where: { id: featureId },
        include: { project: true },
      })
      if (!feature) return reply.status(404).send({ error: 'Feature not found' })

      const { aiService } = await import('../services/aiService.js')
      const contentMd = await aiService.generateSpec(
        body.description,
        feature.project.constitution || undefined,
      )

      const spec = await prisma.spec.upsert({
        where: { featureId },
        create: { featureId, contentMd, status: 'draft' },
        update: { contentMd, version: { increment: 1 } },
      })

      return reply.send({ data: spec, message: 'Spec generated' })
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to generate spec' })
    }
  })

  // GET /features/:featureId/plan — get plan for feature
  app.get('/:featureId/plan', async (request, reply) => {
    const { featureId } = request.params as { featureId: string }
    try {
      const plan = await prisma.plan.findUnique({ where: { featureId } })
      if (!plan) return reply.status(404).send({ error: 'Plan not found' })
      return reply.send({ data: plan })
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to fetch plan' })
    }
  })

  // POST /features/:featureId/plan — create plan
  app.post('/:featureId/plan', async (request, reply) => {
    const { featureId } = request.params as { featureId: string }
    const body = request.body as { contentMd?: string }
    try {
      const plan = await prisma.plan.create({
        data: { featureId, contentMd: body.contentMd || '' },
      })
      return reply.status(201).send({ data: plan, message: 'Plan created' })
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code: string }).code === 'P2002'
      ) {
        return reply.status(400).send({ error: 'Plan already exists for this feature' })
      }
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to create plan' })
    }
  })

  // PUT /features/:featureId/plan — update plan
  app.put('/:featureId/plan', async (request, reply) => {
    const { featureId } = request.params as { featureId: string }
    const body = request.body as { contentMd?: string; dataModel?: string; apiSpec?: string }
    try {
      const plan = await prisma.plan.upsert({
        where: { featureId },
        create: { featureId, contentMd: body.contentMd || '' },
        update: body,
      })
      return reply.send({ data: plan, message: 'Plan updated' })
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to update plan' })
    }
  })

  // POST /features/:featureId/plan/generate — generate plan via AI
  app.post('/:featureId/plan/generate', async (request, reply) => {
    const { featureId } = request.params as { featureId: string }

    try {
      const feature = await prisma.feature.findUnique({
        where: { id: featureId },
        include: { spec: true, project: true },
      })
      if (!feature) return reply.status(404).send({ error: 'Feature not found' })
      if (!feature.spec) {
        return reply.status(400).send({ error: 'Create a spec first before generating a plan' })
      }

      const { aiService } = await import('../services/aiService.js')
      const contentMd = await aiService.generatePlan(
        feature.spec.contentMd,
        feature.project.constitution || undefined,
      )

      const plan = await prisma.plan.upsert({
        where: { featureId },
        create: { featureId, contentMd },
        update: { contentMd },
      })

      return reply.send({ data: plan, message: 'Plan generated' })
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to generate plan' })
    }
  })

  // GET /features/:featureId/tasks — list tasks for feature
  app.get('/:featureId/tasks', async (request, reply) => {
    const { featureId } = request.params as { featureId: string }
    try {
      const tasks = await prisma.task.findMany({
        where: { featureId },
        orderBy: { order: 'asc' },
      })
      return reply.send({ data: tasks })
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to fetch tasks' })
    }
  })

  // POST /features/:featureId/tasks — create task
  app.post('/:featureId/tasks', async (request, reply) => {
    const { featureId } = request.params as { featureId: string }
    const body = request.body as {
      title: string
      description?: string
      priority?: string
      agent?: 'copilot' | 'claude'
      status?: string
      isParallel?: boolean
    }

    if (!body.title) return reply.status(400).send({ error: 'title is required' })

    try {
      const count = await prisma.task.count({ where: { featureId } })
      const task = await prisma.task.create({
        data: {
          featureId,
          title: body.title,
          description: body.description,
          priority: body.priority || 'medium',
          agent: body.agent || 'copilot',
          status: (body.status as 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done') || 'backlog',
          isParallel: body.isParallel || false,
          order: count + 1,
        },
      })
      return reply.status(201).send({ data: task, message: 'Task created' })
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to create task' })
    }
  })

  // POST /features/:featureId/tasks/generate — generate tasks via AI
  app.post('/:featureId/tasks/generate', async (request, reply) => {
    const { featureId } = request.params as { featureId: string }

    try {
      const feature = await prisma.feature.findUnique({
        where: { id: featureId },
        include: { spec: true, plan: true },
      })
      if (!feature) return reply.status(404).send({ error: 'Feature not found' })

      const planContent = feature.plan?.contentMd || feature.spec?.contentMd || ''
      if (!planContent) {
        return reply.status(400).send({ error: 'Create a spec or plan first' })
      }

      const { aiService } = await import('../services/aiService.js')
      const generatedTasks = await aiService.generateTasks(planContent)

      const count = await prisma.task.count({ where: { featureId } })
      const tasks = await Promise.all(
        generatedTasks.map((t, i) =>
          prisma.task.create({
            data: {
              featureId,
              title: t.title,
              description: t.description,
              priority: t.priority || 'medium',
              agent: 'copilot',
              status: 'backlog',
              order: count + i + 1,
            },
          }),
        ),
      )

      return reply.send({ data: tasks, message: 'Tasks generated' })
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to generate tasks' })
    }
  })

  // PUT /features/:featureId/tasks/reorder — batch reorder
  app.put('/:featureId/tasks/reorder', async (request, reply) => {
    const body = request.body as { tasks: Array<{ id: string; order: number; status?: string }> }

    try {
      await Promise.all(
        body.tasks.map((t) =>
          prisma.task.update({
            where: { id: t.id },
            data: {
              order: t.order,
              ...(t.status && { status: t.status as 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' }),
            },
          }),
        ),
      )
      return reply.send({ message: 'Tasks reordered' })
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to reorder tasks' })
    }
  })
}
