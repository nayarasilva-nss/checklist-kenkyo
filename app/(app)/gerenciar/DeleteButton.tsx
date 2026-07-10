"use client";

export function DeleteButton({
  action,
  id,
  confirmText,
}: {
  action: (formData: FormData) => void;
  id: number;
  confirmText: string;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="btn-small btn-delete"
        onClick={(e) => {
          if (!confirm(confirmText)) e.preventDefault();
        }}
      >
        Deletar
      </button>
    </form>
  );
}
