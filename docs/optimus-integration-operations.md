# Optimus integration: market data and company analytics

## Verified implementation boundary
The existing Vite/React application remains the engine. The Atlas styling layer is loaded after the existing styles. The original six pages, four dictionaries, map, forms and media workflows are retained.

## Market data
The homepage calls `GET /api/market-prices`. The server-side adapter requires:
- `MARKET_DATA_URL`: HTTPS URL of an authorized market-data service returning `{ "quotes": [...] }`.
- `MARKET_DATA_TOKEN`: private bearer token for that service.

Each quote must include `symbol`, numeric `price`, `currency`, `unit`, ISO `asOf`, and `source`. Optionally include `delayMinutes`. Quote symbols must exactly match mineral names in company records for the UI to display them. Implement provider-specific symbol mapping **on the server** once the actual vendor contract is known. Do not assume that all minerals have LME contracts; display unavailable where no licensed reference exists. Market data may be delayed and may not be licensed for public redistribution. Confirm the vendor's display rights before enabling.

No provider is currently configured. The market board therefore displays unavailable values rather than invented figures.

## First-party analytics
Deploy migration `20261104010000_first_party_aggregate_analytics.sql` to the company's Supabase project. Deploy `supabase/functions/site-analytics` and set `SITE_ORIGIN` to the exact production origin, along with the usual Supabase server secrets. Set the frontend `VITE_SITE_ANALYTICS_URL` to the deployed function's HTTPS endpoint. The frontend records only the route and language, respects Do Not Track, and does not use cookies or persistent visitor IDs. The database stores daily aggregate page views. The table is inaccessible to anonymous and authenticated browser roles; only the service-role RPC can increment counts.

These are aggregate page-view counts, not verified unique human visitors. Origin checks alone are **not** a substitute for bot detection, and deployment needs rate limiting and monitoring before relying on counts for business decisions. The endpoint is disabled unless configured.

## Release checks
Do not publish until `npm ci`, `npm run build` (which includes typecheck, lint, unit tests and budget), and `npm run test:e2e` pass. Validate all four language routes, RTL behavior, form persistence and auth, security headers, and browser network requests. Confirm that the configured market-data feed has the required license and source attribution. Verify the actual production endpoint and Supabase project ownership.
