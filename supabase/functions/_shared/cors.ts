// Definição de cabeçalhos CORS para ser compartilhada entre todas as Edge Functions
// Configuração mais permissiva para desenvolvimento, em produção seria melhor restringir as origens

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Em produção, limitar para o domínio da aplicação
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client, range',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400', // Cache preflight por 24 horas
  'Access-Control-Allow-Credentials': 'true',
}; 