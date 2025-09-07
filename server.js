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
    const startTime = Date.now();
    console.log(`🚀 [${new Date().toISOString()}] Outfit transfer request started`);
    
    try {
        console.log('📥 Request body structure:', {
            hasApiKey: !!req.body.apiKey,
            hasUserImage: !!req.body.userImage,
            hasOutfitImage: !!req.body.outfitImage,
            userImageSize: req.body.userImage?.data?.length || 0,
            outfitImageSize: req.body.outfitImage?.data?.length || 0
        });
        
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

        // Generate images using streaming API with proper configuration
        const config = {
            responseModalities: ['IMAGE', 'TEXT'],
            temperature: 0.7,
            maxOutputTokens: 8192,
        };

        const contents = [
            {
                role: 'user',
                parts: [
                    { text: prompt },
                    { inlineData: userImageData },
                    { inlineData: outfitImageData }
                ],
            },
        ];

        const response = await client.models.generateContentStream({
            model: 'gemini-2.5-flash-image-preview',
            config,
            contents,
        });

        // Extract generated images from streaming response
        let generatedImages = [];
        let textOutput = '';
        
        for await (const chunk of response) {
            if (!chunk.candidates || !chunk.candidates[0]?.content?.parts) {
                continue;
            }

            // Check for image data in chunks
            for (const part of chunk.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    generatedImages.push(part.inlineData.data);
                    console.log('📸 Image extracted from stream');
                } else if (part.text) {
                    textOutput += part.text;
                }
            }
        }

        console.log('🔍 Stream processing completed');
        console.log('📊 Text output:', textOutput.substring(0, 100) + '...');
        console.log('🖼️ Images extracted:', generatedImages.length);

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