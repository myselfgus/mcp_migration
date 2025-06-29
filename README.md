# mcp_migration

## Descrição

Este repositório contém scripts, documentação e código de apoio ao processo de migração do MCP (Memory Control Plane), incluindo estratégias, checklist de execução, auditorias e implementação remota de servidores de memória na infraestrutura Cloudflare Workers.

---

This repository contains scripts, documentation, and supporting code for the migration process of the MCP (Memory Control Plane), including strategies, execution checklist, audits, and a remote memory server implementation on Cloudflare Workers.

---

## Estrutura do Repositório / Repository Structure

- `cloudflare-servers/`
  - `memory-remote/`  
    Implementação do servidor de memória remota para MCP utilizando Cloudflare Workers ([package.json](https://github.com/myselfgus/mcp_migration/blob/main/cloudflare-servers/memory-remote/package.json)).
    - Scripts de desenvolvimento, deploy e banco de dados usando Wrangler.
    - Código principal em TypeScript.
- `create_project_structure.ps1`  
  Script em PowerShell para criação de estrutura de projeto.
- `mcp_audit_report.json`  
  Relatório de auditoria do MCP.
- `cognitive_first_strategy.md`  
  Estratégia inicial detalhando abordagens cognitivas para migração.
- `corrected_analysis.md`  
  Análise revisada do processo de migração.
- `migration_strategy.md`  
  Estratégia geral de migração.
- `execution_checklist.md`  
  Checklist para execução do processo de migração.
- `CONTEXT_FOR_NEXT_CLAUDE.md`  
  Contexto adicional para automação e IA.

---

## Como rodar / How to Run

### Pré-requisitos / Prerequisites

- Node.js
- npm
- Wrangler CLI (`npm install -g wrangler`)
- PowerShell (para scripts `.ps1`, Windows ou Linux com suporte)

### Passos básicos / Basic Steps

```bash
cd cloudflare-servers/memory-remote
npm install
# Para desenvolvimento local:
npm run dev
# Para deploy:
npm run deploy
# Para rodar testes:
npm run test
```

Para scripts PowerShell:
```powershell
./create_project_structure.ps1
```

---

## Contato / Contact

Para dúvidas ou contribuições, abra uma Issue ou Pull Request.
