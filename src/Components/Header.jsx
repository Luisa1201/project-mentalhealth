import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaUser, FaFacebookF, FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { MdEmail } from "react-icons/md";
import "../assets/Header.css";
import { auth, db, GoogleProvider, GithubProvider, FacebookProvider, fetchSignInMethodsForEmail } from "../firebase";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import Swal from "sweetalert2";
import { registerLogout } from "../utils/sessionManager";
import {
  linkWithPopup,
  linkWithRedirect,
  getRedirectResult,
  signInWithPopup,
  linkWithCredential,
  GoogleAuthProvider as GAP,
  FacebookAuthProvider as FBP,
  GithubAuthProvider as GHP,
  EmailAuthProvider,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";

const Header = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [linked, setLinked] = useState({ password: false, google: false, facebook: false, github: false });

  useEffect(() => {
    // Escuchar cambios en la autenticación
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // Obtener nombre del usuario desde Firestore
        try {
          const userDoc = await getDoc(doc(db, "usuarios", currentUser.uid));
          if (userDoc.exists()) {
            setUserName(userDoc.data().nombres);
          }
        } catch (error) {
          console.error("Error al obtener datos del usuario:", error);
        }
        const providers = (currentUser.providerData || []).map((p) => p.providerId);
        setLinked({
          password: providers.includes("password"),
          google: providers.includes("google.com"),
          facebook: providers.includes("facebook.com"),
          github: providers.includes("github.com"),
        });
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Manejar resultado de redirección (fallback a popup bloqueado)
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const res = await getRedirectResult(auth);
        if (res && res.user) {
          const providers = (res.user.providerData || []).map((p) => p.providerId);
          setLinked({
            password: providers.includes("password"),
            google: providers.includes("google.com"),
            facebook: providers.includes("facebook.com"),
            github: providers.includes("github.com"),
          });
          Swal.fire("Cuenta vinculada correctamente!", "", "success");
        }
      } catch (e) {
        // silencioso; ya hay manejos en el flujo principal
        console.warn("Redirect linking error", e);
      }
    };
    handleRedirectResult();
  }, []);

  const handleLogout = async () => {
    try {
      // Registrar cierre de sesión antes de cerrar
      await registerLogout();
      
      await auth.signOut();
      Swal.fire("Éxito", "Sesión cerrada correctamente", "success");
      navigate("/loginPage");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      Swal.fire("Error", "No se pudo cerrar la sesión", "error");
    }
  };

  const handleLinkAccount = async (providerType) => {
    try {
      let provider;
      let providerId;
      switch (providerType) {
        case "google":
          provider = GoogleProvider;
          providerId = "google.com";
          try {
            provider.setCustomParameters?.({
              login_hint: auth.currentUser?.email || undefined,
              prompt: "select_account",
            });
          } catch (_) {}
          break;
        case "facebook":
          provider = FacebookProvider;
          providerId = "facebook.com";
          break;
        case "github":
          provider = GithubProvider;
          providerId = "github.com";
          break;
        default:
          return;
      }
      if (!auth.currentUser) {
        Swal.fire("Inicia sesión", "Debes iniciar sesión para vincular cuentas.", "info");
        return;
      }

      // Pre-chequeo informativo
      try {
        const methods = await fetchSignInMethodsForEmail(auth, auth.currentUser.email);
        if (methods && methods.includes(providerId)) {
          Swal.fire(
            "Proveedor disponible para este correo",
            "Si el popup falla por 'cuenta existente', inicia con ese proveedor y luego vuelve para vincular.",
            "info"
          );
        }
      } catch (e) {
        console.warn("No se pudieron obtener métodos de inicio de sesión:", e);
      }

      // Preferir popup; usar redirect sólo en iOS/Safari o navegadores in-app
      const ua = navigator.userAgent || "";
      const isIOS = /iPhone|iPad|iPod/i.test(ua);
      const isSafari = /Safari\//.test(ua) && !/Chrome\//.test(ua);
      const isInApp = /FBAN|FBAV|Instagram|Line|Twitter|LinkedIn|WhatsApp|Messenger/i.test(ua);

      let result;
      if (isIOS || isSafari || isInApp) {
        try { await setPersistence(auth, browserLocalPersistence); } catch (_) {}
        await linkWithRedirect(auth.currentUser, provider);
        return; // El flujo continúa en getRedirectResult
      } else {
        result = await linkWithPopup(auth.currentUser, provider);
      }

      const providers = (result.user.providerData || []).map((p) => p.providerId);
      setLinked({
        password: providers.includes("password"),
        google: providers.includes("google.com"),
        facebook: providers.includes("facebook.com"),
        github: providers.includes("github.com"),
      });

      // Persistir en Firestore
      try {
        const uid = result.user.uid;
        const userRef = doc(db, "users", uid);
        const snap = await getDoc(userRef);
        const providersNow = (result.user.providerData || []).map((p) => p.providerId);
        if (snap.exists()) {
          await updateDoc(userRef, { providers: providersNow, lastLinkedAt: serverTimestamp() });
        } else {
          await setDoc(
            userRef,
            { email: result.user.email, providers: providersNow, createdAt: serverTimestamp(), lastLinkedAt: serverTimestamp() },
            { merge: true }
          );
        }
      } catch (e) {
        console.warn("No se pudo actualizar providers en Firestore:", e);
      }

      Swal.fire("Cuenta vinculada correctamente!", "", "success");
    } catch (error) {
      if (error.code === "auth/popup-closed-by-user" || error.code === "auth/cancelled-popup-request") {
        // Silencioso
        return;
      } else if (error.code === "auth/popup-blocked") {
        try {
          try { await setPersistence(auth, browserLocalPersistence); } catch (_) {}
          await linkWithRedirect(auth.currentUser, provider);
          return;
        } catch (e) {
          Swal.fire("Popup bloqueado", "Permite las ventanas emergentes del navegador para continuar.", "info");
        }
      } else if (
        error.code === "auth/account-exists-with-different-credential" ||
        error.code === "auth/credential-already-in-use"
      ) {
        // Unificación de cuentas
        try {
          const email = error.customData?.email || auth.currentUser?.email;
          let pendingCred = null;
          if (providerType === "google") pendingCred = GAP.credentialFromError(error);
          if (providerType === "facebook") pendingCred = FBP.credentialFromError(error);
          if (providerType === "github") pendingCred = GHP.credentialFromError(error);

          if (!pendingCred) throw error;

          const methods = await fetchSignInMethodsForEmail(auth, email);

          // Intento directo si ya estoy autenticado
          if (auth.currentUser) {
            try {
              const directLinked = await linkWithCredential(auth.currentUser, pendingCred);
              const p = (directLinked.user.providerData || []).map((x) => x.providerId);
              setLinked({
                password: p.includes("password"),
                google: p.includes("google.com"),
                facebook: p.includes("facebook.com"),
                github: p.includes("github.com"),
              });
              Swal.fire("Cuenta vinculada correctamente!", "", "success");
              return;
            } catch (_) {}
          }

          // Iniciar con proveedor principal y luego vincular credencial pendiente
          const primary = methods.find((m) => m !== "password") || methods[0];
          let signInProviderInstance = null;
          if (primary === "google.com") signInProviderInstance = GoogleProvider;
          if (primary === "facebook.com") signInProviderInstance = FacebookProvider;
          if (primary === "github.com") signInProviderInstance = GithubProvider;

          if (signInProviderInstance) {
            const signinRes = await signInWithPopup(auth, signInProviderInstance);

            if (methods.includes("password")) {
              const { value: password } = await Swal.fire({
                title: "Confirma tu contraseña",
                input: "password",
                inputLabel: `Para vincular el inicio por correo (${email})`,
                inputPlaceholder: "Escribe tu contraseña",
                inputAttributes: { autocapitalize: "off", autocorrect: "off" },
                showCancelButton: true,
                confirmButtonText: "Vincular",
              });
              if (password) {
                const emailCred = EmailAuthProvider.credential(email, password);
                await linkWithCredential(signinRes.user, emailCred);
              }
            }

            const linkedRes = await linkWithCredential(signinRes.user, pendingCred);
            const p = (linkedRes.user.providerData || []).map((x) => x.providerId);
            setLinked({
              password: p.includes("password"),
              google: p.includes("google.com"),
              facebook: p.includes("facebook.com"),
              github: p.includes("github.com"),
            });
            Swal.fire("Cuentas unificadas", "Se vincularon los métodos de acceso a tu cuenta.", "success");
            return;
          }

          Swal.fire(
            "Cuenta existente con otro proveedor",
            "Inicia sesión con el proveedor sugerido para este correo y luego vuelve a intentar vincular.",
            "info"
          );
          return;
        } catch (mergeErr) {
          console.error(mergeErr);
          Swal.fire("No se pudo unificar cuentas", mergeErr.message, "error");
          return;
        }
      } else if (error.code === "auth/provider-already-linked") {
        Swal.fire("Ya vinculado", "Tu cuenta ya está vinculada con este proveedor.", "info");
      } else {
        console.error(error);
        Swal.fire("Error al vincular cuenta", error.message, "error");
      }
    }
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-logo">
          <button className="sidebar-toggle-mobile" onClick={() => {
            document.querySelector('.sidebar-toggle-btn')?.click();
          }}>
            ☰
          </button>
          <span className="logo-icon">🧠</span>
          <span className="logo-text">Salud Mental</span>
        </div>

        <nav className="header-nav">
          <a href="#inicio" className="nav-link">Inicio</a>
          <a href="#servicios" className="nav-link">Servicios</a>
          <a href="#recursos" className="nav-link">Recursos</a>
          <a href="#contacto" className="nav-link">Contacto</a>
        </nav>

        <div className="header-actions">
          {/* Vista móvil: chip con nombre y botón a la derecha */}
          {!loading && user && (
            <div className="user-compact">
              <span className="user-compact-name">{userName || user.email.split('@')[0]}</span>
              <div className="provider-icons" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button
                  title={linked.password ? "Correo vinculado" : "No vinculado con correo"}
                  className={`provider-btn ${linked.password ? 'active' : ''}`}
                  style={{ width: 24, height: 24, padding: 0, borderRadius: '9999px', border: '1px solid #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', background: linked.password ? '#374151' : 'transparent', color: linked.password ? '#ffffff' : '#374151' }}
                >
                  <MdEmail size={16} color={linked.password ? '#ffffff' : '#9ca3af'} />
                </button>
                <button
                  onClick={() => !linked.google && handleLinkAccount('google')}
                  title={linked.google ? "Google vinculado" : "Vincular con Google"}
                  className={`provider-btn ${linked.google ? 'active' : ''}`}
                  style={{ width: 24, height: 24, padding: 0, borderRadius: '9999px', border: '1px solid #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', background: linked.google ? '#ef4444' : 'transparent', color: linked.google ? '#ffffff' : '#374151' }}
                >
                  <FcGoogle size={16} />
                </button>
                <button
                  onClick={() => !linked.facebook && handleLinkAccount('facebook')}
                  title={linked.facebook ? "Facebook vinculado" : "Vincular con Facebook"}
                  className={`provider-btn ${linked.facebook ? 'active' : ''}`}
                  style={{ width: 24, height: 24, padding: 0, borderRadius: '9999px', border: '1px solid #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', background: linked.facebook ? '#2563eb' : 'transparent', color: linked.facebook ? '#ffffff' : '#374151' }}
                >
                  <FaFacebookF size={16} color={linked.facebook ? '#ffffff' : '#9ca3af'} />
                </button>
                <button
                  onClick={() => !linked.github && handleLinkAccount('github')}
                  title={linked.github ? "GitHub vinculado" : "Vincular con GitHub"}
                  className={`provider-btn ${linked.github ? 'active' : ''}`}
                  style={{ width: 24, height: 24, padding: 0, borderRadius: '9999px', border: '1px solid #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', background: linked.github ? '#111827' : 'transparent', color: linked.github ? '#ffffff' : '#374151' }}
                >
                  <FaGithub size={16} color={linked.github ? '#ffffff' : '#9ca3af'} />
                </button>
              </div>
              <button
                className="btn-logout-mobile"
                onClick={handleLogout}
                title="Cerrar sesión"
              >
                <FaSignOutAlt />
              </button>
            </div>
          )}
          {!loading && user && (
            <div className="user-session">
              <div className="user-info">
                <div className="user-avatar">
                  <FaUser />
                </div>
                <div className="user-details">
                  <p className="user-name">{userName || user.email.split('@')[0]}</p>
                </div>
              </div>

              <div className="provider-icons" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginRight: '12px' }}>
                <button
                  title={linked.password ? "Correo vinculado" : "No vinculado con correo"}
                  className={`provider-btn ${linked.password ? 'active' : ''}`}
                  style={{ width: 28, height: 28, padding: 0, borderRadius: '9999px', border: '1px solid #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', background: linked.password ? '#374151' : 'transparent', color: linked.password ? '#ffffff' : '#374151' }}
                >
                  <MdEmail size={20} color={linked.password ? '#ffffff' : '#9ca3af'} />
                </button>
                <button
                  onClick={() => !linked.google && handleLinkAccount('google')}
                  title={linked.google ? "Google vinculado" : "Vincular con Google"}
                  className={`provider-btn ${linked.google ? 'active' : ''}`}
                  style={{ width: 28, height: 28, padding: 0, borderRadius: '9999px', border: '1px solid #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', background: linked.google ? '#ef4444' : 'transparent', color: linked.google ? '#ffffff' : '#374151' }}
                >
                  <FcGoogle size={20} />
                </button>
                <button
                  onClick={() => !linked.facebook && handleLinkAccount('facebook')}
                  title={linked.facebook ? "Facebook vinculado" : "Vincular con Facebook"}
                  className={`provider-btn ${linked.facebook ? 'active' : ''}`}
                  style={{ width: 28, height: 28, padding: 0, borderRadius: '9999px', border: '1px solid #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', background: linked.facebook ? '#2563eb' : 'transparent', color: linked.facebook ? '#ffffff' : '#374151' }}
                >
                  <FaFacebookF size={20} color={linked.facebook ? '#ffffff' : '#9ca3af'} />
                </button>
                <button
                  onClick={() => !linked.github && handleLinkAccount('github')}
                  title={linked.github ? "GitHub vinculado" : "Vincular con GitHub"}
                  className={`provider-btn ${linked.github ? 'active' : ''}`}
                  style={{ width: 28, height: 28, padding: 0, borderRadius: '9999px', border: '1px solid #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', background: linked.github ? '#111827' : 'transparent', color: linked.github ? '#ffffff' : '#374151' }}
                >
                  <FaGithub size={20} color={linked.github ? '#ffffff' : '#9ca3af'} />
                </button>
              </div>

              <button
                className="btn-logout"
                onClick={handleLogout}
                title="Cerrar sesión"
              >
                <FaSignOutAlt />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;