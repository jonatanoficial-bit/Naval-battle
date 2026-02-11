
import { ui } from './ui.js?v=2026-02-11_205704';
import { content } from './content.js?v=2026-02-11_205704';
import { formatMoney } from './utils.js?v=2026-02-11_205704';
import { buildWorldMap, updateWorldStyles } from './world/map.js?v=2026-02-11_205704';
import { simulateBattle, calcFleetPower } from './battle/sim.js?v=2026-02-11_205704';

function screenShell({bgPath, title, subtitle, pills = []}, body){
  const bg = ui.el('div', { class:'bg', style: `background-image:url('${bgPath}')` });
  const shell = ui.el('div', { class:'shell' });

  const left = ui.el('div', { class:'brand' }, [
    ui.el('div', { class:'title' }, [title]),
    ui.el('div', { class:'sub' }, [subtitle]),
  ]);

  const pillsEl = ui.el('div', { class:'pills' }, pills.map(p => ui.el('div',{class:'pill'},[
    ui.el('b',{},[p.v]),
    ui.el('span',{},[p.k]),
  ])));

  const top = ui.el('div', { class:'topbar' }, [left, pillsEl]);
  shell.appendChild(top);
  shell.appendChild(body);

  const root = ui.el('div', {}, [bg, shell]);
  return root;
}

function navBar(store, router){
  const isReady = !!store.state.player?.name;
  return ui.el('div', {class:'nav'}, [
    ui.el('button', {class:'btn ghost small', onClick: ()=>router.go(isReady?'hq':'home')}, ['Menu']),
    ui.el('button', {class:'btn ghost small', onClick: ()=>router.go('world')}, ['Dominação']),
    ui.el('button', {class:'btn ghost small', onClick: ()=>router.go('missions')}, ['Missões']),
    ui.el('button', {class:'btn ghost small', onClick: ()=>router.go('store')}, ['Frota']),
    ui.el('button', {class:'btn ghost small', onClick: ()=>router.go('ranks')}, ['Carreira']),
  ]);
}

