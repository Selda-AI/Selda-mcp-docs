---
name: selda-workspace
description: Drive a Selda go-to-market workspace. Use when the user wants to find companies to reach, add prospects, run the GTM pipeline, review drafted outreach, or report on campaign results through their connected Selda account.
---

# Selda workspace

Others give you a list. Selda gets you the conversation: it works out who to reach, researches each
company, writes every message from that research, and carries the thread to a customer, a quote, or
a meeting. A person approves every send. The app is at https://app.selda.ai. Every call is scoped
to the organization that owns the API key, so never pass `orgId` or `userId`.

## Golden rules

1. **Call `selda_list_projects` first.** Everything else needs a `projectId`, and the user usually
   has more than one workspace.
2. **Nothing you do sends anything.** Every tool here produces drafts. A human approves and sends
   inside the Selda app. Never tell the user you sent something, and never imply Selda blasts email.
3. **Precision over volume.** A few companies with a real reason to be contacted beats a long list.
   If the user asks for a big number, ask what a good customer looks like first.
4. **Direct add beats discovery when the user already knows who.** If they hand you companies, a
   URL, or a list, add each one with `selda_add_lead`. Use `selda_run_pipeline` only for open ended
   searches like "find SaaS founders in Finland".
5. **The pipeline costs credits and takes minutes.** Start it, tell the user it is running, then
   poll `selda_get_run_status`. If runs fail, check `selda_credits` before guessing.

## Tools

**Reading**
- `selda_list_projects` gives workspaces and the `projectId` everything else needs
- `selda_get_project` gives one workspace's business context, ICP and settings
- `selda_list_leads`, `selda_get_lead` give a workspace's leads and one lead in full, including the
  research behind it, the fit judgement, and the outreach angle
- `selda_list_messages`, `selda_get_thread` give messages and the whole conversation with one lead
- `selda_list_campaigns`, `selda_get_campaign`, `selda_campaign_stats` give campaigns and results
- `selda_get_run_status` polls a pipeline run: phase, companies found, contacts resolved, drafts
  written, and any error
- `selda_credits` gives balance, daily free credits and plan

**Writing**
- `selda_add_lead` adds a company or person you already know. Pass `analysis` with research you
  already did and Selda writes from your material instead of crawling from scratch. Dedupes by email.
- `selda_update_lead` moves status (new, contacted, responded, qualified, unqualified) or edits notes

**Running**
- `selda_run_pipeline` runs the engine from a brief: find companies, research, judge fit, find the
  angle, draft the message
- `selda_lookup` resolves one company and returns the right people to reach, without starting
  anything. Uses paid data, so it needs a workspace whose plan includes the API.
- `selda_upload_material` then `selda_import_material` turns a folder of your own research into a
  reviewable campaign

## Flows that work

**Explore.** `selda_list_projects`, then `selda_get_project`, then `selda_list_leads`. Summarise
what the workspace is actually for before listing rows at the user.

**Add prospects the user named.** `selda_list_projects`, then one `selda_add_lead` per company with
whatever research you have in `analysis`. Then tell them drafts are waiting for review in the app.

**Discovery.** `selda_list_projects`, then `selda_run_pipeline` with a brief that says who, where,
and why now. A vague brief produces a vague list. Then poll `selda_get_run_status` and read the
results with `selda_list_leads`.

**Report.** `selda_list_campaigns`, then `selda_campaign_stats`. Lead with replies and meetings.
Sends are an input, not a result.

## When a call is refused

A handful of functions spend money to discover real people, so a workspace that has not bought the
API is refused them. The error message says which, in a sentence. Relay it as written and offer
what the sandbox can still do, which is adding companies the user already has and drafting against
them. Do not retry the same call hoping for a different answer.

Connecting at all is not the gate: MCP and the API are on every plan, the free one included.

## Voice

When you draft or summarise outreach: one concrete idea, one real observation about that specific
prospect, one ask. No template feel. No "I hope this email finds you well". No em dashes. The
whole point is that it reads as a conversation somebody started, not an entry off a list, so make
sure the research is visible in the words.
