# Changelog

Changes to the Selda tool surface. An integration that breaks silently is worse than one that
breaks loudly, so anything that can break yours is recorded here.

The live capability manifest at `GET /mcp/capabilities` is always the authority on what exists
right now. This file exists to tell you what moved.

## 2026-08-30

**MCP and the API are on every plan, the free one included.** Creating a key was never gated on a
tier, but nothing published said so, and the previous wording ("live keys require a paid plan") read
as if you had to buy something before you could connect a client at all. You do not. A free
workspace mints a `sk_test_` key and reaches the whole surface except the functions that spend money
or resolve real people.

**The refusal on those functions is about who pays, not which prefix you hold.** A sandbox key on a
workspace whose plan includes the API, with its invoice paid, may call `company.lookup`,
`leads.enrich`, `leads.enrichBatch`, `engine.start`, `connectors.sync`, `runs.confirmCompanies` and
`runs.startFromLeads`, and spends that workspace's own credits doing it. Nothing about the send
boundary moved: no key of any kind can send.

**Eleven functions added, none removed or changed.** `campaigns.messageStructure`,
`campaigns.setMessageStructure` and `campaigns.lockMessageStructure` state what a campaign's message
is made of and lock it so nothing rewrites it. `flows.list`, `flows.runs`, `flows.create`,
`flows.update`, `flows.setEnabled`, `flows.delete` and `flows.saveSkill` reach the flow builder.
`replies.preview` drafts a reply without writing it into a thread. The manifest went from 61
functions to 72, of which 65 are open to a sandbox key.

**`/v1/` aliases documented.** `/v1/mcp/query`, `/v1/mcp/mutate`, `/v1/mcp/run`,
`/v1/mcp/material/upload` and `/v1/mcp/capabilities` have always pointed at the same handlers as the
unversioned paths. Both are kept; `/v1/` is the seam where a behaviour change would appear.

**`leads.add` takes `companyDomain`, not `website`.** The example client and the research-handoff
skill both passed `website`, which the function does not declare and Convex rejects, so anyone who
copied them got an argument error on their first call. Fixed in both.

**The settings path is Settings → Connections → MCP server.** It was written as "Settings → Apps →
API key", which no longer matches the app.

## 2026-08-20

**`messages.send` never existed.** The 2026-08-06 entry below lists it among the functions that
need a live key, and the README carried the same row. There is no such function in any dispatch
table and none is planned: a live key buys contact data and engine runs, never a send. Sending
happens in the Selda app after a human approves each message. The wrong line is left standing below
rather than edited out, because anyone who read it may have planned around it.

**Sixteen functions became visible.** They were dispatchable over HTTP the whole time and wrapped by
no MCP tool, so a client could not see them. Nothing about what they do changed:

`leads.delete`, `leads.deleteBatch`, `leads.merge`, `leads.addBatch`, `leads.addTag`,
`webhooks.create`, `webhooks.list`, `webhooks.delete`, `knowledge.get`, `knowledge.set`,
`knowledge.append`, `messages.approve`, `messages.generate`, `replies.classify`,
`projects.updateContext`, `connectors.list`.

**`events.ingest` takes `autoAdvance`.** With it, an arriving lead does not just get stored: Selda
reads the workspace's Brain, writes the reply in the language the enquiry was written in, and leaves
it in the Sales Inbox. It sends nothing. Off by default, because it spends. With no Brain material
to answer from it drafts nothing and reports `no_brain_material` — an invented price approved by
somebody who assumed Selda knew the real one is worse than no draft.

**Two new webhook events: `draft.ready` and `draft.failed`.** Every other event reports what already
happened, so the surface was pull-only. `draft.ready` is how you learn there is something waiting to
approve.

**Non-ASCII form fields no longer throw.** A field named `Sähköposti` failed the whole
`events.ingest` call with `invalid character 'ä'`, so a Finnish or German site's enquiry was lost
while the visitor saw a thank-you page. Keys are folded server-side and the original spelling is
kept alongside, so nothing is dropped and no integration has to transliterate on its way out.

**`leads.skip` now says that it deletes.** Its summary read "Skip a lead (legacy path)" while the
function removed the lead and every message on it. Behaviour unchanged; the description was wrong.
It also needs a Clerk session and cannot be reached by any API key — use `leads.delete`.

## 2026-08-06

First public release of this repository: README, a working example client, two loadable skills, and
generated schemas.

**Breaking, and deliberate: a sandbox key can no longer spend.** `company.lookup`,
`leads.enrich`, `leads.enrichBatch`, `engine.start`, `connectors.sync`, `messages.send` and
`material.import` with `autoAdvance` now require a live key on a paid plan. Everything else stays
open to a sandbox key, including every read and every write that pushes your own data in. If your
integration used a sandbox key for contact lookup, it will now get a `403` with
`code: "live_key_required:<reason>"` and a sentence explaining it.

**Removed: `projects.create`.** A workspace is created by a person in the Selda app. It is not
gated, it is gone, and calling it returns `unknown_fn`.

**Added: `events.ingest`** (`selda_ingest_event`), for pushing an event from your own site or
product into a workspace. Matches an existing lead on email or LinkedIn, never on domain, because
merging two colleagues cannot be undone. Returns every field on every call, so absence never has to
be interpreted. Needs the inbound add-on.

**Added: the Brain** is readable and writable (`selda_list_brain`, `selda_add_brain_item`,
`selda_update_brain_item`, `selda_remove_brain_item`), so a workspace can be filled and grown from a
script rather than by hand.

**Clarified: `leads.add` already returned `leadId` and deduplicated on email.** The documentation
said "New lead object", which led at least one integrator to defensively handle two shapes. The
response shape is now published. A suppressed address returns `blocked` with a reason instead of
silently vanishing.

**Added to `GET /mcp/capabilities`:** `sandboxAllowed`, `liveOnlyReason` and `requiresEntitlement`,
so a limit can be read rather than discovered by hitting it.

## Earlier

- `selda_create_campaign` and `selda_add_leads_by_tag` were removed. They wrote to a legacy table
  the app's campaign view does not read, so a campaign created that way was invisible in the
  product. Use `selda_upload_material` and `selda_import_material` instead: they create a real,
  reviewable campaign through the same path the app's own folder drop uses.
