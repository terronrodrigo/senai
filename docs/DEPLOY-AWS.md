# Deploy AWS EKS - Saga SENAI

## Visão geral

- **Região:** sa-east-1 (São Paulo)
- **EKS:** 2–3 nodes t3.large (autoscaling)
- **RDS:** PostgreSQL 15, db.t4g.medium Multi-AZ
- **EFS:** Sistema de arquivos para uploads (ou S3)
- **Amazon MQ:** RabbitMQ (ou EC2 com RabbitMQ)
- **ElastiCache:** Redis
- **ALB:** Load balancer para API e frontend
- **Route 53:** DNS (ex.: saga.senai.br)
- **ECR:** Imagens Docker
- **CloudWatch / Prometheus:** Métricas e logs

## Pré-requisitos

- AWS CLI configurado
- kubectl
- Docker
- Terraform (opcional)

## 1. Infraestrutura base

### EKS cluster (exemplo via AWS Console ou Terraform)

- Node group: t3.large, 2–3 nodes, autoscaling 2–10
- OIDC para IRSA (pods acessarem RDS, EFS, etc.)

### RDS PostgreSQL

- Engine: PostgreSQL 15
- Instance: db.t4g.medium
- Multi-AZ: sim
- Storage: 100 GB+, autoscaling
- Security group: liberar 5432 apenas para o security group dos nodes EKS

### ElastiCache Redis

- Node type: cache.t4g.micro ou cache.t4g.small
- Cluster mode: disabled (single node para MVP)

### Amazon MQ (RabbitMQ)

- Engine: RabbitMQ 3.12
- Instance: mq.t3.micro (dev) / mq.m5.large (prod)
- Criar usuário/senha e obter URL AMQP

### EFS (opcional para uploads)

- Criar EFS na mesma VPC do EKS
- Montar no deployment do backend em `/app/uploads` (ou usar S3 + SDK)

## 2. Build e push das imagens

```bash
# ECR repositories
aws ecr create-repository --repository-name saga-backend --region sa-east-1
aws ecr create-repository --repository-name saga-frontend --region sa-east-1

# Backend
cd backend
docker build -t saga-backend .
docker tag saga-backend:latest ACCOUNT.dkr.ecr.sa-east-1.amazonaws.com/saga-backend:latest
aws ecr get-login-password --region sa-east-1 | docker login --username AWS --password-stdin ACCOUNT.dkr.ecr.sa-east-1.amazonaws.com
docker push ACCOUNT.dkr.ecr.sa-east-1.amazonaws.com/saga-backend:latest

# Frontend (NEXT_PUBLIC_API_URL é definido em tempo de build para o client)
cd ../frontend
docker build --build-arg NEXT_PUBLIC_API_URL=https://saga.senai.br -t saga-frontend .
docker tag saga-frontend:latest ACCOUNT.dkr.ecr.sa-east-1.amazonaws.com/saga-frontend:latest
docker push ACCOUNT.dkr.ecr.sa-east-1.amazonaws.com/saga-frontend:latest
```

## 3. Kubernetes

- Atualizar `infra/kubernetes/backend-deployment.yaml` e `frontend-deployment.yaml` com a imagem ECR.
- Criar Secret com DATABASE_URL, REDIS_URL, RABBITMQ_URL, JWT_SECRET (e OPENAI_API_KEY se usar).
- Aplicar na ordem:

```bash
kubectl apply -f infra/kubernetes/namespace.yaml
kubectl apply -f infra/kubernetes/configmap.yaml
kubectl apply -f infra/kubernetes/secrets.yaml   # criado a partir de secrets.example.yaml
kubectl apply -f infra/kubernetes/backend-deployment.yaml
kubectl apply -f infra/kubernetes/frontend-deployment.yaml
kubectl apply -f infra/kubernetes/hpa.yaml
kubectl apply -f infra/kubernetes/ingress-alb.yaml
```

- Configurar ALB Ingress Controller e certificado ACM no Ingress.
- Apontar Route 53 para o ALB.

## 4. Banco de dados

- Executar migração uma vez (job ou pod temporário com `npm run migrate` no backend).
- Opcional: rodar seed para regiões e módulo de aprendizado.

## 5. Worker (filas)

- Deploy de um Deployment que rode o worker (ex.: `node src/workers/projectProcessor.js`) com as mesmas envs do backend (DATABASE_URL, RABBITMQ_URL).
- HPA opcional para o worker (ver `hpa.yaml`).

## 6. Custos estimados (mensal)

| Recurso        | Estimativa   |
|----------------|-------------|
| EKS control plane | ~$73   |
| 2–3 t3.large   | ~$120–180   |
| RDS db.t4g.medium Multi-AZ | ~$100 |
| ElastiCache    | ~$15–30     |
| Amazon MQ      | ~$50–100    |
| EFS (opcional) | ~$30        |
| ALB            | ~$25        |
| Outros (Route 53, dados) | ~$20 |
| **Total**      | **~$435–560** (reduzível com Savings Plans / Reserved) |

## 7. Monitoramento

- CloudWatch Container Insights no cluster.
- Métricas do ALB e do RDS no CloudWatch.
- Opcional: Prometheus + Grafana (Helm) no cluster; alertas para latência e erros 5xx.

## 8. Performance

- Índices já definidos no schema SQL.
- Redis para cache de listagens e dashboards (TTL configurado no código).
- Compressão gzip no Fastify.
- Rate limiting por IP.
- Para picos (ex.: 5k/h): aumentar réplicas do backend e do worker via HPA; considerar read replicas no RDS se necessário.
