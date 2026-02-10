import { storage } from '../storage.js';

function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

function shipPower(def){
  if(def && typeof def.power === 'number') return def.power;
  const st = def?.stats || {};
  const atk = Number(st.atk ?? 50);
  const df  = Number(st.def ?? 50);
  const spd = Number(st.spd ?? 50);
  const stealth = Number(st.stealth ?? 0);
  return Math.round(atk*0.55 + df*0.35 + spd*0.18 + stealth*0.22);
}

function fleetAggregatePower(fleet, shipsById){
  let power = 0;
  let support = 0;
  for(const u of (fleet||[])){
    const def = shipsById[u.id] || {};
    const base = shipPower(def);
    const lvlMul = 1 + (Math.max(1, u.lvl||1) - 1) * 0.08;
    const qty = Math.max(0, u.qty || 0);
    power += base * lvlMul * qty;
    const role = (def.role || '').toLowerCase();
    if(role.includes('suporte')) support += qty;
    if(u.id === 'support_oiler') support += qty * 2;
  }
  power *= (1 + clamp(support * 0.015, 0, 0.18));
  return Math.max(0, power);
}

export function simulateBattle({ content, strat }){
  const s = storage.get();
  const upg = s.upgrades || {};
  const upSonar = Number(upg.sonar||0);
  const upECM = Number(upg.ecm||0);
  const upAA = Number(upg.aa||0);
  const upHull = Number(upg.hull||0);
  const upTorp = Number(upg.torpedo||0);

  const shipsById = Object.fromEntries((content.ships||[]).map(x => [x.id, x]));

  const playerPower = fleetAggregatePower(s.fleet || [], shipsById);
  const hasFleet = playerPower > 0;

  const enemyPower = Math.max(80, playerPower * (0.85 + Math.random()*0.45));

  const stratMul = {
    aggressive: { atk: 1.12, def: 0.95 },
    silent:     { atk: 1.03, def: 1.03 },
    aa:         { atk: 0.98, def: 1.10 },
    ew:         { atk: 1.00, def: 1.06 },
  }[strat] || { atk: 1.0, def: 1.0 };

  const effectivePlayer = hasFleet ? playerPower * stratMul.atk * stratMul.def : 0;
  const chanceRaw = 50 + (effectivePlayer - enemyPower) / (Math.max(playerPower, 1)) * 35;
  const chance = hasFleet ? clamp(Math.round(chanceRaw), 8, 92) : 0;

  const roll = Math.random() * 100;
  const win = hasFleet && (roll <= chance);

  const rewards = win
    ? { xp: Math.round(120 + playerPower * 0.14), credits: Math.round(18000 + playerPower * 0.18) }
    : { xp: 0, credits: 0 };

  const introByStrat = {
    _up: `Sistemas: Sonar ${upSonar}, ECM ${upECM}, AA ${upAA}, Casco ${upHull}, Torpedos ${upTorp}.`,
    aggressive: { icon:'⚔️', title:'Contato detectado', text:'A frota acelera rumo ao contato, com mísseis em prontidão máxima e regras de engajamento agressivas.' },
    silent:     { icon:'🫧', title:'Silêncio no mar', text:'Assinaturas são reduzidas. Submarinos assumem a linha de frente e a guerra vira um jogo de sombras.' },
    aa:         { icon:'🛡️', title:'Escudo aéreo', text:'Defesas aéreas são priorizadas: radares, interceptadores e cortinas antimíssil entram em modo total.' },
    ew:         { icon:'📡', title:'Guerra eletrônica', text:'Jammers e decoys entram em ação. A batalha vira um labirinto de sinais falsos e alvos fantasmas.' },
  };

  const midTitle = win ? 'Superioridade confirmada' : 'Contato hostil dominante';
  const midIcon  = win ? '🏆' : '⚠️';
  const mid = win
    ? 'A estratégia encontra brechas. O inimigo hesita — e cada segundo vira vantagem tática.'
    : 'O inimigo pressiona com coordenação. Sem espaço para erro, o comando calcula o recuo.';

  const outro = win
    ? `Vitória decisiva. Sua inteligência de combate rende +${rewards.xp} XP e +${rewards.credits} créditos.`
    : (hasFleet ? 'Derrota tática. A frota preserva ativos e recua para reorganização.' : 'Sem frota disponível. O comando cancela o confronto e ordena retorno ao porto.');

  const intro = introByStrat[strat] || introByStrat.aggressive;

  const events = [
    { t: 0,    icon: intro.icon, title: intro.title, text: intro.text },
    { t: 1400, icon: '🛰️', title: 'Inteligência tática', text: 'Satélites, sonar e radares compõem o quadro. ${introByStrat._up}' },
    { t: 2900, icon: '💥', title: 'Primeiro engajamento', text: 'Lançamentos, manobras evasivas e contramedidas. O oceano vira campo de cálculo.' },
    { t: 4500, icon: midIcon, title: midTitle, text: mid },
    { t: 6100, icon: '📜', title: 'Desfecho', text: outro },
  ];

  return {
    chance,
    win,
    rewards,
    enemyPower: Math.round(enemyPower),
    playerPower: Math.round(playerPower),
    events,
    narration: { intro: intro.text, midTitle, mid, outro }
  };
}
