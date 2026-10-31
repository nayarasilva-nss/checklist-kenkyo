-- ============================================================================
-- CHECKLIST KENKYO — ISOLAMENTO POR EMPRESA (fase de escalonamento)
--
-- O checklist vira produto: cada empresa (organizations) só vê o que é dela.
-- A maior parte das tabelas já nasceu com organization_id; para as tabelas
-- FILHAS (itens, respostas, pendências), a empresa é derivada pela cadeia de
-- FKs — e o isolamento na leitura é garantido pelo código (lib/auth/escopo.ts
-- + filtragem pela tabela pai), não por coluna repetida.
--
-- Este migration só acrescenta o que falta em tabelas de 1º nível (que têm
-- pai direto com empresa mas não têm a coluna): nada de dados é alterado.
-- Reaplicável.
-- ============================================================================

-- shift_log_pendencias pende de shift_logs, que tem organization_id.
ALTER TABLE shift_log_pendencias
  ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE;
UPDATE shift_log_pendencias p
   SET organization_id = s.organization_id
  FROM shift_logs s
 WHERE p.shift_log_id = s.id AND p.organization_id IS NULL;
CREATE INDEX IF NOT EXISTS shift_log_pendencias_org_idx ON shift_log_pendencias (organization_id);
