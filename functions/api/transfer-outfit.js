export async function onRequestPost(context) {
    try {
        const { request } = context;
        
        // Parse request body
        const body = await request.json();
        const { apiKey, userImage, outfitImage } = body;

        // Validate required fields
        if (!apiKey) {
            return new Response(JSON.stringify({
                success: false,
                error: 'API Key es requerida'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (!userImage || !userImage.data || !userImage.mimeType) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Imagen de usuario es requerida'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (!outfitImage || !outfitImage.data || !outfitImage.mimeType) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Imagen de outfit es requerida'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        console.log('🎨 Iniciando transferencia de outfit...');

        // Initialize Google AI with user's API key
        const { GoogleGenAI } = await import("@google/genai");
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

        return new Response(JSON.stringify({
            success: true,
            images: generatedImages,
            count: generatedImages.length
        }), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
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

        return new Response(JSON.stringify({
            success: false,
            error: errorMessage
        }), {
            status: 500,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

// Handle preflight OPTIONS requests
export async function onRequestOptions() {
    return new Response(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400'
        }
    });
}