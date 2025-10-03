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

function Psicoorientadores() {
  const [psicos, setPsicos] = useState([]);
  const [psicosFiltrados, setPsicosFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");

  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
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

  // READ - cargar psicoorientadores2
  const cargarPsicos = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "psicoorientadores"), orderBy("creado", "desc"));
      const querySnapshot = await getDocs(q);
      const array = [];
      
      querySnapshot.forEach((doc) => {
        array.push({
          id: doc.id,
          ...doc.data()
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
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Buscar por nombre, especialidad o correo..."
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
