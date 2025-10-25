import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, orderBy, getDocs, limit } from "firebase/firestore";
import { db } from "../../firebase";
import { FaHistory, FaUser, FaEnvelope, FaClock, FaSignInAlt, FaSignOutAlt, FaGoogle, FaGithub, FaFacebook, FaEnvelopeOpen, FaArrowLeft } from "react-icons/fa";
import "./SessionHistory.css";
import Header from "../../Components/Header";
import Sidebar from "../../Components/Sidebar";
import Footer from "../../Components/Footer";

const SessionHistory = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, active, closed
  const [searchTerm, setSearchTerm] = useState("");
  const [providerFilter, setProviderFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all"); // all, today, week, month

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const sessionsRef = collection(db, "sessions");
      const q = query(sessionsRef, orderBy("loginTime", "desc"), limit(100));
      const querySnapshot = await getDocs(q);

      const sessionsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setSessions(sessionsData);
    } catch (error) {
      console.error("Error al obtener sesiones:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    
    // Manejar tanto Timestamp de Firebase como objetos Date
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  const calculateDuration = (loginTime, logoutTime) => {
    if (!loginTime || !logoutTime) return "Sesión activa";
    
    const login = loginTime.toDate ? loginTime.toDate() : new Date(loginTime);
    const logout = logoutTime.toDate ? logoutTime.toDate() : new Date(logoutTime);
    
    const durationMs = logout - login;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getProviderIcon = (provider) => {
    switch (provider?.toLowerCase()) {
      case "google":
        return <FaGoogle className="provider-icon google" />;
      case "github":
        return <FaGithub className="provider-icon github" />;
      case "facebook":
        return <FaFacebook className="provider-icon facebook" />;
      case "email":
        return <FaEnvelopeOpen className="provider-icon email" />;
      default:
        return <FaUser className="provider-icon default" />;
    }
  };

  const isWithinDateRange = (timestamp) => {
    if (!timestamp || dateFilter === "all") return true;
    
    const sessionDate = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffTime = now - sessionDate;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    switch (dateFilter) {
      case "today":
        return diffDays < 1;
      case "week":
        return diffDays < 7;
      case "month":
        return diffDays < 30;
      default:
        return true;
    }
  };

  const filteredSessions = sessions.filter(session => {
    // Filtro de estado (activa/cerrada)
    if (filter === "active" && !session.isActive) return false;
    if (filter === "closed" && session.isActive) return false;
    
    // Filtro de proveedor
    if (providerFilter !== "all" && session.provider?.toLowerCase() !== providerFilter.toLowerCase()) {
      return false;
    }
    
    // Filtro de fecha
    if (!isWithinDateRange(session.loginTime)) return false;
    
    // Búsqueda por texto (nombre o email)
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchName = session.userName?.toLowerCase().includes(search);
      const matchEmail = session.userEmail?.toLowerCase().includes(search);
      return matchName || matchEmail;
    }
    
    return true;
  });

  return (
    <>
      <Header />
      <Sidebar />
      <div className="session-history-container">
        <div className="session-history-header">
          <div className="header-top">
            <div className="header-title">
              <FaHistory className="title-icon" />
              <h1>Historial de Sesiones</h1>
            </div>
            <button 
              className="back-to-dashboard-btn"
              onClick={() => navigate('/dashboard')}
              title="Volver al Dashboard"
            >
              <FaArrowLeft />
              <span>Volver al Dashboard</span>
            </button>
          </div>
          <p className="header-subtitle">
            Registro completo de inicios y cierres de sesión de usuarios
          </p>
        </div>

        {/* Barra de búsqueda */}
        <div className="search-bar">
          <input
            type="text"
            placeholder="🔍 Buscar por nombre o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button 
              className="clear-search"
              onClick={() => setSearchTerm("")}
              title="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filtros */}
        <div className="filters-container">
          <div className="filter-group">
            <label className="filter-label">Estado:</label>
            <div className="session-filters">
              <button 
                className={`filter-btn ${filter === "all" ? "active" : ""}`}
                onClick={() => setFilter("all")}
              >
                Todas ({sessions.length})
              </button>
              <button 
                className={`filter-btn ${filter === "active" ? "active" : ""}`}
                onClick={() => setFilter("active")}
              >
                Activas ({sessions.filter(s => s.isActive).length})
              </button>
              <button 
                className={`filter-btn ${filter === "closed" ? "active" : ""}`}
                onClick={() => setFilter("closed")}
              >
                Cerradas ({sessions.filter(s => !s.isActive).length})
              </button>
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Proveedor:</label>
            <select 
              className="filter-select"
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
            >
              <option value="all">Todos</option>
              <option value="email">Email</option>
              <option value="google">Google</option>
              <option value="github">GitHub</option>
              <option value="facebook">Facebook</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Fecha:</label>
            <select 
              className="filter-select"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="all">Todas</option>
              <option value="today">Hoy</option>
              <option value="week">Última semana</option>
              <option value="month">Último mes</option>
            </select>
          </div>
        </div>

        {/* Resultados */}
        {searchTerm || providerFilter !== "all" || dateFilter !== "all" ? (
          <div className="filter-results">
            <p>
              Mostrando <strong>{filteredSessions.length}</strong> de <strong>{sessions.length}</strong> sesiones
              {searchTerm && ` • Búsqueda: "${searchTerm}"`}
              {providerFilter !== "all" && ` • Proveedor: ${providerFilter}`}
              {dateFilter !== "all" && ` • Fecha: ${dateFilter === "today" ? "Hoy" : dateFilter === "week" ? "Última semana" : "Último mes"}`}
            </p>
          </div>
        ) : null}

        {/* Tabla de sesiones */}
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Cargando historial de sesiones...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="no-sessions">
            <FaHistory className="no-sessions-icon" />
            <h3>No hay sesiones registradas</h3>
            <p>Las sesiones aparecerán aquí cuando los usuarios inicien sesión</p>
          </div>
        ) : (
          <div className="sessions-table-container">
            <table className="sessions-table">
              <thead>
                <tr>
                  <th><FaUser /> Usuario</th>
                  <th><FaEnvelope /> Correo</th>
                  <th>Proveedor</th>
                  <th><FaSignInAlt /> Hora de Ingreso</th>
                  <th><FaSignOutAlt /> Hora de Salida</th>
                  <th><FaClock /> Duración</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.map((session) => (
                  <tr key={session.id} className={session.isActive ? "active-session" : ""}>
                    <td className="user-cell">
                      <div className="user-info">
                        <FaUser className="user-avatar-icon" />
                        <span>{session.userName || "Usuario"}</span>
                      </div>
                    </td>
                    <td className="email-cell">{session.userEmail}</td>
                    <td className="provider-cell">
                      <div className="provider-badge">
                        {getProviderIcon(session.provider)}
                        <span>{session.provider || "Email"}</span>
                      </div>
                    </td>
                    <td className="time-cell">{formatDate(session.loginTime)}</td>
                    <td className="time-cell">
                      {session.logoutTime ? formatDate(session.logoutTime) : 
                        <span className="active-badge">En sesión</span>
                      }
                    </td>
                    <td className="duration-cell">
                      {calculateDuration(session.loginTime, session.logoutTime)}
                    </td>
                    <td className="status-cell">
                      {session.isActive ? (
                        <span className="status-badge active">🟢 Activa</span>
                      ) : (
                        <span className="status-badge closed">⚫ Cerrada</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default SessionHistory;
