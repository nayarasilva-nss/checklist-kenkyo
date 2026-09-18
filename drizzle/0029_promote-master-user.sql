-- Promove a conta da Nayara (dona da operação/plataforma) de "gestor"
-- para "master": mesmas permissões de gestor, mais acesso a /plataforma,
-- que deixa de ser liberado pra qualquer gestor da empresa Kenkyo.
-- Em migração própria, separada da que adiciona 'master' ao enum
-- (0028) — não dá pra usar um valor de enum recém-criado na mesma
-- transação em que ele foi adicionado.
UPDATE "users" SET "profile" = 'master' WHERE "username" = 'nayara.silva';
