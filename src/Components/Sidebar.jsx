import React from "react";
import { useNavigate } from "react-router-dom";
import "../assets/Sidebar.css";

const Sidebar = () => {
  const navigate = useNavigate();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">🧠 Salud Mental</div>
      <ul className="sidebar-links">
        <li><a href="#frases">Estudiantes</a></li>
        <li><a href="#tips">Psicoorientadores</a></li>
        <li>
          <a 
            href="#servicios" 
            onClick={(e) => {
              e.preventDefault();
              navigate('/servicios');
            }}
          >
            Servicios
          </a>
        </li>
      </ul>
    </aside>
  );
};

export default Sidebar;
