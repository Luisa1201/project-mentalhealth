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

  const [formData, setFormData] = useState({
    nombres: "", correo:"", password: "", confirmPassword: ""

  });

  const handleChange = (e) =>{
    setFormData ({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const {
       nombres, correo, password, confirmPassword
    } = formData;

    // Validaciones
    if(
      !nombres || !correo || !password || !confirmPassword
    ){
      return Swal.fire("Todos los campos son obligatorios");
    }
    if(password.length < 6){
      return Swal.fire("la contraseña debe tener al menos 6 caracteres");
    
    }
    if(password !== confirmPassword){
      return Swal.fire("las contraseñas no son iguales");
    }
    try {
      const emaillower = correo.toLocaleLowerCase();
       // Crear usuario para el servicio de authenticación de firebase
      const userMethod = await createUserWithEmailAndPassword(auth, emaillower, password);
      const user = userMethod.user;

      //Guardar datos en firebase
      await setDoc (doc(db, "usuarios", user.uid),{
        uid: user.uid,
        nombres, correo: emaillower, password, confirmPassword, estado: "pendiente", 
        rol: "visitante", creado: new Date(), metodo: "password"
      });

      Swal.fire("Registrado", "Usuario creado con éxito", "success");
      navigate("/")
    }catch (error){
      console.error("Error de registro", error);

      if(error.code === "auth/email-already-in-use"){
        Swal.fire("Correo en uso", "Debe ingresar error", "error");
      }

    }
  }

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
        placeholder="correos" 
        required 
        value={formData.correo} 
        onChange={handleChange} />

        <div className="password-container">
        <input type={showPassword ? "text" :"password"}
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
        <input type={showPassword ? "text" :"password"} 
        name="confirmPassword" 
        placeholder="confirmPassword" 
        required 
        value={formData.confirmPassword} 
        onChange={handleChange}/>

         <button
          type="button"
          className="toggle-password"
          onClick={() => setShowPassword(!showPassword)}>
          {showPassword ? <FaEyeSlash/>: <FaEye/>}
        </button>

        </div>

        <button type="submit">Crear cuenta</button>
      </form>
      <p className="auth-text">
        ¿Ya tienes cuenta?{" "}
        <button type="button" className="login-btn" onClick={() => window.location.href = "/loginPage"}>
          Inicia sesión
        </button>
      </p>
    </div>
    </div>
  );
}

export default RegisterForm;
