# 🚀 Deployment Setup - Nano Banana

## GitHub Repository
**URL**: https://github.com/edgargomero/nano-mango

## Cloudflare Pages
- **Project Name**: nano-banana
- **Production URL**: https://nano-banana-eq6.pages.dev
- **Latest Deployment**: https://48ce80ba.nano-banana-eq6.pages.dev

## CI/CD Pipeline Status

### ✅ Completed Setup
- [x] Git repository initialized
- [x] GitHub repository created
- [x] Code pushed to GitHub
- [x] Cloudflare Pages project created
- [x] Initial deployment successful
- [x] GitHub Actions workflow configured

### 🔧 Required Configuration

Para completar el CI/CD automático, necesitas configurar estos secretos en GitHub:

#### 1. GitHub Repository Secrets
Ve a: `https://github.com/edgargomero/nano-mango/settings/secrets/actions`

Agrega estos secretos:

**CLOUDFLARE_API_TOKEN**
```bash
# Obtener en: https://dash.cloudflare.com/profile/api-tokens
# Permisos necesarios:
# - Account: Cloudflare Pages:Edit
# - Zone: Page Rules:Edit
# - Zone: Zone:Read
```

**CLOUDFLARE_ACCOUNT_ID**
```bash
# Obtener en: https://dash.cloudflare.com
# Panel derecho → Account ID
```

#### 2. Verificar Token de Cloudflare
```bash
# Test API token locally:
curl -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
     -H "Authorization: Bearer YOUR_API_TOKEN" \
     -H "Content-Type: application/json"
```

## Automatic Deployment Workflow

### Push to `main` branch:
1. **Trigger**: Code pushed to main
2. **Build**: `npm ci && npm run build`  
3. **Deploy**: Upload `dist/` to Cloudflare Pages
4. **Result**: Live at production URL

### Pull Request workflow:
1. **Trigger**: PR opened/updated
2. **Build**: Same as production
3. **Deploy**: Preview deployment created
4. **Result**: Preview URL in PR comments

## Manual Deployment Commands

```bash
# Local build and deploy
npm run build
npx wrangler pages deploy dist --project-name=nano-banana

# Check deployment status
npx wrangler pages deployment list --project-name=nano-banana

# View logs
npx wrangler pages deployment tail --project-name=nano-banana
```

## Build Configuration

**Build Command**: `npm run build`
**Build Output**: `dist/` 
**Node Version**: 18.x
**Install Command**: `npm ci`

## Environment Variables

⚠️ **No environment variables required** - API keys are provided by users through the web interface.

## Domain Configuration

Para configurar un dominio personalizado:

```bash
# Add custom domain
npx wrangler pages project domain add nano-banana your-domain.com

# List domains  
npx wrangler pages project domain list nano-banana
```

## Monitoring

- **Cloudflare Dashboard**: https://dash.cloudflare.com → Pages → nano-banana
- **Analytics**: Traffic, requests, errors disponibles en el dashboard
- **Real-time logs**: `npx wrangler pages deployment tail`
- **GitHub Actions**: https://github.com/edgargomero/nano-mango/actions

## Next Steps

1. Configurar secretos de GitHub (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID)
2. Hacer un push o PR para probar el CI/CD automático
3. Configurar dominio personalizado si es necesario
4. Monitorear deployment metrics