import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { users, templates, templateItems } from "../lib/db/schema";

async function main() {
  const username = process.env.SEED_ADMIN_USERNAME?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!username || !password) {
    throw new Error(
      "SEED_ADMIN_USERNAME e SEED_ADMIN_PASSWORD precisam estar definidos no ambiente",
    );
  }

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (existing.length === 0) {
    const passwordHash = await bcrypt.hash(password, 10);
    await db.insert(users).values({
      name: "Admin",
      username,
      passwordHash,
      profile: "gestor",
    });
    console.log(`Usuário Gestor "${username}" criado.`);
  } else {
    console.log(`Usuário Gestor "${username}" já existe, pulando.`);
  }

  const defaultTemplates = [
    {
      name: "Abertura Padrão",
      description: "Modelo de abertura da loja",
      items: ["Verificar segurança", "Ligar sistemas", "Contar caixa"],
    },
    {
      name: "Fechamento Padrão",
      description: "Modelo de fechamento",
      items: ["Fechar caixa", "Desligar sistemas", "Verificar segurança"],
    },
  ];

  const existingTemplates = await db
    .select({ name: templates.name })
    .from(templates);
  const existingNames = new Set(existingTemplates.map((t) => t.name));

  for (const template of defaultTemplates) {
    if (existingNames.has(template.name)) {
      console.log(`Modelo "${template.name}" já existe, pulando.`);
      continue;
    }

    const [created] = await db
      .insert(templates)
      .values({ name: template.name, description: template.description })
      .returning({ id: templates.id });

    await db.insert(templateItems).values(
      template.items.map((label, position) => ({
        templateId: created.id,
        label,
        position,
      })),
    );
    console.log(`Modelo "${template.name}" criado.`);
  }

  console.log("Seed concluído.");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
