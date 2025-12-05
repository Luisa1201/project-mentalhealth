# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

# Dependencias o paquetes
* 😊 npm install firebase
* 😂 npm install react-firebase-hooks
* 😉 npm install boostrap
* npm list react-router-dom
* npm install sweetalert2
* npm install react-icons
* npm install -g firebase-tools  // instalar la herramienta oficial de firebase para poder trabajar con firebase hosting y otros servicios.
* firebase --version //Revisar la versión de firebase

# Comandos para lograr el despliegue

1. **Iniciar sesión en Firebase**
   ```bash
   firebase login
   ```
   - Abre una ventana del navegador para autenticarte con tu cuenta de Google
   - Necesitas permisos de administrador en el proyecto de Firebase

2. **Construir la aplicación para producción**
   ```bash
   npm run build
   ```
   - Crea una versión optimizada de la aplicación en la carpeta `build/`
   - Minifica archivos JavaScript y CSS
   - Optimiza los assets para producción

3. **Eliminar la carpeta build existente (opcional, para limpiar versiones anteriores)**
   ```bash
   rm -rf build
   ```
   - Elimina la carpeta de compilación anterior
   - Útil para evitar conflictos con builds anteriores

4. **Inicializar Firebase (solo primera vez)**
   ```bash
   firebase init
   ```
   - Configura las opciones de despliegue de Firebase
   - Selecciona las características necesarias (Hosting, Firestore, etc.)
   - Especifica la carpeta de despliegue (generalmente `build` o `public`)

5. **Desplegar la aplicación**
   ```bash
   firebase deploy
   ```
   - Sube los archivos a Firebase Hosting
   - Muestra la URL de producción una vez completado
   - Las actualizaciones pueden tardar unos minutos en estar disponibles

6. **Comandos rápidos para actualizaciones posteriores**
   ```bash
   npm run build && firebase deploy
   ```
   - Construye y despliega en un solo paso
   - Útil después de hacer cambios en el código