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
        const client = new GoogleGenAI({ apiKey: apiKey });

        // Create detailed prompt for outfit transfer
        const prompt = `Create a professional fashion photo. Take the outfit/clothing from the second image and let the person from the first image wear it. Generate a realistic, full-body shot of the person wearing the new outfit, maintaining their original facial features, pose, and body characteristics. Preserve the person's identity completely while only changing their clothing to match the reference outfit exactly.

Requirements:
- Maintain the person's face, pose, and body structure from the first image
- Copy the clothing style, colors, patterns, and details from the second image  
- Keep professional lighting and photographic quality
- Avoid any deformities or digital artifacts
- Result should be photorealistic and natural
- Ensure the clothing fits naturally on the person's body`;

        console.log('📸 Procesando imágenes con IA...');

        // Convert base64 images to proper format for multi-modal input
        const userImageData = {
            mimeType: userImage.mimeType,
            data: userImage.data
        };

        const outfitImageData = {
            mimeType: outfitImage.mimeType,  
            data: outfitImage.data
        };

        // Generate images using Gemini 2.5 Flash Image with context images
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: [
                prompt,
                { inlineData: userImageData },
                { inlineData: outfitImageData }
            ],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 8192,
            }
        });

        // Extract generated images from response
        let generatedImages = [];
        if (response.response && response.response.candidates) {
            for (const candidate of response.response.candidates) {
                if (candidate.content && candidate.content.parts) {
                    for (const part of candidate.content.parts) {
                        if (part.inlineData && part.inlineData.data) {
                            generatedImages.push(part.inlineData.data);
                        }
                    }
                }
            }
        }

        // If no images found in response, try alternative extraction
        if (generatedImages.length === 0 && response.response) {
            console.log('Trying alternative image extraction...');
            // Add fallback extraction logic if needed
            const text = response.response.text();
            if (text && text.includes('base64')) {
                // Extract base64 data if present in text response
                const base64Match = text.match(/data:image\/[^;]+;base64,([^"]+)/);
                if (base64Match) {
                    generatedImages.push(base64Match[1]);
                }
            }
        }

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