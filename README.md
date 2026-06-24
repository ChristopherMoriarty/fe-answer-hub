# Answer Hub — Frontend

Interview prep workspace. Tree of topics on the left, Markdown answers on the right.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- TanStack Query
- react-markdown + GFM

## Run

```bash
npm install
npm run dev
```

Backend should be on `http://localhost:8000`. Vite proxies `/api` in dev.

## Design

Dark **study desk** theme: grid background, amber accent, DM Sans + JetBrains Mono.

## Structure

```
src/
├── api/           # fetch client + nodes endpoints
├── components/
│   ├── tree/      # sidebar tree
│   └── editor/    # markdown edit / preview
├── hooks/         # react-query hooks
└── types/         # API types
```
