# Selda MCP

Connect an AI client to a [Selda](https://selda.ai) workspace.

Selda is a GTM engine: it finds the right companies, researches each one, writes messages that do
not read as AI, and sends them from your own inbox in your customer's language. This repository is
the machine readable documentation for driving that engine from outside the app, over the
[Model Context Protocol](https://modelcontextprotocol.io) or plain HTTP.

The narrative documentation lives at **[docs.selda.ai/reference/mcp](https://docs.selda.ai/reference/mcp)**.
When the two disagree, the live capability manifest described below is right.

## What you can do with it

| You want to | How |
|---|---|
| Read your workspaces, leads, campaigns and threads from an AI client | Connect the hosted server, then just ask |
| Push research you already did into Selda so it writes from your material | `selda_add_lead` with an `analysis` field, or upload files and import them |
| Run the full pipeline from a brief and read the drafts it produced | `selda_run_pipeline`, then poll `selda_get_run_status` |
| Receive replies as they arrive instead of polling | Register an outbound webhook for `reply.received` |
| Have an arriving enquiry answered before anyone looks at it | `selda_ingest_event` with `autoAdvance`, then listen for `draft.ready` |
| Clear the rows a trial install left behind | `selda_delete_lead`, or `selda_merge_leads` for a duplicate |

## What you cannot do with it, on purpose

**Nothing here sends outreach.** A script can build a campaign all the way up to drafted messages.
A human presses send, in the Selda app. There is no function that launches a campaign's sends, and
there is no flag that turns that off.

This is not a limitation we plan to remove. It is the product's central claim: Selda recommends,
the human decides.

## Connect

### OAuth, recommended for Claude.ai, ChatGPT and Cursor

Add this as a custom connector:

```
https://mcp.selda.ai/api/mcp
```

The server advertises OAuth, so the client walks you through logging in and picking a workspace.
Nothing to paste.

### A static key, for Claude Code, scripts and CI

Create a key in the Selda app under **Settings → Apps → API key**. The full key is shown once.

```bash
claude mcp add --transport http selda https://mcp.selda.ai/api/mcp \
  --header "Authorization: Bearer $SELDA_API_KEY"
```

Any other MCP client that reads a config file takes the same URL and the same header.

## Keys, scopes and isolation

A key is `sk_live_…` (live) or `sk_test_…` (sandbox). Only a SHA-256 hash of it is ever stored, so
a lost key is revoked, never recovered.

| Scope | Grants |
|---|---|
| `read` | read operations |
| `write` | write operations |
| `pipeline` | pipeline and engine actions, which cost credits |

Every call is bound to the organization that owns the key. The org id is injected server side from
the validated key and an `orgId` in your request body is ignored. One organization's key cannot
reach another organization's data.

Sandbox keys run the product in test mode and cannot send. Live keys require a paid plan. The
capability manifest is the authority on which functions a given key may call.

## The HTTP API underneath

The MCP tools are a curated front end over an HTTP API you can call directly.

| Endpoint | Method | Purpose |
|---|---|---|
| `/mcp/query` | POST | reads |
| `/mcp/mutate` | POST | writes |
| `/mcp/run` | POST | pipeline and engine actions |
| `/mcp/material/upload` | POST | raw file bytes in, a storage id out |
| `/mcp/capabilities` | GET | the capability manifest, no key needed |

The body is always `{ "fn": "...", "args": { ... } }`. A success is `{ "value": … }`; a failure is
`{ "error": { "type", "code", "message", "request_id" } }` with a non-200 status.

Discover the base URL and the current function list from the manifest rather than hardcoding
either. See [`examples/`](examples/) for a client that does exactly that in about forty lines.

## Grounding a message on research you already have

You probably already produce per-prospect research somewhere else. Two ways to bring it in, and
both make Selda write from your material instead of crawling from scratch.

**One company you already researched:**

```bash
curl -X POST "$SELDA_API_BASE/mcp/mutate" \
  -H "Authorization: Bearer $SELDA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"fn":"leads.add","args":{
        "projectId":"<workspace id>",
        "company":"Filterit Oy",
        "email":"etunimi@filterit.fi",
        "analysis":"They run three production lines and posted about downtime in March..."
      }}'
```

**A folder of files, one folder per company:** upload each file with an `X-Selda-Path` header, then
import the returned storage ids. The leading folder in the path is how Selda maps a file to a
company, so `boreo/filterit/analyysi.pdf` belongs to Filterit.

Importing material creates the campaign and the company list and **stops there**. Giving Selda your
material is permission to read it, not permission to run a campaign. An `autoAdvance` argument lets
a script grant the next stages one at a time, and even then it cannot send.

## Repository contents

| Path | What it is |
|---|---|
| [`schemas/capabilities.json`](schemas/capabilities.json) | Every function, generated from the live service |
| [`examples/`](examples/) | A minimal working client, no dependencies |
| [`skills/`](skills/) | Loadable skills that teach an AI client how to use Selda well |
| [`CHANGELOG.md`](CHANGELOG.md) | Changes to the tool surface, so an integration does not break silently |

`schemas/capabilities.json` is generated from `GET /mcp/capabilities`, which is itself derived from
the same dispatch tables the endpoints run on. It cannot describe a function that does not exist,
and it cannot omit one that does. Each entry carries its `fn`, endpoint, scope, one-line summary,
the MCP tools that wrap it, whether a sandbox key may call it, why not when it may not, and any
extra entitlement it needs.

If the file and the live endpoint ever disagree, the endpoint is right and this repository is
stale. Fetch it yourself in anything long-lived.

## What a sandbox key can and cannot do

Of the 54 functions today, **48 are open to a sandbox key** and 6 are not. The line is not "reads
versus writes". A sandbox key can read the whole workspace **and push your own data in**: add leads
with your own research, write the Brain, upload material, import it, draft against it. That is the
whole product in test mode, and it is how you build something worth paying for before you pay.

What a sandbox key cannot do is make the engine **produce new contact data** or reach a real person:

| Function | Why a live key |
|---|---|
| `company.lookup` | resolves real people through paid data providers |
| `leads.enrich`, `leads.enrichBatch` | same, per lead |
| `engine.start` | discovery: web search, crawls, per-lead spend |
| `connectors.sync` | pulls and enriches from an outside source |
| `runs.confirmCompanies` | confirms a run's company list, which starts the paid work |
| `runs.startFromLeads` | writes a message per lead you pushed in |
| `material.import` **with** `autoAdvance` | the grant carries the run into contact lookup |

This table listed `messages.send` until 20.8.2026. **No such function exists in any dispatch table
and none is planned** — a live key buys the calls above, which spend money or reach a data provider,
never the one that reaches a recipient. The line is corrected here rather than quietly deleted,
because anyone who read it may have planned around it.

A refused call returns `403` with a `code` you can branch on and a sentence you can show a person.
Creating a workspace is not on either list: it happens in the Selda app, and there is no function
for it by any key.

## Support

Questions, or a tool you need that does not exist: [docs.selda.ai/support](https://docs.selda.ai/support).

MIT licensed. This repository contains documentation, examples and skills. It does not contain
Selda's source code.
