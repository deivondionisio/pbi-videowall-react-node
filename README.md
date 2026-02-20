
# Power BI VideoWall – App‑Owns‑Data (React + Node + Docker)

Videowall **3×2** (6 telas) exibindo **6 páginas** do **mesmo relatório Power BI** — 24/7 com:
- **Renovação automática do Embed Token** **sem** recarregar o iframe (via `setAccessToken`).
- Navegação para páginas por **`displayName`** (`getPages()` + `setActive()`).
- Backend **Node/Express** com **MSAL Node (client credentials)** e **Power BI REST – Generate Token V2**.
- Execução **Docker** (client + server).

> **Modelo de embedding**: **App‑Owns‑Data** (Embed for your customers), seguindo o **sample oficial** da Microsoft para **NodeJS / AppOwnsData**.  
> **Geração de token**: **Generate Token V2** (permissões/limites/documentação oficial).  
> **Frontend React**: wrapper **`powerbi-client-react`** e ciclo de vida de embed conforme docs.

---

## Arquitetura & Pastas

```
server/
  Dockerfile
  package.json
  config/
    config.json
  models/
    embedConfig.js
  src/
    authentication.js
    powerbi.js
    server.js
  public/
  views/

client/
  Dockerfile
  package.json
  vite.config.js
  index.html
  src/
    WallTile.jsx
    main.jsx
    styles.css

docker-compose.yml
```

**Referências oficiais**:
- Repositório **PowerBI‑Developer‑Samples** (NodeJS → *Embed for your customers / AppOwnsData*).
- **Generate Token V2** (API REST) — campos, limites e permissões.
- **`powerbi-client-react`** – `<PowerBIEmbed>`, eventos e atualização de token.

---

## Requisitos & Licenciamento

- **App‑Owns‑Data** requer **capacidade** (Power BI Embedded A* ou Premium).  
- **Service Principal** com acesso ao workspace/dataset (permissões adequadas).

---

## Configuração (Server)

Edite `server/config/config.json` (sem segredos):
```json
{
  "authenticationMode": "ServicePrincipal",
  "authorityUrl": "https://login.microsoftonline.com/",
  "tenantId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "clientId": "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
  "clientSecret": "<USE_ENV_CLIENT_SECRET>",
  "scope": "https://analysis.windows.net/powerbi/api/.default",
  "workspaceId": "zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz",
  "reportId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
}
```

> **Segurança**: **não** commitar segredos. Defina `CLIENT_SECRET` **via variável de ambiente**/Key Vault.

---

## Configuração (Client – 6 páginas do videowall)

No `docker-compose.yml`, preencha:

```yaml
environment:
  - VITE_API_BASE=http://server:5300
  - VITE_REPORT_ID=${REPORT_ID}
  - VITE_PAGE_1=${PAGE_1}
  - VITE_PAGE_2=${PAGE_2}
  - VITE_PAGE_3=${PAGE_3}
  - VITE_PAGE_4=${PAGE_4}
  - VITE_PAGE_5=${PAGE_5}
  - VITE_PAGE_6=${PAGE_6}
```

Cada `PAGE_n` deve ser o **displayName** exato da página do relatório.

---

## Execução (Docker)

PowerShell (Windows):
```powershell
$env:CLIENT_SECRET = '<seu_client_secret>'
$env:REPORT_ID     = '<seu_report_id>'
$env:PAGE_1 = 'Curva S'
$env:PAGE_2 = 'Atividades Visão Geral'
$env:PAGE_3 = 'Aderência a Programação'
$env:PAGE_4 = 'GV UVT'
$env:PAGE_5 = 'Planejamento Entressafra'
$env:PAGE_6 = 'Programação Semanal'

docker compose up -d --build
```

- **Server** (health): http://localhost:5300/health → **OK**  
- **Client** (videowall 3×2): http://localhost:3000

---

## API do Backend

- `GET /health` → `200 OK`  
- `GET /getEmbedInfo?reportId=<id>` → `{ embedUrl, token, expiration, reportId, datasetId }`

---

## Renovação do Token (sem recarregar)

O client busca um novo token **antes** do `expiration` e atualiza o embed com:
```js
report.setAccessToken('<novo_token>');
```

---

## Troubleshooting

1. **401/403 ao gerar token**
   - Confirme permissões do Service Principal no workspace/dataset.
   - Verifique `tenantId`/`clientId` e `CLIENT_SECRET` no ambiente.
   - Confirme capacidade (Embedded/Premium).

2. **Páginas não carregam**
   - Cheque `displayName` das páginas (acentos/espaços).
   - Ajuste `VITE_PAGE_n`.

3. **Token expira e não renova**
   - Verifique chamada periódica ao `/getEmbedInfo` e uso de `setAccessToken`.

---

## Contribuições

Pull Requests são bem‑vindos! Para roadmap (filtros por página, telemetria de token, resiliência de refresh), abra uma issue.

---

## Segurança

- **Nunca** commit segredos (use Key Vault/ENV).  
- Conceda ao Service Principal **apenas** as permissões necessárias.
