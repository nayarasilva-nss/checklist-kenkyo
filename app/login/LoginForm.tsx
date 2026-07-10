"use client";

import { useActionState } from "react";
import { login } from "@/lib/auth/actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <form action={formAction}>
      <div className="form-group">
        <label htmlFor="username">Usuário</label>
        <input
          type="text"
          id="username"
          name="username"
          placeholder="Seu usuário"
          required
          autoComplete="username"
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">Senha</label>
        <input
          type="password"
          id="password"
          name="password"
          placeholder="Digite sua senha"
          required
          autoComplete="current-password"
        />
      </div>

      {state?.error && <p className="login-error">{state.error}</p>}

      <button className="btn-login" type="submit" disabled={pending}>
        {pending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
