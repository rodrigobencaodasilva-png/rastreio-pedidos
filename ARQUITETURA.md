# Arquitetura e Decisões Técnicas

## Visão geral
Três serviços: frontend (Next.js) consome a API REST (Express/Node) que acessa o
PostgreSQL. Orquestrados por Docker Compose.

## Automação ao mudar status
1. Atualiza o pedido (define data_confirmacao + prazo 72h úteis ao confirmar).
2. Registra histórico. 3. Grava log de auditoria. 4. E-mail (se habilitado).
5. WhatsApp (se habilitado). 6. Registra resultado de cada envio.

## Cálculo de prazo (72h úteis)
Considera dias úteis (seg–sex) e expediente 08h–18h (10h/dia), a partir da confirmação.
Reagendamentos recalculam/sobrescrevem a data_prevista, refletindo de imediato.

## Parser de ficha
Correspondência por rótulos + fallback por regex (CPF/CNPJ e e-mail soltos). Valores
"R$ 3.000,00" normalizados para número. Campos extras vão para info_adicional.

## Segurança
bcrypt (custo 12); JWT; queries parametrizadas; Helmet; rate limit (global + login);
permissões por papel; logs de auditoria com IP.

## Modelo de dados
admins, clientes, pedidos, historico_status, qrcodes, notificacoes, configuracoes,
logs_auditoria. FKs com ON DELETE CASCADE onde aplicável.

## Notificações mock vs live
mock não envia (dev/demo); live usa Nodemailer (SMTP) e Meta Cloud API. Status de
leitura real exigiria webhooks da Meta — ponto isolado no serviço de notificação.
