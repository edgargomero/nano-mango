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