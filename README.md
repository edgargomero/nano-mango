# 🍌 Nano Banana - AI Outfit Transfer

Aplicación web de transferencia de outfits usando Google GenAI Imagen que te permite transferir la ropa de una imagen de referencia a tu foto personal directamente desde el navegador.

## Características

- ✨ Transferencia inteligente de outfits usando IA
- 🎯 Preserva tu identidad facial y pose original
- 🎨 Genera múltiples variaciones del resultado
- 🌐 Interfaz web moderna y fácil de usar
- 🔐 Usa tu propia API Key (sin configuración de servidor)
- 📱 Responsive design para móvil y desktop
- 🔥 Utiliza el modelo Imagen 3 de Google

## Instalación

1. Clona o descarga este proyecto
2. Instala las dependencias:
```bash
npm install
```

## Uso

### Aplicación Web (Recomendado)

1. Inicia el servidor:
```bash
npm start
```

2. Abre tu navegador en `http://localhost:3000`

3. Ingresa tu API Key de Google AI Studio

4. Sube tu foto y la imagen del outfit que quieres transferir

5. ¡Haz clic en "Transferir Outfit" y espera los resultados!

### Línea de Comandos (CLI)

```bash
npm run cli <tu_foto> <imagen_outfit> [nombre_resultado]
```

#### Ejemplos CLI
```bash
# Uso básico
npm run cli mi_foto.jpg outfit_elegante.jpg

# Con nombre personalizado
npm run cli selfie.png vestido_fiesta.jpg look_fiesta
```

## Obtener API Key

1. Ve a [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Inicia sesión con tu cuenta de Google
3. Crea una nueva API key
4. ¡Úsala directamente en la aplicación web!

## Formatos Soportados

- **Imágenes de entrada**: JPG, JPEG, PNG, WebP
- **Imágenes de salida**: PNG (alta calidad, 2K)

## Consejos para Mejores Resultados

- Usa fotos con buena iluminación y resolución
- La imagen de outfit debe mostrar claramente la ropa
- Evita poses muy complejas o ángulos extremos
- Las imágenes frontales o de 3/4 funcionan mejor
- Asegúrate de que ambas imágenes tengan buena calidad

## Estructura del Proyecto

```
nano-mango/
├── public/           # Frontend web
│   ├── index.html   # Página principal
│   ├── style.css    # Estilos
│   └── script.js    # JavaScript del frontend
├── server.js        # Servidor Express
├── index.js         # CLI application
├── package.json     # Dependencias del proyecto
├── .env.example     # Plantilla de configuración
└── README.md        # Este archivo
```

## Desarrollo

```bash
# Servidor con recarga automática
npm run dev

# Solo CLI
npm run cli
```

## Troubleshooting

- **Error de API Key**: Verifica que tu API Key sea correcta y esté activa
- **Error de cuota**: Revisa tu límite en Google AI Studio
- **Imágenes muy grandes**: Reduce el tamaño de las imágenes si hay problemas de carga
- **Resultados no esperados**: Intenta con imágenes de mejor calidad o diferentes ángulos