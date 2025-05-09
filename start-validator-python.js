/**
 * Script para iniciar o microserviço de validação IMAP/SMTP usando Python diretamente
 * 
 * Use este script quando o Docker não estiver disponível
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Cores para saída no console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Diretório do microserviço
const validatorDir = path.join(__dirname, 'imap-smtp-validator');

/**
 * Verifica se o Python está instalado e disponível
 */
function checkPython() {
  console.log('Verificando instalação do Python...');
  
  // Comandos para tentar encontrar o Python
  const pythonCommands = ['python', 'python3', 'py'];
  
  for (const cmd of pythonCommands) {
    try {
      const pythonVersion = execSync(`${cmd} --version`, { encoding: 'utf8' });
      console.log(`${colors.green}✓ Python detectado:${colors.reset} ${pythonVersion.trim()}`);
      return cmd;
    } catch (error) {
      // Continuar tentando com o próximo comando
    }
  }
  
  console.error(`${colors.red}✗ Python não encontrado!${colors.reset}`);
  console.log(`
${colors.yellow}Você precisa instalar o Python para executar o microserviço de validação.${colors.reset}
Visite https://www.python.org/downloads/ para baixar e instalar.
Python 3.8 ou superior é recomendado.
`);
  return false;
}

/**
 * Verifica se o pip está instalado e disponível
 */
function checkPip(pythonCommand) {
  console.log('Verificando instalação do pip...');
  
  try {
    const pipVersion = execSync(`${pythonCommand} -m pip --version`, { encoding: 'utf8' });
    console.log(`${colors.green}✓ Pip detectado:${colors.reset} ${pipVersion.trim()}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}✗ Pip não encontrado!${colors.reset}`);
    console.log(`
${colors.yellow}Pip é necessário para instalar as dependências.${colors.reset}
Normalmente é instalado junto com o Python, mas você pode tentar instalá-lo com:
${pythonCommand} -m ensurepip
`);
    return false;
  }
}

/**
 * Verifica se o diretório do microserviço existe
 */
function checkValidatorDir() {
  console.log(`Verificando diretório do microserviço...`);
  
  if (fs.existsSync(validatorDir)) {
    const files = fs.readdirSync(validatorDir);
    
    // Verificar se os arquivos essenciais existem
    const essentialFiles = ['app.py', 'requirements.txt'];
    const missingFiles = essentialFiles.filter(file => !files.includes(file));
    
    if (missingFiles.length === 0) {
      console.log(`${colors.green}✓ Diretório do microserviço verificado:${colors.reset} ${validatorDir}`);
      return true;
    } else {
      console.error(`${colors.red}✗ Arquivos essenciais faltando: ${missingFiles.join(', ')}${colors.reset}`);
      return false;
    }
  } else {
    console.error(`${colors.red}✗ Diretório do microserviço não encontrado: ${validatorDir}${colors.reset}`);
    return false;
  }
}

/**
 * Instala as dependências usando pip
 */
function installDependencies(pythonCommand) {
  console.log(`${colors.blue}Instalando dependências do microserviço...${colors.reset}`);
  
  try {
    // Mudar para o diretório do validador
    process.chdir(validatorDir);
    
    // Instalar dependências
    execSync(`${pythonCommand} -m pip install -r requirements.txt`, { 
      encoding: 'utf8',
      stdio: 'inherit'
    });
    
    console.log(`${colors.green}✓ Dependências instaladas com sucesso!${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}✗ Erro ao instalar dependências:${colors.reset}`, error.message);
    return false;
  }
}

/**
 * Inicia o microserviço usando Python diretamente
 */
function startValidator(pythonCommand) {
  console.log(`${colors.blue}Iniciando microserviço de validação IMAP/SMTP...${colors.reset}`);
  
  // Caminho para o diretório do microserviço
  process.chdir(validatorDir);
  
  // Definir variáveis de ambiente
  const env = {
    ...process.env,
    FLASK_APP: 'app.py',
    API_KEY: 'dev_key_change_me_in_production'
  };
  
  // Comando para iniciar o servidor Flask
  console.log(`Executando: ${pythonCommand} app.py`);
  
  // Inicia o processo Python
  const validatorProcess = spawn(pythonCommand, ['app.py'], {
    env,
    stdio: 'inherit',
    shell: true
  });
  
  console.log(`
${colors.green}✓ Microserviço iniciando...${colors.reset}

${colors.cyan}Informações:${colors.reset}
- Serviço disponível em: ${colors.green}http://localhost:5000${colors.reset}
- API Key padrão: ${colors.yellow}dev_key_change_me_in_production${colors.reset}
- Endpoints principais:
  * ${colors.cyan}GET${colors.reset}  /api/status - Verifica status do serviço
  * ${colors.cyan}POST${colors.reset} /api/test-connection - Testa conexão IMAP/SMTP

${colors.yellow}Para parar o serviço:${colors.reset} 
Pressione Ctrl+C no terminal

${colors.blue}O serviço estará pronto quando você ver a mensagem "Running on http://localhost:5000"${colors.reset}
  `);
  
  // Manipular eventos do processo
  validatorProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error(`
${colors.red}✗ O microserviço foi encerrado com código ${code}.${colors.reset}

Verifique se:
1. As portas necessárias estão disponíveis (5000)
2. Todas as dependências foram instaladas corretamente
3. Não há outros erros nos logs acima
      `);
    }
  });
  
  // Encerrar o processo quando o Node for encerrado
  process.on('SIGINT', () => {
    console.log(`\n${colors.yellow}Encerrando o microserviço...${colors.reset}`);
    validatorProcess.kill('SIGINT');
    process.exit(0);
  });
}

/**
 * Função principal
 */
async function main() {
  console.log(`
${colors.cyan}==========================================${colors.reset}
${colors.cyan}  Iniciador do Microserviço de Validação ${colors.reset}
${colors.cyan}           IMAP/SMTP - EmailMax          ${colors.reset}
${colors.cyan}       (Versão direta com Python)        ${colors.reset}
${colors.cyan}==========================================${colors.reset}
  `);
  
  // Verificar requisitos
  const pythonCommand = checkPython();
  if (!pythonCommand) return;
  
  const pipInstalled = checkPip(pythonCommand);
  if (!pipInstalled) return;
  
  const validatorDirOk = checkValidatorDir();
  if (!validatorDirOk) return;
  
  // Instalar dependências
  const dependenciesInstalled = installDependencies(pythonCommand);
  if (!dependenciesInstalled) return;
  
  // Iniciar o microserviço
  startValidator(pythonCommand);
}

// Executar o script
main().catch(error => {
  console.error(`${colors.red}Erro inesperado:${colors.reset}`, error);
}); 