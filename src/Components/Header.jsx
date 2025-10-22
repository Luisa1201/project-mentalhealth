import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaUser } from "react-icons/fa";
import "../assets/Header.css";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import Swal from "sweetalert2";
import { registerLogout } from "../utils/sessionManager";

const Header = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Escuchar cambios en la autenticación
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // Obtener nombre del usuario desde Firestore
        try {
          const userDoc = await getDoc(doc(db, "usuarios", currentUser.uid));
          if (userDoc.exists()) {
            setUserName(userDoc.data().nombres);
          }
        } catch (error) {
          console.error("Error al obtener datos del usuario:", error);
        }
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    try {
      // Registrar cierre de sesión antes de cerrar
      await registerLogout();
      
      await auth.signOut();
      Swal.fire("Éxito", "Sesión cerrada correctamente", "success");
      navigate("/loginPage");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      Swal.fire("Error", "No se pudo cerrar la sesión", "error");
    }
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-logo">
          <span className="logo-icon">🧠</span>
          <span className="logo-text">Salud Mental</span>
        </div>

        <nav className="header-nav">
          <a href="#inicio" className="nav-link">Inicio</a>
          <a href="#servicios" className="nav-link">Servicios</a>
          <a href="#recursos" className="nav-link">Recursos</a>
          <a href="#contacto" className="nav-link">Contacto</a>
        </nav>

        <div className="header-actions">
          {!loading && user && (
            <div className="user-session">
              <div className="user-info">
                <div className="user-avatar">
                  <FaUser />
                </div>
                <div className="user-details">
                  <p className="user-name">{userName || user.email.split('@')[0]}</p>
                </div>
              </div>

              <button
                className="btn-logout"
                onClick={handleLogout}
                title="Cerrar sesión"
              >
                <FaSignOutAlt />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;