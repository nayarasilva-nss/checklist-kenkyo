#!/bin/sh
# Liga o checklist (produção) ao ERP. Roda uma vez, no Mac, de dentro desta pasta:
#   sh scripts/ligar-erp-producao.sh
# Antes: cole o endereço do banco de PRODUÇÃO do checklist em .env.producao
# (Vercel › checklist-kenkyo › Storage › o banco › aba .env.local › Show secret › Copy Snippet).
#
# Faz, nesta ordem: (1) acrescenta no banco os campos da ligação — só
# acrescenta, o checklist no ar continua funcionando; (2) grava na Vercel o
# endereço do ERP e a chave da ligação (a mesma do ERP, lida do .env.local
# dele). Nenhum segredo aparece na tela. O .env.producao é apagado no fim.
set -e
cd "$(dirname "$0")/.."
ERP_ENV="$HOME/Desktop/ERP-Kenkyo/aplicativo/.env.local"
[ -f .env.producao ] || { echo "Falta o .env.producao com o endereço do banco de produção do checklist."; exit 1; }
[ -f "$ERP_ENV" ] || { echo "Não achei o .env.local do ERP em $ERP_ENV."; exit 1; }
trap 'rm -f .env.producao' EXIT
ler() { grep -E "^$1=" "$2" 2>/dev/null | head -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//'; }
URL=$(ler DATABASE_URL_UNPOOLED .env.producao); [ -n "$URL" ] || URL=$(ler POSTGRES_URL_NON_POOLING .env.producao); [ -n "$URL" ] || URL=$(ler DATABASE_URL .env.producao)
[ -n "$URL" ] || { echo "Não achei DATABASE_URL no .env.producao."; exit 1; }

echo "1/2 Campos novos no banco do checklist"
DATABASE_URL="$URL" npx drizzle-kit migrate

echo "2/2 Ligação na Vercel"
gravar() { vercel env rm "$1" production --yes > /dev/null 2>&1 || true; printf '%s' "$2" | vercel env add "$1" production > /dev/null; echo "  variável $1 gravada"; }
gravar ERP_API_URL "https://erp-kenkyo.vercel.app"
TOKEN=$(ler API_REQUISICOES_TOKEN "$ERP_ENV")
[ -n "$TOKEN" ] || { echo "O .env.local do ERP não tem API_REQUISICOES_TOKEN."; exit 1; }
gravar ERP_API_TOKEN "$TOKEN"
echo "Pronto. Falta publicar o checklist (avise o Claude)."
