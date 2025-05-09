// Script para verificar variáveis de ambiente com dotenv
// Carrega as variáveis de .env.local diretamente

// Carregar dotenv para ler o arquivo .env.local
require('dotenv').config({ path: '.env.local' });

console.log('Verificando variáveis de ambiente do Supabase (via dotenv)...');
console.log('Conteúdo bruto do process.env:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_URL));
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY));
console.log('---');

// Verificar a URL do Supabase
if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.log('✅ NEXT_PUBLIC_SUPABASE_URL: DEFINIDO');
  console.log(`   Valor: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
  
  // Verificar se contém caracteres "<" ou ">"
  if (process.env.NEXT_PUBLIC_SUPABASE_URL.includes('<') || 
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes('>')) {
    console.log('⚠️ AVISO: A URL contém caracteres < ou > que podem causar problemas');
  }
} else {
  console.log('❌ NEXT_PUBLIC_SUPABASE_URL: NÃO DEFINIDO');
}

// Verificar a chave anônima do Supabase
if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.log('✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: DEFINIDO');
  console.log(`   Valor (primeiros 10 caracteres): ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 10)}...`);
  
  // Verificar se contém caracteres "<" ou ">"
  if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('<') || 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('>')) {
    console.log('⚠️ AVISO: A chave contém caracteres < ou > que podem causar problemas');
  }
} else {
  console.log('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY: NÃO DEFINIDO');
}

// Tentar construir uma URL com o valor para verificar se é válido
try {
  const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || '');
  console.log('✅ URL é válida e pode ser utilizada');
  console.log(`   Host: ${url.hostname}`);
} catch (error) {
  console.log('❌ URL inválida:', error.message);
}

console.log('\nDicas de solução:');
console.log('1. Verifique o arquivo .env.local');
console.log('2. Use nomes corretos: NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY');
console.log('3. Certifique-se de que não há símbolos < > nos valores');
console.log('4. Reinicie o servidor após alterar .env.local'); 