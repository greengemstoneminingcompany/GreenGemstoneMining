# GGMC 2.0 — Buyer-ready website and owner studio

**Branch:** `concept/buyer-ready-ggmc-studio`
**Base:** `feature/advanced-design-creative-studio`
**Purpose:** A visually inspectable concept, not a production release or a buyer diligence certification.

## What this concept demonstrates
- Public redesign: Overview, Company, Projects, Minerals, Operations, Gallery, Evidence, and Contact.
- Responsive editorial art direction: forest-and-gold, readable cream backgrounds, minimal layout, documented project records.
- Company-supplied project classifications and factual distinctions; no new resource or reserve claims.
- Owner Studio: visual home-page copy editing; live design preview; mobile/desktop mock preview; style palettes; local image selection; searchable read-only project data; evidence follow-up checklist; translation review screen; local draft save, undo, redo, reset.
- `?classic=1` opens the original feature-branch experience for visual comparison.

## What this is *not*
- It does not publish content to production, create a buyer data room, authenticate real investors, upload media, or verify minerals/licences, company ownership, contracts, equipment or financials.
- The concept studio is a **browser-local sandbox**. Anyone with access to the preview can experiment; their changes cannot write to the production database. Production publish is disabled.
- The gallery reuses the existing Supabase folder browser. Media association, covers, bulk upload pipeline, approval, and provenance are outstanding integration work.
- The studio's mobile view is a bounded design approximation, not full browser-device emulation.
- The source photos/collages in `public/assets/images` have not been independently authenticated. Other categories deliberately show empty cover placeholders rather than fabricated photos.
- The English concept has not yet been independently translated to Somali, Arabic or Chinese.

## Verification before any promotion
1. GitHub Actions lint, TypeScript, unit tests, build and Playwright smoke tests.
2. Live desktop/tablet/mobile browser inspection of the deployed preview.
3. Accessibility and performance audits.
4. Security review of any new database writes/auth/publishing before implementation.
5. Independent review of company claims and source documents.
6. Formal approval before touching production or merging to main.

The architectural direction is to retain one authoritative structured content model and protected server-side publishing, rather than allow the demo controls to mutate the live website.
