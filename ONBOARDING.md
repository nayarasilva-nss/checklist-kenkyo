# Kit de implantação — Checklist para um cliente novo

> Processo de onboarding assistido (fase de escalonamento): uma implantação
> leva ~1 dia de configuração + uma semana acompanhada. Válido para qualquer
> nicho; o que muda são os modelos de checklist e os nomes das funções.

## Antes de começar (o que você precisa do cliente)

- [ ] Nome da empresa e uma cor de marca (hex, ex. `#0a7d4f`) + logo em PNG
- [ ] Lista das unidades/lojas (nome de cada uma)
- [ ] Lista das funções da operação (ex.: Líder de abertura, Gerente, Atendente) — não precisa bater com a Kenkyo
- [ ] Quem serão os 2–5 primeiros usuários (nome, usuário, função, perfil: gestor/gerente/líder)
- [ ] Se a empresa tem ERP Kenkyo: endereço do ERP e a chave da API (se não tem, pule — o checklist funciona sozinho)

## Passo a passo (~1 dia)

1. **Empresa entra** — mande o link `/signup` para o dono; ele cria a conta.
2. **Você aprova** — `/plataforma` (perfil master): mude o status de `pending` para `active`. Aprove e cadastre logo e cor em Gerenciar.
3. **Unidades** — Gerenciar › Unidades: cadastre as lojas. *(Se usar ERP: ligue cada unidade ao CNPJ dela em Gerenciar › ERP.)*
4. **Funções** — Gerenciar › Funções: crie as funções do cliente.
5. **Modelos de checklist** — Gerenciar › Modelos: parta do modelo base do nicho (abaixo), adapte os itens com o dono em uma reunião de 1h. Um modelo por rotina do dia (Abertura, Fechamento, Turno…).
6. **Usuários** — Gerenciar › Usuários: cadastre a equipe, um perfil e uma unidade para cada. Dica: os primeiros líderes entram com o checklist marcado como obrigatório; quem cobre outra loja entra depois.
7. **Treinamento (30 min, gravado)** — com os líderes: executar o checklist do dia, tirar foto de não-conforme, registrar anomalia. Com o gerente: ver pendências, ler o Indicadores.
8. **Primeira semana acompanhada** — olhe o `/plataforma` todo dia: execuções > 0? Alguém travado? Fale pelo WhatsApp no 2º dia sem execução, não no 5º.

## Modelos base por nicho (ponto de partida, não bula)

### Restaurante/lanchonete (já validado pela Kenkyo)
- **Abertura**: caixa conferido, câmara fria na temperatura, bancada higienizada, café/máquinas ligadas, equipe com uniforme.
- **Fechamento**: gaveta contada, lixo fora, gás desligado, geladeiras conferidas, alarme armado.
- **Meio de turno**: piso/seguimento, reposição de insumos, escalas cumpridas.

### Varejo/loja
- **Abertura**: vitrine limpo, caixa contado, vidrates/portões ok, equipe reunida 10 min.
- **Fechamento**: conferência de caixa e cartões, mercadoria recolhida, saída registrada.
- **Rotina semanal**: vencimentos próximos, ruptura de prateleira, limpeza de fundo de loja.

### Serviços/escritório
- **Abertura**: e-mails do dia anterior, agenda do dia, sala de reunião pronta.
- **Fechamento**: backup feito, documentos arquivados, equipamentos desligados.

## O que dizer ao cliente (a promessa)

- Cada pessoa vê só a empresa dela; os dados nunca se misturam.
- O dono recebe (ou imprime) o **Resumo da semana** em PDF: Início › Indicadores › "Resumo da semana (PDF)".
- O checklist **não exige o ERP** — mas, com ele, requisições, contagens e caixa conversam.

## Acompanhamento do SaaS (o seu lado)

- `/plataforma` mostra execução dos últimos 14 dias e a última por empresa — zero execuções é o alerta de churn.
- Se um cliente para de usar, ligue antes de suspender (`/plataforma` › status).
