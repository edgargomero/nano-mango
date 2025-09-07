import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Create simple test images as base64
function createTestImageBase64() {
    // A simple 1x1 pixel PNG in base64 (red pixel)
    const redPixelPNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    return {
        data: redPixelPNG,
        mimeType: 'image/png'
    };
}

async function testImageGeneration() {
    console.log('🧪 Testing Image Generation API...');
    
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
        console.error('❌ GOOGLE_AI_API_KEY not found in .env');
        return;
    }

    console.log('🔑 API Key:', apiKey.substring(0, 10) + '...');

    try {
        const client = new GoogleGenAI({ apiKey: apiKey });
        
        // Test different models
        const modelsToTest = [
            'gemini-2.5-flash-image-preview',
            'gemini-2.0-flash-image', 
            'gemini-2.5-flash'
        ];

        for (const modelName of modelsToTest) {
            console.log(`\\n🤖 Testing model: ${modelName}`);
            
            try {
                let config, contents;
                
                if (modelName === 'gemini-2.5-flash') {
                    // Text-only model
                    config = {
                        temperature: 0.7,
                        maxOutputTokens: 1000,
                    };
                    contents = [
                        {
                            role: 'user',
                            parts: [
                                { text: 'Hello! Can you help with image generation tasks?' }
                            ],
                        },
                    ];
                } else {
                    // Image generation models
                    config = {
                        responseModalities: ['IMAGE', 'TEXT'],
                        temperature: 0.7,
                        maxOutputTokens: 8192,
                    };
                    
                    const testImage = createTestImageBase64();
                    contents = [
                        {
                            role: 'user',
                            parts: [
                                { text: 'Describe this image and create a simple variation of it.' },
                                { inlineData: testImage }
                            ],
                        },
                    ];
                }

                console.log('📤 Making API call...');
                const response = await client.models.generateContentStream({
                    model: modelName,
                    config,
                    contents,
                });

                console.log('✅ API call successful, processing stream...');
                
                let textOutput = '';
                let imageCount = 0;
                
                for await (const chunk of response) {
                    if (!chunk.candidates || !chunk.candidates[0]?.content?.parts) {
                        continue;
                    }

                    for (const part of chunk.candidates[0].content.parts) {
                        if (part.inlineData && part.inlineData.data) {
                            imageCount++;
                            console.log('🖼️ Image chunk received');
                        } else if (part.text) {
                            textOutput += part.text;
                            process.stdout.write(part.text);
                        }
                    }
                }
                
                console.log(`\\n✅ Model ${modelName} SUCCESS!`);
                console.log(`📊 Text length: ${textOutput.length}`);
                console.log(`🖼️ Images generated: ${imageCount}`);
                
            } catch (modelError) {
                console.error(`❌ Model ${modelName} FAILED:`, modelError.message);
                console.error('🔍 Error details:', {
                    message: modelError.message,
                    status: modelError.status || 'N/A',
                    code: modelError.code || 'N/A'
                });
            }
        }

    } catch (error) {
        console.error('❌ Critical test failure:', error.message);
        console.error('🔍 Full error:', error);
    }
}

// Run the test
testImageGeneration();