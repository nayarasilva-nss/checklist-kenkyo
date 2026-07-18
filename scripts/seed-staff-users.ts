import { randomInt } from "crypto";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { jobFunctions, units, users } from "../lib/db/schema";

type StaffDef = {
  name: string;
  username: string;
  profile: "gestor" | "gerente" | "lider" | "rh";
  jobFunctionName: string;
};

const UNIT_NAME = "Kenkyo Garden";

const STAFF: StaffDef[] = [
  { name: "Fernanda Silva", username: "fernanda.silva", profile: "lider", jobFunctionName: "Chefe" },
  { name: "Marlene Assis", username: "marlene.assis", profile: "lider", jobFunctionName: "Chefe" },
  { name: "Carlos Augusto", username: "carlos.augusto", profile: "lider", jobFunctionName: "Chefe" },

  { name: "Robson Antonio", username: "robson.antonio", profile: "lider", jobFunctionName: "Chefe de Sushibar" },
  { name: "Johnatan Diego", username: "johnatan.diego", profile: "lider", jobFunctionName: "Chefe de Sushibar" },
  { name: "Rai Mateus", username: "rai.mateus", profile: "lider", jobFunctionName: "Chefe de Sushibar" },
  { name: "Andre Luiz", username: "andre.luiz", profile: "lider", jobFunctionName: "Chefe de Sushibar" },

  { name: "Carla Rafaella", username: "carla.rafaella", profile: "gerente", jobFunctionName: "Gerente" },
  { name: "Geovana Brandao", username: "geovana.brandao", profile: "gerente", jobFunctionName: "Gerente" },
  { name: "Ivan Junio", username: "ivan.junio", profile: "gerente", jobFunctionName: "Gerente" },

  { name: "Joab Fellipe", username: "joab.fellipe", profile: "lider", jobFunctionName: "Líder de Sushibar" },

  { name: "Luis Gustavo", username: "luis.gustavo", profile: "lider", jobFunctionName: "Líder de Bar" },

  { name: "Ana Beatriz Barbosa", username: "ana.barbosa", profile: "lider", jobFunctionName: "Líder de Delivery" },
  { name: "Karollyna Amorim", username: "karollyna.amorim", profile: "lider", jobFunctionName: "Líder de Delivery" },

  { name: "Luzivania Pereira", username: "luzivania.pereira", profile: "lider", jobFunctionName: "Líder de Estoque/Produção" },
];

function randomPassword4() {
  return String(randomInt(0, 10000)).padStart(4, "0");
}

async function main() {
  let [unit] = await db.select().from(units).where(eq(units.name, UNIT_NAME)).limit(1);
  if (!unit) {
    [unit] = await db.insert(units).values({ name: UNIT_NAME }).returning();
    console.log(`Unidade criada: "${UNIT_NAME}"`);
  }

  const allFunctions = await db.select().from(jobFunctions);
  const funcByName = new Map(allFunctions.map((f) => [f.name, f.id]));

  const existingUsernames = new Set(
    (await db.select({ username: users.username }).from(users)).map((u) => u.username),
  );

  console.log("=== CREDENCIAIS (anote agora, não ficam salvas em lugar nenhum) ===");

  for (const staff of STAFF) {
    if (existingUsernames.has(staff.username)) {
      console.log(`"${staff.username}" já existe, pulando.`);
      continue;
    }

    const jobFunctionId = funcByName.get(staff.jobFunctionName);
    if (!jobFunctionId) {
      console.error(`Função "${staff.jobFunctionName}" não encontrada, abortando "${staff.name}".`);
      continue;
    }

    const password = randomPassword4();
    const passwordHash = await bcrypt.hash(password, 10);

    await db.insert(users).values({
      name: staff.name,
      username: staff.username,
      passwordHash,
      profile: staff.profile,
      unitId: unit.id,
      jobFunctionId,
    });

    console.log(`${staff.name} | usuário: ${staff.username} | senha: ${password}`);
  }

  console.log("=== FIM DAS CREDENCIAIS ===");
  console.log("Criação de usuários concluída.");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
