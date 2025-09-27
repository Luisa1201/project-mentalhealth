import React from "react";
import "./header.css";

const Header = ({onLogout}) => {
  return (
    <nav className="navbar">
      <div className="navbar-logo">🧠 Salud Mental</div>
      <ul className="navbar-links">
        <li><a href="#frases"></a></li>
        <li><a href="#tips">Nosotros</a></li>
        <li><a href="#informacion " onClick={onLogout}>Cerrar Sesión</a></li>
      </ul>
    </nav>
  );
};

export default Header;
