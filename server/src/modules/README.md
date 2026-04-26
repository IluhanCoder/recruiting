# Server Modules Standard

Each feature on the server must live in its own folder under `src/modules/<feature>`.

Required files per feature:
- `<feature>-types.ts`
- `<feature>-service.ts`
- `<feature>-controller.ts`
- `<feature>-router.ts`

Optional file (when persistence is needed):
- `<feature>-schema.ts`

Rules:
- `*-router.ts`: only route declarations and middleware composition.
- `*-controller.ts`: only request/response flow and calling services.
- `*-service.ts`: business logic and DB access.
- `*-types.ts`: DTOs and module-level contract types.
- `*-schema.ts`: Mongoose schemas/models only.

Shared code is outside features:
- `src/middlewares`
- `src/shared`

All API routes are mounted from `src/app.ts`.
