import { collection, addDoc, updateDoc, doc, serverTimestamp, getDocs, query, where, writeBatch, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Registra el inicio de sesión de un usuario
 * @param {Object} user - Objeto del usuario de Firebase Auth
 * @param {string} provider - Proveedor de autenticación (email, google, github, facebook)
 * @returns {Promise<string>} - ID del documento de sesión creado
 */
export const registerLogin = async (user, provider = "email") => {
  try {
    const sessionData = {
      userId: user.uid,
      userName: user.displayName || "Usuario",
      userEmail: user.email,
      provider: provider,
      loginTime: serverTimestamp(),
      logoutTime: null,
      isActive: true
    };

    const docRef = await addDoc(collection(db, "sessions"), sessionData);
    
    // Guardar el ID de sesión en localStorage para poder actualizarlo al cerrar sesión
    localStorage.setItem("currentSessionId", docRef.id);
    
    console.log("Sesión registrada con ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error al registrar inicio de sesión:", error);
    throw error;
  }
};

/**
 * Registra el cierre de sesión de un usuario
 * @param {string} sessionId - ID del documento de sesión (opcional, se obtiene de localStorage si no se proporciona)
 * @returns {Promise<void>}
 */
export const registerLogout = async (sessionId = null) => {
  try {
    const currentSessionId = sessionId || localStorage.getItem("currentSessionId");
    
    if (!currentSessionId) {
      console.warn("No hay sesión activa para cerrar");
      return;
    }

    const sessionRef = doc(db, "sessions", currentSessionId);
    await updateDoc(sessionRef, {
      logoutTime: serverTimestamp(),
      isActive: false
    });

    // Limpiar el ID de sesión del localStorage
    localStorage.removeItem("currentSessionId");
    
    console.log("Cierre de sesión registrado para sesión:", currentSessionId);
  } catch (error) {
    console.error("Error al registrar cierre de sesión:", error);
    throw error;
  }
};

/**
 * Obtiene el proveedor de autenticación basado en los datos del usuario
 * @param {Object} user - Objeto del usuario de Firebase Auth
 * @returns {string} - Nombre del proveedor
 */
export const getAuthProvider = (user) => {
  if (!user || !user.providerData || user.providerData.length === 0) {
    return "email";
  }

  const providerId = user.providerData[0].providerId;
  
  switch (providerId) {
    case "google.com":
      return "Google";
    case "github.com":
      return "GitHub";
    case "facebook.com":
      return "Facebook";
    case "password":
      return "Email";
    default:
      return "Desconocido";
  }
};

export const clearLocalSessionPointer = () => {
  try {
    localStorage.removeItem("currentSessionId");
  } catch (_) {}
};

export const resetUserSessions = async (userId, options = { hard: false }) => {
  const hard = !!options.hard;
  const q = query(collection(db, "sessions"), where("userId", "==", userId));
  const snap = await getDocs(q);
  if (snap.empty) return 0;
  if (hard) {
    const batch = writeBatch(db);
    snap.forEach((d) => batch.delete(doc(db, "sessions", d.id)));
    await batch.commit();
    clearLocalSessionPointer();
    return snap.size;
  } else {
    const batch = writeBatch(db);
    snap.forEach((d) => batch.update(doc(db, "sessions", d.id), { isActive: false, logoutTime: serverTimestamp() }));
    await batch.commit();
    clearLocalSessionPointer();
    return snap.size;
  }
};
