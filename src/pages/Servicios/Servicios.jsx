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

function Servicios() {
  // Cierre automático de sesión por inactividad
  useInactivityLogout();
  
  const [servicios, setServicios] = useState([]);
  const [serviciosFiltrados, setServiciosFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");

  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFilter, setExportFilter] = useState("all");
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    duracion: "",
    precio: "",
    estado: "Activo"
  });

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // READ - Cargar servicios desde Firebase
  const cargarServicios = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "servicios"), orderBy("creado", "desc"));
      const querySnapshot = await getDocs(q);
      const serviciosArray = [];
      
      querySnapshot.forEach((doc) => {
        const servicioData = doc.data();
        // Asegurarse de que el precio sea un número
        const precio = typeof servicioData.precio === 'number' 
          ? servicioData.precio 
          : parseFloat(servicioData.precio) || 0;
          
        serviciosArray.push({
          id: doc.id,
          ...servicioData,
          precio: precio
        });
      });
      
      setServicios(serviciosArray);
      setLoading(false);
    } catch (error) {
      console.error("Error al cargar servicios:", error);
      Swal.fire("Error", "No se pudieron cargar los servicios", "error");
      setLoading(false);
    }
  };

  // useEffect para cargar servicios al montar el componente
  useEffect(() => {
    cargarServicios();
  }, []);

  // Filtrar y buscar servicios
  useEffect(() => {
    let resultado = servicios;

    // Filtrar por búsqueda
    if (searchTerm) {
      resultado = resultado.filter(servicio =>
        servicio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        servicio.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por estado
    if (filtroEstado !== "Todos") {
      resultado = resultado.filter(servicio => servicio.estado === filtroEstado);
    }

    setServiciosFiltrados(resultado);
  }, [servicios, searchTerm, filtroEstado]);

  // Exportar a PDF
  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      // Crear documento con orientación horizontal
      const doc = new jsPDF('l', 'mm', 'a4');
      
      // Título
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('REPORTE DE SERVICIOS', 148, 15, { align: 'center' });
      
      // Fecha
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, 14, 25);
      
      // Datos a exportar
      const dataToExport = exportFilter === 'filtered' ? serviciosFiltrados : servicios;
      
      // Preparar datos para la tabla
      const tableColumn = ["Nombre", "Descripción", "Duración", "Precio", "Estado"];
      const tableRows = dataToExport.map(servicio => {
        const precio = parseFloat(servicio.precio || 0);
        return [
          servicio.nombre || 'N/A',
          servicio.descripcion || 'N/A',
          servicio.duracion || 'N/A',
          {
            content: `$${precio.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
            styles: { halign: 'right' }
          },
          servicio.estado || 'N/A'
        ];
      });

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
          1: { cellWidth: 80 }, // Descripción
          2: { cellWidth: 30 }, // Duración
          3: { cellWidth: 25 }, // Precio
          4: { cellWidth: 25 }  // Estado
        },
        margin: { left: 10, right: 10 }
      });

      // Guardar PDF
      doc.save(`reporte_servicios_${new Date().toISOString().split('T')[0]}.pdf`);
      
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
      const dataToExport = exportFilter === 'filtered' ? serviciosFiltrados : servicios;
      
      // Preparar datos para Excel
      const excelData = dataToExport.map(servicio => {
        const precio = parseFloat(servicio.precio || 0);
        return {
          'Nombre': servicio.nombre || 'N/A',
          'Descripción': servicio.descripcion || 'N/A',
          'Duración': servicio.duracion || 'N/A',
          'Precio': {
            v: precio,
            t: 'n',
            z: '"$"#,##0_);("$"#,##0)'
          },
          'Estado': servicio.estado || 'N/A',
          'Creado': servicio.creado ? servicio.creado.toDate().toLocaleString('es-ES') : 'N/A'
        };
      });

      // Crear libro y hoja de cálculo
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      XLSX.utils.book_append_sheet(wb, ws, 'Servicios');

      // Añadir filtros
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      ws['!autofilter'] = { ref: XLSX.utils.encode_range(range) };

      // Ajustar anchos de columna
      ws['!cols'] = [
        { wch: 25 }, // Nombre
        { wch: 50 }, // Descripción
        { wch: 15 }, // Duración
        { wch: 15 }, // Precio
        { wch: 15 }, // Estado
        { wch: 25 }  // Creado
      ];

      // Guardar archivo Excel
      XLSX.writeFile(wb, `reporte_servicios_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Error generando Excel:', error);
      Swal.fire('Error', 'Error al generar el archivo Excel', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // CREATE - Crear nuevo servicio en Firebase
  const crearServicio = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.descripcion || !formData.duracion || !formData.precio) {
      return Swal.fire("Error", "Todos los campos son obligatorios", "error");
    }

    // Limpiar y formatear el precio
    const precioLimpio = parseFloat(formData.precio.toString().replace(/[^0-9.]/g, ''));
    
    if (isNaN(precioLimpio)) {
      return Swal.fire("Error", "Por favor ingrese un precio válido", "error");
    }

    try {
      // Guardar en Firebase
      await addDoc(collection(db, "servicios"), {
        ...formData,
        precio: precioLimpio,
        creado: new Date()
      });

      Swal.fire("Creado", "Servicio creado exitosamente", "success");
      cancelarForm();
      cargarServicios(); // Recargar lista
    } catch (error) {
      console.error("Error al crear servicio:", error);
      Swal.fire("Error", "No se pudo crear el servicio", "error");
    }
  };

  // UPDATE - Actualizar servicio en Firebase
  const actualizarServicio = async (e) => {
    e.preventDefault();

    // Limpiar y formatear el precio
    const precioLimpio = parseFloat(formData.precio.toString().replace(/[^0-9.]/g, ''));
    
    if (isNaN(precioLimpio)) {
      return Swal.fire("Error", "Por favor ingrese un precio válido", "error");
    }

    try {
      const servicioRef = doc(db, "servicios", editando);
      await updateDoc(servicioRef, {
        ...formData,
        precio: precioLimpio
      });

      Swal.fire("Actualizado", "Servicio actualizado correctamente", "success");
      cancelarForm();
      cargarServicios(); // Recargar lista
    } catch (error) {
      console.error("Error al actualizar:", error);
      Swal.fire("Error", "No se pudo actualizar el servicio", "error");
    }
  };

  // DELETE - Eliminar servicio de Firebase
  const eliminarServicio = async (id, nombre) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: `Se eliminará el servicio: ${nombre}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, "servicios", id));
        Swal.fire("Eliminado", "Servicio eliminado correctamente", "success");
        cargarServicios(); // Recargar lista
      } catch (error) {
        console.error("Error al eliminar:", error);
        Swal.fire("Error", "No se pudo eliminar el servicio", "error");
      }
    }
  };

  // Iniciar edición
  const iniciarEdicion = (servicio) => {
    setEditando(servicio.id);
    setFormData({
      nombre: servicio.nombre,
      descripcion: servicio.descripcion,
      duracion: servicio.duracion,
      precio: servicio.precio,
      estado: servicio.estado
    });
    setShowForm(true);
  };

  // Cancelar formulario
  const cancelarForm = () => {
    setShowForm(false);
    setEditando(null);
    setFormData({
      nombre: "",
      descripcion: "",
      duracion: "",
      precio: "",
      estado: "Activo"
    });
  };

  // Ver detalles del servicio
  const verDetalles = (servicio) => {
    const precioFormateado = servicio.precio !== undefined && servicio.precio !== null
      ? `$${Number(servicio.precio).toLocaleString('es-CO', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        })}`
      : '$0';
      
    Swal.fire({
      title: servicio.nombre,
      html: `
        <div style="text-align: left;">
          <p><strong>Descripción:</strong> ${servicio.descripcion || 'N/A'}</p>
          <p><strong>Duración:</strong> ${servicio.duracion || 'N/A'}</p>
          <p><strong>Precio:</strong> ${precioFormateado}</p>
          <p><strong>Estado:</strong> ${servicio.estado || 'N/A'}</p>
        </div>
      `,
      icon: "info",
      confirmButtonText: "Cerrar"
    });
  };

  return (
    <>
      {/* HEADER SENCILLO */}
      <header className="servicios-header-top">
        <div className="header-content">
          <h1>🏥 Gestión de Servicios</h1>
          <p>Administra los servicios de salud mental</p>
        </div>
      </header>

      <div className="servicios-container">
        {/* BARRA DE BÚSQUEDA Y FILTROS */}
        <div className="search-filter-container">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Buscar servicios..."
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
            {showForm ? "❌ Cancelar" : "➕ Nuevo Servicio"}
          </button>
        </div>

      {/* FORMULARIO CREATE/UPDATE */}
      {showForm && (
        <div className="form-card">
          <h2>{editando ? "✏️ Editar Servicio" : "➕ Nuevo Servicio"}</h2>
          <form onSubmit={editando ? actualizarServicio : crearServicio}>
            <div className="form-row">
              <div className="form-group">
                <label>Nombre del Servicio *</label>
                <input
                  type="text"
                  name="nombre"
                  placeholder="Ej: Terapia Individual"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Duración *</label>
                <input
                  type="text"
                  name="duracion"
                  placeholder="Ej: 60 minutos"
                  value={formData.duracion}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Descripción *</label>
              <textarea
                name="descripcion"
                placeholder="Describe el servicio..."
                value={formData.descripcion}
                onChange={handleChange}
                rows="3"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Precio *</label>
                <input
                  type="text"
                  name="precio"
                  placeholder="Ej: $50.000"
                  value={formData.precio}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Estado *</label>
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  required
                >
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

      {/* TABLA READ */}
      <div className="servicios-list">
        <h2>📋 Lista de Servicios ({serviciosFiltrados.length} de {servicios.length})</h2>
        
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Cargando servicios...</p>
          </div>
        ) : servicios.length === 0 ? (
          <div className="empty-state">
            <p>📭 No hay servicios registrados</p>
            <p>Haz clic en "Nuevo Servicio" para agregar uno</p>
          </div>
        ) : serviciosFiltrados.length === 0 ? (
          <div className="empty-state">
            <p>🔍 No se encontraron resultados</p>
            <p>Intenta con otros términos de búsqueda</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="servicios-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Duración</th>
                  <th>Precio</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {serviciosFiltrados.map((servicio) => (
                  <tr key={servicio.id}>
                    <td className="td-nombre">{servicio.nombre}</td>
                    <td className="td-descripcion">{servicio.descripcion}</td>
                    <td>{servicio.duracion}</td>
                    <td className="td-precio">
                      {servicio.precio !== undefined && servicio.precio !== null
                        ? `$${Number(servicio.precio).toLocaleString('es-CO', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                          })}`
                        : '$0'}
                    </td>
                    <td>
                      <span className={`badge ${servicio.estado.toLowerCase()}`}>
                        {servicio.estado}
                      </span>
                    </td>
                    <td className="td-acciones">
                      <button
                        className="btn-ver"
                        onClick={() => verDetalles(servicio)}
                        title="Ver detalles"
                      >
                        👁️
                      </button>
                      <button
                        className="btn-editar"
                        onClick={() => iniciarEdicion(servicio)}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-eliminar"
                        onClick={() => eliminarServicio(servicio.id, servicio.nombre)}
                        title="Eliminar"
                      >
                        🗑️
                      </button>
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

export default Servicios;
