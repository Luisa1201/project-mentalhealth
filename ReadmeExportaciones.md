# Guía de Exportación de Datos

## Tabla de Contenidos
- [Módulos Disponibles](#módulos-disponibles)
- [Características](#características)
  - [Exportación a PDF](#exportación-a-pdf)
  - [Exportación a Excel](#exportación-a-excel)
- [Instrucciones de Uso](#instrucciones-de-uso)
- [Requisitos del Sistema](#requisitos-del-sistema)
- [Solución de Problemas](#solución-de-problemas)

## Módulos Disponibles

La funcionalidad de exportación está disponible en los siguientes módulos:

1. **Servicios**
   - Exporta información detallada de los servicios ofrecidos
   - Incluye: Nombre, descripción, duración, precio y estado

2. **Psicoorientadores**
   - Exporta datos del personal de psicoorientación
   - Incluye: Nombre, especialidad, correo, teléfono y disponibilidad

3. **Estudiantes**
   - Exporta información de los estudiantes
   - Incluye: Nombre, apellido, grado, contacto y datos del acudiente

## Características

### Exportación a PDF

- **Formato profesional** con encabezado y pie de página
- **Tablas organizadas** con diseño responsivo
- **Filtrado avanzado**:
  - Exportar todos los registros
  - Exportar solo los registros filtrados
- **Opciones de personalización**:
  - Título personalizado
  - Fecha y hora de generación
  - Paginación automática

### Exportación a Excel

- **Formato XLSX** compatible con Microsoft Excel, Google Sheets y otros
- **Características avanzadas**:
  - Filtros automáticos
  - Ancho de columnas ajustable
  - Formato de celdas optimizado
  - Soporte para caracteres especiales
- **Opciones de exportación**:
  - Todos los registros
  - Solo registros visibles (filtrados)

## Instrucciones de Uso

### Requisitos Previos
- Navegador web actualizado (Chrome, Firefox, Edge o Safari)
- Permisos de visualización en el módulo correspondiente

### Pasos para Exportar

1. **Navegar al módulo**
   - Accede al módulo del cual deseas exportar datos (Servicios, Psicoorientadores o Estudiantes)

2. **Filtrar datos (opcional)**
   - Utiliza la barra de búsqueda para encontrar registros específicos
   - Aplica filtros adicionales si están disponibles

3. **Seleccionar tipo de exportación**
   - En la barra de herramientas, localiza el menú desplegable de exportación
   - Selecciona:
     - "Exportar todos": Para todos los registros
     - "Exportar filtrados": Solo los registros que coinciden con los filtros actuales

4. **Generar el archivo**
   - Haz clic en el botón correspondiente:
     - 📄 **PDF**: Para generar un documento PDF
     - 📊 **Excel**: Para generar un archivo XLSX

5. **Guardar el archivo**
   - El navegador descargará automáticamente el archivo
   - El nombre del archivo seguirá el formato: `reporte_[modulo]_[fecha].ext`
     - Ejemplo: `reporte_estudiantes_2025-12-05.xlsx`

## Requisitos del Sistema

### Dependencias
- `jsPDF`: ^2.5.1
- `jspdf-autotable`: ^3.5.28
- `xlsx`: ^0.18.5

### Navegadores Compatibles
- Google Chrome (recomendado)
- Mozilla Firefox
- Microsoft Edge
- Safari (versiones recientes)

## Solución de Problemas

### Problemas Comunes

1. **El archivo no se descarga**
   - Verifica que el navegador no esté bloqueando las descargas
   - Intenta con otro navegador
   - Asegúrate de tener espacio suficiente en disco

2. **Formato incorrecto en Excel**
   - Los números pueden mostrarse como texto. Selecciona las celdas y cambia el formato a "Número"
   - Las fechas pueden requerir ajuste de formato en Excel

3. **Caracteres especiales no se muestran correctamente**
   - Asegúrate de que el archivo se guarde con codificación UTF-8
   - En Excel, verifica la configuración regional

### Soporte Técnico
Para problemas adicionales, por favor contacta al equipo de soporte técnico con la siguiente información:
- Módulo donde ocurre el problema
- Navegador y versión
- Pasos para reproducir el problema
- Captura de pantalla del error (si aplica)

---

*Última actualización: Diciembre 2025*
