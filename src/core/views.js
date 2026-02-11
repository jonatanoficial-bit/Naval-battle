import { storage } from './storage.js?v=2026-02-11_170809';
import { toast, money } from './ui.js?v=2026-02-11_170809';
import { ensureBaseContentLoaded } from './content.js?v=2026-02-11_170809';
import { simulateBattle } from './battle/sim.js?v=2026-02-11_170809';
import { applyBattleResult } from './battle/resolve.js?v=2026-02-11_170809';
import { renderWorldMap } from './world/map.js?v=2026-02-11_170809';

const view = () => document.getElementById('view');

function shipThumb(img, emoji='⚓'){
  if(!img) return `<div class="thumb ship">${emoji}</div>`;
  return `<div class="thumb ship"><img src="${img}" alt="" loading="lazy"></div>`;
}

function shipPowerLabel(ship){
  const st = ship.stats || {};
  const atk = Number(st.atk ?? 50);
  const df  = Number(st.def ?? 50);
  const spd = Number(st.spd ?? 50);
  const stealth = Number(st.stealth ?? 0);
  const p = ship.power ?? Math.round(atk*0.55 + df*0.35 + spd*0.18 + stealth*0.22);
  return { p, atk, df, spd, stealth };
}

function card(title, subtitle, inner){
  return `
  <section class="card">
    <h1 class="h1">${title}</h1>
    <p class="p">${subtitle}</p>
    <div style="margin-top:12px">${inner}</div>
  </section>`;
}

