"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentUser, requireGestor } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { deliveryErrorRecords } from "@/lib/db/schema";
import { canSubmitDeliveryError } from "@/lib/data/delivery-errors";
import { addHistoryEntry } from "@/lib/data/history";
import { resolveEffectiveUnitId } from "@/lib/auth/covering-unit";

export type DeliveryErrorFormState = { error?: string } | undefined;

export async function createDeliveryErrorRecord(
  _prevState: DeliveryErrorFormState,
  formData: FormData,
): Promise<DeliveryErrorFormState> {
  const user = await getCurrentUser();

  if (!canSubmitDeliveryError(user)) {
    return { error: "Você não tem permissão para registrar pedidos com erro" };
  }

  // Unidade efetiva do dia — quem está cobrindo outra unidade registra
  // pra lá. Quem não tem unidade fixa (hoje, Gestor) escolhe na hora,
  // via unitId no formulário (ver units em PedidosErroForm).
  let effectiveUnitId = await resolveEffectiveUnitId(user);
  if (!effectiveUnitId) {
    const rawUnitId = Number(formData.get("unitId"));
    if (!rawUnitId) {
      return { error: "Selecione a unidade" };
    }
    effectiveUnitId = rawUnitId;
  }

  const date = String(formData.get("date") ?? "").trim();
  const totalPedidosRaw = String(formData.get("totalPedidos") ?? "").trim();
  const pedidosComErroRaw = String(formData.get("pedidosComErro") ?? "").trim();
  const motivo = String(formData.get("motivo") ?? "").trim() || null;

  if (!date) return { error: "Informe a data" };

  const totalPedidos = Number(totalPedidosRaw);
  if (!Number.isInteger(totalPedidos) || totalPedidos <= 0) {
    return { error: "Informe o total de pedidos do dia" };
  }

  const pedidosComErro = Number(pedidosComErroRaw);
  if (!Number.isInteger(pedidosComErro) || pedidosComErro < 0) {
    return { error: "Informe uma quantidade válida de pedidos com erro" };
  }

  if (pedidosComErro > totalPedidos) {
    return { error: "Pedidos com erro não pode ser maior que o total de pedidos" };
  }

  if (!user.organizationId) return { error: "Conta sem empresa associada" };

  await db.insert(deliveryErrorRecords).values({
    organizationId: user.organizationId,
    unitId: effectiveUnitId,
    userId: user.id,
    date,
    totalPedidos,
    pedidosComErro,
    motivo,
  });

  await addHistoryEntry(
    user.id,
    `Registro de pedidos com erro: ${pedidosComErro}/${totalPedidos}`,
    "completed",
  );

  revalidatePath("/perdas");
}

export async function deleteDeliveryErrorRecord(formData: FormData) {
  await requireGestor();
  const id = Number(formData.get("id"));
  if (!id) return;
  await db.delete(deliveryErrorRecords).where(eq(deliveryErrorRecords.id, id));
  revalidatePath("/perdas");
}
