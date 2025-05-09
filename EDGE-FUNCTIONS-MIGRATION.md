# Migração das Edge Functions para Microserviço Python

Este documento descreve o processo de migração das Edge Functions do Supabase para o microserviço Python de validação IMAP/SMTP.

## Contexto

O EmailMax originalmente utilizava Edge Functions do Supabase para validar conexões de email IMAP/SMTP. No entanto, essa abordagem apresentava limitações significativas:

1. **Restrições de conexão**: Edge Functions não podem se conectar a portas arbitrárias, incluindo as usadas para IMAP (993) e SMTP (587/465)
2. **Limitações de tempo**: O tempo máximo de execução é restrito
3. **Bibliotecas indisponíveis**: Não é possível instalar bibliotecas específicas como `imaplib` e `smtplib` no ambiente serverless
4. **Debugging complexo**: Problemas de conexão são difíceis de diagnosticar

Por essas razões, implementamos um microserviço Python independente que supera essas limitações.

## Modificações Realizadas

As seguintes alterações foram implementadas para remover a dependência de Edge Functions:

### 1. Remoção das Edge Functions

- Removida a referência à Edge Function `test-email-connection` em `lib/utils/email-connection.ts`
- Eliminado o fallback para Edge Functions quando o microserviço não está disponível

### 2. Melhorias na Utilização do Microserviço

- Aumentado o timeout de conexão de 5 para 8 segundos
- Melhorada a detecção de disponibilidade do microserviço 
- Aprimoradas as mensagens de erro e o tratamento de falhas
- Adicionado logging mais detalhado para facilitar a depuração

### 3. Interface do Usuário

- Atualizado o componente `AddAccountForm` para verificar a disponibilidade do microserviço
- Adicionadas melhores mensagens de erro quando o microserviço não está acessível
- Criados componentes de feedback visual para ajudar na solução de problemas

### 4. Scripts de Inicialização

- Adicionado `start-validator.js` para iniciar o microserviço via Docker
- Adicionado `start-validator-python.js` para iniciar o microserviço diretamente com Python
- Atualizados os scripts no package.json para facilitar o início do sistema completo

## Configuração Necessária

Para completar a migração, é necessário:

1. Configurar o arquivo `.env.local` com:
   ```
   NEXT_PUBLIC_EMAIL_VALIDATION_SERVICE_URL=http://localhost:5000
   EMAIL_VALIDATION_API_KEY=dev_key_change_me_in_production
   USE_EDGE_FUNCTIONS=false
   ```

2. Iniciar o microserviço antes de usar a aplicação:
   ```
   npm run validator:start
   ```
   
   Ou usando Python diretamente:
   ```
   npm run validator:start-python
   ```

## Benefícios da Migração

- **Maior confiabilidade**: Conexões IMAP/SMTP mais estáveis e previsíveis
- **Melhor diagnóstico**: Logs detalhados e mensagens de erro mais claras
- **Tempo de execução ilimitado**: Sem restrições de timeout do ambiente serverless
- **Capacidades ampliadas**: Suporte a bibliotecas Python completas e recursos do sistema
- **Ambiente de desenvolvimento simplificado**: Desenvolvimento e teste local mais fácil

## Testes Realizados

- [x] Validação de conexão IMAP com servidores comuns (Gmail, Outlook, etc.)
- [x] Validação de conexão SMTP com diferentes portas (587, 465)
- [x] Detecção automática de configurações para provedores conhecidos
- [x] Tratamento de erros de conexão e mensagens apropriadas
- [x] Fallback para execução via Python quando Docker não está disponível

## Próximos Passos

1. Considerar a containerização do sistema completo (frontend + microserviço)
2. Avaliar a necessidade de escalabilidade horizontal do microserviço
3. Implementar monitoramento e alertas para o microserviço

## Referências

- [Documentação do Microserviço](README-validator.md)
- [Limitações das Edge Functions do Supabase](https://supabase.com/docs/guides/functions/limitations)
- [Implementação Python do Validador](imap-smtp-validator/app.py) 