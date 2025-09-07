export async function onRequestPost(context) {
    const startTime = Date.now();
    console.log(`🚀 [${new Date().toISOString()}] Outfit transfer request started`);
    
    try {
        const { request } = context;
        console.log('📥 Request method:', request.method);
        console.log('📥 Request headers:', JSON.stringify([...request.headers.entries()]));
        
        // Parse request body with error handling
        let body;
        try {
            body = await request.json();
            console.log('📦 Request body parsed successfully');
            console.log('📊 Body structure:', {
                hasApiKey: !!body.apiKey,
                hasUserImage: !!body.userImage,
                hasOutfitImage: !!body.outfitImage,
                userImageSize: body.userImage?.data?.length || 0,
                outfitImageSize: body.outfitImage?.data?.length || 0
            });
        } catch (parseError) {
            console.error('❌ JSON parse error:', parseError.message);
            return new Response(JSON.stringify({
                success: false,
                error: 'Invalid JSON in request body',
                details: parseError.message
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
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
        console.log('🔑 API Key validation:', {
            keyLength: apiKey.length,
            keyPrefix: apiKey.substring(0, 10),
            keyFormat: apiKey.startsWith('AIza') ? 'Valid format' : 'Invalid format'
        });

        // Initialize Google AI with user's API key
        let client;
        try {
            const { GoogleGenAI } = await import("@google/genai");
            client = new GoogleGenAI({ apiKey: apiKey });
            console.log('✅ GoogleGenAI client initialized successfully');
        } catch (importError) {
            console.error('❌ Failed to import or initialize GoogleGenAI:', importError.message);
            return new Response(JSON.stringify({
                success: false,
                error: 'Failed to initialize AI client',
                details: importError.message
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

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

        console.log('📤 Preparing API request:', {
            model: 'gemini-2.5-flash-image-preview',
            configKeys: Object.keys(config),
            contentParts: contents[0].parts.length,
            promptLength: prompt.length,
            userImageType: userImageData.mimeType,
            outfitImageType: outfitImageData.mimeType
        });

        let response;
        const modelsToTry = [
            'gemini-2.5-flash-image-preview',
            'gemini-2.0-flash-image',
            'gemini-2.5-flash'
        ];

        let lastError = null;
        for (let i = 0; i < modelsToTry.length; i++) {
            const modelName = modelsToTry[i];
            try {
                console.log(`🌐 Attempting API call with model: ${modelName}...`);
                
                // Adjust config based on model
                let adjustedConfig = { ...config };
                if (modelName === 'gemini-2.5-flash') {
                    // Text-only model fallback
                    adjustedConfig = {
                        temperature: 0.7,
                        maxOutputTokens: 1000,
                    };
                    // Modify contents to be text-only for fallback
                    const fallbackContents = [
                        {
                            role: 'user',
                            parts: [
                                { text: 'I need to transfer clothing from one image to another person. Please provide step-by-step instructions for this task using AI image generation.' }
                            ],
                        },
                    ];
                    response = await client.models.generateContentStream({
                        model: modelName,
                        config: adjustedConfig,
                        contents: fallbackContents,
                    });
                } else {
                    response = await client.models.generateContentStream({
                        model: modelName,
                        config: adjustedConfig,
                        contents,
                    });
                }
                
                console.log(`✅ API call successful with ${modelName}, starting stream processing`);
                break; // Success, exit the loop
                
            } catch (modelError) {
                console.error(`❌ Model ${modelName} failed:`, modelError.message);
                lastError = modelError;
                
                if (i === modelsToTry.length - 1) {
                    // Last model attempt failed
                    throw modelError;
                }
                
                console.log(`🔄 Trying next model...`);
                continue;
            }
        }

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

        const processingTime = Date.now() - startTime;
        console.log(`⏱️ Total processing time: ${processingTime}ms`);

        if (generatedImages.length === 0) {
            console.warn('⚠️ No images were generated in the response');
            return new Response(JSON.stringify({
                success: false,
                error: 'No se generaron imágenes',
                details: 'El modelo no devolvió imágenes. Posible problema con el prompt o las imágenes de entrada.',
                textOutput: textOutput,
                processingTime: processingTime
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        console.log(`✅ Transferencia completada! ${generatedImages.length} imágenes generadas en ${processingTime}ms`);

        return new Response(JSON.stringify({
            success: true,
            images: generatedImages,
            count: generatedImages.length,
            processingTime: processingTime,
            textOutput: textOutput.length > 0 ? textOutput : null
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
        const processingTime = Date.now() - startTime;
        console.error('❌ Critical error in outfit transfer:', error);
        console.error('🔍 Error stack:', error.stack);
        console.error('⏱️ Failed after:', processingTime + 'ms');
        
        let errorMessage = 'Error interno del servidor';
        let statusCode = 500;
        
        if (error.message.includes('API key')) {
            errorMessage = 'API Key inválida. Verifica tu clave de Google AI Studio';
            statusCode = 401;
        } else if (error.message.includes('quota')) {
            errorMessage = 'Cuota de API excedida. Revisa tu límite en Google AI Studio';
            statusCode = 429;
        } else if (error.message.includes('permission')) {
            errorMessage = 'Permisos insuficientes. Verifica la configuración de tu API Key';
            statusCode = 403;
        } else if (error.message.includes('rate')) {
            errorMessage = 'Demasiadas solicitudes. Espera un momento antes de intentar nuevamente';
            statusCode = 429;
        } else if (error.message.includes('model')) {
            errorMessage = 'Modelo no disponible. Intenta nuevamente más tarde';
            statusCode = 503;
        } else if (error.message.includes('network')) {
            errorMessage = 'Error de conexión. Verifica tu conexión a internet';
            statusCode = 503;
        } else if (error.message.includes('timeout')) {
            errorMessage = 'Tiempo de espera agotado. La generación tomó demasiado tiempo';
            statusCode = 408;
        }

        return new Response(JSON.stringify({
            success: false,
            error: errorMessage,
            details: error.message,
            processingTime: processingTime,
            timestamp: new Date().toISOString(),
            errorType: error.constructor.name
        }), {
            status: statusCode,
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