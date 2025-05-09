# TASK.md - Sistema de Gerenciamento e Automação de Email

Este documento rastreia as tarefas atuais, backlog, e subtarefas do projeto. Atualizado regularmente para refletir o progresso e novas descobertas.

## Legenda

- 🔄 Em Progresso
- ⏱️ Pendente
- ✅ Concluído
- 🔍 Pesquisa Necessária

## Sprint Atual: Fundação

### Configuração Inicial

- ✅ Criar estrutura base do projeto Next.js
  - ✅ Configurar Typescript
  - ✅ Configurar Tailwind CSS
  - ✅ Implementar componentes Shadcn/UI
  - ✅ Atualizar Next.js para versão 15.3.2
  - ✅ Configurar Zustand para gerenciamento de estado

- ✅ Configurar ambiente Supabase
  - ✅ Criar projeto no Supabase (projeto "EmailMax" em us-east-2)
  - ✅ Configurar PostgreSQL e definir políticas RLS básicas
  - ✅ Modelar tabelas iniciais (EmailAccounts, WarmupPlans, EmailTemplates)
  - ✅ Criar cliente Supabase com createClient (Next.js)
### Próximos Passos Imediatos

- ✅ Desenvolver migrações SQL para tabelas principais
  - ✅ Criar tabela `email_accounts`
  - ✅ Criar tabela `warmup_plans`
  - ✅ Criar tabela `warmup_metrics`

  - ✅ Criar função para conexão IMAP
  - ✅ Implementar função para envio SMTP
  - ✅ Desenvolver funções para monitoramento de caixas de entrada

### Autenticação de Email

- ✅ Implementar sistema de gerenciamento de credenciais
  - ✅ Criar interfaces para adicionar contas de email (App passwords)
  - ✅ Desenvolver método para armazenar credenciais no Supabase
  - 🔄 Implementar função de teste de conexão IMAP/SMTP
    - 🔄 Desenvolver microserviço Python para validação real de conexões
  - ✅ Criar mecanismo de atualização automática de tokens expirados

- ✅ Desenvolver módulo de conexão IMAP
  - ✅ Implementar NodeIMAP para conexões seguras
  - ✅ Criar pool de conexões com gerenciamento de estados
  - ✅ Implementar funções de busca e leitura de emails
  - ✅ Desenvolver handlers para eventos IMAP importantes

- ✅ Desenvolver módulo de conexão SMTP
  - ✅ Implementar Nodemailer
  - ✅ Criar sistema de fila de envio
  - ✅ Implementar controle de taxa de envio

### Interface Básica

- ✅ Criar layout principal do aplicativo
  - ✅ Implementar navegação principal
  - ✅ Criar dashboard inicial
  - ✅ Desenvolver página de gerenciamento de contas

- ✅ Desenvolver visualização básica de emails
  - ✅ Criar interface de visualização de caixa de entrada
  - ✅ Implementar componente de leitura de emails
  - ✅ Desenvolver componentes para listagem e filtragem

## Backlog: Componentes Essenciais

### Microserviço de Validação IMAP/SMTP

- 🔄 Desenvolver microserviço Python para validação de email
  - 🔄 Implementar API RESTful com Flask para teste de conexões
  - 🔄 Adicionar suporte a validação real de IMAP/SMTP
  - 🔄 Implementar detecção automática de configurações por provedor
  - 🔄 Desenvolver sistema de feedback detalhado de erros
  - 🔄 Configurar Docker para implantação
  - 🔄 Integrar com sistema EmailMax existente

### Sistema de Aquecimento de Email

- ⏱️ Desenvolver engine de aquecimento
  - ✅ Implementar autenticação e conexão com contas de email via IMAP
  - ⏱️ Desenvolver função Edge para monitoramento de caixas de entrada
  - ⏱️ Criar algoritmos de interação natural (leitura, marcação, resposta)
  - ⏱️ Desenvolver lógica de simulação de padrões humanos (variação aleatória)

- ⏱️ Criar interface de configuração de aquecimento
  - ⏱️ Desenvolver formulários de configuração de planos
  - ⏱️ Implementar visualização de progresso
  - ⏱️ Criar dashboard de métricas de aquecimento
  - ⏱️ Configurar ajuste dinâmico de limites

### Rastreamento e Analytics

- ⏱️ Implementar sistema de rastreamento de emails
  - ⏱️ Criar mecanismo de rastreamento de aberturas
  - ⏱️ Desenvolver rastreamento de cliques em links
  - ⏱️ Implementar armazenamento de dados de interação

- ⏱️ Desenvolver dashboard analítico
  - ⏱️ Criar visualizações de métricas-chave
  - ⏱️ Implementar gráficos de performance com Recharts
  - ⏱️ Desenvolver relatórios de entregabilidade

## Backlog: Funcionalidades Avançadas

### Editor de Fluxos de Trabalho

- ⏱️ Desenvolver editor visual drag-and-drop
  - ⏱️ Implementar canvas interativo
  - ⏱️ Criar componentes de nós para o editor
  - ⏱️ Desenvolver conectores entre nós

- ⏱️ Implementar tipos de nós
  - ⏱️ Nós de condição
  - ⏱️ Nós de ação
  - ⏱️ Nós de temporização
  - ⏱️ Nós de segmentação

- ⏱️ Criar engine de execução de fluxos
  - ⏱️ Implementar interpretador de fluxos
  - ⏱️ Desenvolver sistema de filas para execução
  - ⏱️ Criar handlers para eventos e gatilhos

### Integração com IA (Claude)

- ⏱️ Implementar conexão com API Claude
  - ⏱️ Configurar autenticação e gerenciamento de token API
  - ⏱️ Desenvolver Edge Function para chamadas a API Claude
  - ⏱️ Implementar sistema de cache para respostas similares
  - ⏱️ Criar mecanismo de controle de taxa (rate limiting) para requisições
  - ⏱️ Otimizar prompts para tarefas específicas de email

- ⏱️ Desenvolver funcionalidades de IA
  - ⏱️ Categorização automática de emails
  - ⏱️ Geração de respostas personalizadas
  - ⏱️ Extração de contexto de conversas
  - ⏱️ Análise de sentimento e intenção

### Sistema Anti-Detecção

- ⏱️ Implementar geração de headers realistas
- ⏱️ Desenvolver sistema de rotação de proxies
- ⏱️ Criar simulador de comportamento humano
- ⏱️ Implementar fingerprinting de navegador personalizado

## Descobertas e Notas

- Projeto "EmailMax" criado no Supabase (região us-east-2)
- Banco de dados PostgreSQL disponível (versão 15.8.1)
- Extensões principais já configuradas: pg_graphql, pgcrypto, pg_stat_statements, pgjwt, uuid-ossp, supabase_vault
- Layout principal implementado com Next.js App Router e suporte adaptativo a dispositivos móveis
- Estrutura de navegação com submenus implementada na barra lateral
- Dashboard inicial implementado com visualização de métricas e atividades recentes
- Visualização de emails implementada com listagem, filtros, e detalhamento
- Implementada autenticação e conexão com contas de email via IMAP, com interface de gerenciamento de conexão
- Limitação identificada: Edge Functions do Supabase não permitem conexões às portas de email (25, 465, 587 para SMTP e 143, 993 para IMAP), necessitando microserviço Python separado para validação real

## Referências

- PLANNING.md - Documento principal de planejamento do projeto
