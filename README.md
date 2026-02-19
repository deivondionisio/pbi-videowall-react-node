
# Power BI VideoWall – React + Node + Docker (6 telas)

VideoWall 3×2 com **6 páginas** do mesmo relatório Power BI rodando 24/7:

- Renovação automática de **Embed Token** (sem recarregar o iframe) com `setAccessToken`.
- **Atualização automática** da página a cada **1 hora**, **preservando filtros** por página.
- Seleção de páginas **automática** pelo `displayName` (`getPages` + `setPage`).
- Backend Node/Express com **MSAL Node (client credentials)** e **Power BI REST – GenerateToken V2**.

> IDs já configurados no `docker-compose.yml`:
>
> - **WorkspaceId**: `secret Id`
> - **ReportId**: `secret Id`
>
> Páginas exibidas: **Curva S**, **Atividades Visão Geral**, **Aderência a Programação**, **GV UVT**, **Planejamento Entressafra**, **Programação Semanal**.

---

## 🗺️ Mapa de Rede / Arquitetura

```
+-------------------------+           +---------------------+
|  Polywall / Navegador  |           |  Microsoft Entra ID |
|  (6 iframes React)     |           |  (OAuth - MSAL)     |
+-----------+-------------+           +----------+----------+
            |                                   ^
            | HTTP (GET /api/embed-batch)       |
            v                                   |
+-----------+-------------+           +----------+----------+
|    Backend (Node)       |  HTTPS    |  Power BI REST API |
|  Express + MSAL Node    +---------->+  GenerateToken V2  |
|  (porta 8080)           |           |  Reports/Datasets  |
+-----------+-------------+           +----------+----------+
            ^                                   |
            |                                   |
            | Embed Token + Embed Url           |
            |                                   v
+-----------+-------------+           +---------------------+
|    Frontend (React)     |<----------+  Power BI Service   |
|  Nginx (porta 3000)     |   iframe  |  (Report iFrame)    |
+-------------------------+           +---------------------+
```

- O **frontend React** embute 6 instâncias do relatório (uma por página) e
  **renova o Embed Token** antes de expirar, **sem recarregar o iFrame**.
- O **backend Node** autentica no Entra ID (client credentials) e chama a
  **Power BI REST API** para **coletar embedUrl/datasetId** e **gerar o token V2**
  cobrindo os 6 embeds.

---

## 🚀 Como rodar (Docker)

1. Copie `server/.env.sample` para `server/.env` e preencha:
   - `TENANT_ID`, `CLIENT_ID`, `CLIENT_SECRET` (Service Principal com acesso ao workspace/dataset).
2. (Opcional) Para aplicar **automaticamente** o filtro `Empresa = UVT`,
   preencha no `docker-compose.yml` as variáveis:
   - `VITE_EMPRESA_TABLE` e `VITE_EMPRESA_COLUMN` (ex.: `DimEmpresa` / `NomeEmpresa`).
3. Suba tudo:

```bash
docker compose up -d --build
# Frontend: http://localhost:3000
# Backend:  http://localhost:8080
```

As 6 páginas serão abertas em um grid 3×2. Se preferir, ajuste o CSS em `client/src/styles.css` para adequar ao seu VideoWall.

---

## 📄 Páginas e filtros

- **Curva S** – filtro: `Empresa = UVT` (se `VITE_EMPRESA_*` definidos)
- **Atividades Visão Geral** – filtro: `Empresa = UVT`
- **Aderência a Programação** – filtro: `Empresa = UVT`
- **GV UVT** – sem filtros
- **Planejamento Entressafra** – sem filtros
- **Programação Semanal** – filtro: `Empresa = UVT`

> Mesmo sem `VITE_EMPRESA_*`, qualquer filtro aplicado pelo operador é **preservado**
> automaticamente (salvo localmente por página) e **reaplicado** após renovação e reload.

---

## 🧪 Notas de operação 24/7

- **Renovação do token** acontece ~10 min antes da expiração (padrão 60 min), sem recarregar o iFrame.
- **Reload** da página ocorre 1×/hora por robustez operacional; os filtros são preservados.
- Para múltiplos players (várias máquinas exibindo o VideoWall), considere
  persistir filtros em um repositório central (Redis/DB) em vez de `localStorage`.

---

## 🛠️ Publicar no GitHub (CLI)

```bash
# dentro da pasta do projeto
git init
git add .
git commit -m "feat: Power BI VideoWall (React+Node+Docker) - 6 páginas, token auto, filtros persistentes"

# cria o repositório e faz push (substitua pelo seu usuário se necessário)
gh repo create deivondionisio/pbi-videowall-react-node --private --source=. --remote=origin --push
```

---

## 📚 Referências úteis

- **Renovar token sem recarregar** com `setAccessToken` (Power BI Client APIs).
- **Listar páginas e navegar** (`getPages` / `setPage`).
- **Filtros** (`getFilters` / `setFilters`) e níveis (relatório/página/visual).
- **Wrapper React oficial**: `powerbi-client-react`.
- **GenerateToken V2** (Power BI REST) e **MSAL Node** (client credentials).
```
