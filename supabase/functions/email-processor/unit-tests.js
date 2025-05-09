// Testes unitários simples para a Edge Function email-processor
// Execute com: node unit-tests.js

// Funções a serem testadas
function validarEmailParams(params) {
  const { to, subject, text } = params;
  const erros = [];
  
  if (!to) erros.push("Destinatário (to) é obrigatório");
  if (!subject) erros.push("Assunto (subject) é obrigatório");
  if (!text) erros.push("Conteúdo (text) é obrigatório");
  
  if (to && !to.includes('@')) erros.push("Destinatário inválido");
  
  return erros.length === 0 ? { valido: true } : { valido: false, erros };
}

function formatarEmail(params) {
  const { to, subject, text, html } = params;
  return {
    to,
    subject: subject.trim(),
    content: text.trim(),
    html: html || `<p>${text.replace(/\n/g, '<br>')}</p>`
  };
}

function calcularProximaTentativa(tentativaAtual) {
  // Implementa backoff exponencial: 5min, 15min, 45min, etc.
  if (tentativaAtual <= 0) return 5 * 60 * 1000; // 5 minutos
  return Math.min(
    24 * 60 * 60 * 1000, // máximo 24h
    5 * 60 * 1000 * Math.pow(3, tentativaAtual - 1)
  );
}

// Framework de testes simples
let passados = 0;
let falhas = 0;

function assertEquals(esperado, atual, mensagem) {
  const passouTeste = JSON.stringify(esperado) === JSON.stringify(atual);
  
  if (passouTeste) {
    console.log(`✅ Passou: ${mensagem}`);
    passados++;
  } else {
    console.log(`❌ Falhou: ${mensagem}`);
    console.log(`   Esperado: ${JSON.stringify(esperado)}`);
    console.log(`   Recebido: ${JSON.stringify(atual)}`);
    falhas++;
  }
  
  return passouTeste;
}

// Testes para validação de parâmetros
console.log('\n🧪 Testes de validação de parâmetros do email');

assertEquals(
  { valido: true },
  validarEmailParams({
    to: 'destinatario@exemplo.com',
    subject: 'Teste',
    text: 'Conteúdo do email'
  }),
  'Deve validar parâmetros corretos'
);

assertEquals(
  { valido: false, erros: ['Destinatário (to) é obrigatório'] },
  validarEmailParams({
    subject: 'Teste',
    text: 'Conteúdo do email'
  }),
  'Deve detectar falta de destinatário'
);

assertEquals(
  { valido: false, erros: ['Destinatário inválido'] },
  validarEmailParams({
    to: 'destinatarioInvalido',
    subject: 'Teste',
    text: 'Conteúdo do email'
  }),
  'Deve validar formato de email'
);

// Testes para formatação de email
console.log('\n🧪 Testes de formatação de email');

assertEquals(
  {
    to: 'destinatario@exemplo.com',
    subject: 'Teste',
    content: 'Conteúdo do email',
    html: '<p>Conteúdo do email</p>'
  },
  formatarEmail({
    to: 'destinatario@exemplo.com',
    subject: 'Teste ',
    text: ' Conteúdo do email '
  }),
  'Deve formatar email corretamente e gerar HTML'
);

assertEquals(
  {
    to: 'destinatario@exemplo.com',
    subject: 'Teste',
    content: 'Linha 1\nLinha 2',
    html: '<div>HTML personalizado</div>'
  },
  formatarEmail({
    to: 'destinatario@exemplo.com',
    subject: 'Teste',
    text: 'Linha 1\nLinha 2',
    html: '<div>HTML personalizado</div>'
  }),
  'Deve usar o HTML fornecido quando disponível'
);

// Testes para cálculo de próxima tentativa
console.log('\n🧪 Testes de cálculo de próxima tentativa');

assertEquals(
  5 * 60 * 1000, // 5 minutos
  calcularProximaTentativa(0),
  'Deve retornar 5 minutos para primeira tentativa'
);

assertEquals(
  15 * 60 * 1000, // 15 minutos
  calcularProximaTentativa(1),
  'Deve retornar 15 minutos para segunda tentativa'
);

assertEquals(
  45 * 60 * 1000, // 45 minutos
  calcularProximaTentativa(2),
  'Deve retornar 45 minutos para terceira tentativa'
);

assertEquals(
  24 * 60 * 60 * 1000, // 24 horas (valor máximo)
  calcularProximaTentativa(10),
  'Deve respeitar o limite máximo de 24 horas'
);

// Resumo
console.log('\n==================================================');
console.log(`🧮 Resumo dos testes: ${passados} passaram, ${falhas} falharam`);
console.log('==================================================');

// Retorna código de erro se algum teste falhou
if (falhas > 0) {
  process.exit(1);
} 