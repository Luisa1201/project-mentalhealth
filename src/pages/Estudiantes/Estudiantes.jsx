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

function Estudiantes() {
  // Cierre automático de sesión por inactividad
  useInactivityLogout();
  
  const [estudiantes, setEstudiantes] = useState([]);
  const [estudiantesFiltrados, setEstudiantesFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");

  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFilter, setExportFilter] = useState("all");
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    fechaNacimiento: "",
    edad: "",
    grado: "",
    correo: "",
    telefono: "",
    acudiente: "",
    telefonoAcudiente: "",
    estado: "Activo"
  });

  // Manejar cambios en formulario
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // READ - cargar estudiantes
  const cargarEstudiantes = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "estudiantes"), orderBy("creado", "desc"));
      const querySnapshot = await getDocs(q);
      const estudiantesArray = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        estudiantesArray.push({
          id: doc.id,
          ...data,
          telefono: data.telefono || 'No registrado',
          fechaNacimiento: data.fechaNacimiento || 'No registrada',
          acudiente: data.acudiente || 'No registrado',
          telefonoAcudiente: data.telefonoAcudiente || 'No registrado'
        });
      });
      
      setEstudiantes(estudiantesArray);
      setLoading(false);
    } catch (error) {
      console.error("Error al cargar estudiantes:", error);
      Swal.fire("Error", "No se pudieron cargar los estudiantes", "error");
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
      doc.text('REPORTE DE ESTUDIANTES', 148, 15, { align: 'center' });
      
      // Fecha
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, 14, 25);
      
      // Datos a exportar
      const dataToExport = exportFilter === 'filtered' ? estudiantesFiltrados : estudiantes;
      
      // Preparar datos para la tabla
      const tableColumn = ["Nombre", "Apellido", "Edad", "Grado", "Correo", "Estado"];
      const tableRows = dataToExport.map(est => [
        est.nombre || 'N/A',
        est.apellido || 'N/A',
        est.edad || 'N/A',
        est.grado || 'N/A',
        est.correo || 'N/A',
        est.estado || 'N/A'
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
          0: { cellWidth: 35 }, // Nombre
          1: { cellWidth: 35 }, // Apellido
          2: { cellWidth: 15 }, // Edad
          3: { cellWidth: 25 }, // Grado
          4: { cellWidth: 50 }, // Correo
          5: { cellWidth: 20 }  // Estado
        },
        margin: { left: 10, right: 10 }
      });

      // Guardar PDF
      doc.save(`reporte_estudiantes_${new Date().toISOString().split('T')[0]}.pdf`);
      
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
      const dataToExport = exportFilter === 'filtered' ? estudiantesFiltrados : estudiantes;
      
      // Preparar datos para Excel
      const excelData = dataToExport.map(est => ({
        'Nombre': est.nombre || 'N/A',
        'Apellido': est.apellido || 'N/A',
        'Fecha Nacimiento': est.fechaNacimiento || 'No registrada',
        'Edad': est.edad || 'N/A',
        'Grado': est.grado || 'N/A',
        'Correo': est.correo || 'N/A',
        'Teléfono': est.telefono || 'No registrado',
        'Acudiente': est.acudiente || 'No registrado',
        'Teléfono Acudiente': est.telefonoAcudiente || 'No registrado',
        'Estado': est.estado || 'N/A',
        'Creado': est.creado ? est.creado.toDate().toLocaleString('es-ES') : 'N/A'
      }));

      // Crear libro y hoja de cálculo
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      XLSX.utils.book_append_sheet(wb, ws, 'Estudiantes');

      // Añadir filtros
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      ws['!autofilter'] = { ref: XLSX.utils.encode_range(range) };

      // Ajustar anchos de columna
      ws['!cols'] = [
        { wch: 20 }, // Nombre
        { wch: 20 }, // Apellido
        { wch: 20 }, // Fecha Nacimiento
        { wch: 10 }, // Edad
        { wch: 15 }, // Grado
        { wch: 30 }, // Correo
        { wch: 20 }, // Teléfono
        { wch: 25 }, // Acudiente
        { wch: 20 }, // Teléfono Acudiente
        { wch: 15 }, // Estado
        { wch: 25 }  // Creado
      ];

      // Guardar archivo Excel
      XLSX.writeFile(wb, `reporte_estudiantes_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Error generando Excel:', error);
      Swal.fire('Error', 'Error al generar el archivo Excel', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    cargarEstudiantes();
  }, []);

  // Filtrar y buscar
  useEffect(() => {
    let resultado = estudiantes;

    if (searchTerm) {
      resultado = resultado.filter(est =>
        est.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        est.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        est.correo.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filtroEstado !== "Todos") {
      resultado = resultado.filter(est => est.estado === filtroEstado);
    }

    setEstudiantesFiltrados(resultado);
  }, [estudiantes, searchTerm, filtroEstado]);

  // CREATE - nuevo estudiante
  const crearEstudiante = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.apellido || !formData.edad || !formData.grado || !formData.correo) {
      return Swal.fire("Error", "Todos los campos obligatorios deben llenarse", "error");
    }

    try {
      await addDoc(collection(db, "estudiantes"), {
        ...formData,
        creado: new Date()
      });

      Swal.fire("Creado", "Estudiante registrado exitosamente", "success");
      cancelarForm();
      cargarEstudiantes();
    } catch (error) {
      console.error("Error al crear estudiante:", error);
      Swal.fire("Error", "No se pudo registrar el estudiante", "error");
    }
  };

  // UPDATE
  const actualizarEstudiante = async (e) => {
    e.preventDefault();

    try {
      const estudianteRef = doc(db, "estudiantes", editando);
      await updateDoc(estudianteRef, formData);

      Swal.fire("Actualizado", "Estudiante actualizado correctamente", "success");
      cancelarForm();
      cargarEstudiantes();
    } catch (error) {
      console.error("Error al actualizar:", error);
      Swal.fire("Error", "No se pudo actualizar el estudiante", "error");
    }
  };

  // DELETE
  const eliminarEstudiante = async (id, nombre) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: `Se eliminará el estudiante: ${nombre}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, "estudiantes", id));
        Swal.fire("Eliminado", "Estudiante eliminado correctamente", "success");
        cargarEstudiantes();
      } catch (error) {
        console.error("Error al eliminar:", error);
        Swal.fire("Error", "No se pudo eliminar el estudiante", "error");
      }
    }
  };

  // Editar
  const iniciarEdicion = (est) => {
    setEditando(est.id);
    setFormData({ ...est });
    setShowForm(true);
  };

  const cancelarForm = () => {
    setShowForm(false);
    setEditando(null);
    setFormData({
      nombre: "",
      apellido: "",
      edad: "",
      grado: "",
      correo: "",
      telefono: "",
      acudiente: "",
      telefonoAcudiente: "",
      estado: "Activo"
    });
  };

  // Ver detalles
  const verDetalles = (est) => {
    Swal.fire({
      title: `${est.nombre} ${est.apellido}`,
      html: `
        <div style="text-align: left;">
        <p><strong>Fecha de Nacimiento:</strong> ${est.fechaNacimiento || "No registrada"}</p>
          <p><strong>Edad:</strong> ${est.edad}</p>
          <p><strong>Grado:</strong> ${est.grado}</p>
          <p><strong>Correo:</strong> ${est.correo}</p>
          <p><strong>Teléfono:</strong> ${est.telefono}</p>
          <p><strong>Acudiente:</strong> ${est.acudiente} (${est.telefonoAcudiente})</p>
          <p><strong>Estado:</strong> ${est.estado}</p>
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
          <h1>🎓 Gestión de Estudiantes</h1>
          <p>Administra el registro de estudiantes del colegio</p>
        </div>
      </header>

      <div className="servicios-container">
        {/* Búsqueda y filtros */}
        <div className="search-filter-container">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Buscar estudiantes..."
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
            {showForm ? "❌ Cancelar" : "➕ Nuevo Estudiante"}
          </button>
        </div>

        {/* FORM */}
        {showForm && (
          <div className="form-card">
            <h2>{editando ? "✏️ Editar Estudiante" : "➕ Nuevo Estudiante"}</h2>
            <form onSubmit={editando ? actualizarEstudiante : crearEstudiante}>
              <div className="form-row">
                <div className="form-group">
                  <label>Nombre *</label>
                  <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Apellido *</label>
                  <input type="text" name="apellido" value={formData.apellido} onChange={handleChange} required />
                </div>
              </div>

               <div className="form-row">
                <div className="form-group">
                  <label>Fecha de Nacimiento *</label>
                  <input type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Edad *</label>
                  <input type="number" name="edad" value={formData.edad} onChange={handleChange} required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Grado *</label>
                  <input type="text" name="grado" value={formData.grado} onChange={handleChange} required />
                </div>
                <div className="form-group">
                <label>Correo *</label>
                <input type="email" name="correo" value={formData.correo} onChange={handleChange} required />
              </div>
              </div>
              

              <div className="form-row">
                <div className="form-group">
                  <label>Teléfono</label>
                  <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Acudiente</label>
                  <input type="text" name="acudiente" value={formData.acudiente} onChange={handleChange} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Teléfono Acudiente</label>
                  <input type="text" name="telefonoAcudiente" value={formData.telefonoAcudiente} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Estado *</label>
                  <select name="estado" value={formData.estado} onChange={handleChange}>
                    <option value="Activo">Activo</option>
                    <option value="Retirado">Retirado</option>
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
          <h2>📋 Lista de Estudiantes ({estudiantesFiltrados.length} de {estudiantes.length})</h2>
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Cargando estudiantes...</p>
            </div>
          ) : estudiantes.length === 0 ? (
            <div className="empty-state">
              <p>📭 No hay estudiantes registrados</p>
              <p>Haz clic en "Nuevo Estudiante" para agregar uno</p>
            </div>
          ) : estudiantesFiltrados.length === 0 ? (
            <div className="empty-state">
              <p>🔍 No se encontraron resultados</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="servicios-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Apellido</th>
                    <th>Fecha Nacimiento</th>
                    <th>Edad</th>
                    <th>Grado</th>
                    <th>Correo</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {estudiantesFiltrados.map((est) => (
                    <tr key={est.id}>
                      <td>{est.nombre}</td>
                      <td>{est.apellido}</td>
                      <td>{est.fechaNacimiento || "No registrada"}</td>
                      <td>{est.edad}</td>
                      <td>{est.grado}</td>
                      <td>{est.correo}</td>
                      <td>
                        <span className={`badge ${est.estado.toLowerCase()}`}>
                          {est.estado}
                        </span>
                      </td>
                      <td className="td-acciones">
                        <button className="btn-ver" onClick={() => verDetalles(est)}>👁️</button>
                        <button className="btn-editar" onClick={() => iniciarEdicion(est)}>✏️</button>
                        <button className="btn-eliminar" onClick={() => eliminarEstudiante(est.id, est.nombre)}>🗑️</button>
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

export default Estudiantes;
