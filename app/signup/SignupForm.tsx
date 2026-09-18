"use client";

import { useActionState } from "react";
import { signupOrganization } from "@/lib/actions/organizations";

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signupOrganization, undefined);

  return (
    <form action={formAction}>
      <div className="form-group">
        <label htmlFor="companyName">Nome da empresa</label>
        <input
          type="text"
          id="companyName"
          name="companyName"
          placeholder="Ex: Restaurante Sabor & Cia"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="name">Seu nome</label>
        <input type="text" id="name" name="name" placeholder="Seu nome completo" required />
      </div>

      <div className="form-group">
        <label htmlFor="username">Usuário</label>
        <input
          type="text"
          id="username"
          name="username"
          placeholder="Login que você vai usar"
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
          placeholder="Pelo menos 6 caracteres"
          required
          minLength={6}
          autoComplete="new-password"
        />
      </div>

      {state?.error && <p className="login-error">{state.error}</p>}

      <button className="btn-login" type="submit" disabled={pending}>
        {pending ? "Criando..." : "Criar empresa"}
      </button>
    </form>
  );
}
