# 🚚 Sistema de Rastreamento de Pedidos

Sistema web completo e responsivo para gerenciamento e rastreamento de pedidos, com
área pública de consulta (CPF/CNPJ), painel administrativo, QR Code de recebimento,
cálculo automático de prazo (72h úteis) e notificações por E-mail e WhatsApp.

## Tecnologias
- Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS, Recharts
- Backend: Node.js, Express, TypeScript
- Banco: PostgreSQL 16
- Auth: JWT + bcrypt
- Infra: Docker, Docker Compose

## Funcionalidades
Área do cliente: consulta por CPF/CNPJ, barra de progresso, status atual, prazo
restante, histórico completo, QR Code e dados da entrega.

Painel admin: dashboard com gráficos, CRUD de pedidos, alterar status, adiar/reagendar,
observações, gerar/reemitir QR Code, busca de clientes, exportação PDF e Excel.

Cadastro rápido: cole a ficha do pedido e o parser identifica os campos automaticamente.

Notificações: E-mail (SMTP) e WhatsApp (Meta Cloud API) a cada mudança de status, com
central de status (enviada/entregue/lida/pendente/erro) e teste de envio. Modo mock
(sem credenciais) ou live.

Segurança: bcrypt, JWT, Helmet, rate limiting, consultas parametrizadas (anti SQL
injection), permissões por papel (admin/operador/viewer) e logs de auditoria.

## Rodar com Docker (recomendado)
```bash
cp .env.example .env
docker compose up --build
```
- Frontend: http://localhost:3000
- API: http://localhost:4000

Login padrão: admin@empresa.com / Admin@123 (altere em .env).
Documentos de exemplo: 529.982.247-25, 11.444.777/0001-61, 390.533.447-05.

## Publicar online grátis
Veja DEPLOY.md (Render + GitHub).

## Estrutura
backend/ (API Express + PostgreSQL) e frontend/ (Next.js). Detalhes em ARQUITETURA.md.
