import React, { useState } from "react";
import "./ResetPage.css";

function ResetPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleResetPassword = (e) => {
    e.preventDefault();
    // Aquí iría la lógica de restablecimiento
    console.log("Restablecer contraseña");
  };

  return (
    <div className="reset-body">
      <div className="reset-container">
        <h2>Restablecer contraseña</h2>
        <p className="reset-text">
          Ingresa tu nueva contraseña para restablecer el acceso a tu cuenta.
        </p>

        <form className="reset-form" onSubmit={handleResetPassword}>
          <input
            type="password"
            placeholder="Nueva contraseña"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Confirmar nueva contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <button type="submit">
            Restablecer contraseña
          </button>
        </form>

        <p className="auth-text">
          <button
            type="button"
            className="back-btn"
            onClick={() => window.location.href = "/loginPage"}
          >
            😊 Volver al inicio de sesión
          </button>
        </p>
      </div>
    </div>
  );
}

export default ResetPage;
