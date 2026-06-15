# Publicar gratuitamente (Render + GitHub)

Hospedagem 100% gratuita, sem cartão: Render roda API + PostgreSQL + site; o código fica
no GitHub. No plano free os serviços "dormem" após ~15 min sem acesso.

## 1. GitHub
Crie conta em https://github.com e um repositório `rastreio-pedidos`.

## 2. Subir o código
Sem Git: no repositório, Add file ▸ Upload files e arraste o CONTEÚDO da pasta
`rastreio-pedidos` (backend, frontend, render.yaml...). Commit.
Com Git:
```bash
git init && git add . && git commit -m "deploy"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/rastreio-pedidos.git
git push -u origin main
```

## 3. Render
1. https://render.com ▸ Continue with GitHub.
2. New ▸ Blueprint ▸ selecione o repositório. O render.yaml cria banco, API e site.
3. No backend, defina ADMIN_PASSWORD (senha forte) e PUBLIC_BASE_URL (preencha depois
   com a URL do site).
4. Apply e aguarde o build.
5. Copie a URL do site, cole em PUBLIC_BASE_URL do backend e redeploy se preciso.

Login: admin@empresa.com + a senha definida em ADMIN_PASSWORD.

## Notificações reais
Backend: NOTIFICATIONS_MODE=live e preencha SMTP_* e WHATSAPP_*.
