import { useState, useEffect } from "react";
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy 
} from "firebase/firestore";
import { db } from "../../firebase";
import "../../assets/ViewModules.css";
import Swal from "sweetalert2";
import { useInactivityLogout } from "../../utils/useInactivityLogout";
import { FaFilePdf, FaFileExcel } from "react-icons/fa";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

function Psicoorientadores() {
  // Cierre automático de sesión por inactividad
  useInactivityLogout();
  
  const [psicos, setPsicos] = useState([]);
  const [psicosFiltrados, setPsicosFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] =  useState("Todos");

  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFilter, setExportFilter] = useState("all");
  const [formData, setFormData] = useState({
    nombre: "",
    especialidad: "",
    correo: "",
    telefono: "",
    disponibilidad: "",
    estado: "Activo"
  });

  // Manejar cambios en formulario
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // READ - cargar psicoorientadores
  const cargarPsicos = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "psicoorientadores"), orderBy("creado", "desc"));
      const querySnapshot = await getDocs(q);
      const array = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        array.push({
          id: doc.id,
          ...data,
          telefono: data.telefono || 'No registrado',
          disponibilidad: data.disponibilidad || 'No especificada'
        });
      });
      
      setPsicos(array);
      setLoading(false);
    } catch (error) {
      console.error("Error al cargar psicoorientadores:", error);
      Swal.fire("Error", "No se pudieron cargar los psicoorientadores", "error");
      setLoading(false);
    }
  };

  // Exportar a PDF
  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      // Crear documento con orientación horizontal
      const doc = new jsPDF('l', 'mm', 'a4');
      
      // Título
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('REPORTE DE PSICOORIENTADORES', 148, 15, { align: 'center' });
      
      // Fecha
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, 14, 25);
      
      // Datos a exportar
      const dataToExport = exportFilter === 'filtered' ? psicosFiltrados : psicos;
      
      // Preparar datos para la tabla
      const tableColumn = ["Nombre", "Especialidad", "Correo", "Teléfono", "Estado"];
      const tableRows = dataToExport.map(psico => [
        psico.nombre || 'N/A',
        psico.especialidad || 'N/A',
        psico.correo || 'N/A',
        psico.telefono || 'No registrado',
        psico.estado || 'N/A'
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
          fontSize: 9,
          cellPadding: 3,
          textColor: [0, 0, 0],
          lineColor: [200, 200, 200],
          lineWidth: 0.1
        },
        columnStyles: {
          0: { cellWidth: 40 }, // Nombre
          1: { cellWidth: 40 }, // Especialidad
          2: { cellWidth: 60 }, // Correo
          3: { cellWidth: 30 }, // Teléfono
          4: { cellWidth: 25 }  // Estado
        },
        margin: { left: 10, right: 10 }
      });

      // Guardar PDF
      doc.save(`reporte_psicoorientadores_${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (error) {
      console.error('Error al generar PDF:', error);
      Swal.fire('Error', 'Error al generar el archivo PDF', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Exportar a Excel
  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      const dataToExport = exportFilter === 'filtered' ? psicosFiltrados : psicos;
      
      // Preparar datos para Excel
      const excelData = dataToExport.map(psico => ({
        'Nombre': psico.nombre || 'N/A',
        'Especialidad': psico.especialidad || 'N/A',
        'Correo': psico.correo || 'N/A',
        'Teléfono': psico.telefono || 'No registrado',
        'Disponibilidad': psico.disponibilidad || 'No especificada',
        'Estado': psico.estado || 'N/A',
        'Creado': psico.creado ? psico.creado.toDate().toLocaleString('es-ES') : 'N/A'
      }));

      // Crear libro y hoja de cálculo
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      XLSX.utils.book_append_sheet(wb, ws, 'Psicoorientadores');

      // Añadir filtros
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      ws['!autofilter'] = { ref: XLSX.utils.encode_range(range) };

      // Ajustar anchos de columna
      ws['!cols'] = [
        { wch: 25 }, // Nombre
        { wch: 30 }, // Especialidad
        { wch: 35 }, // Correo
        { wch: 20 }, // Teléfono
        { wch: 25 }, // Disponibilidad
        { wch: 15 }, // Estado
        { wch: 25 }  // Creado
      ];

      // Guardar archivo Excel
      XLSX.writeFile(wb, `reporte_psicoorientadores_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Error generando Excel:', error);
      Swal.fire('Error', 'Error al generar el archivo Excel', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    cargarPsicos();
  }, []);

  // Filtrar y buscar
  useEffect(() => {
    let resultado = psicos;

    if (searchTerm) {
      resultado = resultado.filter(ps =>
        ps.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ps.correo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ps.especialidad.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filtroEstado !== "Todos") {
      resultado = resultado.filter(ps => ps.estado === filtroEstado);
    }

    setPsicosFiltrados(resultado);
  }, [psicos, searchTerm, filtroEstado]);

  // CREATE
  const crearPsico = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.especialidad || !formData.correo) {
      return Swal.fire("Error", "Los campos obligatorios deben llenarse", "error");
    }

    try {
      await addDoc(collection(db, "psicoorientadores"), {
        ...formData,
        creado: new Date()
      });

      Swal.fire("Creado", "Psicoorientador registrado exitosamente", "success");
      cancelarForm();
      cargarPsicos();
    } catch (error) {
      console.error("Error al crear psicoorientador:", error);
      Swal.fire("Error", "No se pudo registrar el psicoorientador", "error");
    }
  };

 // UPDATE
  const actualizarPsico = async (e) => {
    e.preventDefault();

    try {
      const psicoRef = doc(db, "psicoorientadores", editando);
      await updateDoc(psicoRef, formData);

      Swal.fire("Actualizado", "Psicoorientador actualizado correctamente", "success");
      cancelarForm();
      cargarPsicos();
    } catch (error) {
      console.error("Error al actualizar:", error);
      Swal.fire("Error", "No se pudo actualizar", "error");
    }
  };

  // DELETE
  const eliminarPsico = async (id, nombre) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: `Se eliminará el psicoorientador: ${nombre}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, "psicoorientadores", id));
        Swal.fire("Eliminado", "Psicoorientador eliminado correctamente", "success");
        cargarPsicos();
      } catch (error) {
        console.error("Error al eliminar:", error);
        Swal.fire("Error", "No se pudo eliminar", "error");
      }
    }
  };
  
// Editar
  const iniciarEdicion = (ps) => {
    setEditando(ps.id);
    setFormData({ ...ps });
    setShowForm(true);
  };

  const cancelarForm = () => {
    setShowForm(false);
    setEditando(null);
    setFormData({
      nombre: "",
      especialidad: "",
      correo: "",
      telefono: "",
      disponibilidad: "",
      estado: "Activo"
    });
  };

  // Ver detalles
  const verDetalles = (ps) => {
    Swal.fire({
      title: `${ps.nombre}`,
      html: `
        <div style="text-align: left;">
          <p><strong>Especialidad:</strong> ${ps.especialidad}</p>
          <p><strong>Correo:</strong> ${ps.correo}</p>
          <p><strong>Teléfono:</strong> ${ps.telefono || "No registrado"}</p>
          <p><strong>Disponibilidad:</strong> ${ps.disponibilidad || "No registrada"}</p>
          <p><strong>Estado:</strong> ${ps.estado}</p>
        </div>
      `,
      icon: "info",
      confirmButtonText: "Cerrar"
    });
  };

  return (
    <>
      <header className="servicios-header-top">
        <div className="header-content">
          <h1>🧑‍🏫 Gestión de Psicoorientadores</h1>
          <p>Administra el registro de psicoorientadores del colegio</p>
        </div>
      </header>

      <div className="servicios-container">
        {/* Búsqueda y filtros */}
        <div className="search-filter-container">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Buscar psicoorientadores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="filter-select"
            >
              <option value="Todos">Todos los estados</option>
              <option value="Activo">Activos</option>
              <option value="Inactivo">Inactivos</option>
            </select>
            
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
                  disabled={!searchTerm && filtroEstado === 'Todos'}
                >
                  Exportar filtrados
                </option>
              </select>
              <button 
                className="export-btn export-btn-pdf"
                onClick={handleExportPDF}
                disabled={isExporting || (exportFilter === 'filtered' && !searchTerm && filtroEstado === 'Todos')}
                title="Exportar a PDF"
              >
                <FaFilePdf /> PDF
              </button>
              <button 
                className="export-btn export-btn-excel"
                onClick={handleExportExcel}
                disabled={isExporting || (exportFilter === 'filtered' && !searchTerm && filtroEstado === 'Todos')}
                title="Exportar a Excel"
              >
                <FaFileExcel /> Excel
              </button>
            </div>
          </div>
          <button 
            className="btn-nuevo"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "❌ Cancelar" : "➕ Nuevo Psicoorientador"}
          </button>
        </div>

        {/* FORM */}
        {showForm && (
          <div className="form-card">
            <h2>{editando ? "✏️ Editar Psicoorientador" : "➕ Nuevo Psicoorientador"}</h2>
            <form onSubmit={editando ? actualizarPsico : crearPsico}>
              <div className="form-row">
                <div className="form-group">
                  <label>Nombre *</label>
                  <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Especialidad *</label>
                  <input type="text" name="especialidad" value={formData.especialidad} onChange={handleChange} required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Correo *</label>
                  <input type="email" name="correo" value={formData.correo} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Teléfono</label>
                  <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Disponibilidad</label>
                  <input type="text" name="disponibilidad" value={formData.disponibilidad} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Estado *</label>
                  <select name="estado" value={formData.estado} onChange={handleChange}>
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="form-buttons">
                <button type="submit" className="btn-guardar">
                  {editando ? "💾 Actualizar" : "💾 Guardar"}
                </button>
                <button type="button" className="btn-cancelar" onClick={cancelarForm}>
                  ❌ Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TABLA */}
        <div className="servicios-list">
          <h2>📋 Lista de Psicoorientadores ({psicosFiltrados.length} de {psicos.length})</h2>
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Cargando psicoorientadores...</p>
            </div>
          ) : psicos.length === 0 ? (
            <div className="empty-state">
              <p>📭 No hay psicoorientadores registrados</p>
              <p>Haz clic en "Nuevo Psicoorientador" para agregar uno</p>
            </div>
          ) : psicosFiltrados.length === 0 ? (
            <div className="empty-state">
              <p>🔍 No se encontraron resultados</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="servicios-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Especialidad</th>
                    <th>Correo</th>
                    <th>Teléfono</th>
                    <th>Disponibilidad</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {psicosFiltrados.map((ps) => (
                    <tr key={ps.id}>
                      <td>{ps.nombre}</td>
                      <td>{ps.especialidad}</td>
                      <td>{ps.correo}</td>
                      <td>{ps.telefono || "No registrado"}</td>
                      <td>{ps.disponibilidad || "No registrada"}</td>
                      <td>
                        <span className={`badge ${ps.estado.toLowerCase()}`}>
                          {ps.estado}
                        </span>
                      </td>
                      <td className="td-acciones">
                        <button className="btn-ver" onClick={() => verDetalles(ps)}>👁️</button>
                        <button className="btn-editar" onClick={() => iniciarEdicion(ps)}>✏️</button>
                        <button className="btn-eliminar" onClick={() => eliminarPsico(ps.id, ps.nombre)}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* BOTÓN VOLVER AL DASHBOARD */}
      <div className="volver-container">
        <button className="btn-volver" onClick={() => window.location.href = "/dashboard"}>
          ⬅️ Volver al Dashboard
        </button>
      </div>
    </>
  );
}

export default Psicoorientadores;
