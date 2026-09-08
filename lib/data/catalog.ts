import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { catalogCategories, catalogItems } from "@/lib/db/schema";

export async function getCatalogCategories() {
  return db.select().from(catalogCategories).orderBy(asc(catalogCategories.name));
}

export async function getCatalogItems() {
  return db
    .select({
      id: catalogItems.id,
      name: catalogItems.name,
      unitMeasure: catalogItems.unitMeasure,
      categoryId: catalogItems.categoryId,
      categoryName: catalogCategories.name,
    })
    .from(catalogItems)
    .leftJoin(catalogCategories, eq(catalogCategories.id, catalogItems.categoryId))
    .orderBy(asc(catalogItems.name));
}
