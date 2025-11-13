import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaGoogle, FaGithub, FaFacebook, FaEye, FaEyeSlash } from "react-icons/fa";
import "./LoginPage.css";
import Swal from "sweetalert2";
import { signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, getRedirectResult, linkWithCredential, fetchSignInMethodsForEmail } from "firebase/auth";
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
   const [isInApp, setIsInApp] = useState(false);
   const [storageIssue, setStorageIssue] = useState(false);

   // Procesar resultado de redirección (flujo móvil/in-app)
   useEffect(() => {
     const resolveRedirect = async () => {
       try {
         const res = await getRedirectResult(auth);
         if (res && res.user) {
           const user = res.user;
           // Registrar inicio de sesión con el proveedor usado
           const providerId = (user.providerData?.[0]?.providerId) || "unknown";
           const providerName = providerId === "google.com" ? "Google" : providerId === "facebook.com" ? "Facebook" : providerId === "github.com" ? "GitHub" : "Social";
           await registerLogin(user, providerName);
           Swal.fire({ icon: "success", title: "¡Bienvenido!", text: `Sesión iniciada con ${providerName}`, timer: 1600, showConfirmButton: false });
           navigate("/dashboard");
         }
       } catch (e) {
         // silenciar si no hay resultado o si el usuario canceló
         if (e?.code && !["auth/no-auth-event"].includes(e.code)) {
           console.warn("Redirect result error:", e);
         }
       }
     };
     resolveRedirect();
   }, [navigate]);

   useEffect(() => {
     const ua = navigator.userAgent || "";
     const inApp = /FBAN|FBAV|Instagram|Line|Twitter|LinkedIn|WhatsApp|Messenger/i.test(ua);
     setIsInApp(inApp);
     let sessionOk = true;
     try {
       const k = "__ss_check__";
       sessionStorage.setItem(k, "1");
       sessionStorage.removeItem(k);
     } catch (_) {
       sessionOk = false;
     }
     setStorageIssue(!sessionOk);
   }, []);

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
      // Detectar móvil/navegadores in-app y usar redirect
      const ua = navigator.userAgent || "";
      const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
      const isInApp = /FBAN|FBAV|Instagram|Line|Twitter|LinkedIn|WhatsApp|Messenger/i.test(ua);

      if (isMobile || isInApp) {
        await signInWithRedirect(auth, provider);
        return; // El flujo continuará en getRedirectResult
      }

      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Registrar inicio de sesión con el proveedor
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
        // Fallback automático a redirect si el popup fue bloqueado
        try {
          await signInWithRedirect(auth, provider);
          return;
        } catch (_) {
          Swal.fire("Error", "El navegador bloqueó la ventana emergente. Intenta nuevamente o abre en el navegador del sistema", "error");
        }
      } else if (error.code === "auth/account-exists-with-different-credential") {
        // Intentar vincular cuentas
        await handleAccountLinking(error, provider, providerName);
      } else {
        Swal.fire("Error", `No se pudo iniciar sesión con ${providerName}. Intenta de nuevo`, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAccountLinking = async (error, newProvider, newProviderName) => {
    try {
      // Obtener el email del error
      const email = error.customData?.email || error.email;
      const pendingCred = error.credential;

      if (!email) {
        Swal.fire("Error", "No se pudo obtener el correo electrónico", "error");
        return;
      }

      // Obtener los métodos de inicio de sesión existentes para este email
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      
      if (signInMethods.length === 0) {
        Swal.fire("Error", "No se encontraron métodos de inicio de sesión para este correo", "error");
        return;
      }

      // Mapear métodos a nombres legibles
      const methodNames = signInMethods.map(method => {
        if (method === "password") return "Email/Contraseña";
        if (method === "google.com") return "Google";
        if (method === "facebook.com") return "Facebook";
        if (method === "github.com") return "GitHub";
        return method;
      }).join(", ");

      // Preguntar al usuario si desea vincular las cuentas
      const result = await Swal.fire({
        icon: "question",
        title: "Cuenta existente",
        html: `Ya tienes una cuenta con el correo <strong>${email}</strong> usando: <strong>${methodNames}</strong>.<br><br>¿Deseas vincular tu cuenta de <strong>${newProviderName}</strong> con tu cuenta existente?`,
        showCancelButton: true,
        confirmButtonText: "Sí, vincular cuentas",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#00b3b3",
        cancelButtonColor: "#d33",
      });

      if (!result.isConfirmed) {
        return;
      }

      // Si el método existente es email/password, pedir la contraseña
      if (signInMethods.includes("password")) {
        const { value: password } = await Swal.fire({
          title: "Ingresa tu contraseña",
          html: `Para vincular tu cuenta de ${newProviderName}, primero debes iniciar sesión con tu correo y contraseña.`,
          input: "password",
          inputPlaceholder: "Contraseña",
          inputAttributes: {
            autocapitalize: "off",
            autocorrect: "off"
          },
          showCancelButton: true,
          confirmButtonText: "Continuar",
          cancelButtonText: "Cancelar",
          confirmButtonColor: "#00b3b3",
          inputValidator: (value) => {
            if (!value) {
              return "Debes ingresar tu contraseña";
            }
          }
        });

        if (!password) {
          return;
        }

        setLoading(true);

        try {
          // Iniciar sesión con email y contraseña
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;

          // Vincular la nueva credencial
          if (pendingCred) {
            await linkWithCredential(user, pendingCred);
          }

          await Swal.fire({
            icon: "success",
            title: "¡Cuentas vinculadas!",
            text: `Tu cuenta de ${newProviderName} ha sido vinculada exitosamente. Ahora puedes iniciar sesión con cualquiera de los métodos.`,
            confirmButtonText: "Continuar",
          });

          // Registrar inicio de sesión
          await registerLogin(user, "Email");
          navigate("/dashboard");
        } catch (linkError) {
          console.error("Error al vincular cuentas:", linkError);
          
          if (linkError.code === "auth/wrong-password") {
            Swal.fire("Error", "Contraseña incorrecta", "error");
          } else {
            Swal.fire("Error", "No se pudo vincular las cuentas. Intenta de nuevo", "error");
          }
        } finally {
          setLoading(false);
        }
      } else {
        // Si el método existente es otro proveedor social
        const existingProviderName = signInMethods.includes("google.com") ? "Google" : 
                                     signInMethods.includes("facebook.com") ? "Facebook" : 
                                     signInMethods.includes("github.com") ? "GitHub" : "otro proveedor";

        await Swal.fire({
          icon: "info",
          title: "Vinculación de cuentas",
          html: `Para vincular tu cuenta de ${newProviderName}, primero debes iniciar sesión con ${existingProviderName}.<br><br>Después de iniciar sesión, podrás vincular otras cuentas desde tu perfil.`,
          confirmButtonText: "Entendido",
        });
      }
    } catch (linkError) {
      console.error("Error en el proceso de vinculación:", linkError);
      Swal.fire("Error", "Hubo un problema al vincular las cuentas", "error");
    }
  };

  const handleGoogleLogin = () => handleSocialLogin(GoogleProvider, "Google");
  const handleGithubLogin = () => handleSocialLogin(GithubProvider, "GitHub");
  const handleFacebookLogin = () => handleSocialLogin(FacebookProvider, "Facebook");

  // Flags calculados en useEffect: isInApp, storageIssue

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

      {(isInApp || storageIssue) && (
        <div className="inapp-warning" style={{background:'#FFF7ED', color:'#9A3412', border:'1px solid #FED7AA', padding:'10px', borderRadius:8, marginTop:10}}>
          <strong>Para continuar:</strong> abre este enlace en el navegador del sistema (Chrome/Safari). Los navegadores dentro de apps pueden bloquear el inicio de sesión.
        </div>
      )}

      <div className="social-login">
        <p>O ingresa con</p>
        <div className="social-buttons">
          <button 
            type="button" 
            className="google-btn"
            onClick={handleGoogleLogin}
            disabled={isInApp || storageIssue || loading}
          >
            <FaGoogle /> Google
          </button>
          <button 
            type="button" 
            className="github-btn"
            onClick={handleGithubLogin}
            disabled={isInApp || storageIssue || loading}
          >
            <FaGithub /> GitHub
          </button>
          <button 
            type="button" 
            className="facebook-btn"
            onClick={handleFacebookLogin}
            disabled={isInApp || storageIssue || loading}
          >
            <FaFacebook /> Facebook
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
