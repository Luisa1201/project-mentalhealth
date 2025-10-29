import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { registerLogout } from "./sessionManager";
import Swal from "sweetalert2";

/**
 * Hook personalizado para cerrar sesión automáticamente por inactividad
 * @param {number} inactivityTime - Tiempo de inactividad en milisegundos (default: 30 minutos)
 * @param {number} warningTime - Tiempo antes de mostrar advertencia en milisegundos (default: 25 minutos)
 */
export const useInactivityLogout = (
  inactivityTime = 30 * 60 * 1000, // 30 minutos
  warningTime = 25 * 60 * 1000     // 25 minutos
) => {
  const navigate = useNavigate();
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const warningShownRef = useRef(false);

  const resetTimers = () => {
    // Limpiar timers existentes
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
    
    // Resetear bandera de advertencia
    warningShownRef.current = false;

    // Timer para mostrar advertencia
    warningTimeoutRef.current = setTimeout(() => {
      if (!warningShownRef.current && auth.currentUser) {
        warningShownRef.current = true;
        showInactivityWarning();
      }
    }, warningTime);

    // Timer para cerrar sesión automáticamente
    timeoutRef.current = setTimeout(() => {
      if (auth.currentUser) {
        logoutDueToInactivity();
      }
    }, inactivityTime);
  };

  const showInactivityWarning = () => {
    const timeRemaining = Math.round((inactivityTime - warningTime) / 1000 / 60);
    
    Swal.fire({
      title: "⚠️ Sesión por expirar",
      html: `Tu sesión se cerrará en <strong>${timeRemaining} minutos</strong> por inactividad.<br><br>Haz clic en cualquier lugar para continuar.`,
      icon: "warning",
      timer: (inactivityTime - warningTime),
      timerProgressBar: true,
      showConfirmButton: true,
      confirmButtonText: "Continuar activo",
      allowOutsideClick: false,
      backdrop: true
    }).then((result) => {
      if (result.isConfirmed || result.isDismissed) {
        // Usuario interactuó, resetear timers
        warningShownRef.current = false;
        resetTimers();
      }
    });
  };

  const logoutDueToInactivity = async () => {
    try {
      // Registrar cierre de sesión
      await registerLogout();
      
      // Cerrar sesión en Firebase
      await auth.signOut();
      
      // Mostrar mensaje
      Swal.fire({
        title: "Sesión cerrada",
        text: "Tu sesión se cerró automáticamente por inactividad",
        icon: "info",
        confirmButtonText: "Entendido"
      });
      
      // Redirigir al login
      navigate("/loginPage");
    } catch (error) {
      console.error("Error al cerrar sesión por inactividad:", error);
    }
  };

  useEffect(() => {
    // Solo activar si hay un usuario autenticado
    if (!auth.currentUser) {
      return;
    }

    // Eventos que indican actividad del usuario
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click"
    ];

    // Resetear timers al detectar actividad
    const handleActivity = () => {
      resetTimers();
    };

    // Agregar listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Iniciar timers
    resetTimers();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [inactivityTime, warningTime, navigate]);
};
