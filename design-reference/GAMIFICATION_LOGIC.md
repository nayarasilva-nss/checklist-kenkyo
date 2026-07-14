# Kenkyo Gamification System

## Core Mechanics

### 1. Experience Points (XP) System — HARD MODE
- **Base Actions (Difícil):**
  - Completar checklist: +30 XP (não é automático)
  - Reportar não-conformidade: +15 XP (honestidade recompensada)
  - **Preencher relatório de anomalia (detalhado):** +50 XP ⭐ (grande valor)
    - Tipo de problema
    - Causa raiz
    - Ação corretiva
    - Data de resolução
  - ~~0 não-conformidades por 5 dias: +200 XP~~ ❌ REMOVIDO (incentiva esconder problemas)
  
- **Streak Bonus (Exigente):**
  - Dia 3 consecutivo: +15% XP multiplier
  - Dia 7 consecutivo: +40% XP multiplier
  - Dia 14 consecutivo: +70% XP multiplier
  - Dia 30 consecutivo: +150% XP multiplier
  - **Quebra streak = reset total (volta ao 1x)**
  
- **Thresholds por Mês (Progressão Logarítmica):**
  - INICIANTE: 0-1.200 XP
  - INTERMEDIÁRIO: 1.201-3.500 XP
  - AVANÇADO: 3.501-7.000 XP
  - PRO: 7.001-12.000 XP
  - MASTER: 12.001+ XP (elite, ~5% da equipe)
  - Reset mensal — tudo zera todo dia 1º

### 2. Ranking System — TIEBREAKER COMPETITIVO
- **Baseado APENAS EM:**
  1. XP acumulado (mês atual) — **ÚNICO critério**
  2. Dias de streak ativo — desempate numérico apenas
  
- **Conformidade é "Policing", NÃO Pontuação:**
  - Sistema interno detecta padrão de "tudo conforme" artificial
  - Checklists 100% conformidade consecutivos = flag automática
  - Se >95% de taxa sem nenhuma não-conformidade reportada = auditoria
  - Quem faz checklist "fake" (marca tudo conforme) perde credibilidade interna (sem XP punição, apenas visibilidade)
  
- **XP só vem de AÇÕES REAIS:**
  - Completar checklist: +30 XP (independente resultado)
  - Reportar não-conformidade real: +10 XP (honestidade recompensada)
  - Manter 0 não-conformidades em 5 dias reais: +200 XP (raro, legítimo)
  - Revisor/Gestor validar checklist duvidoso: XP negativo pro colaborador se for fraude
  
- **Regra de Ouro:**
  - Mesmo XP = quem tem streak mais longo ganha posição
  - **Posições atualizam em tempo real**
  
- **Exibição:**
  - Top 10 colaboradores no Dashboard (não só 6)
  - Seu ranking atual exibido em destaque
  - Diferença XP até próxima posição ("Faltam 450 XP para 2º")
  - Badges: 🥇 🥈 🥉 (apenas top 3 físicos)

### 3. Achievements (Badges)
- **Sempre Desbloqueados:**
  - 🔥 Streak de 7 dias
  - 🏅 Top 1 do Mês
  - 📋 Primeiro Relatório de Anomalia Completo
  
- **Bloqueados (Progressivos):**
  - 🎯 50 Checklists (desbloqueia em 50 completados)
  - 📊 3.000 XP (desbloqueia em 3000 XP)
  - 🎖️ 90+ Dias de Streak
  - 📝 10 Relatórios de Anomalias (qualidade & completude)
  
- **Exibição:**
  - Dashboard mostra 4 primeiros (desbloqueados + próximo)
  - Click abre modal com descrição completa

### 4. Level System
```
INICIANTE (0-1.200 XP)
INTERMEDIÁRIO (1.201-3.500 XP)
AVANÇADO (3.501-7.000 XP)
PRO (7.001-12.000 XP)
MASTER (12.001+ XP - elite, ~5%)
```

- **Progressão Visual:**
  - Barra de XP no Home (com % de preenchimento)
  - Label do nível com cor gradient
  - "X pontos até próximo nível"

### 5. Notifications (Alerts Gamificados)
- Desbloquear achievement: "🎉 Parabéns! Você desbloqueou 🔥 Streak de 7 dias"
- Novo nível: "🚀 Você subiu para nível PRO!"
- Quebra de streak: "⚠️ Sua sequência de 5 dias foi interrompida"
- Ranking change: "📈 Você subiu para 2º lugar!"
- Relatório validado: "✅ Relatório de anomalia aceito! +50 XP"

### 6. Data Structure (No Banco)
```javascript
user: {
  id: "user123",
  name: "Marina Costa",
  xp_current_month: 2340,
  level: "PRO",
  streak_days: 12,
  achievements: ["7day_streak", "100_percent", "top_1"],
  rank_position: 1,
  total_checklists: 47,
  conformity_rate: 0.96
}

checkpoint: {
  date: "2024-01-15",
  user_id: "user123",
  action: "checklist_completed",
  xp_earned: 150,
  bonus_applied: "streak_30percent",
  checklist_id: "check123",
  conformity: 1.0
}
```

## UI Integration Points

### Home
- ✅ XP Progress Bar (atual vs próximo nível)
- ✅ Streak Badge (🎯 12 dias + bônus multiplier)
- ✅ 4 Stats Cards (com gamification labels)
- ✅ Recent Activity table (mostra XP earned)

### Dashboard
- ✅ Achievements section (4 badges)
- ✅ Ranking table (com posição + XP)
- ✅ Non-conformities com XP ajuste

### Notificações
- ✅ Achievement unlocked alerts
- ✅ Level up notifications
- ✅ Streak milestones
- ✅ Ranking position changes

## API Endpoints (Future)
```
POST /api/checklist/complete
  → Returns: { xp_earned, bonus, new_level?, achievements_unlocked? }

GET /api/user/stats
  → Returns: { xp, level, streak, achievements, rank }

GET /api/ranking/leaderboard
  → Returns: [{ user, xp, rank, streak }...]

POST /api/achievements/check
  → Validates unlocked achievements after each action
```

## Rules & Constraints
- Streak resets se não completar checklist em 1 dia
- XP multiplier only applies em dias com 1+ checklist
- Achievements não podem ser "desbloqueados" manualmente
- Ranking atualiza real-time ou em batch (a decidir)
- Histórico de XP mantém por 90 dias (compliance)
