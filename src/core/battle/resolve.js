import { storage } from '../storage.js?v=2026-02-11_205704';

export function applyBattleResult({ result, context }){
  storage.set(s => {
    if(result.win){
      s.rank.xp += result.rewards.xp;
      s.wallet.credits += result.rewards.credits;
      s.wallet.intel += 12;

      const pool = (s.fleet||[]).filter(x => (x.qty||0) > 0);
      if(pool.length){
        const pick = pool[Math.floor(Math.random()*pool.length)];
        pick.lvl = Math.min(20, (pick.lvl||1) + 1);
      }

      if(context?.mode === 'world' && context?.target){
        const t = context.target;
        s.world.conquered = Array.from(new Set([...(s.world.conquered||[]), t]));
        s.world.enemies = (s.world.enemies||[]).filter(x => x !== t);
      }
    } else {
      s.wallet.fuel = Math.max(0, (s.wallet.fuel||0) - 220);

      const lossRate = Math.min(0.25, Math.max(0.06, (result.enemyPower - result.playerPower) / Math.max(result.enemyPower,1) * 0.18 + 0.08));
      for(const u of (s.fleet||[])){
        if((u.qty||0) <= 0) continue;
        const lose = Math.random() < lossRate ? 1 : 0;
        u.qty = Math.max(0, u.qty - lose);
      }
    }

    s.day = (s.day||1) + 1;

    const c = (s.world.conquered||[]).length;
    s.wallet.credits += Math.round(c * 850);
    s.wallet.steel += Math.round(c * 35);
  });
}
