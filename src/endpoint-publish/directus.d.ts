import type { Accountability, SchemaOverview } from "@directus/types";

declare global {
  namespace Express {
    interface Request {
      schema: SchemaOverview;
      accountability: Accountability | null;
    }
  }
}
