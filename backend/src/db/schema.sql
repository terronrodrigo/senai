-- Saga SENAI - Schema PostgreSQL
-- Índices pensados para queries frequentes e alto volume

-- Extensões
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Regiões (DRs)
CREATE TABLE regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(10) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usuários (LGPD: dados sensíveis podem ser criptografados em colunas específicas)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL, -- admin_dn, admin_dr, docente, aluno, egresso, tecnico, consultor, empresa
  region_id UUID REFERENCES regions(id),
  cpf_encrypted VARCHAR(500), -- criptografado
  phone VARCHAR(50),
  lgpd_consent_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_region ON users(region_id);
CREATE INDEX idx_users_created ON users(created_at);

-- Desafios (Grand Prix, Desafio Integradores, Inova SENAI)
CREATE TYPE challenge_type AS ENUM ('grand_prix', 'desafio_integradores', 'inova_senai');
CREATE TYPE challenge_status AS ENUM ('draft', 'open', 'submission', 'evaluation', 'closed');

CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type challenge_type NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  origin VARCHAR(100), -- indústria, sociedade
  region_id UUID REFERENCES regions(id), -- NULL = nacional
  created_by UUID REFERENCES users(id),
  status challenge_status DEFAULT 'draft',
  max_teams_per_challenge INTEGER DEFAULT 100,
  registration_start TIMESTAMPTZ,
  registration_end TIMESTAMPTZ,
  submission_start TIMESTAMPTZ,
  submission_end TIMESTAMPTZ,
  evaluation_start TIMESTAMPTZ,
  evaluation_end TIMESTAMPTZ,
  criteria_json JSONB, -- [{ name, weight, maxScore }]
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_challenges_type ON challenges(type);
CREATE INDEX idx_challenges_status ON challenges(status);
CREATE INDEX idx_challenges_region ON challenges(region_id);
CREATE INDEX idx_challenges_dates ON challenges(registration_start, registration_end, submission_end);

-- Equipes
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  leader_id UUID REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(challenge_id, name)
);

CREATE INDEX idx_teams_challenge ON teams(challenge_id);
CREATE INDEX idx_teams_leader ON teams(leader_id);
CREATE INDEX idx_teams_status ON teams(status);

-- Participantes da equipe (N:N)
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  role_in_team VARCHAR(50), -- leader, member, mentor
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);

-- Projetos (submissão por equipe)
CREATE TYPE project_status AS ENUM ('draft', 'submitted', 'under_review', 'evaluated', 'disqualified');

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges(id),
  title VARCHAR(500) NOT NULL,
  summary TEXT,
  status project_status DEFAULT 'draft',
  -- Arquivos (paths no EFS/S3)
  file_technical_pdf VARCHAR(1000),
  file_prior_art_pdf VARCHAR(1000),
  file_pitch_video VARCHAR(1000),
  file_bmc VARCHAR(1000),
  -- Processamento assíncrono
  processing_status VARCHAR(50) DEFAULT 'pending', -- pending, processing, done, failed
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_team ON projects(team_id);
CREATE INDEX idx_projects_challenge ON projects(challenge_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_submitted ON projects(submitted_at) WHERE submitted_at IS NOT NULL;

-- Avaliações (comissão)
CREATE TABLE evaluators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);

CREATE INDEX idx_evaluators_challenge ON evaluators(challenge_id);

CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  evaluator_id UUID NOT NULL REFERENCES users(id),
  scores_json JSONB NOT NULL, -- { criterionId: score }
  total_score DECIMAL(10,2),
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, evaluator_id)
);

CREATE INDEX idx_evaluations_project ON evaluations(project_id);
CREATE INDEX idx_evaluations_evaluator ON evaluations(evaluator_id);
CREATE INDEX idx_evaluations_total ON evaluations(total_score);

-- Resultados e premiações
CREATE TABLE results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID NOT NULL REFERENCES challenges(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  rank INTEGER,
  certificate_path VARCHAR(1000),
  published_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(challenge_id, project_id)
);

CREATE INDEX idx_results_challenge ON results(challenge_id);
CREATE INDEX idx_results_rank ON results(challenge_id, rank);

-- Conteúdo de aprendizado (módulos)
CREATE TABLE learning_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  description TEXT,
  content_json JSONB, -- embeds, textos, vídeos
  order_index INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_learning_modules_slug ON learning_modules(slug);
CREATE INDEX idx_learning_modules_published ON learning_modules(is_published) WHERE is_published = true;

-- Progresso do usuário (gamificação)
CREATE TABLE user_learning_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  module_id UUID NOT NULL REFERENCES learning_modules(id),
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  score INTEGER,
  UNIQUE(user_id, module_id)
);

CREATE INDEX idx_user_learning_user ON user_learning_progress(user_id);
CREATE INDEX idx_user_learning_module ON user_learning_progress(module_id);

-- Interesses do usuário (áreas para recomendações)
CREATE TABLE user_interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  area VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, area)
);

CREATE INDEX idx_user_interests_user ON user_interests(user_id);

-- Auditoria (LGPD e segurança)
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Particionamento por data para audit_logs (opcional, para milhões de registros)
-- CREATE TABLE audit_logs_2026 PARTITION OF audit_logs FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
