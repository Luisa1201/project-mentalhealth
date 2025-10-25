import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

/**
 * Componente para proteger rutas que solo pueden acceder administradores
 */
const AdminRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAdminRole = async () => {
      try {
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
          setLoading(false);
          return;
        }

        setUser(currentUser);

        // Obtener datos del usuario desde Firestore
        const userDoc = await getDoc(doc(db, "usuarios", currentUser.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          // Verificar si el rol es "administrador"
          setIsAdmin(userData.rol === "administrador");
        }
      } catch (error) {
        console.error("Error al verificar rol de administrador:", error);
      } finally {
        setLoading(false);
      }
    };

    // Escuchar cambios en la autenticación
    const unsubscribe = auth.onAuthStateChanged(() => {
      checkAdminRole();
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#f5f7fa"
      }}>
        <div style={{
          textAlign: "center",
          padding: "40px",
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
        }}>
          <div style={{
            width: "40px",
            height: "40px",
            border: "4px solid #e5e7eb",
            borderTopColor: "#00bcd4",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 15px"
          }}></div>
          <p style={{ color: "#6b7280" }}>Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario, redirigir al login
  if (!user) {
    return <Navigate to="/loginPage" replace />;
  }

  // Si no es administrador, redirigir al dashboard con mensaje
  if (!isAdmin) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#f5f7fa",
        padding: "20px"
      }}>
        <div style={{
          textAlign: "center",
          padding: "40px",
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          maxWidth: "500px"
        }}>
          <div style={{
            fontSize: "4rem",
            marginBottom: "20px"
          }}>🔒</div>
          <h2 style={{
            color: "#1f2937",
            marginBottom: "10px",
            fontSize: "1.5rem"
          }}>Acceso Restringido</h2>
          <p style={{
            color: "#6b7280",
            marginBottom: "20px"
          }}>
            Esta sección solo está disponible para administradores.
          </p>
          <a 
            href="/dashboard"
            style={{
              display: "inline-block",
              padding: "10px 20px",
              background: "linear-gradient(135deg, #00bcd4 0%, #0097a7 100%)",
              color: "white",
              textDecoration: "none",
              borderRadius: "8px",
              fontWeight: "600"
            }}
          >
            Volver al Dashboard
          </a>
        </div>
      </div>
    );
  }

  // Si es administrador, mostrar el contenido
  return children;
};

export default AdminRoute;
