-- Promove a conta da Nayara (dona da operação/plataforma) de "gestor"
-- para "master": mesmas permissões de gestor, mais acesso a /plataforma,
-- que deixa de ser liberado pra qualquer gestor da empresa Kenkyo.
-- Em migração própria, separada da que adiciona 'master' ao enum
-- (0028) — não dá pra usar um valor de enum recém-criado na mesma
-- transação em que ele foi adicionado.
-- Instalação do zero (22/10/2026): o drizzle-kit migrate roda todas as
-- migrações numa transação só, e o 'master' literal quebrava ali ("unsafe
-- use of new value"). O UPDATE só é montado quando a conta existe — num
-- banco novo ela não existe e o valor do enum nem é lido. Em produção esta
-- migração já tinha rodado; o drizzle não aplica de novo.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "users" WHERE "username" = 'nayara.silva') THEN
    EXECUTE 'UPDATE "users" SET "profile" = ''master'' WHERE "username" = ''nayara.silva''';
  END IF;
END $$;
