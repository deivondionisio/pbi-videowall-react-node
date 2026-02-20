
import { PowerBIEmbed } from 'powerbi-client-react';
import { models } from 'powerbi-client';
import { useEffect, useRef, useState } from 'react';

export default function WallTile({ reportId, pageDisplayName, apiBase = import.meta.env.VITE_API_BASE || '' }) {
  const [cfg, setCfg] = useState(null);
  const reportRef = useRef(null);

  useEffect(() => {
    fetch(`${apiBase}/getEmbedInfo?reportId=${reportId}`)
      .then(r => r.json())
      .then(setCfg)
      .catch(console.error);
  }, [reportId, apiBase]);

  useEffect(() => {
    if (!cfg?.expiration) return;
    const t = new Date(cfg.expiration).getTime() - Date.now() - 10 * 60 * 1000;
    const h = setTimeout(async () => {
      const refreshed = await (await fetch(`${apiBase}/getEmbedInfo?reportId=${reportId}`)).json();
      await reportRef.current?.setAccessToken(refreshed.token);
    }, Math.max(t, 0));
    return () => clearTimeout(h);
  }, [cfg, reportId, apiBase]);

  if (!cfg) return null;

  return (
    <PowerBIEmbed
      embedConfig={{
        type: 'report',
        id: cfg.reportId,
        embedUrl: cfg.embedUrl,
        accessToken: cfg.token,
        tokenType: models.TokenType.Embed,
        settings: { panes: { filters: { visible: false } } }
      }}
      eventHandlers={new Map([
        ['loaded', async () => {
          const pages = await reportRef.current.getPages();
          const target = pages.find(p => p.displayName === pageDisplayName);
          if (target) await target.setActive();
        }]
      ])}
      getEmbeddedComponent={(c) => { reportRef.current = c; }}
      cssClassName="tile"
    />
  );
}
