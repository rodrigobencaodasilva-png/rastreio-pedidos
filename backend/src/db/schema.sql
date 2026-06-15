CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS admins (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome         VARCHAR(120) NOT NULL,
    email        VARCHAR(160) UNIQUE NOT NULL,
    senha_hash   TEXT NOT NULL,
    role         VARCHAR(20) NOT NULL DEFAULT 'admin',
    ativo        BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em    TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clientes (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome         VARCHAR(160) NOT NULL,
    documento    VARCHAR(18) UNIQUE NOT NULL,
    tipo_doc     VARCHAR(4) NOT NULL,
    email        VARCHAR(160),
    whatsapp     VARCHAR(20),
    notif_email  BOOLEAN NOT NULL DEFAULT FALSE,
    notif_whats  BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em    TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_clientes_documento ON clientes(documento);

CREATE TABLE IF NOT EXISTS pedidos (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero            VARCHAR(40) UNIQUE NOT NULL,
    cliente_id        UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    produto           TEXT,
    valor             NUMERIC(12,2),
    status            VARCHAR(40) NOT NULL DEFAULT 'pedido_recebido',
    data_pedido       TIMESTAMPTZ NOT NULL DEFAULT now(),
    data_confirmacao  TIMESTAMPTZ,
    prazo_horas_uteis INTEGER NOT NULL DEFAULT 72,
    data_prevista     TIMESTAMPTZ,
    observacoes       TEXT,
    info_adicional    JSONB DEFAULT '{}'::jsonb,
    criado_em         TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);

CREATE TABLE IF NOT EXISTS historico_status (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id   UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    status      VARCHAR(40) NOT NULL,
    descricao   TEXT,
    admin_id    UUID REFERENCES admins(id) ON DELETE SET NULL,
    criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_hist_pedido ON historico_status(pedido_id);

CREATE TABLE IF NOT EXISTS qrcodes (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id    UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    codigo       VARCHAR(64) UNIQUE NOT NULL,
    versao       INTEGER NOT NULL DEFAULT 1,
    ativo        BOOLEAN NOT NULL DEFAULT TRUE,
    confirmado_em TIMESTAMPTZ,
    criado_em    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_qr_codigo ON qrcodes(codigo);

CREATE TABLE IF NOT EXISTS notificacoes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id   UUID REFERENCES pedidos(id) ON DELETE CASCADE,
    cliente_id  UUID REFERENCES clientes(id) ON DELETE SET NULL,
    canal       VARCHAR(12) NOT NULL,
    destino     VARCHAR(160),
    status_envio VARCHAR(16) NOT NULL DEFAULT 'pendente',
    template    VARCHAR(40),
    mensagem    TEXT,
    erro        TEXT,
    criado_em   TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notif_pedido ON notificacoes(pedido_id);
CREATE INDEX IF NOT EXISTS idx_notif_status ON notificacoes(status_envio);

CREATE TABLE IF NOT EXISTS configuracoes (
    chave       VARCHAR(60) PRIMARY KEY,
    valor       JSONB NOT NULL,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS logs_auditoria (
    id          BIGSERIAL PRIMARY KEY,
    admin_id    UUID REFERENCES admins(id) ON DELETE SET NULL,
    acao        VARCHAR(60) NOT NULL,
    entidade    VARCHAR(40),
    entidade_id VARCHAR(64),
    detalhes    JSONB,
    ip          VARCHAR(64),
    criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_logs_admin ON logs_auditoria(admin_id);
CREATE INDEX IF NOT EXISTS idx_logs_acao ON logs_auditoria(acao);