export const screens = {
  home(store, router){
    const body = ui.el('div', { class:'grid' }, [
      ui.el('div', { class:'card' }, [ui.el('div',{class:'inner'},[
        ui.el('h1',{class:'h1'},['Batalha Naval']),
        ui.el('p',{class:'p'},['Guerra naval moderna em turnos. Comece como recruta, suba de patente e conquiste o mundo. (Fase 1: MVP single-player)']),
        ui.el('div',{class:'btnrow'},[
          ui.el('button',{class:'btn primary', onClick: ()=> router.go(store.state.player?'hq':'profile')},[store.state.player?'Continuar':'Iniciar']),
          ui.el('button',{class:'btn ghost', onClick: ()=> router.go('about')},['Sobre a Fase 1']),
        ]),
      ])]),
      ui.el('div',{class:'card'},[ui.el('div',{class:'inner'},[
        ui.el('h2',{style:'margin:0; font-size:16px'},['Dica']),
        ui.el('p',{class:'p'},['A UI é real (HTML/CSS). As imagens são fundos cinematográficos. Você poderá substituir por fotos reais de submarinos/navios depois, sem quebrar o jogo.']),
        ui.el('div',{class:'btnrow'},[
          ui.el('a',{class:'btn gold', href:'admin/index.html', target:'_blank', rel:'noopener'},['Abrir Admin']),
          ui.el('button',{class:'btn danger', onClick: ()=>{ if(confirm('Resetar progresso?')){store.reset(); router.go('home');}}},['Resetar']),
        ])
      ])])
    ]);

    return screenShell({
      bgPath: 'assets/img/backgrounds/bg_001_home.webp',
      title: 'BATALHA NAVAL',
      subtitle: 'Fase 1 — Mobile-first • Vanilla JS',
      pills: [
        {k:'Créditos', v: formatMoney(store.state.credits)},
        {k:'XP', v: formatMoney(store.state.xp)},
      ]
    }, body);
  },

  about(store, router){
    const body = ui.el('div', { class:'card' }, [ui.el('div',{class:'inner'},[
      navBar(store, router),
      ui.el('h1',{class:'h1', style:'margin-top:10px'},['O que tem na Fase 1']),
      ui.el('p',{class:'p'},['• Criação de perfil (nome + avatar).\n• HQ com atalhos.\n• Dominação com mapa real (Natural Earth) e países clicáveis.\n• Simulação de batalha narrada.\n• Loja simples (compra/upgrade).\n• Missões iniciais (campanha WW3).\n• Admin local (DLC on/off e export/import).']),
      ui.el('div',{class:'btnrow'},[
        ui.el('button',{class:'btn primary', onClick: ()=>router.go('home')},['Voltar'])
      ])
    ])]);
    return screenShell({
      bgPath:'assets/img/backgrounds/bg_008_hq.webp',
      title:'Fase 1',
      subtitle:'Base sólida para crescer',
      pills:[{k:'Core', v: store.state.coreVersion}]
    }, body);
  },

  profile(store, router){
    const body = ui.el('div', { class:'card' }, [ui.el('div',{class:'inner'},[
      ui.el('h1',{class:'h1'},['Criar perfil']),
      ui.el('p',{class:'p'},['Escolha seu nome e um avatar provisório. Depois você pode trocar.']),
      ui.el('div',{class:'field'},[
        ui.el('label',{},['Nome do comandante']),
        ui.el('input',{class:'input', id:'name', placeholder:'Ex.: Jonatan', maxlength:'18', value: store.state.player?.name || ''})
      ]),
      ui.el('div',{class:'field'},[
        ui.el('label',{},['Avatar (provisório)']),
        (()=>{
          const row = ui.el('div',{class:'avatarRow'});
          const ids = ['A','B','C','D','E','F'];
          const cur = store.state.player?.avatarId || 'A';
          ids.forEach(id=>{
            const a = ui.el('button',{class:'avatar'+(id===cur?' selected':''), type:'button', onClick:()=>{
              row.querySelectorAll('.avatar').forEach(x=>x.classList.remove('selected'));
              a.classList.add('selected');
              row.dataset.selected = id;
            }},[id]);
            row.appendChild(a);
          });
          row.dataset.selected = cur;
          return row;
        })()
      ]),
      ui.el('div',{class:'btnrow'},[
        ui.el('button',{class:'btn primary', onClick: ()=>{
          const name = document.getElementById('name').value.trim();
          const avatarId = document.querySelector('.avatarRow')?.dataset?.selected || 'A';
          if(name.length < 2) return alert('Digite um nome com pelo menos 2 letras.');
          store.setPlayer({name, avatarId});
          router.go('hq');
        }},['Confirmar']),
        ui.el('button',{class:'btn ghost', onClick: ()=>router.go('home')},['Voltar'])
      ])
    ])]);

    return screenShell({
      bgPath:'assets/img/backgrounds/bg_002_profile.webp',
      title:'Criar perfil',
      subtitle:'Comandante',
      pills:[{k:'Offline', v:'Single-player'}]
    }, body);
  },

  hq(store, router){
    if(!store.state.player?.name) return screens.home(store, router);

    const body = ui.el('div', { class:'grid' }, [
      ui.el('div',{class:'card'},[ui.el('div',{class:'inner'},[
        navBar(store, router),
        ui.el('h1',{class:'h1', style:'margin-top:10px'},[`Bem-vindo, ${store.state.player.name}`]),
        ui.el('p',{class:'p'},['Quartel-General operacional. Selecione um modo: Campanha (WW3) ou Dominação Mundial.']),
        ui.el('div',{class:'kv'},[
          ui.el('div',{class:'k'},[ui.el('div',{class:'label'},['Patente atual']), ui.el('div',{class:'val'},[rankName(store)])]),
          ui.el('div',{class:'k'},[ui.el('div',{class:'label'},['Tamanho da frota']), ui.el('div',{class:'val'},[String(store.state.fleet.length)])]),
        ]),
        ui.el('div',{class:'btnrow'},[
          ui.el('button',{class:'btn primary', onClick: ()=>router.go('missions')},['Campanha (WW3)']),
          ui.el('button',{class:'btn gold', onClick: ()=>router.go('world')},['Dominação Mundial']),
        ])
      ])]),
      ui.el('div',{class:'card'},[ui.el('div',{class:'inner'},[
        ui.el('h2',{style:'margin:0; font-size:16px'},['Último relatório']),
        ui.el('p',{class:'p'},['As batalhas são simuladas e narradas para dar sensação de guerra real.']),
      ]), ui.el('div',{class:'log'},[store.state.lastBattleLog || 'Nenhuma batalha registrada ainda.'])])
    ]);

    return screenShell({
      bgPath:'assets/img/backgrounds/bg_008_hq.webp',
      title:'Quartel-General',
      subtitle:'Operações',
      pills:[
        {k:'Créditos', v: formatMoney(store.state.credits)},
        {k:'XP', v: formatMoney(store.state.xp)},
      ]
    }, body);
  },

  world(store, router){
    if(!store.state.player?.name) return screens.profile(store, router);

    let selected = null;

    const right = ui.el('div',{class:'card'},[ui.el('div',{class:'inner'},[
      navBar(store, router),
      ui.el('h2',{style:'margin:10px 0 0 0; font-size:16px'},['Painel do país']),
      ui.el('p',{class:'p', id:'countryInfo'},['Selecione um país no mapa.']),
      ui.el('div',{class:'btnrow'},[
        ui.el('button',{class:'btn danger', id:'btnWar', disabled:true},['Declarar guerra']),
        ui.el('button',{class:'btn ghost', id:'btnMarkEnemy', disabled:true},['Marcar como inimigo']),
      ]),
      ui.el('p',{class:'p', style:'margin-top:12px'},['Dica: No futuro, este modo vira online PVP sem mudar o core.']),
    ])]);

    const mapCard = ui.el('div',{class:'card'},[ui.el('div',{class:'inner'},[
      ui.el('h1',{class:'h1'},['Dominação Mundial']),
      ui.el('p',{class:'p'},['Mapa real (países clicáveis). Conquiste territórios e aumente sua influência.']),
      (()=>{
        const wrap = ui.el('div',{class:'mapWrap'});
        const svg = buildWorldMap({
          store,
          onSelect: (c)=>{
            selected = c;
            updateWorldStyles({store, svg, selectedIso3: c.iso3});
            const owner = store.getCountryOwner(c.iso3);
            const info = document.getElementById('countryInfo');
            info.textContent = `${c.name} (${c.iso3}) — status: ${owner.toUpperCase()}`;
            const btnWar = document.getElementById('btnWar');
            const btnMarkEnemy = document.getElementById('btnMarkEnemy');
            btnWar.disabled = false;
            btnMarkEnemy.disabled = false;
            btnWar.onclick = ()=> doWar(c);
            btnMarkEnemy.onclick = ()=> { store.setCountryOwner(c.iso3,'enemy'); updateWorldStyles({store, svg, selectedIso3:c.iso3}); info.textContent = `${c.name} (${c.iso3}) — status: ENEMY`; };
          }
        });
        wrap.appendChild(svg);
        return wrap;
      })()
    ])]);

    const body = ui.el('div',{class:'grid'},[mapCard, right]);

    function doWar(country){
      const owner = store.getCountryOwner(country.iso3);
      if(owner === 'player') return alert('Você já controla este país.');
      const strat = prompt('Estratégia (agressiva, silenciosa, defesa_aerea, guerra_eletronica):','agressiva') || 'agressiva';
      const enemyPower = Math.max(80, Math.round(90 + Math.random()*150));
      const result = simulateBattle({store, enemyPower, strategyId: strat.trim(), contextLabel:`Guerra por ${country.name}`});
      store.addCredits(result.credits);
      store.addXp(result.xp);
      store.setLastBattleLog(result.log);
      if(result.win){
        store.setCountryOwner(country.iso3,'player');
      }else{
        store.setCountryOwner(country.iso3,'enemy');
      }
      ui.toast(result.win ? `Vitória! +${formatMoney(result.credits)} cr, +${formatMoney(result.xp)} XP` : `Derrota. +${formatMoney(result.credits)} cr, +${formatMoney(result.xp)} XP`);
      router.go('hq');
    }

    return screenShell({
      bgPath:'assets/img/backgrounds/bg_003_world_ui.webp',
      title:'Dominação Mundial',
      subtitle:'Mapa real • Países clicáveis',
      pills:[
        {k:'Frota', v: String(store.state.fleet.length)},
        {k:'Poder', v: calcFleetPower(store).total.toFixed(0)}
      ]
    }, body);
  },

  missions(store, router){
    if(!store.state.player?.name) return screens.profile(store, router);

    const list = content.missions.map(m=>{
      const card = ui.el('div',{class:'card'},[ui.el('div',{class:'inner'},[
        ui.el('div',{style:'display:flex; justify-content:space-between; gap:10px; align-items:flex-start'},[
          ui.el('div',{},[
            ui.el('h2',{style:'margin:0; font-size:16px'},[m.name]),
            ui.el('p',{class:'p'},[m.brief]),
          ]),
          ui.el('div',{class:'pill'},[
            ui.el('b',{},[String(m.enemyPower)]),
            ui.el('span',{},['Poder inimigo'])
          ])
        ]),
        ui.el('div',{class:'btnrow'},[
          ui.el('button',{class:'btn primary', onClick: ()=>runMission(m)},['Iniciar missão'])
        ])
      ])]);
      return card;
    });

    function runMission(m){
      const strat = prompt('Estratégia (agressiva, silenciosa, defesa_aerea, guerra_eletronica):','agressiva') || 'agressiva';
      const result = simulateBattle({store, enemyPower:m.enemyPower, strategyId:strat.trim(), contextLabel:`Missão: ${m.name}`});
      const credits = result.win ? m.reward.credits : Math.round(m.reward.credits*0.25);
      const xp = result.win ? m.reward.xp : Math.round(m.reward.xp*0.25);
      store.addCredits(credits);
      store.addXp(xp);

      const log = result.log + `\n\nRecompensa da missão: ${formatMoney(credits)} créditos, ${formatMoney(xp)} XP.`;
      store.setLastBattleLog(log);

      ui.toast(result.win ? `Missão concluída! +${formatMoney(credits)} cr, +${formatMoney(xp)} XP` : `Missão falhou. Recompensa parcial.`);
      router.go('hq');
    }

    const body = ui.el('div',{class:'card'},[ui.el('div',{class:'inner'},[
      navBar(store, router),
      ui.el('h1',{class:'h1', style:'margin-top:10px'},['Campanha — Terceira Guerra Mundial']),
      ui.el('p',{class:'p'},['Missões iniciais da Fase 1. Depois entraremos com capítulos, cutscenes e eventos globais.']),
    ]), ui.el('div',{style:'display:grid; gap:12px; padding:14px; border-top:1px solid rgba(255,255,255,.10)'}, list)]);

    return screenShell({
      bgPath:'assets/img/backgrounds/bg_007_briefing.webp',
      title:'Campanha',
      subtitle:'WW3 • Missões',
      pills:[{k:'XP', v: formatMoney(store.state.xp)}]
    }, body);
  },

  store(store, router){
    if(!store.state.player?.name) return screens.profile(store, router);

    const shipsById = new Map(content.ships.map(s=>[s.id,s]));
    const cards = content.ships.map(s=>{
      const owned = store.state.fleet.includes(s.id);
      const up = store.state.upgrades[s.id] || 0;

      return ui.el('div',{class:'card'},[ui.el('div',{class:'inner'},[
        ui.el('div',{style:'display:flex; justify-content:space-between; gap:10px; align-items:flex-start'},[
          ui.el('div',{},[
            ui.el('h2',{style:'margin:0; font-size:16px'},[s.name]),
            ui.el('p',{class:'p'},[`Tipo: ${s.type.toUpperCase()} • Tier ${s.tier}`]),
          ]),
          ui.el('div',{class:'pill'},[
            ui.el('b',{},[formatMoney(s.cost)]),
            ui.el('span',{},['créditos'])
          ])
        ]),
        ui.el('p',{class:'p'},[`ATK ${s.atk} • DEF ${s.def} • STEALTH ${s.stealth} • AA ${s.aa} • HP ${s.hp}`]),
        ui.el('div',{class:'btnrow'},[
          ui.el('button',{class:'btn primary', disabled: owned || store.state.credits < s.cost, onClick: ()=>{
            store.addCredits(-s.cost);
            store.addShip(s.id);
            ui.toast('Comprado!');
            router.go('store');
          }},[owned ? 'Já na frota' : 'Comprar']),
          ui.el('button',{class:'btn gold', disabled: !owned, onClick: ()=>{
            const cost = 25000 + up*15000;
            if(store.state.credits < cost) return alert('Créditos insuficientes.');
            store.addCredits(-cost);
            store.upgradeShip(s.id);
            ui.toast(`Upgrade +1 (nível ${up+1})`);
            router.go('store');
          }},[`Upgrade (${up})`]),
        ])
      ])]);
    });

    const body = ui.el('div',{class:'grid'},[
      ui.el('div',{class:'card'},[ui.el('div',{class:'inner'},[
        navBar(store, router),
        ui.el('h1',{class:'h1', style:'margin-top:10px'},['Frota & Aquisições']),
        ui.el('p',{class:'p'},['Nesta fase, é uma loja simples. Depois teremos mercado, contratos, leilões, estaleiros, manutenção e skins.']),
        ui.el('div',{class:'kv'},[
          ui.el('div',{class:'k'},[ui.el('div',{class:'label'},['Créditos']), ui.el('div',{class:'val'},[formatMoney(store.state.credits)])]),
          ui.el('div',{class:'k'},[ui.el('div',{class:'label'},['Poder total']), ui.el('div',{class:'val'},[calcFleetPower(store).total.toFixed(0)])]),
        ])
      ])]),
      ui.el('div',{style:'display:grid; gap:12px'}, cards)
    ]);

    return screenShell({
      bgPath:'assets/img/backgrounds/bg_010_store.webp',
      title:'Loja',
      subtitle:'Compra e upgrades',
      pills:[{k:'Frota', v: String(store.state.fleet.length)}]
    }, body);
  },

  ranks(store, router){
    if(!store.state.player?.name) return screens.profile(store, router);

    const curRank = rank(store);
    const list = content.ranks.map(r=>{
      const unlocked = store.state.xp >= r.minXp;
      const isCur = r.id === curRank.id;
      return ui.el('div',{class:'card'},[ui.el('div',{class:'inner'},[
        ui.el('div',{style:'display:flex; justify-content:space-between; align-items:center; gap:10px'},[
          ui.el('div',{},[
            ui.el('h2',{style:'margin:0; font-size:16px'},[r.name]),
            ui.el('p',{class:'p'},[`Requer: ${formatMoney(r.minXp)} XP`]),
          ]),
          ui.el('div',{class:'pill', style: isCur ? 'border-color:rgba(42,169,255,.55)' : ''},[
            ui.el('b',{},[unlocked ? (isCur ? 'ATUAL' : 'OK') : 'LOCK']),
            ui.el('span',{},[unlocked ? 'Liberado' : 'Bloqueado'])
          ])
        ])
      ])]);
    });

    const body = ui.el('div',{class:'card'},[ui.el('div',{class:'inner'},[
      navBar(store, router),
      ui.el('h1',{class:'h1', style:'margin-top:10px'},['Carreira & Patentes']),
      ui.el('p',{class:'p'},['Seu progresso é baseado em XP. Missões e guerras dão XP e créditos.']),
      ui.el('div',{class:'kv'},[
        ui.el('div',{class:'k'},[ui.el('div',{class:'label'},['Patente']), ui.el('div',{class:'val'},[curRank.name])]),
        ui.el('div',{class:'k'},[ui.el('div',{class:'label'},['XP']), ui.el('div',{class:'val'},[formatMoney(store.state.xp)])]),
      ]),
    ]), ui.el('div',{style:'display:grid; gap:12px; padding:14px; border-top:1px solid rgba(255,255,255,.10)'}, list)]);

    return screenShell({
      bgPath:'assets/img/backgrounds/bg_012_ranks.webp',
      title:'Carreira',
      subtitle:'Patentes navais',
      pills:[{k:'XP', v: formatMoney(store.state.xp)}]
    }, body);
  }
};

function rank(store){
  let cur = content.ranks[0];
  for(const r of content.ranks){
    if(store.state.xp >= r.minXp) cur = r;
  }
  return cur;
}
function rankName(store){ return rank(store)?.name || 'Recruta'; }
