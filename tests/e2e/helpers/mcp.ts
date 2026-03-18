import { type APIRequestContext } from "playwright/test";

const MCP_URL = "https://mcp.huminicdev.com/dax/mcp";

export async function callMCP(
  request: APIRequestContext,
  toolName: string,
  args: Record<string, unknown>,
  token: string
): Promise<any> {
  const response = await request.post(MCP_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    data: {
      jsonrpc: "2.0",
      method: "tools/call",
      params: { name: toolName, arguments: args },
      id: Date.now(),
    },
  });

  const text = await response.text();
  const lines = text.split("\n");
  for (const line of lines) {
    if (line.startsWith("data: ")) {
      const parsed = JSON.parse(line.slice(6));
      if (parsed.result?.content?.[0]?.text) {
        return JSON.parse(parsed.result.content[0].text);
      }
      return parsed.result;
    }
  }
  throw new Error(`No data in MCP response for ${toolName}`);
}
