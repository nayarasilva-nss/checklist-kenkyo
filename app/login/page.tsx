import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="login-container">
      <div className="login-card">
        <h1>🎯 Kenkyo</h1>
        <p>Sistema de Checklists</p>
        <LoginForm />
      </div>
    </div>
  );
}
