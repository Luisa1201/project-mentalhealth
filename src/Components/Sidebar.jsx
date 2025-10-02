import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../assets/Sidebar.css";

const Sidebar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true); // Abierto por defecto en desktop
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // Detectar cambios de tamaño de ventana
  React.useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsOpen(true); // Siempre abierto en desktop por defecto
      } else {
        setIsOpen(false); // Cerrado en móvil por defecto
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      {/* Botón Toggle */}
      <button className="sidebar-toggle-btn" onClick={toggleSidebar}>
        {isOpen ? '◀' : '▶'}
      </button>

      {/* Overlay (solo móvil) */}
      {isMobile && isOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'active' : 'collapsed'}`}>
        <div className="sidebar-logo">🧠 Salud Mental</div>
        <ul className="sidebar-links">
          <li><a 
          href="#estudiantes" 
           onClick={(e) => {
            e.preventDefault();
            navigate('/estudiantes'); 
            isMobile && setIsOpen(false);
            }}>Estudiantes</a></li>
            
          <li><a href="#psicoorientadores" onClick={() => isMobile && setIsOpen(false)}>Psicoorientadores</a></li>
          <li>
            <a 
              href="#servicios" 
              onClick={(e) => {
                e.preventDefault();
                navigate('/servicios');
                isMobile && setIsOpen(false);
              }}
            >
              Servicios
            </a>
          </li>
        </ul>
      </aside>
    </>
  );
};

export default Sidebar;
