# Nano Banana - Despliegue en Cloudflare Pages

## 🚀 Configuración de Despliegue

Este proyecto está preparado para desplegarse en **Cloudflare Pages** con **Cloudflare Functions** para la API.

### Estructura del Proyecto

```
nano-mango/
├── functions/              # Cloudflare Functions (serverless API)
│   └── api/
│       ├── transfer-outfit.js  # Endpoint principal de IA
│       └── health.js           # Health check
├── public/                 # Frontend estático
│   ├── index.html
│   ├── script.js
│   └── style.css
├── dist/                   # Build output (generado)
├── wrangler.toml          # Configuración Cloudflare
├── _headers               # Headers HTTP personalizados
└── package.json
```

## 📋 Pasos de Despliegue

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Construir el Proyecto

```bash
npm run build
```

### 3. Vista Previa Local (Opcional)

```bash
npm run preview
```

### 4. Desplegar en Cloudflare Pages

#### Opción A: Desde el Dashboard de Cloudflare

1. Ve a [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navega a **Pages** > **Create a project**
3. Conecta tu repositorio Git
4. Configura:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node.js version**: `18.x` o superior

#### Opción B: Con Wrangler CLI

```bash
# Instalar Wrangler globalmente
npm install -g wrangler

# Autenticarse
wrangler login

# Desplegar
wrangler pages deploy dist --project-name=nano-banana
```

### 5. Variables de Entorno

⚠️ **Importante**: Este proyecto usa API keys del lado del cliente, por lo que **NO necesita variables de entorno** en Cloudflare.

Los usuarios proporcionan sus propias Google AI Studio API keys a través de la interfaz web.

## 🔧 Configuración Técnica

### Cloudflare Functions

- **Runtime**: Node.js ES Modules
- **Timeout**: 60 segundos (suficiente para IA)
- **Memory**: 128MB (ajustable según necesidad)

### Headers de Seguridad

Configurados en `_headers`:
- CORS habilitado para API endpoints
- CSP (Content Security Policy)
- X-Frame-Options, X-Content-Type-Options
- Referrer-Policy

### Limitaciones de Cloudflare Pages

- **Request body limit**: 100MB (suficiente para imágenes base64)
- **Response limit**: 25MB
- **Execution time**: 60 segundos máximo
- **Cold start**: ~50-200ms

## 🧪 Testing

### Local con Wrangler

```bash
npm run preview
# Accede a http://localhost:8788
```

### Endpoints de API

- **POST** `/api/transfer-outfit` - Transferencia de outfit con IA
- **GET** `/api/health` - Health check del servicio

### Payload de Ejemplo

```json
{
  "apiKey": "YOUR_GOOGLE_AI_STUDIO_KEY",
  "userImage": {
    "data": "base64_image_data",
    "mimeType": "image/jpeg"
  },
  "outfitImage": {
    "data": "base64_image_data", 
    "mimeType": "image/png"
  }
}
```

## 📊 Monitoreo y Logs

Una vez desplegado, puedes monitorear:

1. **Cloudflare Dashboard** > **Pages** > tu proyecto
2. **Functions** tab para ver logs en tiempo real
3. **Analytics** para métricas de uso
4. **Custom domains** para configurar tu dominio

## 🔒 Seguridad

- ✅ API keys manejadas del lado del cliente
- ✅ Headers de seguridad configurados
- ✅ CORS configurado apropiadamente
- ✅ No almacenamiento de datos sensibles
- ✅ Validación de entrada en Functions

## 💡 Optimizaciones

- **CDN Global**: Cloudflare distribuye automáticamente
- **Caching**: Assets estáticos cacheados globalmente
- **Compresión**: Gzip/Brotli automático
- **HTTP/3**: Habilitado por defecto

## 🆘 Troubleshooting

### Error: "Module not found"
- Verifica que `@google/genai` esté en `dependencies`
- Asegúrate de usar Node.js 18+ en build settings

### Error: "Request timeout"
- Google AI puede tardar. Timeout configurado en 60s
- Verifica que las imágenes no sean excesivamente grandes

### Error: "Invalid API key" 
- El usuario debe proporcionar una API key válida de Google AI Studio
- Verificar permisos de la API key para Imagen model