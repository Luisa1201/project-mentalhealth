

Requisitos previos

- Proyecto React funcionando (este repositorio).
- Proyecto Firebase creado y configurado.
- Proveedor de Google habilitado en Firebase Authentication.

1) Configuración en Firebase Console

1. Ve a Firebase Console → Authentication → Sign-in method.
2. Habilita Google.
3. En Authorized domains agrega los dominios que vas a usar (por ejemplo: localhost, 127.0.0.1 y el dominio en producción).
4. Guarda los cambios.

2) Configuración del Auth en el código

Archivo: src/firebase.js

- Se inicializa Firebase y la autenticación usando initializeAuth para soportar correctamente popup/redirect y distintas persistencias (IndexedDB/Local/Session).

Ejemplo (resumen de lo implementado):

import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  browserPopupRedirectResolver,
  GoogleAuthProvider,
  GithubAuthProvider,
  FacebookAuthProvider,
} from "firebase/auth";

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence],
  popupRedirectResolver: browserPopupRedirectResolver,
});

export const GoogleProvider = new GoogleAuthProvider();

Puntos clave

- initializeAuth en lugar de getAuth para poder configurar resolvers y persistencias desde el inicio.
- popupRedirectResolver permite manejar correctamente el fallback a redirect cuando el popup es bloqueado o el entorno es in-app (Facebook/Instagram, etc.).

3) Flujo de inicio de sesión con Google en la UI

Archivo: src/pages/LoginPage/LoginPage.jsx

Funciones relevantes

- handleGoogleLogin: dispara el flujo con Google.
- handleSocialLogin(provider, providerName): lógica común para Google, Facebook, GitHub.
- useEffect(getRedirectResult): procesa el resultado cuando se usó signInWithRedirect (típico en navegadores in-app o si popup fue bloqueado).

Resumen del flujo

A. Detección de entorno y fallback
- Se detecta si el navegador es in-app (FB/IG/WhatsApp/Messenger, etc.).
- Si es in-app, se usa signInWithRedirect (persistencia local), y el resultado se procesa en useEffect(getRedirectResult).
- Si no es in-app, se intenta signInWithPopup.
- Si signInWithPopup es bloqueado o falla con errores como auth/popup-blocked o auth/operation-not-supported-in-this-environment, se cae en fallback a signInWithRedirect.

B. Éxito de autenticación
- En signInWithPopup o en getRedirectResult, se obtiene el objeto user.
- Se registra la sesión con registerLogin(user, "Google").
- Se muestra un SweetAlert de bienvenida y se navega a /dashboard.

C. Errores manejados
- auth/popup-closed-by-user: se informa que el usuario cerró la ventana.
- auth/popup-blocked, auth/cancelled-popup-request, auth/operation-not-supported-in-this-environment, auth/internal-error: se intenta fallback a signInWithRedirect.
- auth/account-exists-with-different-credential: se delega a handleAccountLinking(error, provider, providerName) para manejar la vinculación de cuentas (si aplica en tu flujo actual).

UI y experiencia

- En móvil/in-app se deshabilitan los botones sociales según flags calculados (isInApp, storageIssue) y se muestra un aviso indicando abrir en el navegador del sistema si es necesario.
- Se usan SweetAlert2 para feedback de éxito/errores.

4) Registro de sesión

Archivo: src/utils/sessionManager.js

- La función registerLogin(user, providerName) registra el inicio de sesión (métrica/bitácora interna del proyecto). Este proyecto ya la utiliza en LoginPage.jsx después de un login exitoso.

5) Pruebas recomendadas

Local (http://localhost:3000):
- Caso 1 (popup): Desde Chrome/Firefox/Edge, clic en "Google".
  - Esperado: se abre popup, login exitoso, alerta de éxito y redirección a /dashboard.
- Caso 2 (redirect): Desde un WebView/in-app (o si el popup se bloquea), clic en "Google".
  - Esperado: la app redirige a Google, tras volver a la app useEffect(getRedirectResult) procesa la sesión.
- Caso 3 (errores):
  - popup-closed → alerta informativa.
  - popup-blocked → fallback a redirect y, si falla, alerta con instrucciones.

Producción:
- Agregar el dominio productivo en Firebase Authentication → Authorized domains.
- Verificar que el proveedor de Google esté habilitado en el proyecto de producción.

6) Solución de problemas (FAQ)

- El botón no hace nada en apps como Facebook/Instagram:
  - Es normal que los WebViews bloqueen popups. Este proyecto detecta in-app y usa redirect automáticamente; si el entorno impide almacenamiento de sesión, se muestra un aviso para abrir en el navegador del sistema.

- Veo auth/operation-not-supported-in-this-environment:
  - Ocurre en entornos que no soportan popups (WebView). El código intenta fallback a signInWithRedirect.

- No se guarda la sesión tras el redirect:
  - Asegúrate de tener initializeAuth con persistencias configuradas (IndexedDB/Local/Session) y popupRedirectResolver.
  - Verifica que no tengas bloqueado el almacenamiento en el navegador.

- Error auth/account-exists-with-different-credential:
  - Indica que el correo ya existe con otro método. Según tu versión actual, se llama a handleAccountLinking para resolver la vinculación, o se informa al usuario cómo proceder.

7) Dónde tocar el código si necesitas cambios

- Cambiar comportamiento de fallback (popup → redirect): src/pages/LoginPage/LoginPage.jsx, dentro de handleSocialLogin y los useEffect relacionados.
- Ajustar persistencia: src/firebase.js (initializeAuth).
- Ajustar mensajes UI: SweetAlert en LoginPage.jsx.
- Habilitar/deshabilitar proveedores: botones y handlers en LoginPage.jsx y los providers en src/firebase.js.

8) Comandos útiles

- Instalar dependencias: npm install
- Arrancar proyecto: npm run dev 

9) Conclusión

Con esta configuración, el inicio de sesión con Google funciona de forma robusta tanto en navegadores de escritorio (popup) como en entornos móviles/in-app (redirect), con manejo de persistencia y mensajes claros para el usuario. Si cambias de dominio o despliegas a producción, no olvides agregar el dominio en Firebase Authentication y mantener habilitado el proveedor de Google.
