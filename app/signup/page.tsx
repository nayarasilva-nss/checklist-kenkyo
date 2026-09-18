import Link from "next/link";
import { SignupForm } from "./SignupForm";

export default function SignupPage() {
  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Criar empresa</h1>
        <p>Cadastre sua empresa e comece a usar — sem depender de ninguém pra configurar.</p>
        <SignupForm />
        <p style={{ marginTop: 16, fontSize: 13, textAlign: "center" }}>
          Já tem uma conta? <Link href="/login">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
