import Image from "next/image";
import Link from "next/link";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="login-container">
      <div className="login-card">
        <Image
          src="/kenkyo-logo.png"
          alt="Kenkyo"
          width={64}
          height={64}
          className="login-logo"
          priority
        />
        <h1>Kenkyo</h1>
        <p>Sistema de Checklists</p>
        <LoginForm />
        <p style={{ marginTop: 16, fontSize: 13, textAlign: "center" }}>
          Sua empresa ainda não usa o sistema?{" "}
          <Link href="/signup">Criar empresa</Link>
        </p>
      </div>
    </div>
  );
}
