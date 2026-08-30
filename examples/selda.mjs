// A complete Selda HTTP client. No dependencies, Node 18 or newer.
//
//   SELDA_API_BASE=https://... SELDA_API_KEY=sk_live_... node selda.mjs
//
// The key is in the Selda app under Settings → Connections → MCP server; the base is
//   https://api.selda.ai (or https://api.selda.ai/v1 for the versioned paths).

const BASE = process.env.SELDA_API_BASE;
const KEY = process.env.SELDA_API_KEY;

if (!BASE || !KEY) {
  console.error("Set SELDA_API_BASE (https://api.selda.ai) and SELDA_API_KEY (Settings → Connections → MCP server).");
  process.exit(1);
}

/**
 * Call one Selda function.
 *
 * `endpoint` is "query" for reads, "mutate" for writes, "run" for pipeline actions.
 * Never pass orgId: it comes from the key, and a value in the body is ignored.
 */
async function selda(endpoint, fn, args = {}) {
  const res = await fetch(`${BASE}/mcp/${endpoint}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fn, args }),
  });
  const body = await res.json();
  if (!res.ok || body.error) {
    // The message is written for a human. The code is what you branch on.
    const e = body.error ?? {};
    throw new Error(`${e.code ?? res.status}: ${e.message ?? "request failed"} (${e.request_id ?? "no request id"})`);
  }
  return body.value;
}

/** What this key is allowed to call. Derived from the live service, so it never goes stale. */
async function capabilities() {
  const res = await fetch(`${BASE}/mcp/capabilities`);
  return (await res.json()).value;
}

// ── Example: add a company you already researched, then read it back ──

const projects = await selda("query", "projects.list");
if (projects.length === 0) {
  console.error("No workspaces yet. Create one in the Selda app first.");
  process.exit(1);
}

const projectId = projects[0].id ?? projects[0]._id;
console.log(`Workspace: ${projects[0].name}`);

// Passing `analysis` is the point. Selda writes the message from your research
// instead of crawling the company from scratch.
await selda("mutate", "leads.add", {
  projectId,
  company: "Example Oy",
  // `companyDomain`, not `website`: an argument the function does not declare is rejected.
  companyDomain: "example.com",
  email: "hello@example.com",
  analysis: "They opened a second location in March and are hiring two installers.",
});

const leads = await selda("query", "leads.list", { projectId, limit: 5 });
for (const lead of leads) {
  console.log(`  ${lead.company ?? "?"}: ${lead.email ?? "no address yet"}`);
}

const { count } = await capabilities();
console.log(`\n${count} functions available. Nothing here sends: a human presses send in the app.`);