export const views = {
  home(){
    const p = storage.getProfile();
    const body = `
      ${card('Operação Início', 'Escolha um modo e avance na carreira naval.', `
        <div id="final" style="display:none">
          <div class="kpi">
          <div class="pill"><div class="label">Comandante</div><div class="value">${p.name || '—'}</div></div>
          <div class="pill"><div class="label">Patente</div><div class="value">${storage.get().rank.id}</div></div>
        </div>
        <div style="height:10px"></div>
        <button class="btn" onclick="location.hash='#/hq'">Entrar no Quartel-General</button>
        <div style="height:10px"></div>
        <button class="btn secondary" onclick="location.hash='#/settings'">Ajustes Visuais</button>
        <div style="height:10px"></div>
        <button class="btn secondary" onclick="location.hash='#/profile'">Criar / Editar Perfil</button>
      `)}
      ${card('Modos', 'Fase 1 inclui loop de missão e dominação em versão MVP.', `
        <div class="row">
          <button class="btn" onclick="location.hash='#/intel'">Campanha (WW3)</button>
          <button class="btn secondary" onclick="location.hash='#/world'">Dominação Mundial</button>
        </div>
      `)}
    `;
    view().innerHTML = body;
  },

  profile(params){
    const next = params.get('next') || '#/home';
    const p = storage.getProfile();
    const body = `
      ${card('Criar Perfil', 'Defina seu nome de comandante. Avatares serão substituídos por imagens reais depois.', `
        <label class="small">Nome do Comandante</label>
        <div style="height:8px"></div>
        <input class="input" id="name" placeholder="Ex.: Almirante Vale" value="${p.name || ''}" maxlength="22"/>
        <div style="height:10px"></div>
        <div class="card" style="padding:12px">
          <div class="badge">Alvo selecionado: <span id="target">nenhum</span></div>
          <div class="small" style="margin-top:8px">Vitória adiciona o país à sua lista de conquistados.</div>
        </div>
        <div style="height:10px"></div>
        <div class="row">
          <button class="btn" id="save">Salvar</button>
          <button class="btn secondary" onclick="location.hash='${next}'">Voltar</button>
        </div>
        <div style="height:10px"></div>
        <div class="badge">Dica: no futuro, avatar será upload (Admin) e também multiplayer.</div>
      `)}
    `;
    view().innerHTML = body;
    document.getElementById('save').onclick = () => {
      const name = (document.getElementById('name').value || '').trim();
      if(name.length < 2){ toast('Digite um nome válido'); return; }
      storage.setProfile({ name });
      toast('Perfil salvo');
      location.hash = next;
    };
  },

  hq(){
    const s = storage.get();
    const body = `
      ${card('Quartel-General', 'Gerencie recursos, frota e avance na patente.', `
        <div id="final" style="display:none">
          <div class="kpi">
          <div class="pill"><div class="label">Créditos</div><div class="value">${money(s.wallet.credits)}</div></div>
          <div class="pill"><div class="label">Aço</div><div class="value">${money(s.wallet.steel)}</div></div>
        </div>
        <div style="height:10px"></div>
        <div class="card" style="padding:12px">
          <div class="badge">Alvo selecionado: <span id="target">nenhum</span></div>
          <div class="small" style="margin-top:8px">Vitória adiciona o país à sua lista de conquistados.</div>
        </div>
        <div style="height:10px"></div>
        <div class="row">
          <button class="btn" onclick="location.hash='#/shop'">Comprar Embarcações</button>
          <button class="btn secondary" onclick="location.hash='#/research'">Pesquisa</button>
          <button class="btn secondary" onclick="location.hash='#/upgrades'">Oficina (Upgrades)</button>
        </div>
      `)}
      ${card('Ações rápidas', 'Inicie uma missão ou simule um confronto.', `
        <div class="row">
          <button class="btn" onclick="location.hash='#/intel'">Briefing de Missão</button>
          <button class="btn secondary" onclick="location.hash='#/battlePlanning'">Simular Batalha</button>
        </div>
      `)}
    `;
    view().innerHTML = body;
  },

  fleet(){
    return views.fleetList();
  },

  fleetList(){
    return ensureBaseContentLoaded().then(content => {
      const s = storage.get();
      const shipsById = Object.fromEntries(content.ships.map(x => [x.id, x]));
      const items = s.fleet.map(f => {
        const def = shipsById[f.id] || { name: f.id, role:'—' };
        return `
        <div class="item">
          <div class="thumb ship"><img src="${def.img || ''}" alt="" loading="lazy" onerror="this.remove();"></div>
          <div class="meta">
            <div class="t">${def.name}</div>
            <div class="s">${def.role} • Nível ${f.lvl} • Qtde ${f.qty}${def.special ? ' • ' + def.special : ''}</div>
          </div>
        </div>`;
      }).join('');

      const body = `
        ${card('Sua Frota', 'Fase 1: frota e upgrades básicos (expandível via DLC).', `
          <div class="list">${items}</div>
          <hr class="sep"/>
          <button class="btn" onclick="location.hash='#/shop'">Ir para Loja</button>
        `)}
      `;
      view().innerHTML = body;
    });
  },


  shop(){
    return ensureBaseContentLoaded().then(content => {
      const s = storage.get();
      const canBuy = (cost) => s.wallet.credits >= cost;

      const ships = [...(content.ships||[])].sort((a,b) => {
        const ta = Number(a.tier||1), tb = Number(b.tier||1);
        if(ta !== tb) return ta - tb;
        return Number(a.cost||0) - Number(b.cost||0);
      });

      const body = `
        ${card('Loja Naval', 'Compre unidades. As imagens desta Fase 3 já entram automaticamente na frota/loja/batalhas.', `
          <div class="kpi">
            <div class="pill"><div class="label">Créditos</div><div class="value">${money(s.wallet.credits)}</div></div>
            <div class="pill"><div class="label">Frota</div><div class="value">${(s.fleet||[]).reduce((a,x)=>a+(x.qty||0),0)} unidades</div></div>
          </div>
          <div style="height:12px"></div>
          <input class="input" id="q" placeholder="Buscar embarcação (ex: submarino, fragata, porta-aviões)" />
          <div style="height:10px"></div>
          <div class="row" style="gap:10px;flex-wrap:wrap">
            <button class="btn secondary" data-filter="all" style="padding:10px 12px;border-radius:14px">Todas</button>
            <button class="btn secondary" data-filter="Submarino" style="padding:10px 12px;border-radius:14px">Submarinos</button>
            <button class="btn secondary" data-filter="Superfície" style="padding:10px 12px;border-radius:14px">Superfície</button>
            <button class="btn secondary" data-filter="Suporte" style="padding:10px 12px;border-radius:14px">Suporte</button>
          </div>
          <div style="height:12px"></div>
          <div class="list" id="list"></div>
          <hr class="sep"/>
          <button class="btn secondary" onclick="location.hash='#/hq'">Voltar ao Quartel</button>
        `)}
      `;

      view().innerHTML = body;

      let roleFilter = 'all';
      const q = document.getElementById('q');
      const list = document.getElementById('list');

      const render = () => {
        const term = (q.value||'').trim().toLowerCase();
        const filtered = ships.filter(ship => {
          const role = (ship.role||'');
          const okRole = roleFilter==='all' ? true : role.includes(roleFilter);
          if(!okRole) return false;
          if(!term) return true;
          return (ship.name||'').toLowerCase().includes(term) || role.toLowerCase().includes(term) || (ship.special||'').toLowerCase().includes(term);
        });

        list.innerHTML = filtered.map(ship => {
          const st = shipPowerLabel(ship);
          const disabled = !canBuy(ship.cost);
          return `
            <div class="item">
              ${shipThumb(ship.img,'🛳️')}
              <div class="meta">
                <div class="t">${ship.name}</div>
                <div class="s">${ship.role} • Tier ${ship.tier||1} • Poder ${st.p} • Custo ${money(ship.cost||0)}</div>
                <div class="s" style="margin-top:6px">ATK ${st.atk} • DEF ${st.df} • SPD ${st.spd}${st.stealth ? ' • STEALTH '+st.stealth : ''}${ship.special ? ' • ' + ship.special : ''}</div>
              </div>
              <div class="right">
                <button class="btn ${disabled ? 'secondary' : ''}" style="padding:10px 12px;border-radius:14px" data-buy="${ship.id}">
                  ${disabled ? 'Sem créditos' : 'Comprar'}
                </button>
              </div>
            </div>`;
        }).join('');

        list.querySelectorAll('[data-buy]').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-buy');
            const ship = ships.find(x => x.id === id);
            if(!ship) return;
            applyBattleResult({ result, context: { mode, target: params.get('target') } });
        toast('Unidade adquirida');
            views.shop();
          });
        });
      };

      q.addEventListener('input', render);
      view().querySelectorAll('[data-filter]').forEach(b => {
        b.addEventListener('click', () => {
          roleFilter = b.getAttribute('data-filter');
          view().querySelectorAll('[data-filter]').forEach(x => x.classList.add('secondary'));
          b.classList.remove('secondary');
          render();
        });
      });

      // default active
      view().querySelector('[data-filter="all"]').classList.remove('secondary');
      render();
    });
  },


  research(){
    const body = `
      ${card('Pesquisa & Tecnologia', 'Fase 1: árvore simples. (Fase 2+ adiciona módulos, sonar, ECM, AA etc.)', `
        <div class="list">
          <div class="item">
            <div class="thumb">🛰️</div>
            <div class="meta"><div class="t">Sonar Melhorado</div><div class="s">+5% precisão submarina</div></div>
            <div class="right"><span class="badge">Em breve</span></div>
          </div>
          <div class="item">
            <div class="thumb">🛡️</div>
            <div class="meta"><div class="t">Defesa Aérea</div><div class="s">+5% resistência a mísseis</div></div>
            <div class="right"><span class="badge">Em breve</span></div>
          </div>
        </div>
        <hr class="sep"/>
        <button class="btn secondary" onclick="location.hash='#/hq'">Voltar</button>
      `)}
    `;
    view().innerHTML = body;
  },

  ranks(){
    const s = storage.get();
    const body = `
      ${card('Carreira', 'Ganhe XP em missões e suba de patente.', `
        <div id="final" style="display:none">
          <div class="kpi">
          <div class="pill"><div class="label">Patente atual</div><div class="value">${s.rank.id}</div></div>
          <div class="pill"><div class="label">XP</div><div class="value">${money(s.rank.xp)}</div></div>
        </div>
        <div style="height:12px"></div>
        <button class="btn" onclick="location.hash='#/intel'">Ir para Missões</button>
      `)}
      ${card('Patentes (base)', 'No futuro, patentes podem variar por nação via DLC.', `
        <div class="badge">Recruta → Marinheiro → Cabo → Sargento → Tenente → Capitão → Contra-Almirante → Vice-Almirante → Almirante</div>
      `)}
    `;
    view().innerHTML = body;
  },

  intel(){
    return ensureBaseContentLoaded().then(content => {
      const mission = content.missions[0];
      const body = `
        ${card('Briefing — Campanha (WW3)', mission.briefing, `
          <div class="list">
            ${mission.objectives.map(o => `<div class="item"><div class="thumb">🎯</div><div class="meta"><div class="t">${o}</div><div class="s">Recompensa: XP</div></div></div>`).join('')}
          </div>
          </div>
          <hr class="sep"/>
          <div class="row">
            <button class="btn" onclick="location.hash='#/battlePlanning?mode=mission'">Iniciar Missão</button>
            <button class="btn secondary" onclick="location.hash='#/home'">Voltar</button>
          </div>
        `)}
      `;
      view().innerHTML = body;
    });
  },

  world(){
    const body = `
      ${card('Dominação Mundial', 'Mapa real (SVG simplificado nesta fase). Depois substituiremos por GeoJSON detalhado.', `
        <div class="mapWrap">
          <div class="mapUI"></div>
          <div id="mapMount"></div>
        </div>
        <div style="height:10px"></div>
        <div class="card" style="padding:12px">
          <div class="badge">Alvo selecionado: <span id="target">nenhum</span></div>
          <div class="small" style="margin-top:8px">Vitória adiciona o país à sua lista de conquistados.</div>
        </div>
        <div style="height:10px"></div>
        <div class="row">
          <button class="btn" id="btnWar">Declarar Guerra</button>
          <button class="btn secondary" onclick="location.hash='#/hq'">Voltar</button>
        </div>
        <div class="badge" style="margin-top:10px">Toque em um país para selecionar • Fase 2+ terá rotas navais e fronteiras reais.</div>
      `)}
    `;
    view().innerHTML = body;
    const mount = document.getElementById('mapMount');
    let selected = null;
    mount.addEventListener('country:selected', (e) => { selected = e.detail; storage.set(s=>{ s.world.selected = e.detail.iso; }); });
    renderWorldMap(mount);
    const tEl = document.getElementById('target');
    tEl.textContent = storage.get().world?.selected || 'nenhum';
    mount.addEventListener('country:selected', (e)=>{ tEl.textContent = e.detail.iso; });
    document.getElementById('btnWar').onclick = () => {
      if(!selected){ toast('Selecione um país no mapa'); return; }
      // Fase 2: iniciar batalha rápida contra o país selecionado
      location.hash = '#/battlePlanning?mode=world&target=' + encodeURIComponent(selected.iso);
    };
  },

  battlePlanning(params){
    const mode = params.get('mode') || 'skirmish';
    const body = `
      ${card('Planejamento de Batalha', 'Escolha uma doutrina. A simulação usa frota + estratégia.', `
        <div class="list">
          <div class="item">
            <div class="thumb">⚔️</div>
            <div class="meta"><div class="t">Agressiva</div><div class="s">Maior dano, maior risco</div></div>
            <div class="right"><button class="btn" style="padding:10px 12px;border-radius:14px" data-strat="aggressive">Selecionar</button></div>
          </div>
          <div class="item">
            <div class="thumb">🫧</div>
            <div class="meta"><div class="t">Silenciosa</div><div class="s">Stealth e submarinos</div></div>
            <div class="right"><button class="btn" style="padding:10px 12px;border-radius:14px" data-strat="silent">Selecionar</button></div>
          </div>
          <div class="item">
            <div class="thumb">🛡️</div>
            <div class="meta"><div class="t">Defesa Aérea</div><div class="s">Resiste a mísseis</div></div>
            <div class="right"><button class="btn" style="padding:10px 12px;border-radius:14px" data-strat="aa">Selecionar</button></div>
          </div>
          <div class="item">
            <div class="thumb">📡</div>
            <div class="meta"><div class="t">Guerra Eletrônica</div><div class="s">Reduz precisão inimiga</div></div>
            <div class="right"><button class="btn" style="padding:10px 12px;border-radius:14px" data-strat="ew">Selecionar</button></div>
          </div>
        </div>
        <hr class="sep"/>
        <div class="row">
          <button class="btn secondary" onclick="location.hash='${mode==='mission' ? '#/intel' : '#/hq'}'">Voltar</button>
        </div>
      `)}
    `;
    view().innerHTML = body;

    view().querySelectorAll('[data-strat]').forEach(b => {
      b.addEventListener('click', () => {
        const strat = b.getAttribute('data-strat');
        location.hash = `#/battleNarration?mode=${encodeURIComponent(mode)}&strat=${encodeURIComponent(strat)}`;
      });
    });
  },

  battleNarration(params){
    return ensureBaseContentLoaded().then(content => {
      const mode = params.get('mode') || 'skirmish';
      const strat = params.get('strat') || 'aggressive';
      const result = simulateBattle({ content, strat });

      const body = `
        ${card('Batalha em tempo real (narrativa)', 'A narração acontece em etapas, com ritmo e emoção. Você pode acelerar.', `
          <div class="badge">Modo: ${mode} • Estratégia: ${strat}</div>
          <div style="height:10px"></div>
          <div class="row" style="gap:10px;flex-wrap:wrap">
            <button class="btn" id="start">Iniciar Narração</button>
            <button class="btn secondary" id="skip" style="padding:10px 12px;border-radius:14px">Pular</button>
            <select class="input" id="speed" style="max-width:160px">
              <option value="1">Velocidade 1x</option>
              <option value="2">Velocidade 2x</option>
              <option value="4">Velocidade 4x</option>
            </select>
          </div>
          <div style="height:10px"></div>
          <div class="badge" style="padding:10px 12px">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
              <span>Progresso</span>
              <span id="progLabel">0%</span>
            </div>
            <div style="height:10px"></div>
            <div style="height:10px;background:rgba(255,255,255,.10);border-radius:999px;overflow:hidden">
              <div id="progBar" style="height:100%;width:0%;background:linear-gradient(90deg, rgba(111,231,255,.9), rgba(255,211,138,.85))"></div>
            </div>
          </div>
          <div style="height:10px"></div>
          <div style="height:10px"></div>
          <div id="timeline" class="list"></div>
          <hr class="sep"/>

          <div id="final" style="display:none">
          <div class="kpi">
            <div class="pill"><div class="label">Chance estimada</div><div class="value">${result.chance}%</div></div>
            <div class="pill"><div class="label">Resultado</div><div class="value">${result.win ? 'Vitória' : 'Derrota'}</div></div>
          </div>
          <div style="height:12px"></div>
          <div class="item">
            <div class="thumb">${result.win ? '🏆' : '⚠️'}</div>
            <div class="meta"><div class="t">${result.narration.midTitle}</div><div class="s">${result.narration.mid}</div></div>
          </div>
          <div style="height:10px"></div>
          <div class="item">
            <div class="thumb">📜</div>
            <div class="meta"><div class="t">Relatório</div><div class="s">${result.narration.outro}</div></div>
          </div>
          </div>
          <hr class="sep"/>
          <div class="row">
            <button class="btn" id="apply" disabled style="opacity:.65">Aplicar Resultado</button>
            <button class="btn secondary" onclick="location.hash='#/battlePlanning?mode=${encodeURIComponent(mode)}'">Nova Estratégia</button>
          </div>
        `)}
      `;
      view().innerHTML = body;

      const timeline = document.getElementById('timeline');
      const startBtn = document.getElementById('start');
      const skipBtn = document.getElementById('skip');
      const applyBtn = document.getElementById('apply');
      const final = document.getElementById('final');

      function addEvent(icon, title, text){
        const el = document.createElement('div');
        el.className = 'item';
        el.innerHTML = `
          <div class="thumb">${icon}</div>
          <div class="meta"><div class="t">${title}</div><div class="s">${text}</div></div>
        `;
        timeline.appendChild(el);
        el.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }

      let running = false;
      skipBtn.onclick = () => {
        timeline.innerHTML = '';
        for(const e of result.events){ addEvent(e.icon || '📡', e.title, e.text); }
        final.style.display = 'block';
        applyBtn.disabled = false;
        applyBtn.style.opacity = '1';
        toast('Narração pulada');
      };

      startBtn.onclick = async () => {
        if(running) return;
        running = true;
        startBtn.disabled = true;
        startBtn.style.opacity = '.65';
        timeline.innerHTML = '';

        const speedSel = document.getElementById('speed');
        const total = (result.events[result.events.length-1]?.t || 0);
        const startAt = performance.now();
        const tick = () => {
          const sp = Number(speedSel.value||1);
          const elapsed = (performance.now() - startAt) * sp;
          const pct = total ? Math.min(100, Math.round((elapsed/total)*100)) : 0;
          document.getElementById('progLabel').textContent = pct + '%';
          document.getElementById('progBar').style.width = pct + '%';
          if(pct < 100) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);

        let lastT = 0;
        for(const e of result.events){
          const sp = Number(speedSel.value||1);
          const wait = Math.max(250, (e.t - lastT) / sp);
          lastT = e.t;
          await new Promise(r => setTimeout(r, wait));
          addEvent(e.icon || '📡', e.title, e.text);
        }

        // Reveal final summary
        final.style.display = 'block';
        applyBtn.disabled = false;
        applyBtn.style.opacity = '1';
        toast('Narração concluída');
      };

      document.getElementById('apply').onclick = () => {
        storage.set(s => {
          if(result.win){
            s.rank.xp += result.rewards.xp;
            s.wallet.credits += result.rewards.credits;
            s.wallet.intel += 10;
          }else{
            s.wallet.fuel = Math.max(0, s.wallet.fuel - 120);
          }
        });
        toast(result.win ? 'Recompensas recebidas' : 'Recuo tático executado');
        location.hash = mode === 'mission' ? '#/intel' : '#/hq';
      };
    });
  },

  
  settings(){
    const s = storage.get();
    const bgDim = s.ui?.bgDim ?? 0.62;
    const body = `
      ${card('Ajustes Visuais', 'Melhore a visibilidade dos fundos no PC e no celular.', `
        <label class="small">Intensidade da sombra do fundo (quanto menor, mais visível)</label>
        <div style="height:10px"></div>
        <input class="range" id="bgDim" type="range" min="0.20" max="0.85" step="0.01" value="${bgDim}">
        <div style="height:10px"></div>
        <div class="badge">Atual: ${bgDim.toFixed(2)}</div>
        <hr class="sep"/>
        <button class="btn" id="save">Salvar</button>
        <div style="height:10px"></div>
        <button class="btn secondary" onclick="location.hash='#/home'">Voltar</button>
      `)}
    `;
    view().innerHTML = body;

    const input = document.getElementById('bgDim');
    const badge = view().querySelector('.badge');
    input.addEventListener('input', () => {
      const v = Number(input.value);
      badge.textContent = 'Atual: ' + v.toFixed(2);
      document.documentElement.style.setProperty('--bgDim', String(v));
    });

    document.getElementById('save').onclick = () => {
      const v = Number(input.value);
      storage.set(st => { st.ui = { ...(st.ui||{}), bgDim: v }; });
      toast('Ajuste salvo');
    };
  },
