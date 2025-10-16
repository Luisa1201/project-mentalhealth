import { useState } from "react";
import { Link, useNavigate} from "react-router-dom"
import "./RegisterForm.css";
import "../LoginPage/LoginPage.css"
import Swal from "sweetalert2";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";
import { FaEye, FaEyeSlash } from "react-icons/fa"

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

  return (
    <div className="register-body">
    <div className="register-container">
      <h2>Registro</h2>
      <form onSubmit={handleSubmit} className="register-form">
        
        <input type="text" 
        name="nombres" 
        placeholder="nombres" 
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
        placeholder="confirmPassword" 
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
