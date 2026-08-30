---
name: selda-research-handoff
description: Hand research you already produced to Selda so its outreach is written from your material instead of a fresh crawl. Use after analysing companies, scraping a source, or reading a folder of prospect documents.
---

# Research handoff to Selda

You have just done the expensive part: you understand these companies. This skill is about not
throwing that away. Selda can write from your analysis instead of rediscovering the same facts,
and the difference shows in the message.

## Pick the right path

| What you have | Use |
|---|---|
| A company, a contact, and your own written analysis | `selda_add_lead` with `analysis` |
| Files on disk, one folder per company | `selda_upload_material` per file, then `selda_import_material` |

## Handing over one company

```
selda_add_lead {
  projectId: "...",
  company: "Filterit Oy",
  companyDomain: "filterit.fi",
  email: "etunimi@filterit.fi",
  analysis: "Three production lines. Posted in March about unplanned downtime.
             Their maintenance is outsourced and the contract renews in autumn."
}
```

Write `analysis` as prose, the way you would brief a colleague. Specific and dated beats
comprehensive. Two concrete observations a competitor would not know is worth more than a page of
company description Selda could have crawled itself.

## Handing over a folder

The path is the mapping. `boreo/filterit/analyysi.pdf` tells Selda the file belongs to Filterit.
Send the path relative to the folder you would otherwise have dragged into the app, upload each
file, then pass every returned storage id to `selda_import_material`.

Importing creates the campaign and the company list and **stops there**. Giving Selda your material
is permission to read it, not permission to run a campaign. If you want the run to continue,
`autoAdvance` grants the next stages one at a time: `["leads"]` finds contacts and stops before
anything is written, `true` also drafts messages and spends credits. Neither can send.

## Rules that matter

**Never write credentials, passwords, API keys or access tokens into a lead, a note or an analysis
field.** If your source material contains them, leave them out. A lead record is not a vault, and
anything you put there can end up in front of a person.

**Do not invent to fill a field.** An empty `analysis` is honest. A plausible sounding one produces
a message that names something that never happened, which is worse than a generic message. If you
did not find a reason to reach out, say so and let the human decide.

**Zero and unknown are different.** "No employees listed" is not "0 employees". Carry the
distinction through.

## After the handoff

Tell the user what landed and what it now needs from them: drafts are in the Selda app, a human
reviews and sends. Do not describe the work as finished, and do not offer to send it.
