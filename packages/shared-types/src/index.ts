// Enums
export type AgentType = 'copilot' | 'claude'

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done'

export type FeatureStatus = 'draft' | 'in_progress' | 'completed'

export type SpecStatus = 'draft' | 'in_review' | 'approved'

// Interfaces
export interface IProject {
  id: string
  name: string
  path: string
  description?: string
  defaultAgent: AgentType
  mainBranch: string
  constitution?: string
  createdAt: string
  updatedAt: string
}

export interface IFeature {
  id: string
  projectId: string
  name: string
  slug: string
  branch?: string
  status: FeatureStatus
  spec?: ISpec
  plan?: IPlan
  tasks?: ITask[]
  createdAt: string
  updatedAt: string
}

export interface ISpec {
  id: string
  featureId: string
  contentMd: string
  version: number
  status: SpecStatus
  createdAt: string
  updatedAt: string
}

export interface IPlan {
  id: string
  featureId: string
  contentMd: string
  dataModel?: string
  apiSpec?: string
  createdAt: string
  updatedAt: string
}

export interface ITask {
  id: string
  featureId: string
  title: string
  description?: string
  status: TaskStatus
  priority: 'low' | 'medium' | 'high'
  agent: AgentType
  isParallel: boolean
  order: number
  attempts?: ITaskAttempt[]
  workspace?: IWorkspace
  createdAt: string
  updatedAt: string
}

export interface ITaskAttempt {
  id: string
  taskId: string
  agent: AgentType
  status: 'pending' | 'running' | 'success' | 'failed'
  log?: string
  startedAt?: string
  finishedAt?: string
  createdAt: string
}

export interface IWorkspace {
  id: string
  taskId: string
  worktreePath?: string
  branch?: string
  status: 'idle' | 'running' | 'paused' | 'completed'
  diffs?: IDiff[]
  commits?: ICommit[]
  createdAt: string
  updatedAt: string
}

export interface IDiff {
  id: string
  workspaceId: string
  filePath: string
  content: string
  createdAt: string
}

export interface ICommit {
  id: string
  workspaceId: string
  hash?: string
  message: string
  pushedAt?: string
  createdAt: string
}

export interface IMemory {
  id: string
  projectId: string
  type: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface IAgentCall {
  id: string
  taskId?: string
  agent: AgentType
  prompt: string
  response?: string
  tokens?: number
  createdAt: string
}

// Request/Response types
export interface CreateProjectRequest {
  name: string
  path: string
  description?: string
  defaultAgent?: AgentType
  mainBranch?: string
}

export interface CreateFeatureRequest {
  projectId: string
  name: string
  slug: string
  branch?: string
}

export interface CreateTaskRequest {
  featureId: string
  title: string
  description?: string
  priority?: 'low' | 'medium' | 'high'
  agent?: AgentType
  order?: number
}

export interface GenerateSpecRequest {
  prompt: string
  context?: string
  featureId?: string
}

export interface GeneratePlanRequest {
  specId: string
  featureId: string
}

export interface GenerateTasksRequest {
  planId: string
  featureId: string
}

export interface ApiResponse<T> {
  data: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}
