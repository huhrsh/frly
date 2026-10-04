# Fryly SEO review — 4 October 2026

## Research and positioning

Reviewed available web-search results for group management apps, payment/expense splitters, group travel planners and shared checklist apps. This was not a location-controlled Google India ranking audit. Search volume, traffic, backlinks and ranking causes were not measured. Lessons below are inferences about intent and usefulness.

- [Splitwise](https://www.splitwise.com/) explains shared expenses through trips, housemates and friends. [Tricount](https://www.tricount.com/) foregrounds bill splitting and balances. Apply plain expense language, a worked example and an explicit explanation of settlement. Avoid copying competitor claims about transfers, imports, receipt scanning or currency conversion.
- [Trip Tracka](https://www.triptracka.com/group-trip-planner) and [Plan Harmony](https://www.planharmony.com/) combine trip planning with shared costs. Apply a before/during/after workflow. Fryly uses manually entered itinerary notes, links and calendar events, rather than automated route planning or booking imports.
- [OurGroceries](https://www.ourgroceries.com/overview) uses a specific household task to explain shared lists; its [FAQ](https://www.ourgroceries.com/faq) answers how sharing works. Apply groceries, chores and packing examples with a starter packing list.
- [Taskade team documentation](https://help.taskade.com/en/articles/8958682-taskade-for-teams) demonstrates workspace and team organisation intent. Generic group management searches are broad. Fryly should identify itself as everyday group collaboration, with actual membership roles, rather than imply enterprise project management.

Original copy and existing components were used. The differentiator is expense records, shared notes and checklists together with Owner/Admin/Member/Viewer roles. Payment custom shares, whole-number limitation on Everyone splits, selected section currency and settlement records were inspected in PaymentView.jsx. Roles and approved membership checks were inspected in GroupService.java and GroupManageModal.jsx. Section passwords are removed; no section password promise is added.

## Implemented

12 indexable pages: home, features, pricing, FAQ, about, contact, and six distinct feature/use-case guides:

| Route | Intent |
| --- | --- |
| /group-management-app | Everyday group organisation and permissions |
| /split-expenses | Group bill splitting, shares, balances and settlement records |
| /group-trip-planner | Travel itinerary notes, packing, costs and photos |
| /shared-checklist-app | Shared packing, chores and grocery lists |
| /shared-notes-app | Group rich-text notes and organising decisions |
| /roommate-organizer | Flatmate bills, groceries and house plans |

- Public React components rendered into production HTML, with visible headings and crawlable links before JavaScript runs. Client mounting retains the current authenticated application and dynamic reviews; this is static rendering, not full app hydration.
- Per-route title, description, canonical, Open Graph, Twitter and truthful WebSite/WebPage data. Homepage SoftwareApplication describes real features, without invented reviews or unsupported rich-result promises. Removed public SearchAction because the existing group search is authenticated, not a public URL search.
- Private/account routes and low-content/form pages receive a noindex shell and Vercel X-Robots-Tag. Unknown URLs return a 404 page with HTTP 404 through Vercel routes. These directives do not replace backend access control.
- Sitemap contains only selected public pages. FAQ added; empty blog and submission forms excluded. llms.txt is an optional textual overview, not a guarantee of indexing or AI citations.
- Homepage explains collaboration and expenses directly; contextual guide links and creator project footer links connect the content.
- Signed-in routes load on demand. The main JavaScript bundle dropped from 1,159 kB (333 kB gzip) to 425 kB (133 kB gzip), about 63% smaller by raw size. This is a build measurement, not a measured PageSpeed or Core Web Vitals score.
- Existing verification tags retained. Existing service worker push handlers retained; cache name bumped so previous cached HTML is replaced on update. Navigations remain network-only as before. Build-generated editorial HTML is not promised offline.

## Launch and measurement

Deploy the frontend with the updated build command and frontend/vercel.json together. Do not publish only source changes with an old SPA catch-all configuration. Preview should serve public HTML at canonical paths, keep login/OAuth and nested group links working, and return 404 for unknown URLs. Test Google sign-in, group creation/join, expense entry, browser back/forward, an existing installed PWA update and push deep links. Full authenticated flows and deployed headers require a configured preview/session.

After deployment, submit https://fryly.vercel.app/sitemap.xml to the existing Search Console property. Inspect the homepage and each guide for selected canonical and indexing. Run deployed mobile PageSpeed and rich-result validation. Review impressions, clicks and CTR by query and page over several weeks; start with expense splitting, group trips and shared checklist impressions. Indexability and relevance do not guarantee rankings.

Potential product follow-ups: an interactive public expense-split example, a sanitized original group walkthrough, and reusable starter group setups. These require further product work; no fake screenshots or public exposure of real group data was added.

Technical references: [Google JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics), [Google helpful content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content), [Vercel configuration](https://vercel.com/docs/project-configuration).

## Validation

Production build and automated SEO checks passed for all 12 public pages. Checks cover one H1, unique titles, descriptions, canonicals, social URLs, parseable structured data, sitemap coverage and internal links; route configuration checks cover guides, account/group paths and unknown-page 404 handling. All 91 existing frontend tests passed, plus a new metadata-navigation test. Targeted lint passed for the changed routing and new SEO components. These are local checks, not a deployed Vercel header audit or a full authenticated browser session.

The existing Rolldown/PWA combination prints a plugin compatibility diagnostic during builds, but completes successfully. Generated HTML retains service-worker registration and the push service worker is emitted. There is also a large deferred editor bundle. Installed-device update and notification behavior still need the preview checks above.
