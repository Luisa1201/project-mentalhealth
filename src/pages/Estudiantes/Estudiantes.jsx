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

function Estudiantes() {
  const [estudiantes, setEstudiantes] = useState([]);
  const [estudiantesFiltrados, setEstudiantesFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");

  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
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
        estudiantesArray.push({
          id: doc.id,
          ...doc.data()
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
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Buscar por nombre, apellido o correo..."
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
              <option value="Retirado">Retirado</option>
            </select>
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
                  <label>Edad *</label>
                  <input type="number" name="edad" value={formData.edad} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Grado *</label>
                  <input type="text" name="grado" value={formData.grado} onChange={handleChange} required />
                </div>
              </div>

              <div className="form-group">
                <label>Correo *</label>
                <input type="email" name="correo" value={formData.correo} onChange={handleChange} required />
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
    </>
  );
}

export default Estudiantes;
