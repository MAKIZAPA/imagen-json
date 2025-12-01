# Aplicación de Subida de Archivos

Aplicación web simple para subir archivos (PDF, imágenes, documentos) con interfaz HTML y servidor Node.js.

##  Instalación

```bash
npm install
```

##  Uso

1. **Inicia el servidor**:
   ```bash
   npm start
   ```

2. **Abre tu navegador** en:
   ```
   http://localhost:3000
   ```

3. **Sube archivos**:
   - Haz clic en el área de subida
   - O arrastra y suelta archivos directamente


- `index.html` - Interfaz web con drag & drop
- `server.js` - Servidor Express que recibe archivos
- `uploads/` - Carpeta donde se guardan los archivos subidos

## Tipos de archivos soportados

- Imágenes: `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`
- Documentos: `.pdf`, `.doc`, `.docx`
- Cualquier archivo (límite: 10MB)

##  Configuración

En `server.js` puedes modificar:
- `PORT`: Puerto del servidor (default: 3000)
- `fileSize`: Tamaño máximo de archivo (default: 10MB)
