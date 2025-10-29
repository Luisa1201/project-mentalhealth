# Sistema de Cierre Automático de Sesión por Inactividad

## 📋 Descripción

El sistema detecta cuando un usuario no ha interactuado con la aplicación durante un período determinado y cierra automáticamente su sesión para proteger la seguridad y privacidad.

## ⚙️ Configuración Actual

- **Tiempo de inactividad**: 30 minutos (1,800,000 ms)
- **Advertencia previa**: 25 minutos (1,500,000 ms)
- **Tiempo para reaccionar**: 5 minutos entre advertencia y cierre

## 🔍 Eventos Detectados

El sistema detecta las siguientes interacciones del usuario:
- Movimientos del mouse (`mousedown`, `mousemove`)
- Pulsaciones de teclado (`keypress`)
- Scroll en la página
- Toques en pantalla táctil (`touchstart`)
- Clics en cualquier parte de la aplicación

## 🚀 Funcionamiento

1. **Usuario activo**: Cada vez que el usuario interactúa, los timers se resetean
2. **25 minutos sin actividad**: Aparece una advertencia con un contador regresivo
3. **Usuario puede continuar**: Si hace clic en "Continuar activo" o interactúa, la sesión permanece abierta
4. **30 minutos sin actividad**: La sesión se cierra automáticamente y el usuario es redirigido al login

## 📍 Páginas Protegidas

El hook `useInactivityLogout` está implementado en:
- ✅ Dashboard
- ✅ Estudiantes
- ✅ Psicoorientadores
- ✅ Servicios
- ✅ Historial de Sesiones

## 🔧 Personalización

Para modificar los tiempos, edita los valores en cada página:

```javascript
// Tiempo personalizado (ejemplo: 15 minutos)
useInactivityLogout(
  15 * 60 * 1000,  // Tiempo total de inactividad
  12 * 60 * 1000   // Tiempo para mostrar advertencia
);
```

## 📝 Registro de Sesiones

Cuando se cierra la sesión por inactividad:
1. Se actualiza el registro en Firestore con `logoutTime` y `isActive: false`
2. Se cierra la sesión de Firebase Auth
3. Se limpia el localStorage
4. Se redirige al usuario al login

## 🔐 Beneficios de Seguridad

- ✅ Previene acceso no autorizado en equipos compartidos
- ✅ Protege datos sensibles de estudiantes y psicoorientadores
- ✅ Cumple con mejores prácticas de seguridad
- ✅ Permite auditoría de sesiones en el historial

## 🛠️ Archivos Relacionados

- `/src/utils/useInactivityLogout.js` - Hook principal
- `/src/utils/sessionManager.js` - Gestión de sesiones en Firestore
- Cada página protegida importa y usa el hook
