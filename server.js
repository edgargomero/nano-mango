import { GoogleGenAI } from "@google/genai";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint for outfit transfer
app.post('/api/transfer-outfit', async (req, res) => {
    try {
        const { apiKey, userImage, outfitImage } = req.body;

        // Validate required fields
        if (!apiKey) {
            return res.status(400).json({
                success: false,
                error: 'API Key es requerida'
            });
        }

        if (!userImage || !userImage.data || !userImage.mimeType) {
            return res.status(400).json({
                success: false,
                error: 'Imagen de usuario es requerida'
            });
        }

        if (!outfitImage || !outfitImage.data || !outfitImage.mimeType) {
            return res.status(400).json({
                success: false,
                error: 'Imagen de outfit es requerida'
            });
        }

        console.log('🎨 Iniciando transferencia de outfit...');

        // Initialize Google AI with user's API key
        const ai = new GoogleGenAI({
            apiKey: apiKey
        });

        // Create detailed prompt for outfit transfer
        const prompt = `Analiza la imagen de referencia del outfit y transfiere ese mismo estilo de ropa a la persona en la imagen principal. Mantén exactamente la misma cara, pose, cuerpo y características físicas de la persona original. Solo cambia la ropa para que coincida exactamente con el outfit de la imagen de referencia.

Requisitos específicos:
- Preservar completamente la identidad, pose y expresión de la persona original
- Copiar fielmente el estilo, colores, patrones y detalles del outfit de referencia
- Mantener la iluminación y calidad fotográfica profesional
- Evitar cualquier deformidad o artefacto digital
- Resultado final debe ser fotorrealista y natural

La transformación debe ser precisa y mantener la coherencia visual.`;

        console.log('📸 Procesando imágenes con IA...');

        // Generate images with outfit transfer
        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: prompt,
            config: {
                numberOfImages: 2,
                sampleImageSize: '2K',
                aspectRatio: '1:1'
            }
        });

        // Extract generated images
        const generatedImages = response.generatedImages.map(img => img.image.imageBytes);

        console.log(`✅ Transferencia completada! ${generatedImages.length} imágenes generadas`);

        res.json({
            success: true,
            images: generatedImages,
            count: generatedImages.length
        });

    } catch (error) {
        console.error('❌ Error en transferencia de outfit:', error);
        
        let errorMessage = 'Error interno del servidor';
        
        if (error.message.includes('API key')) {
            errorMessage = 'API Key inválida. Verifica tu clave de Google AI Studio';
        } else if (error.message.includes('quota')) {
            errorMessage = 'Cuota de API excedida. Revisa tu límite en Google AI Studio';
        } else if (error.message.includes('permission')) {
            errorMessage = 'Permisos insuficientes. Verifica la configuración de tu API Key';
        } else if (error.message.includes('rate')) {
            errorMessage = 'Demasiadas solicitudes. Espera un momento antes de intentar nuevamente';
        } else if (error.message.includes('model')) {
            errorMessage = 'Modelo no disponible. Intenta nuevamente más tarde';
        }

        res.status(500).json({
            success: false,
            error: errorMessage
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Nano Banana server is running',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint no encontrado'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🍌 Nano Banana server running at http://localhost:${PORT}`);
    console.log(`📱 Open your browser and navigate to the URL above`);
    console.log(`🚀 Ready to transfer outfits with AI!`);
});

export default app;