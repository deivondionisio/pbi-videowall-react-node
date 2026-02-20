
import express from "express";
import cors from "cors";
import { getAccessToken } from "./authentication.js";
import { getReportEmbedInfo, generateEmbedTokenV2 } from "./powerbi.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_, res) => res.status(200).send("OK"));

app.get("/getEmbedInfo", async (req, res) => {
  try {
    const reportId = req.query.reportId;
    const aadToken = await getAccessToken();
    const { embedUrl, datasetId, reportId: resolvedReportId } = await getReportEmbedInfo(aadToken, reportId);
    const { token, expiration } = await generateEmbedTokenV2(aadToken, { reportId: resolvedReportId, datasetId });
    res.json({ embedUrl, token, expiration, reportId: resolvedReportId, datasetId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get embed info" });
  }
});

const port = process.env.PORT || 5300;
app.listen(port, () => console.log(`Server listening on :${port}`));
