import { useState, useCallback, useRef } from 'react';
import { ArenaStats, startBattle, hitBattle, endBattle, ArenaHitResponse } from '../api/arenaApi';
import { useAuthStore } from '../stores/authStore';
import { useCharacterStore } from '../stores/characterStore';

// ══════════════════════════════════════════════════════════════════
// USE ARENA BATTLE — Hook quản lý logic trận đấu (API calls)
// Giữ nguyên backend integration, thêm thông tin ai bị đánh
// ══════════════════════════════════════════════════════════════════

export interface DamageEvent {
  target: 'player' | 'boss';
  amount: number;
  isCrit: boolean;
  heal?: number;
}

export const useArenaBattle = () => {
  const [battleId, setBattleId] = useState<number | null>(null);
  const [playerStats, setPlayerStats] = useState<ArenaStats | null>(null);
  const [bossStats, setBossStats] = useState<ArenaStats | null>(null);

  const [isBattling, setIsBattling] = useState(false);
  const [battleOutcome, setBattleOutcome] = useState<'victory' | 'defeat' | 'draw' | null>(null);
  const [battleStartTime, setBattleStartTime] = useState<number>(0);

  const [logs, setLogs] = useState<string[]>([]);
  const [lastDamageEvent, setLastDamageEvent] = useState<DamageEvent | null>(null);

  // Throttle: tránh gọi API quá nhanh
  const hitCooldown = useRef(false);

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 8));
  };

  const initBattle = useCallback(async () => {
    try {
      const data = await startBattle();
      setBattleId(data.battleId);
      setPlayerStats(data.player);
      setBossStats(data.boss);
      setIsBattling(true);
      setBattleOutcome(null);
      setBattleStartTime(Date.now());
      setLogs([]);
      setLastDamageEvent(null);
      addLog(data.resumed ? '⚔️ Trận đấu tiếp tục!' : '⚔️ Trận đấu bắt đầu!');
    } catch (error: any) {
      addLog(`❌ Lỗi: ${error.message}`);
    }
  }, []);

  const processHit = useCallback(async (): Promise<'player' | 'boss' | null> => {
    if (!battleId || !isBattling || hitCooldown.current) return null;

    // Throttle 200ms để không spam API
    hitCooldown.current = true;
    setTimeout(() => { hitCooldown.current = false; }, 200);

    try {
      const hitData = await hitBattle(battleId);

      // Cập nhật HP
      setPlayerStats(prev => prev ? { ...prev, hp: hitData.playerHP } : null);
      setBossStats(prev => prev ? { ...prev, hp: hitData.bossHP } : null);

      let whoGotHit: 'player' | 'boss' | null = null;

      if (hitData.playerDamage > 0) {
        // Player tấn công Boss → Boss bị đánh
        whoGotHit = 'boss';
        setLastDamageEvent({
          target: 'boss',
          amount: hitData.playerDamage,
          isCrit: hitData.playerCrit,
          heal: hitData.vampiricHeal,
        });
        addLog(`⚔️ Bạn gây ${hitData.playerDamage} DMG!${hitData.playerCrit ? ' 💥CRIT!' : ''}${hitData.vampiricHeal > 0 ? ` 🩸+${hitData.vampiricHeal} HP` : ''}`);
      } else if (hitData.bossDamage > 0) {
        // Boss tấn công Player → Player bị đánh
        whoGotHit = 'player';
        setLastDamageEvent({
          target: 'player',
          amount: hitData.bossDamage,
          isCrit: false,
        });
        addLog(`💀 Boss gây ${hitData.bossDamage} DMG!`);
      } else {
        addLog(`💨 Sượt qua!`);
      }

      // Kiểm tra kết thúc trận
      if (hitData.battleEnded && hitData.outcome) {
        setIsBattling(false);
        setBattleOutcome(hitData.outcome);
        await finishBattle(hitData.outcome);
      }

      return whoGotHit;
    } catch (error: any) {
      addLog(`❌ Lỗi: ${error.message}`);
      return null;
    }
  }, [battleId, isBattling]);

  const finishBattle = async (outcome: 'victory' | 'defeat' | 'draw') => {
    if (!battleId) return;
    try {
      const duration = Math.floor((Date.now() - battleStartTime) / 1000);
      const res = await endBattle(battleId, outcome, duration);

      if (outcome === 'victory') {
        addLog(`🏆 CHIẾN THẮNG! +${res.expEarned} EXP, +${res.goldEarned} Gold`);
      } else if (outcome === 'defeat') {
        addLog(`💀 Thất bại... +${res.expEarned} EXP`);
      } else {
        addLog(`🤝 Hòa! +${res.expEarned} EXP, +${res.goldEarned} Gold`);
      }

      if (res.levelUp) addLog(`✨ LEVEL UP!`);

      // Đồng bộ chỉ số
      useAuthStore.getState().refreshUser();
      useCharacterStore.getState().fetchProfile();
    } catch (error: any) {
      addLog(`❌ Lỗi kết thúc: ${error.message}`);
    }
  };

  return {
    battleId,
    playerStats,
    bossStats,
    isBattling,
    battleOutcome,
    logs,
    lastDamageEvent,
    initBattle,
    processHit,
  };
};
