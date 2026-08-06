# Changelog

Changes to the Selda tool surface. An integration that breaks silently is worse than one that
breaks loudly, so anything that can break yours is recorded here.

The live capability manifest at `GET /mcp/capabilities` is always the authority on what exists
right now. This file exists to tell you what moved.

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
