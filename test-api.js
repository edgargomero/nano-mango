import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

async function testOutfitTransfer() {
    console.log('🧪 Testing Nano Banana API...');
    
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
        console.error('❌ GOOGLE_AI_API_KEY not found in .env');
        return;
    }

    console.log('🔑 API Key loaded:', apiKey.substring(0, 10) + '...');

    try {
        // Initialize Google AI
        const client = new GoogleGenAI({ apiKey: apiKey });

        // Test prompt
        const prompt = `Create a professional fashion photo. Take the outfit/clothing from the second image and let the person from the first image wear it. Generate a realistic, full-body shot of the person wearing the new outfit, maintaining their original facial features, pose, and body characteristics. Preserve the person's identity completely while only changing their clothing to match the reference outfit exactly.

Requirements:
- Maintain the person's face, pose, and body structure from the first image
- Copy the clothing style, colors, patterns, and details from the second image  
- Keep professional lighting and photographic quality
- Avoid any deformities or digital artifacts
- Result should be photorealistic and natural
- Ensure the clothing fits naturally on the person's body`;

        // Test with simple text first
        console.log('📝 Testing basic model access...');
        
        const config = {
            responseModalities: ['TEXT'],
            temperature: 0.7,
            maxOutputTokens: 1000,
        };

        const contents = [
            {
                role: 'user',
                parts: [
                    { text: 'Hello! Can you generate images? Just respond with yes or no.' }
                ],
            },
        ];

        const response = await client.models.generateContentStream({
            model: 'gemini-2.5-flash-image-preview',
            config,
            contents,
        });

        console.log('🚀 Streaming response...');
        let textOutput = '';
        
        for await (const chunk of response) {
            if (!chunk.candidates || !chunk.candidates[0]?.content?.parts) {
                continue;
            }

            // Check for text in chunks
            for (const part of chunk.candidates[0].content.parts) {
                if (part.text) {
                    textOutput += part.text;
                    process.stdout.write(part.text);
                }
            }
        }

        console.log('\\n✅ Test completed successfully!');
        console.log('📊 Full response:', textOutput);

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        // Check common error types
        if (error.message.includes('API key')) {
            console.log('🔍 Possible solutions:');
            console.log('1. Verify your API key is correct');
            console.log('2. Check if the API key has proper permissions');
            console.log('3. Ensure billing is enabled on your Google Cloud project');
        } else if (error.message.includes('quota')) {
            console.log('📊 Quota exceeded - wait a moment and try again');
        } else if (error.message.includes('model')) {
            console.log('🤖 Model access issue - check if gemini-2.5-flash-image-preview is available');
        }
    }
}

// Run the test
testOutfitTransfer();