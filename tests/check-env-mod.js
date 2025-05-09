// Script para verificar se as variáveis de ambiente estão definidas e 
// mostrar os valores existentes

console.log('Verificando variáveis de ambiente do Supabase...');

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

console.log('\nDicas de solução:');
console.log('1. Verifique o arquivo .env.local');
console.log('2. Use nomes corretos: NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY');
console.log('3. Certifique-se de que não há símbolos < > nos valores');
console.log('4. Reinicie o servidor após alterar .env.local'); 