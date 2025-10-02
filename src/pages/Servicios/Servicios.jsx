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
import "./Servicios.css";
import Swal from "sweetalert2";

function Servicios() {
  const [servicios, setServicios] = useState([]);
  const [serviciosFiltrados, setServiciosFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");

  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
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
        serviciosArray.push({
          id: doc.id,
          ...doc.data()
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

  // CREATE - Crear nuevo servicio en Firebase
  const crearServicio = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.descripcion || !formData.duracion || !formData.precio) {
      return Swal.fire("Error", "Todos los campos son obligatorios", "error");
    }

    try {
      // Guardar en Firebase
      await addDoc(collection(db, "servicios"), {
        ...formData,
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

    try {
      const servicioRef = doc(db, "servicios", editando);
      await updateDoc(servicioRef, formData);

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
    Swal.fire({
      title: servicio.nombre,
      html: `
        <div style="text-align: left;">
          <p><strong>Descripción:</strong> ${servicio.descripcion}</p>
          <p><strong>Duración:</strong> ${servicio.duracion}</p>
          <p><strong>Precio:</strong> ${servicio.precio}</p>
          <p><strong>Estado:</strong> ${servicio.estado}</p>
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
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Buscar por nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-box">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="filter-select"
            >
              <option value="Todos">Todos los estados</option>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
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
                    <td className="td-precio">{servicio.precio}</td>
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
    </>
  );
}

export default Servicios;
