
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Convierte una imagen o PDF a base64
 */
function fileToGenerativePart(path, mimeType) {
    return {
        inlineData: {
            data: Buffer.from(fs.readFileSync(path)).toString('base64'),
            mimeType
        }
    };
}

/**
 * @param {string} filePath - Ruta del archivo (imagen o PDF)
 * @param {string} mimeType - Tipo MIME del archivo
 * @returns {Promise<Array>} - Array de objetos JSON con los datos extraídos
 */
async function processTableImage(filePath, mimeType = 'image/jpeg') {
    try {
        const fileType = mimeType.includes('pdf') ? 'PDF' : 'imagen';
        console.log(`Procesando ${fileType} con Gemini Vision...`);

        // Usar Gemini 2.0 Flash Lite (o otro modelo si es necesario)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

        // Preparar el archivo (imagen o PDF)
        const filePart = fileToGenerativePart(filePath, mimeType);

        // Prompt para Gemini
        const currentDate = new Date().toISOString();
        
        const prompt = `
Analiza esta tabla de datos mineros y extrae TODA la información en formato JSON.

FECHA ACTUAL: ${currentDate}

IMPORTANTE: 
- Extrae TODAS las filas de la tabla
- Para cada fila, crea un objeto JSON con esta estructura EXACTA:

{
    "_id": "genera un ID único tipo MongoDB (24 caracteres hexadecimales)",
    "frontLabor": "valor de la columna 'Reserva (tn)' o identificador similar",
    "date": "fecha en formato ISO (2025-11-21T00:00:00.000Z)",
    "startDate": "${currentDate}",
    "dateString": "fecha en formato YYYY-MM-DD",
    "phase": "mineral",
    "tonnage": número de toneladas (convierte a número entero),
    "volquetes": [],
    "firma_volquetes": [],
    "state": "active",
    "shift": "noche",
    "type": "blending",
    "accept": [],
    "day": día del mes (número),
    "month": mes (número),
    "year": 2025,
    "__v": 0,
    "createdAt": "${currentDate}",
    "updatedAt": "${currentDate}"
}

REGLAS:
1. Extrae el "frontLabor" de las columnas que contienen códigos como "1910_OB6_TJ-650"
2. El "tonnage" debe ser el número de toneladas (busca columnas como TOTAL, Reserva, etc.)
3. USA LA FECHA ACTUAL (${currentDate}) para startDate, createdAt y updatedAt
4. Si encuentras valores en blanco o vacíos, usa valores por defecto
5. Devuelve SOLO el array JSON, sin explicaciones adicionales
6. Asegúrate de que sea un JSON válido

Responde ÚNICAMENTE con el array JSON, nada más.
`;

        // Hacer la petición a Gemini
        const result = await model.generateContent([prompt, filePart]);
        const response = await result.response;
        const text = response.text();

        console.log('📄 Respuesta de Gemini recibida');

        // Limpiar la respuesta (remover markdown si existe)
        let jsonText = text.trim();
        
        // Remover bloques de código markdown si existen
        if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        }

        // Parsear el JSON
        const data = JSON.parse(jsonText);

        console.log(`Extraídos ${data.length} registros`);
        
        return data;

    } catch (error) {
        console.error('Error al procesar imagen:', error);
        throw new Error(`Error al procesar la imagen: ${error.message}`);
    }
}

module.exports = { processTableImage };
