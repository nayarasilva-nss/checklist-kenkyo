// Prévia provisória da escala de dezembro/2026 (planilha escala_dezembro_2026_robson_fixo.xlsx).
// Só para visualização na tela Escala: não é gravada no banco e não afeta indicadores.
export type PreviaPessoa = { nome: string; funcao: string; folgas: number[] };
export type PreviaGrupo = { titulo: string; pessoas: PreviaPessoa[] };
export const PREVIA_MES = "2026-12";
export const PREVIA_FECHADOS = [24, 25, 31];
export const PREVIA: Record<string, { unidade: string; grupos: PreviaGrupo[] }> = {
 "oriental": {
  "unidade": "Cozinha Oriental",
  "grupos": [
   {
    "titulo": "Sushibar",
    "pessoas": [
     {
      "nome": "Rai Mateus",
      "funcao": "Chefe de sushibar",
      "folgas": [
       4,
       11,
       12,
       19,
       20,
       24,
       25,
       31
      ]
     },
     {
      "nome": "Arthur Demétrio",
      "funcao": "Sushiman 2",
      "folgas": [
       3,
       10,
       17,
       24,
       25,
       26,
       27,
       31
      ]
     },
     {
      "nome": "A CONTRATAR",
      "funcao": "Sushiman 2",
      "folgas": [
       6,
       10,
       16,
       22,
       23,
       24,
       25,
       31
      ]
     },
     {
      "nome": "A CONTRATAR",
      "funcao": "Sushiman 2",
      "folgas": [
       5,
       11,
       18,
       24,
       25,
       26,
       27,
       31
      ]
     },
     {
      "nome": "A CONTRATAR",
      "funcao": "Sushiman 1",
      "folgas": [
       7,
       8,
       14,
       20,
       24,
       25,
       30,
       31
      ]
     },
     {
      "nome": "Márcia Eduarda",
      "funcao": "Auxiliar de sushiman",
      "folgas": [
       6,
       8,
       15,
       22,
       23,
       24,
       25,
       31
      ]
     },
     {
      "nome": "Gabriel de Souza",
      "funcao": "Auxiliar de sushiman",
      "folgas": [
       7,
       13,
       19,
       24,
       25,
       29,
       30,
       31
      ]
     },
     {
      "nome": "Lucas Gabriel",
      "funcao": "Chefe folguista (ver aba Folguistas)",
      "folgas": [
       7,
       13,
       14,
       15,
       22,
       24,
       25,
       31
      ]
     },
     {
      "nome": "Robson",
      "funcao": "Chefe da Oriental (sushibar e cozinha)",
      "folgas": [
       5,
       12,
       19,
       20,
       21,
       24,
       25,
       31
      ]
     }
    ]
   },
   {
    "titulo": "Cozinha",
    "pessoas": [
     {
      "nome": "Marlene",
      "funcao": "Chefe de cozinha",
      "folgas": [
       2,
       8,
       13,
       16,
       17,
       24,
       25,
       31
      ]
     },
     {
      "nome": "Luciana Lima",
      "funcao": "Cozinheira",
      "folgas": [
       6,
       10,
       16,
       17,
       24,
       25,
       30,
       31
      ]
     },
     {
      "nome": "Dioneia",
      "funcao": "Cozinheira",
      "folgas": [
       5,
       12,
       19,
       20,
       23,
       24,
       25,
       31
      ]
     },
     {
      "nome": "A CONTRATAR",
      "funcao": "Cozinheiro",
      "folgas": [
       7,
       14,
       21,
       24,
       25,
       26,
       27,
       31
      ]
     },
     {
      "nome": "Diogo Cesar",
      "funcao": "Auxiliar de cozinha",
      "folgas": [
       7,
       14,
       19,
       20,
       21,
       24,
       25,
       31
      ]
     },
     {
      "nome": "Maria Clara",
      "funcao": "Auxiliar de cozinha",
      "folgas": [
       6,
       12,
       18,
       23,
       24,
       25,
       26,
       31
      ]
     },
     {
      "nome": "Lucas Gabriel",
      "funcao": "Chefe folguista (ver aba Folguistas)",
      "folgas": [
       7,
       13,
       14,
       15,
       22,
       24,
       25,
       31
      ]
     },
     {
      "nome": "Robson",
      "funcao": "Chefe da Oriental (sushibar e cozinha)",
      "folgas": [
       5,
       12,
       19,
       20,
       21,
       24,
       25,
       31
      ]
     }
    ]
   },
   {
    "titulo": "Salão",
    "pessoas": [
     {
      "nome": "Luiza",
      "funcao": "Hostess",
      "folgas": [
       5,
       12,
       13,
       16,
       23,
       24,
       25,
       31
      ]
     },
     {
      "nome": "Maître (preencher nome)",
      "funcao": "Maître (reveza c/ gerente operacional)",
      "folgas": [
       7,
       14,
       20,
       24,
       25,
       29,
       30,
       31
      ]
     },
     {
      "nome": "Bruna Juliana",
      "funcao": "Garçom/garçonete",
      "folgas": [
       4,
       11,
       18,
       24,
       25,
       26,
       27,
       31
      ]
     },
     {
      "nome": "Christian Filipe",
      "funcao": "Garçom/garçonete",
      "folgas": [
       6,
       7,
       8,
       15,
       21,
       24,
       25,
       31
      ]
     },
     {
      "nome": "Izabelly Bitencourt",
      "funcao": "Garçom/garçonete",
      "folgas": [
       3,
       10,
       17,
       24,
       25,
       26,
       27,
       31
      ]
     },
     {
      "nome": "Letícia Maria",
      "funcao": "Garçom/garçonete",
      "folgas": [
       7,
       13,
       14,
       19,
       23,
       24,
       25,
       31
      ]
     },
     {
      "nome": "Mariane da Silva",
      "funcao": "Garçom/garçonete",
      "folgas": [
       6,
       7,
       12,
       19,
       24,
       25,
       26,
       31
      ]
     },
     {
      "nome": "Thobias Gabriel",
      "funcao": "Garçom/garçonete",
      "folgas": [
       5,
       12,
       13,
       14,
       17,
       24,
       25,
       31
      ]
     },
     {
      "nome": "Luize",
      "funcao": "Garçom/garçonete",
      "folgas": [
       5,
       6,
       12,
       17,
       24,
       25,
       30,
       31
      ]
     },
     {
      "nome": "Carlos",
      "funcao": "Garçom/garçonete",
      "folgas": [
       5,
       11,
       18,
       19,
       20,
       24,
       25,
       31
      ]
     },
     {
      "nome": "Giuliano",
      "funcao": "Garçom/garçonete",
      "folgas": [
       4,
       11,
       18,
       19,
       20,
       24,
       25,
       31
      ]
     },
     {
      "nome": "Maria Eduarda",
      "funcao": "Garçom/garçonete",
      "folgas": [
       4,
       10,
       17,
       24,
       25,
       26,
       27,
       31
      ]
     }
    ]
   },
   {
    "titulo": "Bar",
    "pessoas": [
     {
      "nome": "Kathrein",
      "funcao": "Bartender",
      "folgas": [
       3,
       10,
       17,
       24,
       25,
       26,
       27,
       31
      ]
     },
     {
      "nome": "Luis Gustavo",
      "funcao": "Bartender",
      "folgas": [
       6,
       8,
       9,
       16,
       23,
       24,
       25,
       31
      ]
     },
     {
      "nome": "Larissa Moura",
      "funcao": "Auxiliar de bar",
      "folgas": [
       5,
       11,
       12,
       19,
       20,
       24,
       25,
       31
      ]
     },
     {
      "nome": "A CONTRATAR",
      "funcao": "Auxiliar de bar",
      "folgas": [
       7,
       13,
       18,
       24,
       25,
       29,
       30,
       31
      ]
     }
    ]
   },
   {
    "titulo": "Copa",
    "pessoas": [
     {
      "nome": "Antonia Maria",
      "funcao": "Auxiliar de serviços gerais",
      "folgas": [
       3,
       10,
       17,
       24,
       25,
       26,
       27,
       31
      ]
     },
     {
      "nome": "Leidiane Cabral",
      "funcao": "Auxiliar de serviços gerais",
      "folgas": [
       7,
       8,
       9,
       16,
       20,
       24,
       25,
       31
      ]
     },
     {
      "nome": "Lunna Kalyndah",
      "funcao": "Auxiliar de serviços gerais",
      "folgas": [
       6,
       11,
       15,
       22,
       23,
       24,
       25,
       31
      ]
     },
     {
      "nome": "A CONTRATAR",
      "funcao": "Auxiliar de serviços gerais",
      "folgas": [
       5,
       12,
       13,
       14,
       19,
       24,
       25,
       31
      ]
     }
    ]
   }
  ]
 },
 "delivery": {
  "unidade": "Delivery",
  "grupos": [
   {
    "titulo": "Sushibar",
    "pessoas": [
     {
      "nome": "Johnatan Diego",
      "funcao": "Chefe de sushibar",
      "folgas": [
       5,
       12,
       13,
       14,
       19,
       24,
       25,
       31
      ]
     },
     {
      "nome": "Kae Victor",
      "funcao": "Sushiman 2",
      "folgas": [
       3,
       10,
       17,
       24,
       25,
       26,
       27,
       31
      ]
     },
     {
      "nome": "Angela Beatriz",
      "funcao": "Sushiman 2",
      "folgas": [
       6,
       10,
       17,
       24,
       25,
       29,
       30,
       31
      ]
     },
     {
      "nome": "Joab",
      "funcao": "Sushiman 2",
      "folgas": [
       5,
       11,
       18,
       19,
       20,
       24,
       25,
       31
      ]
     },
     {
      "nome": "A CONTRATAR",
      "funcao": "Sushiman 2",
      "folgas": [
       7,
       13,
       14,
       15,
       21,
       24,
       25,
       31
      ]
     },
     {
      "nome": "A CONTRATAR",
      "funcao": "Sushiman 2",
      "folgas": [
       4,
       11,
       18,
       24,
       25,
       26,
       27,
       31
      ]
     },
     {
      "nome": "Italo Gabriel",
      "funcao": "Sushiman 1",
      "folgas": [
       6,
       9,
       16,
       22,
       23,
       24,
       25,
       31
      ]
     },
     {
      "nome": "Douglas Pablo",
      "funcao": "Auxiliar de sushiman",
      "folgas": [
       4,
       5,
       12,
       19,
       20,
       24,
       25,
       31
      ]
     },
     {
      "nome": "Mônica Gabriela",
      "funcao": "Auxiliar de sushiman",
      "folgas": [
       7,
       13,
       18,
       23,
       24,
       25,
       26,
       31
      ]
     },
     {
      "nome": "Cauã",
      "funcao": "Auxiliar de sushiman",
      "folgas": [
       6,
       10,
       17,
       24,
       25,
       29,
       30,
       31
      ]
     },
     {
      "nome": "Lucas Gabriel",
      "funcao": "Chefe folguista (ver aba Folguistas)",
      "folgas": [
       7,
       13,
       14,
       15,
       22,
       24,
       25,
       31
      ]
     }
    ]
   },
   {
    "titulo": "Cozinha",
    "pessoas": [
     {
      "nome": "Fernanda",
      "funcao": "Chefe de cozinha",
      "folgas": [
       3,
       10,
       17,
       24,
       25,
       26,
       27,
       31
      ]
     },
     {
      "nome": "Lucas",
      "funcao": "Auxiliar de cozinha",
      "folgas": [
       4,
       5,
       6,
       11,
       18,
       24,
       25,
       31
      ]
     },
     {
      "nome": "Lucas Gabriel",
      "funcao": "Chefe folguista (ver aba Folguistas)",
      "folgas": [
       7,
       13,
       14,
       15,
       22,
       24,
       25,
       31
      ]
     }
    ]
   },
   {
    "titulo": "Atendimento",
    "pessoas": [
     {
      "nome": "Karollyna",
      "funcao": "Gerente de delivery",
      "folgas": [
       4,
       11,
       12,
       13,
       19,
       24,
       25,
       31
      ]
     },
     {
      "nome": "Maria Eduarda Alves",
      "funcao": "Atendente de delivery",
      "folgas": [
       3,
       10,
       17,
       24,
       25,
       26,
       27,
       31
      ]
     },
     {
      "nome": "Nayane Vitória",
      "funcao": "Atendente",
      "folgas": [
       7,
       13,
       14,
       21,
       24,
       25,
       30,
       31
      ]
     },
     {
      "nome": "A CONTRATAR",
      "funcao": "Atendente de delivery",
      "folgas": [
       7,
       14,
       20,
       24,
       25,
       29,
       30,
       31
      ]
     },
     {
      "nome": "A CONTRATAR",
      "funcao": "Atendente de delivery",
      "folgas": [
       5,
       6,
       10,
       11,
       17,
       24,
       25,
       31
      ]
     },
     {
      "nome": "A CONTRATAR",
      "funcao": "Atendente de delivery",
      "folgas": [
       6,
       8,
       15,
       22,
       23,
       24,
       25,
       31
      ]
     }
    ]
   },
   {
    "titulo": "Copa",
    "pessoas": [
     {
      "nome": "A CONTRATAR",
      "funcao": "Auxiliar de serviços gerais",
      "folgas": [
       7,
       13,
       17,
       22,
       23,
       24,
       25,
       31
      ]
     },
     {
      "nome": "A CONTRATAR",
      "funcao": "Auxiliar de serviços gerais",
      "folgas": [
       6,
       12,
       19,
       24,
       25,
       29,
       30,
       31
      ]
     }
    ]
   }
  ]
 }
};
