# Plataforma Saga SENAI de Inovação

MVP da plataforma de gestão e operação da Saga SENAI de Inovação: Grand Prix, Desafio de Projetos Integradores e Inova SENAI.

## Stack

| Camada | Tecnologia | Motivo |
|--------|------------|--------|
| Back-end | Node.js + Fastify | Alto throughput assíncrono, baixa latência, validação nativa |
| Front-end | Next.js 14 (React) | SSR, performance, mobile-first |
| DB | PostgreSQL 15 | Índices avançados, particionamento, compatível com migração MariaDB |
| Cache | Redis | Queries frequentes, sessões, rate limiting |
| Filas | RabbitMQ | Processamento assíncrono (uploads, certificados), já usado em legado |
| Containers | Docker + Kubernetes | EKS/Rancher, autoscaling |

## Estrutura

```
SENAI/
├── backend/          # API Fastify
├── frontend/         # Next.js
├── infra/            # K8s, Terraform (opcional)
├── docker-compose.yml
└── README.md
```

## Requisitos

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 15, Redis 7, RabbitMQ 3.12

## Desenvolvimento local

```bash
# Subir infra (PostgreSQL, Redis, RabbitMQ)
docker-compose up -d postgres redis rabbitmq

# Backend
cd backend && npm install && npm run dev

# Frontend (outro terminal)
cd frontend && npm install && npm run dev
```

API: http://localhost:3001  
Web: http://localhost:3000

## Deploy (AWS EKS)

- Ver `infra/kubernetes/` e `docs/DEPLOY-AWS.md`
- Região: sa-east-1 (São Paulo)
- Estimativa: ~$535-715/mês

## Performance (MVP)

- Índices em tabelas de projetos, avaliações e usuários
- Redis para cache de dashboards e sessões
- Compressão gzip em respostas e uploads
- Rate limiting e CDN para assets
- Processamento assíncrono de arquivos via RabbitMQ

## LGPD

- Consentimento no cadastro
- Dados sensíveis criptografados
- Logs de auditoria para acessos
