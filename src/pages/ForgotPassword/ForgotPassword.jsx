import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebase";
import Swal from "sweetalert2";
import "./ForgotPassword.css";

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validar que el correo no esté vacío
    if (!email || email.trim() === "") {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Por favor ingresa tu correo electrónico",
      });
      setLoading(false);
      return;
    }

    // Validar formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Por favor ingresa un correo electrónico válido",
      });
      setLoading(false);
      return;
    }

    try {
      const emailLower = email.toLowerCase().trim();
      
      // Enviar correo de recuperación
      await sendPasswordResetEmail(auth, emailLower, {
        url: window.location.origin + "/loginPage",
        handleCodeInApp: false,
      });

      await Swal.fire({
        icon: "success",
        title: "¡Correo enviado!",
        text: "Hemos enviado un enlace de recuperación a tu correo electrónico. Por favor revisa tu bandeja de entrada y spam.",
        confirmButtonText: "Entendido",
      });

      // Limpiar el formulario y redirigir
      setEmail("");
      navigate("/loginPage");
    } catch (error) {
      console.error("Error al enviar correo de recuperación:", error);

      let errorMessage = "No se pudo enviar el correo. Intenta de nuevo más tarde.";

      if (error.code === "auth/user-not-found") {
        errorMessage = "No existe una cuenta con este correo electrónico";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "El correo electrónico no es válido";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Demasiados intentos. Por favor espera un momento antes de intentar de nuevo";
      }

      Swal.fire({
        icon: "error",
        title: "Error",
        text: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-body">
      <div className="forgot-container">
        <h2>Recuperar contraseña</h2>
        <p className="forgot-text">
          Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
        </p>
        <form className="forgot-form" onSubmit={handleSubmit}>
          <input 
            type="email" 
            placeholder="Correo electrónico" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required 
          />
          <button type="submit" disabled={loading}>
            {loading ? "Enviando..." : "Enviar enlace"}
          </button>
        </form>

        <p className="auth-text">
          <button 
            type="button" 
            className="back-btn" 
            onClick={() => navigate("/loginPage")}
            disabled={loading}
          >
            Volver al inicio de sesión
          </button>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
