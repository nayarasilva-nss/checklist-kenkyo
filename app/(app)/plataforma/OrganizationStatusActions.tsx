"use client";

import { useTransition } from "react";
import { updateOrganizationStatus } from "@/lib/actions/organizations";
import type { OrganizationStatus } from "@/lib/data/organizations";

export function OrganizationStatusActions({
  organizationId,
  status,
}: {
  organizationId: number;
  status: OrganizationStatus;
}) {
  const [pending, startTransition] = useTransition();

  function run(next: OrganizationStatus) {
    startTransition(() => updateOrganizationStatus(organizationId, next));
  }

  if (status === "pending") {
    return (
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" className="btn-secondary" disabled={pending} onClick={() => run("active")}>
          Aprovar
        </button>
        <button type="button" className="btn-secondary" disabled={pending} onClick={() => run("suspended")}>
          Recusar
        </button>
      </div>
    );
  }

  if (status === "active") {
    return (
      <button type="button" className="btn-secondary" disabled={pending} onClick={() => run("suspended")}>
        Suspender
      </button>
    );
  }

  return (
    <button type="button" className="btn-secondary" disabled={pending} onClick={() => run("active")}>
      Reativar
    </button>
  );
}
