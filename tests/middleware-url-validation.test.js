// Teste para validar o formato das URLs usadas no middleware
// Este teste verifica se a URL do Supabase está em formato válido

// Importar URL para validação
const { URL } = require('url');

describe('Validação de URL do Supabase no middleware', () => {
  test('NEXT_PUBLIC_SUPABASE_URL deve ser uma URL válida', () => {
    // Verificar se a variável está definida
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    console.log(`URL para teste: ${supabaseUrl}`);
    
    // Verificar se a URL não contém os símbolos < e >
    expect(supabaseUrl).toBeDefined();
    expect(supabaseUrl).not.toContain('<');
    expect(supabaseUrl).not.toContain('>');
    
    // Verificar se a URL é válida tentando criar um objeto URL
    expect(() => {
      new URL(supabaseUrl);
    }).not.toThrow();
  });
  
  test('URL do Supabase no .env.local deve apontar para um domínio supabase.co', () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    expect(supabaseUrl).toBeDefined();
    
    if (supabaseUrl) {
      const url = new URL(supabaseUrl);
      expect(url.hostname).toContain('supabase.co');
    }
  });
}); 