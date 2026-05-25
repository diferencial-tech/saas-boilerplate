# 🚀 SaaS Boilerplate

Template de produção para SaaS multi-tenant. Construído com as melhores ferramentas do ecossistema Node.js e React, pronto para escalar.

## Stack

| Camada | Tecnologia |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| Backend | Fastify + TypeScript |
| Frontend | Next.js + TypeScript + Tailwind CSS |
| Banco de dados | PostgreSQL + Prisma ORM |
| Cache | Redis |
| Validação | Zod (pacote compartilhado) |
| Logger | Pino |
| Autenticação | JWT + Refresh Token Rotation |
| Monitoramento | Sentry |
| CI | GitHub Actions |

## Estrutura

```
saas-boilerplate/
├── apps/
│   ├── api/                  ← Backend Fastify
│   │   ├── src/
│   │   │   ├── config/       ← Variáveis de ambiente validadas
│   │   │   ├── database/     ← Prisma client + seed
│   │   │   ├── http/
│   │   │   │   ├── middlewares/ ← authenticate, requireRoles, errorHandler
│   │   │   │   └── routes/   ← Rotas organizadas por domínio
│   │   │   ├── plugins/      ← JWT, Redis, Sentry, segurança
│   │   │   ├── services/     ← Regras de negócio
│   │   │   └── utils/        ← sendError, buildPaginatedResponse
│   │   └── prisma/
│   │       ├── schema.prisma ← Models do banco
│   │       └── migrations/   ← Histórico de migrations
│   └── web/                  ← Frontend Next.js
│       └── src/
│           ├── app/          ← App Router (páginas)
│           ├── lib/          ← API client, utilitários
│           └── services/     ← Chamadas à API
└── packages/
    ├── shared/               ← Tipos TypeScript + constantes
    ├── validators/           ← Schemas Zod compartilhados
    └── logger/               ← Pino configurado
```

## Funcionalidades

- ✅ **Auth completo** — registro, login, refresh token rotation, logout
- ✅ **RBAC** — middleware `requireRoles()` com roles `ADMIN` e `USER`
- ✅ **Multi-tenant** — guard de tenant com isolamento por `tenantId`
- ✅ **Audit log** — registro imutável e automático de ações (fire-and-forget)
- ✅ **Segurança** — Helmet, CORS, Rate limiting configurados
- ✅ **Erros padronizados** — `sendError`, `sendValidationError`, `sendNotFound`
- ✅ **Paginação** — `buildPaginatedResponse` e `buildPaginationQuery`
- ✅ **Monitoramento** — Sentry integrado no backend
- ✅ **CI** — GitHub Actions com typecheck, build e migrations
- ✅ **Seed** — usuário Admin criado automaticamente

## Como usar este template

### 1 — Cria um repositório a partir do template

Clica em **Use this template** no GitHub e cria um novo repositório.

### 2 — Clona e instala

```bash
git clone https://github.com/seu-usuario/seu-projeto.git
cd seu-projeto
pnpm install
```

### 3 — Configura o ambiente

```bash
cp .env.example .env
```

Edita o `.env` com suas configurações. Variáveis obrigatórias:

```bash
DATABASE_URL=       # URL de conexão do PostgreSQL
REDIS_URL=          # URL de conexão do Redis
JWT_SECRET=         # String aleatória com 32+ caracteres (openssl rand -base64 32)
```

### 4 — Sobe os serviços

```bash
docker compose up -d
```

### 5 — Compila os pacotes internos

```bash
pnpm --filter @saas/shared build
pnpm --filter @saas/validators build
pnpm --filter @saas/logger build
```

### 6 — Roda as migrations e o seed

```bash
cd apps/api
pnpm db:migrate
pnpm db:seed
```

Credenciais do admin inicial:
- **E-mail:** `admin@saas.com`
- **Senha:** `Admin@123456`

> ⚠️ Troque a senha após o primeiro login.

### 7 — Inicia o desenvolvimento

Em terminais separados:

```bash
# Backend
cd apps/api
pnpm dev

# Frontend
cd apps/web
pnpm dev
```

