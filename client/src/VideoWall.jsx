
import React from "react";
import axios from "axios";
import { PowerBIEmbed } from "powerbi-client-react";
import { models } from "powerbi-client";

const API = import.meta.env.VITE_API_BASE || "http://localhost:8080";
const MINUTES_BEFORE_EXP = 10;
const CHECK_INTERVAL_MS  = 30_000;

const WORKSPACE_ID = import.meta.env.VITE_WORKSPACE_ID;
const REPORT_ID    = import.meta.env.VITE_REPORT_ID;

const EMPRESA_TABLE  = import.meta.env.VITE_EMPRESA_TABLE  || null;
const EMPRESA_COLUMN = import.meta.env.VITE_EMPRESA_COLUMN || null;

const keyFor = (reportId, pageLabel) => `pbi_filters_${reportId}_${pageLabel}`;
const saveFilters = (reportId, pageLabel, filters) => {
  try { localStorage.setItem(keyFor(reportId, pageLabel), JSON.stringify(filters || [])); } catch {}
};
const loadFilters = (reportId, pageLabel) => {
  try { return JSON.parse(localStorage.getItem(keyFor(reportId, pageLabel)) || "null"); } catch { return null; }
};

function buildEmpresaFilter(value = "UVT") {
  if (!EMPRESA_TABLE || !EMPRESA_COLUMN) return null;
  return {
    $schema: "http://powerbi.com/product/schema#basic",
    target: { table: EMPRESA_TABLE, column: EMPRESA_COLUMN },
    operator: "In",
    values: [value],
    filterType: models.FilterType.Basic
  };
}

function EmbedTile({ workspaceId, reportId, desiredPageLabel, tokenBundle, initialFilter }) {
  const repRef = React.useRef(null);
  const [ready, setReady] = React.useState(false);
  const timerRef = React.useRef(null);

  React.useEffect(() => {
    if (!ready || !repRef.current) return;
    const report = repRef.current;

    (async () => {
      try {
        const pages = await report.getPages();
        const match = pages.find(p => p.displayName.trim().toLowerCase() === desiredPageLabel.trim().toLowerCase());
        if (match) {
          await report.setPage(match.name);
          console.log(`[${reportId}] -> página: ${match.displayName}`);
        } else {
          console.warn(`[${reportId}] página "${desiredPageLabel}" não encontrada; mantendo a atual`);
        }

        if (initialFilter) {
          await report.setFilters([initialFilter]);
          console.log(`[${reportId}] filtro inicial aplicado`);
        }

        const saved = loadFilters(reportId, desiredPageLabel);
        if (saved && saved.length) {
          await report.setFilters(saved);
          console.log(`[${reportId}] filtros salvos re-aplicados`);
        }

        report.off("filtersApplied");
        report.on("filtersApplied", async (ev) => {
          try {
            const filters = ev?.detail?.filters ?? await report.getFilters();
            saveFilters(reportId, desiredPageLabel, filters);
            console.log(`[${reportId}] filtros salvos`);
          } catch (e) {
            console.warn(`[${reportId}] falha ao capturar filtros`, e);
          }
        });
      } catch (e) {
        console.warn(`[${reportId}] falha ao selecionar página/aplicar filtros`, e);
      }
    })();

    return () => {
      if (repRef.current) repRef.current.off("filtersApplied");
    };
  }, [ready, desiredPageLabel, reportId, initialFilter]);

  function scheduleTokenRefresh(expiresAtISO) {
    clearInterval(timerRef.current);
    const expiresAt = Date.parse(expiresAtISO);
    timerRef.current = setInterval(async () => {
      const now = Date.now();
      if (expiresAt - now <= MINUTES_BEFORE_EXP * 60 * 1000) {
        try {
          const { data } = await axios.post(`${API}/api/embed-batch`, {
            items: [{ workspaceId, reportId }]
          });
          await repRef.current.setAccessToken(data.token);
          console.log(`[${reportId}] token renovado via setAccessToken`);
          scheduleTokenRefresh(data.expiresAt);
        } catch (e) {
          console.error(`[${reportId}] falha ao renovar token`, e);
        }
      }
    }, CHECK_INTERVAL_MS);
  }

  React.useEffect(() => {
    if (tokenBundle?.expiresAt) scheduleTokenRefresh(tokenBundle.expiresAt);
    return () => clearInterval(timerRef.current);
  }, [tokenBundle?.expiresAt]);

  const info = tokenBundle.items.find(i => i.reportId === reportId);
  if (!info) return <div>Config inválida</div>;

  return (
    <PowerBIEmbed
      embedConfig={{
        type: "report",
        id: reportId,
        embedUrl: info.embedUrl,
        accessToken: tokenBundle.token,
        tokenType: models.TokenType.Embed,
        settings: {
          panes: { filters: { visible: false, expanded: false } },
          background: models.BackgroundType.Transparent
        }
      }}
      getEmbeddedComponent={(rep) => { repRef.current = rep; setReady(true); }}
      eventHandlers={new Map([
        ["loaded", () => console.log(`[${reportId}] loaded`)],
        ["rendered", () => console.log(`[${reportId}] rendered`)],
        ["error", (e) => console.error(`[${reportId}] error`, e?.detail)]
      ])}
      cssClassName="tile"
    />
  );
}

export default function VideoWall() {
  const [bundle, setBundle] = React.useState(null);

  const tiles = [
    { label: "Curva S",                   filter: buildEmpresaFilter("UVT") },
    { label: "Atividades Visão Geral",   filter: buildEmpresaFilter("UVT") },
    { label: "Aderência a Programação",  filter: buildEmpresaFilter("UVT") },
    { label: "GV UVT",                    filter: null },
    { label: "Planejamento Entressafra", filter: null },
    { label: "Programação Semanal",      filter: buildEmpresaFilter("UVT") }
  ];

  React.useEffect(() => {
    (async () => {
      const items = tiles.map(() => ({ workspaceId: WORKSPACE_ID, reportId: REPORT_ID }));
      const { data } = await axios.post(`${API}/api/embed-batch`, { items });
      setBundle(data);
      setInterval(() => window.location.reload(), 60 * 60 * 1000);
    })();
  }, []);

  if (!bundle) return <p>Preparando VideoWall…</p>;

  return (
    <div className="grid6">
      {tiles.map((t, idx) => (
        <EmbedTile
          key={`${REPORT_ID}-${idx}`}
          workspaceId={WORKSPACE_ID}
          reportId={REPORT_ID}
          desiredPageLabel={t.label}
          tokenBundle={bundle}
          initialFilter={t.filter}
        />
      ))}
    </div>
  );
}
