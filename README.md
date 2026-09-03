# Selda MCP

Connect an AI client to a [Selda](https://selda.ai) workspace.

Others give you a list. Selda gets you the conversation: you say who you want, and it finds the
right people, writes each message from real research, and carries the thread to a customer, a
quote, or a meeting. A person approves every send. This repository is the machine readable
documentation for driving that engine from outside the app, over the
[Model Context Protocol](https://modelcontextprotocol.io) or plain HTTP.

**MCP and the API are on every plan, the free one included.** There is no tier to reach before you
can connect a client — see [Keys, scopes and isolation](#keys-scopes-and-isolation) for what a key
on a free workspace can do.

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

`initialize` echoes your protocol version when it is one of `2025-06-18`, `2025-03-26` or
`2024-11-05`, so any current client connects without negotiating down.

#### In ChatGPT

**Settings → Connectors → Add**, same address. ChatGPT only calls a connector that exposes two
tools named `search` and `fetch`, with fixed shapes. Selda exposes both, so there is nothing extra
to do:

```jsonc
// search({ query: "nordic books" })
{ "results": [ { "id": "lead:k57...", "title": "Mika Virtanen \u00b7 Nordic Books Oy", "url": "https://app.selda.ai/workspace-..." } ] }

// fetch({ id: "lead:k57..." })
{ "id": "lead:k57...", "title": "Mika Virtanen \u00b7 Nordic Books Oy", "text": "Name: ...\nResearch: ...",
  "url": "...", "metadata": { "kind": "lead", "draftWaitingForApproval": true } }
```

They are a read-only view over the same workspace the `selda_*` tools reach: leads, projects and
Brain items. Ids are `lead:...`, `project:...` and `brain:...`, and every id `search` returns is
one `fetch` accepts. An id of any other shape is a tool error, not an empty result. Neither of
them writes anything, and nothing on this connector sends a message.

### A static key, for Claude Code, scripts and CI

Create a key in the Selda app under **Settings → Apps → Selda MCP**. The full key is shown
once.

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

**Every plan can connect, the free one included.** Creating a key is not gated on a tier or an
invoice. A workspace standing in test mode always mints `sk_test_`; a workspace approved for live
always mints `sk_live_`. The prefix states the environment and grants nothing on its own — every
gate reads the stored environment and the workspace's live entitlements, re-resolved on each
request.

So on a free workspace you get a test key that reaches the whole surface except the handful of
functions that spend money or resolve real people. That is enough to build the entire integration
before anything is real. The capability manifest is the authority on which functions a given key may
call.

## The HTTP API underneath

The MCP tools are a curated front end over an HTTP API you can call directly.

The base is `https://api.selda.ai`.

| Endpoint | Method | Purpose |
|---|---|---|
| `/mcp/query` | POST | reads |
| `/mcp/mutate` | POST | writes |
| `/mcp/run` | POST | pipeline and engine actions |
| `/mcp/material/upload` | POST | raw file bytes in, a storage id out |
| `/mcp/capabilities` | GET | the capability manifest, no key needed |

Every one of these also answers on a `/v1/` alias — `/v1/mcp/query`, `/v1/mcp/mutate`,
`/v1/mcp/run`, `/v1/mcp/material/upload`, `/v1/mcp/capabilities` — pointing at the same handler.
The unversioned paths are kept for good and will not break; `/v1/` is the seam where anything that
changes behaviour would appear, so prefer it in something long-lived.

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

Of the 72 functions the manifest published on 30.8.2026, **65 were open to a sandbox key** and 7
were not. Those figures move whenever the surface does, so read them off
`GET /mcp/capabilities` rather than off this paragraph — the manifest is authoritative and this
number is a snapshot.

The line is not "reads versus writes". A sandbox key can read the whole workspace **and push your
own data in**: add leads with your own research, write the Brain, upload material, import it, draft
against it. That is the whole product in test mode, and it is how you build something worth paying
for before you pay.

What a sandbox key cannot do is make the engine **produce new contact data** or reach a real person:

| Function | Why it costs |
|---|---|
| `company.lookup` | resolves real people through paid data providers |
| `leads.enrich`, `leads.enrichBatch` | same, per lead |
| `engine.start` | discovery: web search, crawls, per-lead spend |
| `connectors.sync` | pulls and enriches from an outside source |
| `runs.confirmCompanies` | confirms a run's company list, which starts the paid work |
| `runs.startFromLeads` | writes a message per lead you pushed in |
| `material.import` **with** `autoAdvance` | the grant carries the run into contact lookup |

**The question these ask is who pays, not which prefix you hold.** A sandbox key belonging to a
workspace that already has the API on its plan, with its invoice paid, may call every row above and
spends that workspace's own credits doing it. The refusal is aimed at a free account scripting
Selda into a contact-data API at Selda's expense — not at a paying customer working in a sandbox.
`material.import` is the one row that is conditional on its arguments rather than on the function,
so it reports `sandboxAllowed: true` in the manifest and refuses only when `autoAdvance` is passed.

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
