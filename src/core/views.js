import { storage } from './storage.js';
import { toast, money } from './ui.js';
import { ensureBaseContentLoaded } from './content.js';
import { simulateBattle } from './battle/sim.js';
import { renderWorldMap } from './world/map.js';

const view = () => document.getElementById('view');

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
        <div class="kpi">
          <div class="pill"><div class="label">Comandante</div><div class="value">${p.name || '—'}</div></div>
          <div class="pill"><div class="label">Patente</div><div class="value">${storage.get().rank.id}</div></div>
        </div>
        <div style="height:10px"></div>
        <button class="btn" onclick="location.hash='#/hq'">Entrar no Quartel-General</button>
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
        <div class="kpi">
          <div class="pill"><div class="label">Créditos</div><div class="value">${money(s.wallet.credits)}</div></div>
          <div class="pill"><div class="label">Aço</div><div class="value">${money(s.wallet.steel)}</div></div>
        </div>
        <div style="height:10px"></div>
        <div class="row">
          <button class="btn" onclick="location.hash='#/shop'">Comprar Embarcações</button>
          <button class="btn secondary" onclick="location.hash='#/research'">Pesquisa</button>
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
          <div class="thumb">⚓</div>
          <div class="meta">
            <div class="t">${def.name}</div>
            <div class="s">${def.role} • Nível ${f.lvl} • Qtde ${f.qty}</div>
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
      const cards = content.ships.slice(0, 6).map(ship => {
        const disabled = !canBuy(ship.cost);
        return `
          <div class="item">
            <div class="thumb">🛳️</div>
            <div class="meta">
              <div class="t">${ship.name}</div>
              <div class="s">${ship.role} • Poder ${ship.power} • Custo ${money(ship.cost)}</div>
            </div>
            <div class="right">
              <button class="btn ${disabled ? 'secondary' : ''}" style="padding:10px 12px;border-radius:14px" data-buy="${ship.id}">
                ${disabled ? 'Sem créditos' : 'Comprar'}
              </button>
            </div>
          </div>`;
      }).join('');

      const body = `
        ${card('Loja Naval', 'Compre unidades. Você depois substituirá os ícones/imagens por embarcações reais.', `
          <div class="badge">Créditos: ${money(s.wallet.credits)}</div>
          <div class="list" style="margin-top:12px">${cards}</div>
          <hr class="sep"/>
          <button class="btn secondary" onclick="location.hash='#/hq'">Voltar ao Quartel</button>
        `)}
      `;
      view().innerHTML = body;

      view().querySelectorAll('[data-buy]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-buy');
          const ship = content.ships.find(x => x.id === id);
          if(!ship) return;
          storage.set(st => {
            if(st.wallet.credits < ship.cost) return;
            st.wallet.credits -= ship.cost;
            const ex = st.fleet.find(x => x.id === id);
            if(ex) ex.qty += 1;
            else st.fleet.push({ id, lvl: 1, qty: 1 });
          });
          toast('Unidade adquirida');
          views.shop(); // re-render
        });
      });
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
        <div class="row">
          <button class="btn" id="btnWar">Declarar Guerra</button>
          <button class="btn secondary" onclick="location.hash='#/hq'">Voltar</button>
        </div>
        <div class="badge" style="margin-top:10px">Toque em um país para selecionar • Fase 2+ terá rotas navais e fronteiras reais.</div>
      `)}
    `;
    view().innerHTML = body;
    renderWorldMap(document.getElementById('mapMount'));
    document.getElementById('btnWar').onclick = () => {
      toast('Escolha um alvo no mapa (fase 1: demo).');
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
        ${card('A batalha começa…', result.narration.intro, `
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
          <hr class="sep"/>
          <div class="row">
            <button class="btn" id="apply">Aplicar Resultado</button>
            <button class="btn secondary" onclick="location.hash='#/battlePlanning?mode=${encodeURIComponent(mode)}'">Nova Estratégia</button>
          </div>
        `)}
      `;
      view().innerHTML = body;

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
};
