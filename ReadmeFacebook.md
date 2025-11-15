# Autenticación con Facebook en el proyecto

Este documento describe cómo está implementado el proveedor de **autenticación con Facebook** en este proyecto: configuración en Facebook Developers, en Firebase y el flujo de vinculación dentro de la aplicación.

## Índice

1. Requisitos previos  
2. Configuración en Facebook (Facebook Developers)  
3. Configuración en Firebase Console  
4. Configuración del Auth en el código  
5. Flujo de vinculación de cuenta con Facebook  
6. Manejo de errores y casos especiales  
7. Pruebas recomendadas  
8. Dónde tocar el código  
9. Conclusión

## 1) Requisitos previos

- Proyecto React funcionando (este repositorio).
- Proyecto Firebase creado y configurado.
- Proveedor **Facebook** habilitado en Firebase Authentication.
- Una app de Facebook creada en [Meta for Developers](https://developers.facebook.com/).

---

## 2) Configuración en Facebook (Facebook Developers)

1. Ve a **Meta for Developers** → **My Apps** → crea una app o usa una existente.
2. Agrega el producto **Facebook Login**.
3. En **Settings → Basic**:
   - Configura el **App Domain** (por ejemplo, `localhost` y el dominio de producción).
   - Configura la **Privacy Policy URL** y demás campos requeridos.
4. En **Facebook Login → Settings**:
   - En **Valid OAuth Redirect URIs** agrega las URLs de tu app, por ejemplo:
     - `http://localhost:5173/` (o el puerto de tu Vite dev server).
     - La URL de producción.
5. Copia el **App ID** y **App Secret** (se usan en Firebase, no directamente en este código).

---


## 3) Configuración en Firebase Console

1. Ve a **Firebase Console** → **Authentication** → **Sign-in method**.
2. Habilita el proveedor **Facebook**.
3. Pega el **App ID** y el **App Secret** de la app de Facebook.
4. En **Authorized domains**, agrega los dominios que vas a usar:
   - `localhost`
   - `127.0.0.1`
   - Dominio de producción.
5. Guarda los cambios.

---

## 4) Configuración del Auth en el código

### Archivo: `src/firebase.js`

En este proyecto ya está configurado el proveedor de Facebook:

```js
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

const FacebookProvider = new FacebookAuthProvider();

export { auth, FacebookProvider };
```

**Puntos clave:**

- Se usa `initializeAuth` para definir persistencias y `popupRedirectResolver` desde el inicio.
- `FacebookProvider` es la instancia que se utiliza para iniciar sesión o vincular cuentas con Facebook.

---

## 5) Flujo de vinculación de cuenta con Facebook en la UI

En este proyecto, Facebook se usa principalmente para **vincular** el proveedor a una cuenta ya autenticada (multi‑proveedor) desde el `Header`.

### Archivo: `src/Components/Header.jsx`

Funciones relevantes:

- `handleLinkAccount("facebook")`: vincula la cuenta actual con Facebook.
- Uso de `FacebookProvider` y `FacebookAuthProvider` (`FBP`) de Firebase.
- Manejo de popup vs redirect según el navegador / entorno.
- Manejo de errores de cuentas ya existentes (`auth/account-exists-with-different-credential`, etc.).

### Resumen del flujo de vinculación

1. **Selección del proveedor**

   En el header hay un botón con el ícono de Facebook.  
   Si el usuario ya inició sesión y aún no tiene Facebook vinculado:

   ```jsx
   onClick={() => !linked.facebook && handleLinkAccount("facebook")}
   ```

2. **Construcción del proveedor y chequeo previo**

   En `handleLinkAccount`:

   ```js
   case "facebook":
     provider = FacebookProvider;
     providerId = "facebook.com";
     break;
   ```

   - Se obtienen los métodos de inicio de sesión existentes para el correo actual con:
     ```js
     const methods = await fetchSignInMethodsForEmail(auth, auth.currentUser.email);
     ```
   - Si el correo ya tiene Facebook habilitado, se muestra un mensaje informativo.

3. **Popup vs Redirect**

   El código detecta el entorno:

   ```js
   const ua = navigator.userAgent || "";
   const isIOS = /iPhone|iPad|iPod/i.test(ua);
   const isSafari = /Safari\//.test(ua) && !/Chrome\//.test(ua);
   const isInApp = /FBAN|FBAV|Instagram|Line|Twitter|LinkedIn|WhatsApp|Messenger/i.test(ua);
   ```

   - Si es **iOS**, **Safari** o un navegador **in-app**, se fuerza `linkWithRedirect`:
     ```js
     await setPersistence(auth, browserLocalPersistence);
     await linkWithRedirect(auth.currentUser, provider);
     ```
   - En navegadores normales de escritorio/móvil se usa `linkWithPopup`:
     ```js
     const result = await linkWithPopup(auth.currentUser, provider);
     ```

4. **Actualización de estado y Firestore**

   Al vincular correctamente:

   - Se recalculan los `providers` del usuario (`google.com`, `facebook.com`, etc.) y se actualiza el estado `linked`.
   - Se guarda/actualiza un documento en la colección `users` con:
     - `email`
     - `providers`
     - `createdAt` / `lastLinkedAt`
   - Se muestra un `Swal.fire("Cuenta vinculada correctamente!", "", "success")`.

---

## 6) Manejo de errores específicos de Facebook / multi‑proveedor

En `handleLinkAccount` se cubren varios casos:

- `auth/popup-closed-by-user`, `auth/cancelled-popup-request`  
  → Se ignoran, ya que el usuario cerró el popup.

- `auth/popup-blocked`  
  → Se intenta fallback a `linkWithRedirect`.  
    Si no es posible, se muestra un mensaje indicando habilitar popups.

- `auth/account-exists-with-different-credential` o  
  `auth/credential-already-in-use`  
  → Se trata de unificar cuentas:

  ```js
  if (providerType === "facebook") {
    pendingCred = FBP.credentialFromError(error);
  }
  ```

  Pasos generales:

  1. Si el usuario ya está autenticado, se intenta:
     ```js
     await linkWithCredential(auth.currentUser, pendingCred);
     ```
  2. Si no, se identifica el proveedor principal para ese correo (Google, Facebook, GitHub o password) con `fetchSignInMethodsForEmail`.
  3. Se inicia sesión con ese proveedor mediante `signInWithPopup`.
  4. Si el correo también usa contraseña (`password`), se pide la contraseña con SweetAlert y se vincula con `EmailAuthProvider.credential`.
  5. Finalmente se llama a `linkWithCredential` con la credencial pendiente de Facebook y se actualiza el estado `linked`.

- `auth/provider-already-linked`  
  → Se muestra `"Ya vinculado"`.

- Otros errores  
  → Se registran en consola y se muestra `"Error al vincular cuenta"` con el mensaje de Firebase.

---

## 7) Pruebas recomendadas

### Local (Vite dev server)

1. Inicia sesión con un usuario existente (correo/contraseña o Google).
2. En el header, haz clic en el icono de Facebook:
   - Caso normal (navegador desktop): se abre popup de Facebook, se completa el login y se vincula el proveedor.
   - Caso in-app / iOS / Safari: se redirige a Facebook (`linkWithRedirect`) y, al volver, `getRedirectResult` completa la vinculación.
3. Verifica en la UI:
   - El icono de Facebook aparece con estilo **activo**.
4. Verifica en Firestore:
   - En la colección `users`, el documento del usuario tiene `providers` incluyendo `"facebook.com"`.

---

## 8) Dónde tocar el código si necesitas cambios

- **Cambiar comportamiento de popup/redirect**  
  → `src/Components/Header.jsx`, dentro de `handleLinkAccount`.

- **Ajustar persistencias o proveedores disponibles**  
  → `src/firebase.js`.

- **Cambiar textos de mensajes al usuario**  
  → SweetAlert en `Header.jsx`.

---

## 9) Conclusión

Con esta configuración, el proveedor de **Facebook** funciona como un método adicional
que se puede **vincular** a la cuenta del usuario, permitiendo tener varios métodos
de acceso (correo, Google, GitHub, Facebook) bajo el mismo perfil.  
El código maneja entornos de popup/redirect, errores de multi‑proveedor y mantiene
sincronizados tanto la interfaz (estado `linked`) como los datos en Firestore.
