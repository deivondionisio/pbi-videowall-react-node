
import fetch from "node-fetch";
import fs from "fs";
import path from "path";

const config = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "server/config/config.json"), "utf-8")
);

const baseUrl = "https://api.powerbi.com/v1.0/myorg";

export async function getReportEmbedInfo(aadToken, reportId = config.reportId, workspaceId = config.workspaceId) {
  const res = await fetch(`${baseUrl}/groups/${workspaceId}/reports/${reportId}`, {
    headers: { Authorization: `Bearer ${aadToken}` }
  });
  if (!res.ok) throw new Error(`PBI get report failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return {
    reportId: json.id,
    datasetId: json.datasetId,
    embedUrl: json.embedUrl
  };
}

export async function generateEmbedTokenV2(aadToken, { reportId, datasetId, workspaceId = config.workspaceId, allowEdit = false, lifetimeInMinutes = null }) {
  const body = {
    reports: [{ id: reportId, allowEdit }],
    datasets: [{ id: datasetId }],
    ...(lifetimeInMinutes ? { lifetimeInMinutes } : {})
  };

  const res = await fetch(`${baseUrl}/GenerateToken`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${aadToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`PBI generate token failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return { token: json.token, expiration: json.expiration };
}
