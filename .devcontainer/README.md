# GreenGemstoneMining development container

Open this checkout in VS Code and run **Dev Containers: Reopen in Container**.
The image includes Playwright 1.58.2 browsers and Linux dependencies. The
Dockerfile pins Node 22.22.2; package-lock.json pins npm dependencies.
The setup runs `npm ci`. No application secrets are needed for static checks.

Run:

```sh
node --version
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
```

Run the website with `npm run dev -- --host 0.0.0.0`; VS Code forwards port 5173.
Playwright starts its own local server on port 4173. Update the Playwright image
and the exact @playwright/test dependency together to keep browsers compatible.
Do not reuse a macOS node_modules directory inside the Linux container; `npm ci`
reinstalls platform-specific dependencies when the container is created.

Validated on 2026-10-31 using the VS Code Dev Containers CLI: image build,
`npm ci`, Node 22.22.2 / npm 10.9.4, production build (including typecheck,
lint and 78 unit tests), and all 36 Playwright browser tests passed in Linux.
Lint retains one existing React refresh warning in `src/main.tsx`.
Dependency installation reports 12 moderate audit findings; these require a
separate dependency review rather than an automatic breaking upgrade.
