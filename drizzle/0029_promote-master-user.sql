-- Promove a conta da Nayara (dona da operação/plataforma) de "gestor"
-- para "master": mesmas permissões de gestor, mais acesso a /plataforma,
-- que deixa de ser liberado pra qualquer gestor da empresa Kenkyo.
UPDATE "users" SET "profile" = 'master' WHERE "username" = 'nayara.silva';
