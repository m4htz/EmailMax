# CLAUDE.md

Este arquivo fornece orientações para o Claude Code (claude.ai/code) ao trabalhar com código neste repositório.

## Comunicação
- Sempre responder em português brasileiro
- Mostrar o processo de pensamento em tempo real com exemplos de código
- Explicar detalhadamente as alterações e decisões tomadas

## Ferramentas
- Utilizar o MCP Context7 para encontrar documentação quando necessário

## Comandos Principais
- `npm run dev`: Iniciar o servidor de desenvolvimento Next.js
- `npm run build`: Construir o projeto para produção
- `npm run start`: Iniciar o servidor de produção
- `npm run lint`: Executar o linter ESLint
- `npm run test`: Executar todos os testes com Jest
- `npm run test:watch`: Executar testes em modo watch
- `npm run test:coverage`: Executar testes com relatório de cobertura
- `npm run validator:start`: Iniciar o microserviço de validação IMAP/SMTP via Docker
- `npm run validator:start-python`: Iniciar o microserviço via Python diretamente
- `npm run dev:with-validator`: Iniciar Next.js com o microserviço Docker
- `npm run dev:with-python-validator`: Iniciar Next.js com o microserviço Python

## Executando Testes Individuais
- Teste único: `npm test -- -t 'nome do teste'`
- Arquivo específico: `npm test -- path/to/test/file.test.ts`
- Conjunto de testes: `npm test -- -t 'nome do conjunto'`

## Arquitetura do Projeto

### Frontend (Next.js)
- Aplicação Next.js 14 com App Router
- Autenticação via Supabase Auth
- Interface construída com React, TailwindCSS e componentes Radix UI
- Estado gerenciado com Zustand

### Backend
- Supabase para banco de dados PostgreSQL e autenticação
- Microserviço Python para validação de conexões IMAP/SMTP

### Fluxo de Dados
1. Autenticação via Supabase Auth
2. Gerenciamento de contas de email com validação IMAP/SMTP
3. Planos de aquecimento para email (warmup plans)
4. Métricas e análise de desempenho

## Componentes Principais
- **Auth**: Autenticação e controle de acesso
- **Dashboard**: Visualização e gerenciamento de dados
- **EmailAccounts**: Gerenciamento de contas de email
- **Warmup**: Sistema de aquecimento de contas de email

## Microserviço de Validação IMAP/SMTP
Este projeto utiliza um microserviço Python separado para validação de conexões de email, pois as Edge Functions do Supabase têm limitações com portas IMAP/SMTP.

### Configuração do Microserviço
1. Criar/atualizar arquivo `.env.local` com:
   ```
   NEXT_PUBLIC_EMAIL_VALIDATION_SERVICE_URL=http://localhost:5000
   EMAIL_VALIDATION_API_KEY=dev_key_change_me_in_production
   USE_EDGE_FUNCTIONS=false
   ```

2. Iniciar o microserviço antes de usar a aplicação:
   ```
   npm run validator:start
   ```

## Banco de Dados (Supabase)
- Tabelas principais: `email_accounts`, `warmup_plans`, `warmup_metrics`
- Migrações em `/supabase/migrations/`
- Esquema com Row Level Security habilitado

## Estilo de Código
- Usar sintaxe de módulos ES (import/export), não CommonJS (require)
- Desestruturar importações quando possível
- Seguir convenções de TypeScript para tipagem
- Utilizar hooks e componentes funcionais no React

## Fluxo de Trabalho Recomendado
1. Iniciar o microserviço de validação: `npm run validator:start`
2. Iniciar o servidor de desenvolvimento: `npm run dev`
3. Executar o linter e typechecker após alterações: `npm run lint`
4. Executar testes relacionados à área modificada