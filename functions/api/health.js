export async function onRequestGet() {
    return new Response(JSON.stringify({
        success: true,
        message: 'Nano Banana server is running on Cloudflare Pages',
        timestamp: new Date().toISOString(),
        platform: 'Cloudflare Pages Functions'
    }), {
        status: 200,
        headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    });
}