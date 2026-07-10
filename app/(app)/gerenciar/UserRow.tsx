"use client";

import { useState, useTransition } from "react";
import { updateUser, deleteUser } from "@/lib/actions/manage";
import { DeleteButton } from "./DeleteButton";

const PROFILE_LABELS: Record<string, string> = {
  gestor: "Gestor",
  gerente: "Gerente",
  lider: "Líder",
};

type User = {
  id: number;
  name: string;
  username: string;
  profile: string;
};

export function UserRow({ user }: { user: User }) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();

  if (!editing) {
    return (
      <div className="list-item">
        <div className="info">
          <h4>{user.name}</h4>
          <p>
            @{user.username} • {PROFILE_LABELS[user.profile] ?? user.profile}
          </p>
        </div>
        <div className="list-item-actions">
          <button
            className="btn-small"
            type="button"
            onClick={() => setEditing(true)}
          >
            Editar
          </button>
          <DeleteButton
            action={deleteUser}
            id={user.id}
            confirmText={`Deletar o usuário "${user.name}"?`}
          />
        </div>
      </div>
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await updateUser(undefined, fd);
      if (result?.error) {
        setError(result.error);
      } else {
        setError(undefined);
        setEditing(false);
      }
    });
  }

  return (
    <form className="inline-form" onSubmit={handleSubmit}>
      <input type="hidden" name="id" value={user.id} />
      <h4>Editar Usuário</h4>
      <div className="form-group">
        <label htmlFor={`editUserName-${user.id}`}>Nome</label>
        <input
          id={`editUserName-${user.id}`}
          name="name"
          defaultValue={user.name}
        />
      </div>
      <div className="form-group">
        <label htmlFor={`editUsername-${user.id}`}>Usuário (login)</label>
        <input
          id={`editUsername-${user.id}`}
          name="username"
          defaultValue={user.username}
          autoComplete="off"
        />
      </div>
      <div className="form-group">
        <label htmlFor={`editUserProfile-${user.id}`}>Perfil</label>
        <select
          id={`editUserProfile-${user.id}`}
          name="profile"
          defaultValue={user.profile}
        >
          <option value="lider">Líder</option>
          <option value="gerente">Gerente</option>
          <option value="gestor">Gestor</option>
        </select>
      </div>
      <div className="form-group">
        <label htmlFor={`editUserPassword-${user.id}`}>Senha</label>
        <input
          id={`editUserPassword-${user.id}`}
          name="password"
          type="password"
          placeholder="Deixe em branco para manter"
        />
      </div>
      {error && <p className="login-error">{error}</p>}
      <div className="inline-form-buttons">
        <button
          type="button"
          className="btn-cancel"
          onClick={() => setEditing(false)}
        >
          Cancelar
        </button>
        <button className="btn-save" type="submit" disabled={isPending}>
          Salvar
        </button>
      </div>
    </form>
  );
}
