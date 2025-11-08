import { useState } from "react";
import { Link, useNavigate} from "react-router-dom"
import "./RegisterForm.css";
import "../LoginPage/LoginPage.css"
import Swal from "sweetalert2";
import { createUserWithEmailAndPassword, signInWithPopup, signInWithEmailAndPassword, linkWithCredential, fetchSignInMethodsForEmail } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db, GoogleProvider, GithubProvider, FacebookProvider } from "../../firebase";
import { FaEye, FaEyeSlash, FaGoogle, FaGithub, FaFacebook } from "react-icons/fa"

function RegisterForm() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false); //Indica si algo está cargando (true) o no está cargando (false).

  const [formData, setFormData] = useState({
    nombres: "", 
    correo:"", 
    password: "", 
    confirmPassword: ""

  });

  const handleChange = (e) =>{
    setFormData ({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Validar formato de email
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const {
       nombres, correo, password, confirmPassword
    } = formData;

       // Validaciones
    if (!nombres || !correo || !password || !confirmPassword) {
      Swal.fire("Error", "Todos los campos son obligatorios", "error");
      setLoading(false);
      return;
    }

    if (nombres.trim().length < 3) {
      Swal.fire("Error", "El nombre debe tener al menos 3 caracteres", "error");
      setLoading(false);
      return;
    }

    if (!isValidEmail(correo)) {
      Swal.fire("Error", "Por favor ingresa un correo válido", "error");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      Swal.fire("Error", "La contraseña debe tener al menos 6 caracteres", "error");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      Swal.fire("Error", "Las contraseñas no coinciden", "error");
      setLoading(false);
      return;
    }
    
    try {
      const emaillower = correo.toLowerCase();
      
       // Crear usuario para el servicio de authenticación de firebase
      const userCredential = await createUserWithEmailAndPassword(auth, emaillower, password);
      const user = userCredential.user;

      //Guardar datos en firebase
      await setDoc (doc(db, "usuarios", user.uid),{
        uid: user.uid,
        nombres: nombres.trim(), 
        correo: emaillower, 
        estado: "pendiente", 
        rol: "visitante", 
        creado: new Date(), 
        metodo: "email"
      });

      Swal.fire("Registrado", "Usuario creado con éxito", "success");
      navigate("/loginPage")
    }catch (error){
      console.error("Error de registro", error);

      if (error.code === "auth/email-already-in-use") {
        Swal.fire("Error", "Este correo ya está registrado", "error");
      } else if (error.code === "auth/weak-password") {
        Swal.fire("Error", "La contraseña es muy débil", "error");
      } else if (error.code === "auth/invalid-email") {
        Swal.fire("Error", "El correo no es válido", "error");
      } else {
        Swal.fire("Error", "Error al registrar el usuario. Intenta de nuevo", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialRegister = async (provider, providerName) => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Verificar si el usuario ya existe en Firestore
      const userDocRef = doc(db, "usuarios", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // Si es un usuario nuevo, guardar sus datos
        await setDoc(userDocRef, {
          uid: user.uid,
          nombres: user.displayName || `Usuario de ${providerName}`,
          correo: user.email,
          estado: "pendiente",
          rol: "visitante",
          creado: new Date(),
          metodo: providerName.toLowerCase(),
          photoURL: user.photoURL || null
        });
        
        Swal.fire({
          icon: "success",
          title: "¡Registro exitoso!",
          text: `Bienvenido ${user.displayName || user.email}`,
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        // Si ya existe, solo iniciar sesión
        Swal.fire({
          icon: "success",
          title: "¡Bienvenido de nuevo!",
          text: `Sesión iniciada como ${user.displayName || user.email}`,
          timer: 2000,
          showConfirmButton: false
        });
      }
      
      navigate("/dashboard");
    } catch (error) {
      console.error(`Error al registrarse con ${providerName}:`, error);
      
      if (error.code === "auth/popup-closed-by-user") {
        Swal.fire("Cancelado", "Cerraste la ventana de registro", "info");
      } else if (error.code === "auth/popup-blocked") {
        Swal.fire("Error", "El navegador bloqueó la ventana emergente. Por favor, permite las ventanas emergentes", "error");
      } else if (error.code === "auth/account-exists-with-different-credential") {
        // Intentar vincular cuentas
        await handleAccountLinking(error, provider, providerName);
      } else {
        Swal.fire("Error", `No se pudo registrar con ${providerName}. Intenta de nuevo`, "error");
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

  const handleGoogleRegister = () => handleSocialRegister(GoogleProvider, "Google");
  const handleGithubRegister = () => handleSocialRegister(GithubProvider, "GitHub");
  const handleFacebookRegister = () => handleSocialRegister(FacebookProvider, "Facebook");

  return (
    <div className="register-body">
    <div className="register-container">
      <h2>Registro</h2>
      <form onSubmit={handleSubmit} className="register-form">
        
        <input type="text" 
        name="nombres" 
        placeholder="Nombres" 
        required 
        value={formData.nombres} 
        onChange={handleChange}/>

        <input type="email" 
        name="correo" 
        placeholder="Correo electrónico"  
        required 
        value={formData.correo} 
        onChange={handleChange} />

        <div className="password-container">
        <input 
        type={showPassword ? "text" :"password"}
        name="password"
        placeholder="Mínimo 6 caracteres de password" 
        required 
        value={formData.password} 
        onChange={handleChange}
        className="w-full px-3 py-2 border rounded-md pr-10"/>

        <button
          type="button"
          className="toggle-password"
          onClick={() => setShowPassword(!showPassword)}>
          {showPassword ? <FaEyeSlash/>: <FaEye/>}
        </button>
        </div>

      <div className="password-container">
        <input type={showConfirmPassword ? "text" :"password"} 
        name="confirmPassword" 
        placeholder="Confirmar Contraseña" 
        required 
        value={formData.confirmPassword} 
        onChange={handleChange}/>

         <button
          type="button"
          className="toggle-password"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
          {showConfirmPassword ? <FaEyeSlash/>: <FaEye/>}
        </button>

        </div>

        <button type="submit" disabled={loading}>
            {loading ? "Registrando..." : "Crear cuenta"}
          </button>
      </form>

      <div className="social-login">
        <p>O regístrate con</p>
        <div className="social-buttons">
          <button 
            type="button" 
            className="google-btn"
            onClick={handleGoogleRegister}
            disabled={loading}
          >
            <FaGoogle className="icon" /> Google
          </button>
          <button 
            type="button" 
            className="github-btn"
            onClick={handleGithubRegister}
            disabled={loading}
          >
            <FaGithub className="icon" /> GitHub
          </button>
          <button 
            type="button" 
            className="facebook-btn"
            onClick={handleFacebookRegister}
            disabled={loading}
          >
            <FaFacebook className="icon" /> Facebook
          </button>
        </div>
      </div>

       <p className="auth-text">
          ¿Ya tienes cuenta?{" "}
          <button 
            type="button" 
            className="login-btn" 
            onClick={() => navigate("/loginPage")}
          >
            Inicia sesión
          </button>
        </p>
    </div>
    </div>
  );
}

export default RegisterForm;
