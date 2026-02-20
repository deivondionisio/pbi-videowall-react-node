
import { ConfidentialClientApplication } from "@azure/msal-node";
import fs from "fs";
import path from "path";

const config = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "server/config/config.json"), "utf-8")
);

const msalConfig = {
  auth: {
    clientId:     config.clientId,
    authority:    `${config.authorityUrl}${config.tenantId}`,
    clientSecret: process.env.CLIENT_SECRET || undefined
  }
};

const cca = new ConfidentialClientApplication(msalConfig);

export async function getAccessToken() {
  const tokenRequest = {
    scopes: [config.scope]
  };
  const result = await cca.acquireTokenByClientCredential(tokenRequest);
  if (!result || !result.accessToken) throw new Error('Failed to acquire AAD token');
  return result.accessToken;
}
