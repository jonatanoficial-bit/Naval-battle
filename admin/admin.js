
import { ui } from '../src/core/ui.js';

const STORAGE = 'bn_admin_v1';
const DEFAULT_PIN = '1234';

function load(){
  try{ return JSON.parse(localStorage.getItem(STORAGE) || '{}'); }catch{ return {}; }
}
function save(v){
  localStorage.setItem(STORAGE, JSON.stringify(v));
}
const state = load();

function viewLogin(){
  const pin = ui.el('input',{class:'input', type:'password', placeholder:'PIN (padrão 1234)'});
  const root = shell('Admin', 'Gerenciar conteúdo (local)', ui.el('div',{class:'card'},[ui.el('div',{class:'inner'},[
    ui.el('h1',{class:'h1'},['Login do Admin']),
    ui.el('p',{class:'p'},['Fase 1: login local simples. Depois conectamos backend sem quebrar.']),
    ui.el('div',{class:'field'},[ui.el('label',{},['PIN']), pin]),
    ui.el('div',{class:'btnrow'},[
      ui.el('button',{class:'btn primary', onClick:()=>{
        const v = pin.value.trim();
        if(v !== (state.pin || DEFAULT_PIN)) return alert('PIN incorreto.');
        state.authed = true;
        save(state);
        render();
      }},['Entrar']),
      ui.el('a',{class:'btn ghost', href:'../index.html'},['Voltar ao jogo'])
    ])
  ])]));
  return root;
}

function viewPanel(){
  const enabled = state.enabledDLC || [];
  const textarea = ui.el('textarea',{id:'json'});
  textarea.value = JSON.stringify({ enabledDLC: enabled }, null, 2);

  const root = shell('Admin', 'Conteúdo modular (DLC)', ui.el('div',{class:'grid'},[
    ui.el('div',{class:'card'},[ui.el('div',{class:'inner'},[
      ui.el('h2',{style:'margin:0; font-size:16px'},['DLC Manager (Fase 1)']),
      ui.el('p',{class:'p'},['Você pode ativar/desativar DLCs no futuro. Aqui já fica a estrutura salva no localStorage.']),
      ui.el('div',{class:'btnrow'},[
        ui.el('button',{class:'btn primary', onClick:()=>{
          const id = prompt('ID do DLC (ex.: dlc_001_atlantic):','dlc_001_atlantic');
          if(!id) return;
          state.enabledDLC = Array.from(new Set([...(state.enabledDLC||[]), id]));
          save(state);
          render();
        }},['Adicionar DLC']),
        ui.el('button',{class:'btn danger', onClick:()=>{
          state.enabledDLC = [];
          save(state);
          render();
        }},['Desativar todos']),
      ]),
      ui.el('p',{class:'p', style:'margin-top:12px'},['Ativos: '+(state.enabledDLC?.join(', ') || 'nenhum')])
    ])]),
    ui.el('div',{class:'card'},[ui.el('div',{class:'inner'},[
      ui.el('h2',{style:'margin:0; font-size:16px'},['Export / Import (JSON)']),
      ui.el('p',{class:'p'},['Copie e cole o JSON para transportar configurações.']),
      textarea,
      ui.el('div',{class:'btnrow'},[
        ui.el('button',{class:'btn gold', onClick:()=>{
          navigator.clipboard?.writeText(textarea.value);
          alert('Copiado.');
        }},['Copiar']),
        ui.el('button',{class:'btn primary', onClick:()=>{
          try{
            const obj = JSON.parse(textarea.value);
            state.enabledDLC = Array.isArray(obj.enabledDLC) ? obj.enabledDLC : [];
            save(state);
            alert('Importado.');
            render();
          }catch(e){
            alert('JSON inválido.');
          }
        }},['Importar']),
        ui.el('button',{class:'btn ghost', onClick:()=>{
          state.authed = false;
          save(state);
          render();
        }},['Sair']),
      ])
    ])])
  ]));

  return root;
}

function shell(title, subtitle, body){
  const top = ui.el('div',{class:'topbar'},[
    ui.el('div',{class:'brand'},[
      ui.el('div',{class:'title'},[title]),
      ui.el('div',{class:'sub'},[subtitle])
    ]),
    ui.el('div',{class:'pills'},[
      ui.el('div',{class:'pill'},[ui.el('b',{},['Fase 1']), ui.el('span',{},['Local'])])
    ])
  ]);
  const s = ui.el('div',{class:'shell'},[top, body]);
  const bg = ui.el('div',{class:'bg', style:"background-image:url('../assets/img/backgrounds/bg_008_hq.webp')"});
  return ui.el('div',{},[bg, s]);
}

function render(){
  const app = document.getElementById('app');
  app.replaceChildren(state.authed ? viewPanel() : viewLogin());
}
render();