admin(){
    const body = `
      ${card('Admin (local)', 'Fase 1: login por PIN e gestão de DLC via import/export JSON.', `
        <label class="small">PIN</label>
        <div style="height:8px"></div>
        <input class="input" id="pin" placeholder="0000" maxlength="8" inputmode="numeric"/>
        <div style="height:10px"></div>
        <button class="btn" id="login">Entrar</button>
        <div style="height:10px"></div>
        <button class="btn secondary" onclick="location.hash='#/home'">Voltar</button>
      `)}
    `;
    view().innerHTML = body;
    document.getElementById('login').onclick = () => {
      const pin = (document.getElementById('pin').value || '').trim();
      if(pin !== '0000'){ toast('PIN inválido'); return; }
      location.hash = '#/admin-panel';
    };
  },

  'admin-panel'(){
    const s = storage.get();
    const enabled = s.dlcEnabled || [];
    const body = `
      ${card('Admin • Painel', 'Ative DLCs (existentes na pasta /src/content/dlc) e exporte/import o estado.', `
        <div class="badge">DLCs ativados: ${enabled.length ? enabled.join(', ') : 'nenhum'}</div>
        <div style="height:12px"></div>

        <label class="small">Ativar DLC (ID)</label>
        <div style="height:8px"></div>
        <input class="input" id="dlcid" placeholder="ex.: dlc_001_atlantic"/>
        <div style="height:10px"></div>
        <div class="card" style="padding:12px">
          <div class="badge">Alvo selecionado: <span id="target">nenhum</span></div>
          <div class="small" style="margin-top:8px">Vitória adiciona o país à sua lista de conquistados.</div>
        </div>
        <div style="height:10px"></div>
        <div class="row">
          <button class="btn" id="enable">Ativar</button>
          <button class="btn secondary" id="disable">Desativar</button>
        </div>

        <hr class="sep"/>
        <div class="row">
          <button class="btn" id="export">Exportar Save JSON</button>
          <button class="btn secondary" id="import">Importar Save JSON</button>
        </div>

        <div style="height:10px"></div>
        <button class="btn secondary" onclick="location.hash='#/home'">Sair</button>
      `)}
    `;
    view().innerHTML = body;

    document.getElementById('enable').onclick = () => {
      const id = (document.getElementById('dlcid').value || '').trim();
      if(!id) return toast('Digite o ID');
      storage.set(st => {
        st.dlcEnabled = Array.from(new Set([...(st.dlcEnabled||[]), id]));
      });
      toast('DLC ativado (recarregue a página para aplicar)');
    };
    document.getElementById('disable').onclick = () => {
      const id = (document.getElementById('dlcid').value || '').trim();
      if(!id) return toast('Digite o ID');
      storage.set(st => {
        st.dlcEnabled = (st.dlcEnabled||[]).filter(x => x !== id);
      });
      toast('DLC desativado (recarregue a página para aplicar)');
    };

    document.getElementById('export').onclick = () => {
      const data = JSON.stringify(storage.get(), null, 2);
      const blob = new Blob([data], { type:'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'batalha-naval-save.json';
      a.click();
      URL.revokeObjectURL(url);
    };
    document.getElementById('import').onclick = async () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.onchange = async () => {
        const file = input.files?.[0];
        if(!file) return;
        const text = await file.text();
        try{
          const parsed = JSON.parse(text);
          localStorage.setItem('bn1_state_v1', JSON.stringify(parsed));
          toast('Importado. Recarregando…');
          setTimeout(() => location.reload(), 600);
        }catch{
          toast('JSON inválido');
        }
      };
      input.click();
    };
  },

  upgrades(){
    const s = storage.get();
    const u = s.upgrades || { sonar:0, ecm:0, aa:0, hull:0, torpedo:0 };
    const costFor = (lvl) => Math.round(12000 + lvl*9000);
    const body = `
      ${card('Oficina • Upgrades', 'Melhore sua frota. Estes upgrades afetam diretamente a chance e o desempenho nas batalhas.', `
        <div class="badge">Dia ${s.day || 1} • Créditos: ${money(s.wallet.credits)}</div>
        <div style="height:12px"></div>
        <div class="list">
          ${['sonar','ecm','aa','hull','torpedo'].map(k => {
            const label = ({sonar:'Sonar',ecm:'ECM',aa:'Defesa Aérea',hull:'Casco',torpedo:'Torpedos'})[k];
            const lvl = Number(u[k]||0);
            const cost = costFor(lvl);
            const disabled = s.wallet.credits < cost;
            const desc = ({sonar:'+detecção/submarinos',ecm:'-precisão inimiga',aa:'resistência a mísseis',hull:'+durabilidade',torpedo:'+dano submarino'})[k];
            return `
            <div class="item">
              <div class="thumb">🔧</div>
              <div class="meta">
                <div class="t">${label} • Nível ${lvl}</div>
                <div class="s">${desc} • Próximo: ${money(cost)} créditos</div>
              </div>
              <div class="right">
                <button class="btn ${disabled?'secondary':''}" style="padding:10px 12px;border-radius:14px" data-up="${k}">${disabled?'Sem créditos':'Evoluir'}</button>
              </div>
            </div>`;
          }).join('')}
        </div>
        <hr class="sep"/>
        <button class="btn secondary" onclick="location.hash='#/hq'">Voltar</button>
      `)}
    `;

    view().innerHTML = body;
    view().querySelectorAll('[data-up]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-up');
        const lvl = Number((storage.get().upgrades||{})[key]||0);
        const cost = costFor(lvl);
        storage.set(st => {
          if(st.wallet.credits < cost) return;
          st.wallet.credits -= cost;
          st.upgrades = { ...(st.upgrades||{}), [key]: lvl + 1 };
        });
        toast('Upgrade aplicado');
        views.upgrades();
      });
    });
  },

};

export { views };
