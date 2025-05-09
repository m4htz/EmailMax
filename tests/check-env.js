// Script para verificar se as variáveis de ambiente estão definidas

console.log('Verificando variáveis de ambiente do Supabase...');

// Verificar a URL do Supabase
if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.log('✅ NEXT_PUBLIC_SUPABASE_URL: DEFINIDO');
} else {
  console.log('❌ NEXT_PUBLIC_SUPABASE_URL: NÃO DEFINIDO');
}

// Verificar a chave anônima do Supabase
if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.log('✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: DEFINIDO');
} else {
  console.log('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY: NÃO DEFINIDO');
}

console.log('\nDicas de solução:');
console.log('1. Verifique o arquivo .env.local');
console.log('2. Use nomes corretos: NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY');
console.log('3. Reinicie o servidor após alterar .env.local'); 