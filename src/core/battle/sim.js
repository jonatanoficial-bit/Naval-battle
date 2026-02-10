import { storage } from '../storage.js';

function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

export function simulateBattle({ content, strat }){
  const s = storage.get();
  const shipsById = Object.fromEntries(content.ships.map(x => [x.id, x]));

  const playerPower = s.fleet.reduce((acc, u) => {
    const def = shipsById[u.id];
    const base = def?.power || 40;
    const lvlMul = 1 + (u.lvl - 1) * 0.08;
    return acc + base * lvlMul * u.qty;
  }, 0);

  // Enemy scale roughly to player; add randomness
  const enemyPower = playerPower * (0.9 + Math.random()*0.35);

  const stratMul = {
    aggressive: { atk: 1.10, def: 0.95 },
    silent:     { atk: 1.02, def: 1.03 },
    aa:         { atk: 0.98, def: 1.10 },
    ew:         { atk: 1.00, def: 1.06 },
  }[strat] || { atk: 1.0, def: 1.0 };

  const effectivePlayer = playerPower * stratMul.atk * stratMul.def;
  const chance = clamp(Math.round(50 + (effectivePlayer - enemyPower) / (playerPower + 1) * 35), 10, 90);

  const roll = Math.random() * 100;
  const win = roll <= chance;

  const rewards = win
    ? { xp: Math.round(120 + playerPower * 0.15), credits: Math.round(18000 + playerPower * 0.20) }
    : { xp: 0, credits: 0 };

  const introByStrat = {
    aggressive: 'A frota acelera rumo ao contato, com mísseis em prontidão máxima e regras de engajamento agressivas.',
    silent: 'A frota apaga assinaturas, submarinos assumem a linha de frente e a guerra vira um jogo de sombras.',
    aa: 'Defesas aéreas são priorizadas: radares, interceptadores e cortinas antimíssil entram em modo total.',
    ew: 'Jammers e decoys entram em ação. A batalha vira um labirinto de sinais falsos e alvos fantasmas.',
  };

  const midTitle = win ? 'Superioridade confirmada' : 'Contato hostil dominante';
  const mid = win
    ? 'A estratégia encontra brechas. O inimigo hesita — e cada segundo vira vantagem tática.'
    : 'O inimigo pressiona com coordenação. Sem espaço para erro, o comando calcula o recuo.';

  const outro = win
    ? `Vitória decisiva. Sua inteligência de combate rende +${rewards.xp} XP e +${rewards.credits} créditos.`
    : 'Derrota tática. A frota preserva ativos e recua para reorganização.';

    const events = [
    { t: 0,  title: 'Contato detectado', text: narration.intro },
    { t: 1200, title: midTitle, text: mid },
    { t: 2400, title: 'Desfecho', text: outro },
  ];

  return {
    chance,
    win,
    rewards,
    events,
    narration: {
      intro: introByStrat[strat] || introByStrat.aggressive,
      midTitle, mid, outro
    }
  };
}
