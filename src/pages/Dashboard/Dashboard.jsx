// dashboard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { FaUsers, FaHeart, FaCalendarCheck, FaStar, FaArrowRight, FaChartLine, FaUserPlus, FaCog, FaHistory } from "react-icons/fa";
import "./dashboard.css";
import Sidebar from "../../Components/Sidebar.jsx";
import Header from "../../Components/Header.jsx";
import Footer from "../../Components/Footer.jsx";

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <>
      <Header/>
      <Sidebar/>
      <div className="dashboard-container">

      <div className="dashboard-welcome">
        <h1 className="titulo">👋 Bienvenido al Panel de Control</h1>
        <p className="subtitulo">Gestiona y monitorea la salud mental de tu comunidad</p>
      </div>

      {/* Estadísticas Principales */}
      <h2 className="section-title">📊 Estadísticas Principales</h2>
      <div className="stats-grid">
        <div className="stat-card stat-purple">
          <div className="stat-icon">
            <FaUsers />
          </div>
          <div className="stat-info">
            <h3>248</h3>
            <p>Usuarios Activos</p>
            <span className="stat-trend">+12% este mes</span>
          </div>
        </div>

        <div className="stat-card stat-blue">
          <div className="stat-icon">
            <FaCalendarCheck />
          </div>
          <div className="stat-info">
            <h3>156</h3>
            <p>Consultas Realizadas</p>
            <span className="stat-trend">+8% este mes</span>
          </div>
        </div>

        <div className="stat-card stat-green">
          <div className="stat-icon">
            <FaHeart />
          </div>
          <div className="stat-info">
            <h3>12</h3>
            <p>Servicios Activos</p>
            <span className="stat-trend">3 nuevos</span>
          </div>
        </div>

        <div className="stat-card stat-orange">
          <div className="stat-icon">
            <FaStar />
          </div>
          <div className="stat-info">
            <h3>4.8</h3>
            <p>Satisfacción</p>
            <span className="stat-trend">⭐⭐⭐⭐⭐</span>
          </div>
        </div>
      </div>

      {/* Accesos Rápidos */}
      <div className="quick-actions">
        <h2 className="section-title">⚡ Accesos Rápidos</h2>
        <div className="actions-grid">
          <button className="action-card action-purple" onClick={() => navigate('/servicios')}>
            <div className="action-icon">🏥</div>
            <h3>Gestionar Servicios</h3>
            <p>Administra los servicios disponibles</p>
            <FaArrowRight className="action-arrow" />
          </button>

          <button className="action-card action-blue" onClick={() => navigate('/estudiantes')}>
            <div className="action-icon">👥</div>
            <h3>Ver Estudiantes</h3>
            <p>Lista de estudiantes registrados</p>
            <FaArrowRight className="action-arrow" />
          </button>

          <button className="action-card action-green" onClick={() => navigate('/psicoorientadores')}>
            <div className="action-icon">👨‍⚕️</div>
            <h3>Ver Psicoorientadores</h3>
            <p>Profesionales de salud mental</p>
            <FaArrowRight className="action-arrow" />
          </button>

          <button className="action-card action-orange" onClick={() => navigate('/session-history')}>
            <div className="action-icon"><FaHistory /></div>
            <h3>Historial de Sesiones</h3>
            <p>Registro de inicios y cierres de sesión</p>
            <FaArrowRight className="action-arrow" />
          </button>
        </div>
      </div>

      {/* Sección de Bienestar */}
      <h2 className="section-title">💚 Bienestar y Motivación</h2>
      <div className="wellness-section">
        <div className="wellness-card tip-card">
          <div className="wellness-header">
            <span className="wellness-icon">💡</span>
            <h3>Tip del Día</h3>
          </div>
          <p>Practica la respiración consciente por 5 minutos. Inhala profundamente, sostén 4 segundos y exhala lentamente.</p>
        </div>

        <div className="wellness-card mood-card">
          <div className="wellness-header">
            <span className="wellness-icon">🌿</span>
            <h3>Estado de Ánimo</h3>
          </div>
          <p>Hoy te sientes: <strong>Tranquilo</strong>. Recuerda que cada emoción es válida, obsérvala sin juzgar.</p>
        </div>

        <div className="wellness-card quote-card">
          <div className="wellness-header">
            <span className="wellness-icon">✨</span>
            <h3>Frase Motivacional</h3>
          </div>
          <p>"No tienes que ser productivo todo el tiempo, descansar también es avanzar."</p>
        </div>
      </div>

      {/* Gráficos */}
      <h2 className="section-title">📈 Análisis y Estadísticas</h2>
      <div className="charts-section">
        <div className="chart-card">
          <h3>📈 Usuarios por Mes</h3>
          <img
            src="https://quickchart.io/chart?c={type:'line',data:{labels:['Enero','Febrero','Marzo','Abril','Mayo'],datasets:[{label:'Usuarios',data:[15,20,18,28,30],borderColor:'rgb(102,126,234)',backgroundColor:'rgba(102,126,234,0.1)',fill:true,tension:0.4}]},options:{plugins:{legend:{display:false}}}}"
            alt="Gráfico de usuarios"
          />
        </div>

        <div className="chart-card">
          <h3>👥 Demografía</h3>
          <img
            src="https://quickchart.io/chart?c={type:'bar',data:{labels:['18-24','25-34','35-44','45-54'],datasets:[{label:'Mujeres',data:[20,15,10,5],backgroundColor:'rgb(244,114,182)'},{label:'Hombres',data:[18,12,8,4],backgroundColor:'rgb(96,165,250)'}]},options:{plugins:{legend:{position:'bottom'}}}}"
            alt="Gráfico de demografía"
          />
        </div>
      </div>
      
      </div>
      <Footer/>
    </>
  );
};

export default Dashboard;