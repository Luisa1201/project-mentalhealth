import React from "react";
import "./ForgotPassword.css";

function ForgotPassword() {
  return (
    <div className="forgot-body">
    <div className="forgot-container">
      <h2>Recuperar contraseña</h2>
      <p className="forgot-text">
        Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
      </p>
      <form className="forgot-form">
        <input type="email" placeholder="Correo electrónico" required />
        <button type="submit">Enviar enlace</button>
      </form>

      <p className="auth-text">
        <button type="button" className="back-btn" onClick={() => window.location.href = "/loginPage"}>
          Volver al inicio de sesión
        </button>
      </p>
    </div>
    </div>
  );
}

export default ForgotPassword;
