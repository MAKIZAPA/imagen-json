// server.js - Servidor para convertir imágenes de tablas a JSON usando Gemini Vision

require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { processTableImage } = require('./geminiPrompt');

const app = express();
const PORT = 3000;

// Verificar que existe la API key
if (!process.env.GEMINI_API_KEY) {
    console.error('ERROR: No se encontró GEMINI_API_KEY en el archivo .env');
    console.error('Crea un archivo .env y agrega: GEMINI_API_KEY=tu_api_key');
    process.exit(1);
}

// carpeta 'uploads' 
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // Límite de 10MB
    },
    fileFilter: (req, file, cb) => {
       
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes (PNG, JPG, JPEG) o archivos PDF'));
        }
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); 

// Ruta para subir y procesar imágenes
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se recibió ningún archivo' });
        }

        const fileType = req.file.mimetype === 'application/pdf' ? 'PDF' : 'Imagen';
        console.log(`📄 ${fileType} recibido:`, req.file.originalname);
        console.log('   Tamaño:', (req.file.size / 1024).toFixed(2), 'KB');

        const jsonData = await processTableImage(req.file.path, req.file.mimetype);

        console.log(' Procesamiento completado\n');

        // Devolver el JSON generado
        res.json({
            success: true,
            message: 'Imagen procesada correctamente',
            filename: req.file.filename,
            originalname: req.file.originalname,
            recordsExtracted: jsonData.length,
            data: jsonData
        });

    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ 
            error: 'Error al procesar la imagen',
            details: error.message 
        });
    }
});


app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'El archivo es demasiado grande (máx. 10MB)' });
        }
        return res.status(400).json({ error: error.message });
    }
    if (error.message) {
        return res.status(400).json({ error: error.message });
    }
    next(error);
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(' Servidor iniciado correctamente');
    console.log(` URL: http://localhost:${PORT}`);
    console.log(`Gemini Vision API: Configurada`);
    console.log(`Archivos se guardarán en: ${uploadsDir}`);
    console.log('\nAbre http://localhost:3000 en tu navegador\n');
});

