// Importar bibliotecas necessárias
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';

// Interface para a requisição
interface RefreshTokenRequest {
  refreshToken: string;
  provider: string;
  email: string;
}

// Interface para resposta de token
interface TokenResponse {
  accessToken: string;
  newRefreshToken?: string;
  expiresAt: number;
}

// URLs de renovação de token para diferentes provedores
const OAUTH_REFRESH_URLS: Record<string, string> = {
  gmail: 'https://oauth2.googleapis.com/token',
  outlook: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  yahoo: 'https://api.login.yahoo.com/oauth2/get_token',
  zoho: 'https://accounts.zoho.com/oauth/v2/token',
  // Adicione outros provedores conforme necessário
};

// Configurações de cliente OAuth para diferentes provedores
const OAUTH_CLIENTS: Record<string, { clientId: string; clientSecret: string }> = {
  gmail: {
    clientId: Deno.env.get('GMAIL_OAUTH_CLIENT_ID') || '',
    clientSecret: Deno.env.get('GMAIL_OAUTH_CLIENT_SECRET') || '',
  },
  outlook: {
    clientId: Deno.env.get('OUTLOOK_OAUTH_CLIENT_ID') || '',
    clientSecret: Deno.env.get('OUTLOOK_OAUTH_CLIENT_SECRET') || '',
  },
  yahoo: {
    clientId: Deno.env.get('YAHOO_OAUTH_CLIENT_ID') || '',
    clientSecret: Deno.env.get('YAHOO_OAUTH_CLIENT_SECRET') || '',
  },
  zoho: {
    clientId: Deno.env.get('ZOHO_OAUTH_CLIENT_ID') || '',
    clientSecret: Deno.env.get('ZOHO_OAUTH_CLIENT_SECRET') || '',
  },
  // Adicione outros provedores conforme necessário
};

// Função para renovar um token OAuth usando o refresh token
async function refreshOAuthToken(request: RefreshTokenRequest): Promise<TokenResponse> {
  const { refreshToken, provider, email } = request;
  
  // Verificar se o provedor é suportado
  if (!OAUTH_REFRESH_URLS[provider] || !OAUTH_CLIENTS[provider]) {
    throw new Error(`Provedor OAuth não suportado: ${provider}`);
  }
  
  const clientId = OAUTH_CLIENTS[provider].clientId;
  const clientSecret = OAUTH_CLIENTS[provider].clientSecret;
  
  if (!clientId || !clientSecret) {
    throw new Error(`Credenciais OAuth não configuradas para o provedor: ${provider}`);
  }
  
  // Preparar os parâmetros para a solicitação de renovação de token
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });
  
  // Fazer a solicitação para a API do provedor
  const response = await fetch(OAUTH_REFRESH_URLS[provider], {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });
  
  if (!response.ok) {
    const errorData = await response.text();
    console.error(`Erro ao renovar token OAuth para ${email}:`, errorData);
    throw new Error(`Erro ao renovar token OAuth: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // Calcular quando o token expira
  const expiresIn = data.expires_in || 3600; // Padrão: 1 hora
  const expiresAt = Date.now() + expiresIn * 1000;
  
  return {
    accessToken: data.access_token,
    // Alguns provedores retornam um novo refresh token, outros mantêm o mesmo
    newRefreshToken: data.refresh_token,
    expiresAt,
  };
}

// Função principal que processa as requisições HTTP
serve(async (req) => {
  // Lidar com preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Verificar método
    if (req.method !== 'POST') {
      throw new Error('Método não permitido. Use POST.');
    }
    
    // Obter dados da requisição
    const requestData = await req.json() as RefreshTokenRequest;
    
    // Validar dados
    if (!requestData.refreshToken || !requestData.provider || !requestData.email) {
      throw new Error('Todos os campos são obrigatórios: refreshToken, provider, email');
    }
    
    // Renovar o token
    const result = await refreshOAuthToken(requestData);
    
    // Retornar resultado
    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    // Lidar com erros
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return new Response(
      JSON.stringify({
        success: false,
        message: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
}); 