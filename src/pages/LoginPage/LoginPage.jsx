import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaGoogle, FaGithub, FaFacebook, FaEye, FaEyeSlash } from "react-icons/fa";
import "./LoginPage.css";
import Swal from "sweetalert2";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, GoogleProvider, GithubProvider, FacebookProvider } from "../../firebase";
import { registerLogin, getAuthProvider } from "../../utils/sessionManager";

function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    correo: "",
    password: ""
  });
  
   const [loading, setLoading] = useState(false);

   const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { correo, password } = formData;

    // Validaciones
    if (!correo || !password) {
      Swal.fire("Error", "Todos los campos son obligatorios", "error");
      setLoading(false);
      return;
    }

    try {
      const emailLower = correo.toLowerCase();
      
      // Autenticación con Firebase
      const userCredential = await signInWithEmailAndPassword(auth, emailLower, password);
      const user = userCredential.user;

      // Registrar inicio de sesión
      await registerLogin(user, "Email");

      Swal.fire("Éxito", "Sesión iniciada correctamente", "success");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error de inicio de sesión", error);

      if (error.code === "auth/user-not-found") {
        Swal.fire("Error", "El correo no está registrado", "error");
      } else if (error.code === "auth/wrong-password") {
        Swal.fire("Error", "Contraseña incorrecta", "error");
      } else if (error.code === "auth/invalid-email") {
        Swal.fire("Error", "Correo inválido", "error");
      } else if (error.code === "auth/too-many-requests") {
        Swal.fire("Error", "Demasiados intentos fallidos. Intenta más tarde", "error");
      } else {
        Swal.fire("Error", "Error al iniciar sesión. Intenta de nuevo", "error");
      }
    } finally {
      setLoading(false);
    }
};

  const handleSocialLogin = async (provider, providerName) => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Registrar inicio de sesión con el proveedor social
      await registerLogin(user, providerName);
      
      Swal.fire({
        icon: "success",
        title: "¡Bienvenido!",
        text: `Sesión iniciada con ${providerName} como ${user.displayName || user.email}`,
        timer: 2000,
        showConfirmButton: false
      });
      
      navigate("/dashboard");
    } catch (error) {
      console.error(`Error al iniciar sesión con ${providerName}:`, error);
      
      if (error.code === "auth/popup-closed-by-user") {
        Swal.fire("Cancelado", "Cerraste la ventana de inicio de sesión", "info");
      } else if (error.code === "auth/popup-blocked") {
        Swal.fire("Error", "El navegador bloqueó la ventana emergente. Por favor, permite las ventanas emergentes", "error");
      } else if (error.code === "auth/account-exists-with-different-credential") {
        Swal.fire("Error", "Ya existe una cuenta con este correo usando otro método de inicio de sesión", "error");
      } else {
        Swal.fire("Error", `No se pudo iniciar sesión con ${providerName}. Intenta de nuevo`, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => handleSocialLogin(GoogleProvider, "Google");
  const handleGithubLogin = () => handleSocialLogin(GithubProvider, "GitHub");
  const handleFacebookLogin = () => handleSocialLogin(FacebookProvider, "Facebook");

  return (
    <div className="login-body">
    <div className="login-container">
      <div className="login-header">
        <img 
          src="/img/welcome.png"   
          alt="Bienvenido" 
          className="welcome-img"
        />
        <h2>¡Bienvenido!</h2>
      </div>

      <form className="login-form" onSubmit={handleSubmit}>
        <input 
          type="email"
          name="correo" 
          placeholder="Correo electrónico" 
          required 
          value={formData.correo}
          onChange={handleChange}
        />

       <div className="password-container">
            <input 
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Contraseña"
              required 
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md pr-10"
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p className="forgot-password">
          <a href="/forgotPassword" className="forgot-link">
            ¿Olvidaste tu contraseña?
          </a>
        </p>

      <div className="social-login">
        <p>O ingresa con</p>
        <div className="social-buttons">
          <button 
            type="button" 
            className="google-btn"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <FaGoogle className="icon" /> Google
          </button>
          <button 
            type="button" 
            className="github-btn"
            onClick={handleGithubLogin}
            disabled={loading}
          >
            <FaGithub className="icon" /> GitHub
          </button>
          <button 
            type="button" 
            className="facebook-btn"
            onClick={handleFacebookLogin}
            disabled={loading}
          >
            <FaFacebook className="icon" /> Facebook
          </button>
        </div>
      </div>

      <p className="auth-text">
          ¿No tienes cuenta?{" "}
          <button 
            type="button" 
            className="register-btn" 
            onClick={() => navigate("/registerForm")}
          >
            Regístrate
          </button>
        </p>
    </div>
    </div>
  );
}

export default LoginPage;
