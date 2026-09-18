"use client";

import { useTransition } from "react";
import { approveOrganization } from "@/lib/actions/organizations";

export function ApproveButton({ organizationId }: { organizationId: number }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="btn-secondary"
      disabled={pending}
      onClick={() => startTransition(() => approveOrganization(organizationId))}
    >
      {pending ? "Aprovando..." : "Aprovar"}
    </button>
  );
}
