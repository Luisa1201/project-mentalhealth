import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, orderBy, getDocs, limit, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { FaHistory, FaUser, FaEnvelope, FaClock, FaSignInAlt, FaSignOutAlt, FaGoogle, FaGithub, FaFacebook, FaEnvelopeOpen, FaArrowLeft, FaFilePdf, FaFileExcel } from "react-icons/fa";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import "./SessionHistory.css";
import Header from "../../Components/Header";
import Sidebar from "../../Components/Sidebar";
import Footer from "../../Components/Footer";
import { useInactivityLogout } from "../../utils/useInactivityLogout";

const SessionHistory = () => {
  const navigate = useNavigate();
  useInactivityLogout();
  
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [providerFilter, setProviderFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [exportFilter, setExportFilter] = useState("all");
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const sessionsRef = collection(db, "sessions");
      const q = query(sessionsRef, orderBy("loginTime", "desc"), limit(100));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setSessions([]);
        return;
      }

      const userIds = [];
      const sessionsData = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.userId && !userIds.includes(data.userId)) {
          userIds.push(data.userId);
        }
        
        sessionsData.push({
          id: doc.id,
          ...data,
          displayName: data.userName || (data.userEmail ? data.userEmail.split('@')[0] : 'Usuario')
        });
      });

      // Fetch user data in parallel
      const usersPromises = userIds.map(async (userId) => {
        try {
          const userDoc = await getDoc(doc(db, "usuarios", userId));
          return userDoc.exists() ? { id: userId, ...userDoc.data() } : null;
        } catch {
          return null;
        }
      });

      const usersData = (await Promise.all(usersPromises)).filter(Boolean);
      const usersMap = usersData.reduce((acc, user) => ({ ...acc, [user.id]: user }), {});

      const sessionsWithUserData = sessionsData.map(session => {
        if (session.userId && usersMap[session.userId]) {
          const userData = usersMap[session.userId];
          return {
            ...session,
            displayName: userData.nombreCompleto || userData.displayName || session.displayName,
            photoURL: session.photoURL || userData.photoURL
          };
        }
        return session;
      });

      setSessions(sessionsWithUserData);
    } catch (error) {
      console.error('Error loading sessions:', error);
      alert('Error al cargar el historial de sesiones');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
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
    
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const getProviderIcon = (provider) => {
    switch (provider?.toLowerCase()) {
      case "google": return <FaGoogle className="provider-icon google" />;
      case "github": return <FaGithub className="provider-icon github" />;
      case "facebook": return <FaFacebook className="provider-icon facebook" />;
      case "email": return <FaEnvelopeOpen className="provider-icon email" />;
      default: return <FaUser className="provider-icon default" />;
    }
  };

  const isWithinDateRange = (timestamp) => {
    if (!timestamp || dateFilter === "all") return true;
    const sessionDate = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffDays = (now - sessionDate) / (1000 * 60 * 60 * 24);
    
    switch (dateFilter) {
      case "today": return diffDays < 1;
      case "week": return diffDays < 7;
      case "month": return diffDays < 30;
      default: return true;
    }
  };

  const filteredSessions = sessions.filter(session => {
    // Apply status filter
    if (filter === "active" && !session.isActive) return false;
    if (filter === "closed" && session.isActive) return false;
    
    // Apply provider filter
    if (providerFilter !== "all" && session.provider?.toLowerCase() !== providerFilter.toLowerCase()) {
      return false;
    }
    
    // Apply date filter
    if (!isWithinDateRange(session.loginTime)) return false;
    
    // Apply search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchName = session.userName?.toLowerCase().includes(search);
      const matchEmail = session.userEmail?.toLowerCase().includes(search);
      return matchName || matchEmail;
    }
    
    return true;
  });

  const handleExportPDF = () => {
  setIsExporting(true);
  try {
    // Crear documento con orientación horizontal
    const doc = new jsPDF('l', 'mm', 'a4');
    
    // Título
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('REPORTE DE HISTORIAL DE SESIONES', 148, 15, { align: 'center' });
    
    // Fecha
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, 14, 25);
    
    // Datos
    const dataToExport = exportFilter === 'filtered' ? filteredSessions : sessions;
    
    // Preparar datos para la tabla
    const tableColumn = ["Usuario", "Correo", "Proveedor", "Ingreso", "Salida", "Duración", "Estado"];
    const tableRows = dataToExport.map(session => [
      session.displayName || 'N/A',
      session.userEmail || 'N/A',
      session.provider || 'Email',
      formatDate(session.loginTime) || 'N/A',
      session.logoutTime ? formatDate(session.logoutTime) : 'Activa',
      calculateDuration(session.loginTime, session.logoutTime),
      session.isActive ? 'Activa' : 'Cerrada'
    ]);

    // Generar tabla
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
        textAlign: 'center'
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
        textColor: [0, 0, 0],
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      columnStyles: {
        0: { cellWidth: 30 }, // Usuario
        1: { cellWidth: 40 }, // Correo
        2: { cellWidth: 20 }, // Proveedor
        3: { cellWidth: 40 }, // Ingreso
        4: { cellWidth: 40 }, // Salida
        5: { cellWidth: 25 }, // Duración
        6: { cellWidth: 20 }  // Estado
      },
      margin: { left: 10, right: 10 }
    });

    // Guardar PDF
    doc.save(`historial_sesiones_${new Date().toISOString().split('T')[0]}.pdf`);
    
  } catch (error) {
    console.error('Error al generar PDF:', error);
    alert('Error al generar el archivo PDF. Por favor, inténtalo de nuevo.');
  } finally {
    setIsExporting(false);
  }
};

  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      const dataToExport = exportFilter === 'filtered' ? filteredSessions : sessions;
      
      // Prepare data for Excel
      const excelData = dataToExport.map(session => ({
        'Usuario': session.displayName || 'N/A',
        'Correo': session.userEmail || 'N/A',
        'Proveedor': session.provider || 'Email',
        'Ingreso': formatDate(session.loginTime) || 'N/A',
        'Salida': session.logoutTime ? formatDate(session.logoutTime) : 'En sesión',
        'Duración': calculateDuration(session.loginTime, session.logoutTime),
        'Estado': session.isActive ? 'Activa' : 'Cerrada'
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      XLSX.utils.book_append_sheet(wb, ws, 'Historial de Sesiones');

      // Add filters
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      ws['!autofilter'] = { ref: XLSX.utils.encode_range(range) };

      // Set column widths
      ws['!cols'] = [
        { wch: 25 }, // Usuario
        { wch: 30 }, // Correo
        { wch: 15 }, // Proveedor
        { wch: 25 }, // Ingreso
        { wch: 25 }, // Salida
        { wch: 15 }, // Duración
        { wch: 15 }  // Estado
      ];

      // Save Excel file
      XLSX.writeFile(wb, `historial_sesiones_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Error generating Excel:', error);
      alert('Error al generar el archivo Excel');
    } finally {
      setIsExporting(false);
    }
  };

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

        {/* Search and Export Controls */}
        <div className="export-controls">
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
          
          <div className="export-buttons">
            <select 
              className="export-select"
              value={exportFilter}
              onChange={(e) => setExportFilter(e.target.value)}
              disabled={isExporting}
            >
              <option value="all">Exportar todos</option>
              <option 
                value="filtered" 
                disabled={!searchTerm && filter === 'all' && providerFilter === 'all' && dateFilter === 'all'}
              >
                Exportar filtrados
              </option>
            </select>
            <button 
              className="export-btn export-btn-pdf"
              onClick={handleExportPDF}
              disabled={isExporting || (exportFilter === 'filtered' && !searchTerm && filter === 'all' && providerFilter === 'all' && dateFilter === 'all')}
              title="Exportar a PDF"
            >
              <FaFilePdf /> PDF
            </button>
            <button 
              className="export-btn export-btn-excel"
              onClick={handleExportExcel}
              disabled={isExporting || (exportFilter === 'filtered' && !searchTerm && filter === 'all' && providerFilter === 'all' && dateFilter === 'all')}
              title="Exportar a Excel"
            >
              <FaFileExcel /> Excel
            </button>
          </div>
        </div>

        {/* Filters */}
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

        {/* Session Table */}
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
                        {session.photoURL ? (
                          <img 
                            src={session.photoURL} 
                            alt={session.displayName} 
                            className="user-avatar"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'inline-flex';
                            }}
                          />
                        ) : (
                          <div className="user-avatar-fallback">
                            {session.displayName ? session.displayName.charAt(0).toUpperCase() : 'U'}
                          </div>
                        )}
                        <FaUser className="user-avatar-icon" style={{ display: 'none' }} />
                        <span>{session.displayName}</span>
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
                      {session.logoutTime ? formatDate(session.logoutTime) : <span className="active-badge">En sesión</span>}
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