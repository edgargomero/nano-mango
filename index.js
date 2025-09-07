import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import * as path from "node:path";

class NanoBanana {
  constructor(apiKey) {
    this.ai = new GoogleGenAI({
      apiKey: apiKey || process.env.GOOGLE_AI_API_KEY
    });
  }

  // Convert image file to base64
  imageToBase64(imagePath) {
    const imageBuffer = fs.readFileSync(imagePath);
    return imageBuffer.toString('base64');
  }

  // Get MIME type from file extension
  getMimeType(imagePath) {
    const ext = path.extname(imagePath).toLowerCase();
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.png':
        return 'image/png';
      case '.webp':
        return 'image/webp';
      default:
        return 'image/jpeg';
    }
  }

  // Create detailed prompt for outfit transfer
  createOutfitTransferPrompt(userImagePath, outfitImagePath) {
    return `Analiza la imagen de referencia del outfit y transfiere ese mismo estilo de ropa a la persona en la imagen principal. Mantén exactamente la misma cara, pose, cuerpo y características físicas de la persona original. Solo cambia la ropa para que coincida exactamente con el outfit de la imagen de referencia.

Requisitos específicos:
- Preservar completamente la identidad, pose y expresión de la persona original
- Copiar fielmente el estilo, colores, patrones y detalles del outfit de referencia
- Mantener la iluminación y calidad fotográfica profesional
- Evitar cualquier deformidad o artefacto digital
- Resultado final debe ser fotorrealista y natural

La transformación debe ser precisa y mantener la coherencia visual.`;
  }

  // Transfer outfit from reference image to user photo
  async transferOutfit(userImagePath, outfitImagePath, outputPath = 'resultado') {
    try {
      console.log('🎨 Iniciando transferencia de outfit...');
      
      // Validate input files
      if (!fs.existsSync(userImagePath)) {
        throw new Error(`Imagen de usuario no encontrada: ${userImagePath}`);
      }
      if (!fs.existsSync(outfitImagePath)) {
        throw new Error(`Imagen de outfit no encontrada: ${outfitImagePath}`);
      }

      // Convert images to base64
      const userImageBase64 = this.imageToBase64(userImagePath);
      const outfitImageBase64 = this.imageToBase64(outfitImagePath);

      // Create the prompt
      const prompt = this.createOutfitTransferPrompt(userImagePath, outfitImagePath);

      console.log('📸 Procesando imágenes con IA...');

      // Generate image with outfit transfer
      const response = await this.ai.models.generateImages({
        model: 'imagen-3.0-generate-002', // Using Imagen 3 for better results
        prompt: prompt,
        config: {
          numberOfImages: 2,
          sampleImageSize: '2K',
          aspectRatio: '1:1'
        },
        // Include both images as context
        images: [
          {
            inline_data: {
              mime_type: this.getMimeType(userImagePath),
              data: userImageBase64
            }
          },
          {
            inline_data: {
              mime_type: this.getMimeType(outfitImagePath),
              data: outfitImageBase64
            }
          }
        ]
      });

      // Save generated images
      let savedFiles = [];
      for (let i = 0; i < response.generatedImages.length; i++) {
        const filename = `${outputPath}_${i + 1}.png`;
        const imageBytes = response.generatedImages[i].image.imageBytes;
        const buffer = Buffer.from(imageBytes, "base64");
        
        fs.writeFileSync(filename, buffer);
        savedFiles.push(filename);
        console.log(`✅ Imagen guardada: ${filename}`);
      }

      console.log(`🎉 Transferencia completada! ${savedFiles.length} imágenes generadas`);
      return savedFiles;

    } catch (error) {
      console.error('❌ Error en transferencia de outfit:', error.message);
      throw error;
    }
  }
}

// Example usage
async function main() {
  // Initialize the app
  const nanoBanana = new NanoBanana();

  // Check if image paths are provided as arguments
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log(`
🍌 Nano Banana - AI Outfit Transfer

Uso: node index.js <imagen_usuario> <imagen_outfit> [nombre_salida]

Ejemplos:
  node index.js mi_foto.jpg outfit_referencia.jpg
  node index.js usuario.png style.jpg resultado_final

Asegúrate de tener configurada la variable GOOGLE_AI_API_KEY
    `);
    return;
  }

  const userImage = args[0];
  const outfitImage = args[1];
  const outputName = args[2] || 'outfit_transfer';

  try {
    await nanoBanana.transferOutfit(userImage, outfitImage, outputName);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default NanoBanana;