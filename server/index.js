
import "dotenv/config";
import express from "express";
import cors from "cors";
import * as msal from "@azure/msal-node";
import axios from "axios";

const app = express();
app.use(cors());
app.use(express.json());

const { TENANT_ID, CLIENT_ID, CLIENT_SECRET } = process.env;

const cca = new msal.ConfidentialClientApplication({
  auth: {
    clientId: CLIENT_ID,
    authority: `https://login.microsoftonline.com/${TENANT_ID}`,
    clientSecret: CLIENT_SECRET,
  },
});

async function getAadToken() {
  const res = await cca.acquireTokenByClientCredential({
    scopes: ["https://analysis.windows.net/powerbi/api/.default"],
  });
  if (!res?.accessToken) throw new Error("Falha ao obter AAD token");
  return res.accessToken;
}

app.post("/api/embed-batch", async (req, res) => {
  try {
    const { items } = req.body; // [{ workspaceId, reportId }]
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items inválido" });
    }

    const aad = await getAadToken();
    const headers = { Authorization: `Bearer ${aad}` };

    const reports = await Promise.all(
      items.map(async ({ workspaceId, reportId }) => {
        const url = `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports/${reportId}`;
        const { data } = await axios.get(url, { headers });
        return {
          workspaceId,
          reportId: data.id,
          embedUrl: data.embedUrl,
          datasetId: data.datasetId,
        };
      })
    );

    const uniq = (arr) => [...new Set(arr)];
    const datasets = uniq(reports.map(r => r.datasetId)).map(id => ({ id }));
    const workspaces = uniq(reports.map(r => r.workspaceId)).map(id => ({ id }));
    const reportList = uniq(reports.map(r => r.reportId)).map(id => ({ id, allowEdit: false }));

    const genTokenUrl = `https://api.powerbi.com/v1.0/myorg/GenerateToken`;
    const body = {
      reports: reportList,
      datasets,
      targetWorkspaces: workspaces,
      lifetimeInMinutes: 60
    };

    const { data: tokenData } = await axios.post(genTokenUrl, body, { headers });

    res.json({
      token: tokenData.token,
      expiresAt: tokenData.expiration,
      items: reports
    });
  } catch (e) {
    console.error(e?.response?.data || e.message);
    res.status(500).json({ error: "Falha ao gerar embed batch" });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Server on http://localhost:${port}`));
