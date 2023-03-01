import type { BFulltextId } from "@/db/schema/entity/fulltext-id";
type FulltextProps = Pick<BFulltextId, "schema" | "schemaId" | "propertyKey">;
