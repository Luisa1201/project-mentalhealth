import React from "react";
import "./sidebar.css";

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">🧠 Salud Mental</div>
      <ul className="sidebar-links">
        <li><a href="#frases">Estudiantes</a></li>
        <li><a href="#tips">Psicoorientadores</a></li>
        <li><a href="#informacion">Servicios</a></li>
      </ul>
    </aside>
  );
};

export default Sidebar;
