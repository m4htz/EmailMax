/**
 * Script para iniciar o microserviço de validação IMAP/SMTP
 * 
 * Este script facilita a inicialização do microserviço Python
 * verificando requisitos e fornecendo feedback ao usuário.
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
 * Verifica se o Docker está instalado e disponível
 */
function checkDocker() {
  console.log('Verificando instalação do Docker...');
  
  try {
    const dockerVersion = execSync('docker --version', { encoding: 'utf8' });
    console.log(`${colors.green}✓ Docker detectado:${colors.reset} ${dockerVersion.trim()}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}✗ Docker não encontrado!${colors.reset}`);
    console.log(`
${colors.yellow}Você precisa instalar o Docker para executar o microserviço de validação.${colors.reset}
Visite https://www.docker.com/products/docker-desktop/ para baixar e instalar.
`);
    return false;
  }
}

/**
 * Verifica se o Docker Compose está instalado e disponível
 */
function checkDockerCompose() {
  console.log('Verificando Docker Compose...');
  
  try {
    // Tente primeiro o comando padrão mais recente
    const dockerComposeVersion = execSync('docker compose version', { encoding: 'utf8' });
    console.log(`${colors.green}✓ Docker Compose detectado:${colors.reset} ${dockerComposeVersion.trim()}`);
    return 'docker compose';
  } catch (error) {
    try {
      // Tente o comando legado
      const legacyVersion = execSync('docker-compose --version', { encoding: 'utf8' });
      console.log(`${colors.green}✓ Docker Compose (legado) detectado:${colors.reset} ${legacyVersion.trim()}`);
      return 'docker-compose';
    } catch (err) {
      console.error(`${colors.red}✗ Docker Compose não encontrado!${colors.reset}`);
      console.log(`
${colors.yellow}Docker Compose é necessário e normalmente vem instalado com o Docker Desktop.${colors.reset}
Se você instalou o Docker sem o Compose, consulte a documentação para instalar o Compose.
`);
      return false;
    }
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
    const essentialFiles = ['app.py', 'docker-compose.yml', 'Dockerfile', 'requirements.txt'];
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
 * Inicia o microserviço usando Docker Compose
 */
function startValidator(composeCommand) {
  console.log(`${colors.blue}Iniciando microserviço de validação IMAP/SMTP...${colors.reset}`);
  
  // Caminho para o diretório do microserviço e comando a executar
  const command = composeCommand.split(' ')[0];
  const args = [...composeCommand.split(' ').slice(1), 'up', '-d'];
  
  process.chdir(validatorDir);
  
  console.log(`Executando: ${command} ${args.join(' ')}`);
  
  // Inicia o processo Docker Compose
  const process = spawn(command, args, {
    stdio: 'inherit',
    shell: true
  });
  
  process.on('exit', (code) => {
    if (code === 0) {
      console.log(`
${colors.green}✓ Microserviço iniciado com sucesso!${colors.reset}

${colors.cyan}Informações:${colors.reset}
- Serviço disponível em: ${colors.green}http://localhost:5000${colors.reset}
- API Key padrão: ${colors.yellow}dev_key_change_me_in_production${colors.reset}
- Endpoints principais:
  * ${colors.cyan}GET${colors.reset}  /api/status - Verifica status do serviço
  * ${colors.cyan}POST${colors.reset} /api/test-connection - Testa conexão IMAP/SMTP

${colors.yellow}Para parar o serviço:${colors.reset} 
cd imap-smtp-validator && ${composeCommand} down

${colors.blue}O serviço agora está pronto para validar conexões de email!${colors.reset}
`);
    } else {
      console.error(`
${colors.red}✗ Falha ao iniciar o microserviço (código ${code}).${colors.reset}

Verifique se:
1. As portas necessárias estão disponíveis (5000)
2. Você tem permissões suficientes para executar containers Docker
3. Não há outros erros nos logs acima

${colors.yellow}Tente executar manualmente:${colors.reset}
cd imap-smtp-validator && ${composeCommand} up
`);
    }
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
${colors.cyan}==========================================${colors.reset}
  `);
  
  // Verificar requisitos
  const dockerInstalled = checkDocker();
  if (!dockerInstalled) return;
  
  const composeCommand = checkDockerCompose();
  if (!composeCommand) return;
  
  const validatorDirOk = checkValidatorDir();
  if (!validatorDirOk) return;
  
  // Iniciar o microserviço
  startValidator(composeCommand);
}

// Executar o script
main().catch(error => {
  console.error(`${colors.red}Erro inesperado:${colors.reset}`, error);
}); 