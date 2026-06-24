# 📤 Como fazer upload para GitHub e Deploy no Vercel

## Opção 1: Via GitHub Web (Mais fácil)

### Passo 1: Upload dos arquivos

1. Vá para seu repositório: https://github.com/nayarasilva-nss/checklist-kenkyo
2. Clique em "Add file" → "Upload files"
3. Selecione estes arquivos:
   - `index.html`
   - `README.md`
   - `vercel.json`
   - `.gitignore`
4. Clique em "Commit changes"

### Passo 2: Deploy no Vercel

1. Vá para https://vercel.com/new
2. Faça login com GitHub
3. Procure por "checklist-kenkyo"
4. Clique em "Import"
5. Clique em "Deploy"
6. Aguarde alguns segundos

**Pronto!** Seu app estará online em um URL como:
```
https://checklist-kenkyo.vercel.app
```

---

## Opção 2: Via Terminal (Para quem usa Git)

### Passo 1: Clone o repositório

```bash
git clone https://github.com/nayarasilva-nss/checklist-kenkyo.git
cd checklist-kenkyo
```

### Passo 2: Adicione os arquivos

```bash
# Copie os arquivos para a pasta
# index.html, README.md, vercel.json, .gitignore

git add .
git commit -m "Initial commit: Checklist Kenkyo app"
git push origin main
```

### Passo 3: Deploy no Vercel

```bash
# Instale Vercel CLI
npm install -g vercel

# Faça deploy
vercel
```

---

## ✅ Pronto!

Seu app estará acessível online e funcionando 100% offline. Todos os dados continuam salvos no navegador do usuário.

### Links úteis:
- 🔗 Seu repositório: https://github.com/nayarasilva-nss/checklist-kenkyo
- 🌐 Seu app (após deploy): https://checklist-kenkyo.vercel.app
- 📚 Documentação Vercel: https://vercel.com/docs
