import React from "react";
import { useNavigate } from "react-router-dom";
import "../assets/Header.css";

const Header = () => {
  const navigate = useNavigate();

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
          <button 
            className="btn-secondary"
            onClick={() => navigate('/loginPage')}
          >
            Iniciar Sesión
          </button>
          <button 
            className="btn-primary"
            onClick={() => navigate('/registerForm')}
          >
            Registrarse
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
