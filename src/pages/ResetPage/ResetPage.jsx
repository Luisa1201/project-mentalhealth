import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { auth, confirmPasswordReset, verifyPasswordResetCode } from "../../firebase";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Swal from "sweetalert2";
import "./ResetPage.css";

function ResetPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [oobCode, setOobCode] = useState(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    // Verificar que el código de restablecimiento sea válido
    const verifyCode = async () => {
      const code = searchParams.get("oobCode");
      
      // MODO DESARROLLO: Permitir acceso sin código para ver la vista
      const devMode = searchParams.get("dev") === "true";
      
      if (!code && !devMode) {
        Swal.fire({
          icon: "error",
          title: "Enlace inválido",
          text: "El enlace de restablecimiento no es válido o ha expirado",
        }).then(() => {
          navigate("/loginPage");
        });
        return;
      }

      // Si es modo desarrollo, solo mostrar la vista
      if (devMode) {
        setEmail("ejemplo@correo.com");
        setOobCode("dev-mode");
        setVerifying(false);
        return;
      }

      try {
        // Verificar el código y obtener el email
        const userEmail = await verifyPasswordResetCode(auth, code);
        setEmail(userEmail);
        setOobCode(code);
        setVerifying(false);
      } catch (error) {
        console.error("Error al verificar código:", error);
        
        let errorMessage = "El enlace de restablecimiento no es válido o ha expirado";
        
        if (error.code === "auth/invalid-action-code") {
          errorMessage = "El enlace ha expirado o ya fue utilizado";
        } else if (error.code === "auth/expired-action-code") {
          errorMessage = "El enlace ha expirado. Solicita un nuevo enlace de recuperación";
        }

        Swal.fire({
          icon: "error",
          title: "Error",
          text: errorMessage,
        }).then(() => {
          navigate("/forgotPassword");
        });
      }
    };

    verifyCode();
  }, [searchParams, navigate]);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validaciones
    if (!newPassword || !confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Por favor completa todos los campos",
      });
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "La contraseña debe tener al menos 6 caracteres",
      });
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Las contraseñas no coinciden",
      });
      setLoading(false);
      return;
    }

    try {
      // Si es modo desarrollo, solo simular el éxito
      if (oobCode === "dev-mode") {
        await Swal.fire({
          icon: "info",
          title: "Modo Desarrollo",
          text: "Vista de demostración. En producción, aquí se restablecería la contraseña real.",
          confirmButtonText: "Entendido",
        });
        setLoading(false);
        return;
      }

      // Confirmar el restablecimiento de contraseña
      await confirmPasswordReset(auth, oobCode, newPassword);

      await Swal.fire({
        icon: "success",
        title: "¡Contraseña restablecida!",
        text: "Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.",
        confirmButtonText: "Ir a inicio de sesión",
      });

      navigate("/loginPage");
    } catch (error) {
      console.error("Error al restablecer contraseña:", error);

      let errorMessage = "No se pudo restablecer la contraseña. Intenta de nuevo";

      if (error.code === "auth/weak-password") {
        errorMessage = "La contraseña es muy débil. Usa una contraseña más segura";
      } else if (error.code === "auth/invalid-action-code") {
        errorMessage = "El enlace ha expirado o ya fue utilizado";
      } else if (error.code === "auth/expired-action-code") {
        errorMessage = "El enlace ha expirado. Solicita un nuevo enlace de recuperación";
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

  if (verifying) {
    return (
      <div className="reset-body">
        <div className="reset-container">
          <h2>Verificando enlace...</h2>
          <p className="reset-text">Por favor espera mientras verificamos tu enlace de recuperación.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-body">
      <div className="reset-container">
        <h2>Restablecer contraseña</h2>
        <p className="reset-text">
          Ingresa tu nueva contraseña para la cuenta: <strong>{email}</strong>
        </p>

        <form className="reset-form" onSubmit={handleResetPassword}>
          <div className="password-container">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Nueva contraseña"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              required
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <div className="password-container">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirmar nueva contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Restableciendo..." : "Restablecer contraseña"}
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

export default ResetPage;
