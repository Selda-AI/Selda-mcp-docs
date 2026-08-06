# Changelog

Changes to the Selda tool surface. An integration that breaks silently is worse than one that
breaks loudly, so anything that can break yours is recorded here.

The live capability manifest at `GET /mcp/capabilities` is always the authority on what exists
right now. This file exists to tell you what moved.

## 2026-08-06

- First public release of this repository: README, a working example client, and two loadable
  skills.

### Known and being worked on

- Some functions that spend money to discover real people's contact details will move behind a live
  key on a paid plan. A sandbox key will keep full read access to a workspace and full ability to
  push your own data in. This changes nothing for a live key.
- Generated tool schemas will be published under `schemas/` once that lands.

## Earlier

- `selda_create_campaign` and `selda_add_leads_by_tag` were removed. They wrote to a legacy table
  the app's campaign view does not read, so a campaign created that way was invisible in the
  product. Use `selda_upload_material` and `selda_import_material` instead: they create a real,
  reviewable campaign through the same path the app's own folder drop uses.
