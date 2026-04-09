import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clean existing data
  await prisma.agentCall.deleteMany()
  await prisma.memory.deleteMany()
  await prisma.commit.deleteMany()
  await prisma.diff.deleteMany()
  await prisma.workspace.deleteMany()
  await prisma.taskAttempt.deleteMany()
  await prisma.task.deleteMany()
  await prisma.plan.deleteMany()
  await prisma.spec.deleteMany()
  await prisma.feature.deleteMany()
  await prisma.project.deleteMany()

  // Create example project
  // Note: '/tmp/specflow-demo' is a placeholder path for seed data.
  // In production, this would be a real git repository path on the user's machine.
  const project = await prisma.project.create({
    data: {
      name: 'SpecFlow Demo',
      path: '/tmp/specflow-demo',
      description: 'A demo project to showcase SpecFlow features',
      defaultAgent: 'claude',
      mainBranch: 'main',
      constitution: `# Project Constitution

## Tech Stack
- TypeScript + React frontend
- Node.js + Fastify backend
- PostgreSQL database with Prisma ORM
- Python + FastAPI AI service

## Principles
- Type safety first
- Clean, readable code
- Test-driven development
- API-first design

## Coding Standards
- Use async/await over callbacks
- Prefer functional components in React
- Handle errors explicitly
- Write descriptive commit messages`,
    },
  })

  // Create example feature
  const feature = await prisma.feature.create({
    data: {
      projectId: project.id,
      name: 'User Authentication',
      slug: '001-user-authentication',
      branch: '001-user-authentication',
      status: 'in_progress',
    },
  })

  // Create spec for the feature
  await prisma.spec.create({
    data: {
      featureId: feature.id,
      contentMd: `# User Authentication

## Objetivo
Implementar autenticação de usuários com suporte a email/senha e OAuth (GitHub).

## User Stories
- Como usuário, quero me cadastrar com email e senha para acessar a plataforma
- Como usuário, quero fazer login com minha conta GitHub para facilitar o acesso
- Como usuário, quero recuperar minha senha por email caso eu esqueça

## Requisitos Funcionais
1. Cadastro com email/senha
2. Login com email/senha
3. Login OAuth com GitHub
4. Recuperação de senha por email
5. Logout
6. Proteção de rotas autenticadas

## Requisitos Não Funcionais
- Senhas hasheadas com bcrypt (min 12 rounds)
- JWT tokens com expiração de 24h
- Rate limiting de 5 tentativas por minuto
- HTTPS obrigatório em produção

## Critérios de Aceite
- [ ] Usuário consegue se cadastrar e receber email de confirmação
- [ ] Login retorna JWT válido
- [ ] Rotas protegidas retornam 401 sem token
- [ ] OAuth com GitHub funciona em dev e prod

## Fora de Escopo
- Autenticação por SMS
- 2FA (fará parte de outra feature)
- SSO empresarial`,
      version: 1,
      status: 'in_review',
    },
  })

  // Create plan for the feature
  await prisma.plan.create({
    data: {
      featureId: feature.id,
      contentMd: `# Technical Plan: User Authentication

## Stack Técnica
- **Backend**: Node.js + Fastify + Prisma
- **Auth**: JWT (jsonwebtoken) + bcrypt
- **OAuth**: passport.js + passport-github2
- **Email**: nodemailer + smtp

## Arquitetura
\`\`\`
Frontend → POST /auth/register → AuthService → DB (Users)
Frontend → POST /auth/login → AuthService → JWT
Frontend → GET /auth/github → OAuth Flow → DB
\`\`\`

## Implementação
1. Criar modelo User no Prisma schema
2. Implementar endpoints de auth
3. Adicionar middleware JWT
4. Configurar OAuth GitHub
5. Implementar recuperação de senha

## Modelo de Dados
\`\`\`prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String?
  githubId  String?  @unique
  name      String?
  createdAt DateTime @default(now())
}
\`\`\`

## Contratos de API
- POST /auth/register { email, password, name }
- POST /auth/login { email, password } → { token }
- GET /auth/github → OAuth redirect
- POST /auth/forgot-password { email }

## Dependências
- jsonwebtoken ^9.0.0
- bcrypt ^5.1.0
- passport ^0.7.0
- passport-github2 ^0.1.12
- nodemailer ^6.9.0

## Riscos e Mitigações
- **Risco**: Token leak → **Mitigação**: Short expiry + refresh tokens
- **Risco**: Brute force → **Mitigação**: Rate limiting por IP`,
    },
  })

  // Create tasks for the feature
  await prisma.task.createMany({
    data: [
      {
        featureId: feature.id,
        title: 'Create User model in Prisma schema',
        description: 'Add User model with email, password, githubId fields and migrations',
        status: 'done',
        priority: 'high',
        agent: 'claude',
        isParallel: false,
        order: 1,
      },
      {
        featureId: feature.id,
        title: 'Implement register endpoint',
        description: 'POST /auth/register with email validation and bcrypt hashing',
        status: 'in_progress',
        priority: 'high',
        agent: 'claude',
        isParallel: false,
        order: 2,
      },
      {
        featureId: feature.id,
        title: 'Implement login endpoint',
        description: 'POST /auth/login that returns JWT token',
        status: 'todo',
        priority: 'high',
        agent: 'claude',
        isParallel: false,
        order: 3,
      },
    ],
  })

  console.log('✅ Seed complete!')
  console.log(`   Project: ${project.name} (${project.id})`)
  console.log(`   Feature: ${feature.name} (${feature.id})`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
