import React from "react";
import "./sidebar.css";

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">🧠 Salud Mental</div>
      <ul className="sidebar-links">
        <li><a href="#frases">Frases</a></li>
        <li><a href="#tips">Tips</a></li>
        <li><a href="#informacion">Información</a></li>
      </ul>
    </aside>
  );
};

export default Sidebar;
