import { storage } from './storage.js?v=2026-02-11_205704';

export function setBgDim(value){
  const v = Math.max(0.20, Math.min(0.85, Number(value)));
  document.documentElement.style.setProperty('--bgDim', String(v));
}

export function setBackground(url){
  const el = document.getElementById('bg');
  setBgDim(storage.get().ui?.bgDim ?? 0.62);
  el.style.backgroundImage = `linear-gradient(180deg, rgba(0,0,0,.35), rgba(0,0,0,.72)), url('${url}')`;
  el.style.backgroundSize = 'cover';
  el.style.backgroundPosition = 'center';
}

let toastTimer = null;
export function toast(message){
  let t = document.querySelector('.toast');
  if(!t){
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = message;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
}

export function money(n){
  return new Intl.NumberFormat('pt-BR').format(Math.max(0, Math.floor(n)));
}
