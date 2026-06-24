# 🎯 Checklist Kenkyo

Sistema de gerenciamento de checklists interno da operação Kenkyo com controle de acesso por perfil.

## 🚀 Funcionalidades

- **Autenticação**: Login com 3 perfis (Gestor, Gerente, Líder)
- **Dashboard**: Métricas de conformidade em tempo real
- **Checklists**: Execução de checklists diários e semanais
- **Histórico**: Rastreamento de todas as atividades
- **Gerenciamento**: Painel administrativo para Gestores
- **Offline**: Funciona 100% offline com sincronização automática
- **Responsivo**: Interface mobile-friendly

## 👥 Perfis de Acesso

### Gestor
- ✅ Ver todos os checklists e histórico
- ✅ Adicionar/editar/deletar usuários
- ✅ Adicionar/editar/deletar checklists
- ✅ Acessar painel de gerenciamento

### Gerente
- ✅ Executar checklists
- ✅ Ver histórico de atividades
- ✅ Ver dashboard

### Líder
- ✅ Executar checklists
- ✅ Ver histórico de atividades
- ✅ Ver dashboard

## 🔐 Credenciais de Teste

| Perfil | Usuário | Senha |
|--------|---------|-------|
| Gestor | Admin | 2624 |
| Gerente | Ana Sara | 1411 |
| Líder | Lucas | 1234 |

## 💾 Dados

Todos os dados são salvos automaticamente no `localStorage` do navegador. Nenhum dado é enviado para servidor.

## 🌐 Deploy

### Vercel (Recomendado)

1. Faça login em [vercel.com](https://vercel.com)
2. Clique em "New Project"
3. Selecione este repositório GitHub
4. Clique em "Deploy"
5. Pronto! Seu app estará online

### Netlify

1. Faça login em [netlify.com](https://netlify.com)
2. Clique em "New site from Git"
3. Selecione este repositório
4. Clique em "Deploy site"

## 📋 Estrutura

```
.
├── index.html          # App principal
├── README.md          # Este arquivo
└── vercel.json        # Configuração Vercel (opcional)
```

## 🛠️ Desenvolvimento Local

```bash
# Clone o repositório
git clone https://github.com/nayarasilva-nss/checklist-kenkyo.git

# Abra o arquivo index.html no navegador
open index.html
```

## 📝 Roadmap

- [ ] Exportar para PDF
- [ ] Exportar para Excel
- [ ] Sincronização com servidor
- [ ] Notificações em tempo real
- [ ] Relatórios avançados
- [ ] Integração com sistemas externos

## 📄 Licença

Privado - Kenkyo Operations
