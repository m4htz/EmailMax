#!/bin/bash
# Script para implantação da Edge Function email-processor

echo "====================================================="
echo "Implantando Edge Function: email-processor"
echo "====================================================="

# Verificando se a Supabase CLI está instalada
if ! command -v supabase &> /dev/null
then
    echo "❌ Erro: Supabase CLI não está instalado"
    echo "📌 Instale com: npm install -g supabase"
    exit 1
fi

echo "🔍 Verificando estrutura do projeto..."

# Verificando se os arquivos necessários existem
if [ ! -f "index.ts" ]; then
    echo "❌ Erro: Arquivo index.ts não encontrado"
    exit 1
fi

if [ ! -f "config.json" ]; then
    echo "❌ Erro: Arquivo config.json não encontrado"
    exit 1
fi

echo "✅ Estrutura do projeto verificada"
echo "🔄 Iniciando o deploy da função..."

# Executa o comando de deploy
supabase functions deploy email-processor

if [ $? -eq 0 ]; then
    echo "✅ Deploy concluído com sucesso!"
    echo "🔗 A função agora está disponível em:"
    echo "   https://[seu-projeto].supabase.co/functions/v1/email-processor"
    echo ""
    echo "📝 Para testar a função, consulte o arquivo TESTES.md"
else
    echo "❌ Erro durante o deploy"
    echo "📌 Verifique os logs para mais detalhes"
    exit 1
fi

echo "====================================================="
echo "Deploy concluído!"
echo "====================================================="

# Pergunta se deseja verificar os logs
read -p "Deseja verificar os logs da função? (s/n): " verificar_logs

if [[ $verificar_logs == "s" || $verificar_logs == "S" ]]; then
    echo "🔍 Exibindo logs da função..."
    supabase functions logs email-processor
fi

exit 0 