import api from '../services/api';

export interface ArenaStats {
  hp: number;
  maxHP: number;
  strength: number;
  speed: number;
  spriteIdle?: string;
  spriteAttack?: string;
  spriteHurt?: string;
}

export interface ArenaStartResponse {
  battleId: number;
  resumed: boolean;
  player: ArenaStats;
  boss: ArenaStats;
}

export interface ArenaHitResponse {
  playerDamage: number;
  bossDamage: number;
  playerCrit: boolean;
  vampiricHeal: number;
  playerHP: number;
  bossHP: number;
  battleEnded: boolean;
  outcome: 'victory' | 'defeat' | 'draw' | null;
}

export interface ArenaEndResponse {
  battleId: number;
  outcome: 'victory' | 'defeat' | 'draw';
  totalHits: number;
  playerDamageDealt: number;
  bossDamageDealt: number;
  expEarned: number;
  goldEarned: number;
  levelUp: boolean;
}

export const startBattle = async (): Promise<ArenaStartResponse> => {
  const res = await api.post('/arena/start');
  return res.data.data;
};

export const hitBattle = async (battleId: number): Promise<ArenaHitResponse> => {
  const res = await api.post('/arena/hit', { battleId });
  return res.data.data;
};

export const endBattle = async (battleId: number, outcome: 'victory' | 'defeat' | 'draw', durationSeconds: number): Promise<ArenaEndResponse> => {
  const res = await api.post('/arena/end', { battleId, outcome, durationSeconds });
  return res.data.data;
};

export const getHistory = async () => {
  const res = await api.get('/arena/history');
  return res.data.data;
};

export const getStats = async () => {
  const res = await api.get('/arena/stats');
  return res.data.data;
};