- API: `http://localhost:3333`
- Web: `http://localhost:3000`
- Health check: `http://localhost:3333/health`

## Configuração do GitHub Actions

O CI roda automaticamente em todo push e Pull Request para `main` e `develop`.

Configure os seguintes secrets em **Settings → Secrets and variables → Actions**:

| Secret | Descrição |
|---|---|
| `JWT_SECRET` | String aleatória 32+ chars (`openssl rand -base64 32`) |
| `SENTRY_DSN` | DSN do projeto no Sentry (opcional) |

## O que customizar em cada projeto

### Roles

As roles base são `ADMIN` e `USER`. Para adicionar roles específicas do seu domínio:

**1 — Adiciona no enum do Prisma** (`apps/api/prisma/schema.prisma`):

```prisma
enum Role {
  ADMIN
  USER
  MANAGER    ← nova role
  VIEWER     ← nova role
}
```

**2 — Adiciona nas constantes** (`packages/shared/src/roles.ts`):

```typescript
export const ROLES = {
  ADMIN: 'ADMIN',
  USER: 'USER',
  MANAGER: 'MANAGER',
  VIEWER: 'VIEWER',
} as const
```

**3 — Usa no middleware:**

```typescript
{ preHandler: [app.authenticate, requireRoles('ADMIN', 'MANAGER')] }
```

### Audit log

Para logar ações customizadas, adiciona entidades e ações no schema:

```prisma
enum AuditAction {
  // ... existentes
  EXPORT      ← nova ação
  IMPORT      ← nova ação
}

enum AuditEntity {
  // ... existentes
  REPORT      ← nova entidade
  INVOICE     ← nova entidade
}
```

E usa o serviço nos seus services:

```typescript
import { createAuditLog } from '../services/audit.service.js'

createAuditLog({
  action: 'CREATE',
  entity: 'INVOICE',
  entityId: invoice.id,
  userId: request.user.sub,
  newData: invoice,
})
```

### Variáveis de ambiente

Todas as variáveis são validadas com Zod em `apps/api/src/config/env.ts`. Para adicionar novas:

```typescript
const envSchema = z.object({
  // ... existentes
  STRIPE_SECRET_KEY: z.string().min(1),
  SENDGRID_API_KEY: z.string().optional(),
})
```

### Pacotes internos

Para adicionar novos schemas de validação compartilhados:

1. Cria o arquivo em `packages/validators/src/`
2. Exporta em `packages/validators/src/index.ts`
3. Compila com `pnpm --filter @saas/validators build`

## Endpoints disponíveis

### Auth

| Método | Rota | Autenticação | Descrição |
|---|---|---|---|
| POST | `/api/auth/register` | Não | Cria novo usuário |
| POST | `/api/auth/login` | Não | Faz login |
| POST | `/api/auth/refresh` | Não | Renova o access token |
| POST | `/api/auth/logout` | Sim | Faz logout |
| GET | `/api/auth/me` | Sim | Retorna usuário logado |

### Admin

| Método | Rota | Role | Descrição |
|---|---|---|---|
| GET | `/api/admin/users` | ADMIN | Lista usuários paginados |
| GET | `/api/admin/tenants` | ADMIN | Lista tenants paginados |

### Sistema

| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | Health check |

## Formato de resposta

### Sucesso

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### Erro

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos",
    "details": {}
  }
}
```

## Como conectar o CD (deploy contínuo)

O CI está configurado. Para o CD, conecta a plataforma de deploy ao repositório GitHub:

| Plataforma | Para quê | Como conectar |
|---|---|---|
| **Vercel** | Frontend Next.js | Importa o repositório em vercel.com, define `apps/web` como root |
| **Railway** | Backend + Banco | Cria um serviço apontando para `apps/api`, configura as variáveis de ambiente |
| **Render** | Backend | Define `apps/api` como root, comando de build: `pnpm install && pnpm build` |
| **Fly.io** | Backend com Docker | Adiciona `Dockerfile` em `apps/api` e configura o `fly.toml` |

## Licença

MIT