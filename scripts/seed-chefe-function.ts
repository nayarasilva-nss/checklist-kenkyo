import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { jobFunctions } from "../lib/db/schema";

const JOB_FUNCTION_NAME = "Chefe";

async function main() {
  const existing = await db
    .select({ id: jobFunctions.id })
    .from(jobFunctions)
    .where(eq(jobFunctions.name, JOB_FUNCTION_NAME))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(jobFunctions).values({ name: JOB_FUNCTION_NAME });
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
