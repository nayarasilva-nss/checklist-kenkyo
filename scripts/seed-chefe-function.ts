import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { jobFunctions, organizations } from "../lib/db/schema";

const JOB_FUNCTION_NAME = "Chefe";

async function main() {
  const [kenkyo] = await db.select({ id: organizations.id }).from(organizations).where(eq(organizations.slug, "kenkyo"));
  if (!kenkyo) {
    console.log("Organização Kenkyo não encontrada, pulando.");
    process.exit(0);
  }

  const existing = await db
    .select({ id: jobFunctions.id })
    .from(jobFunctions)
    .where(eq(jobFunctions.name, JOB_FUNCTION_NAME))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(jobFunctions).values({ name: JOB_FUNCTION_NAME, organizationId: kenkyo.id });
    console.log(`Função "${JOB_FUNCTION_NAME}" criada.`);
  } else {
    console.log(`Função "${JOB_FUNCTION_NAME}" já existe, pulando.`);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
