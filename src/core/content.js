// Carrega conteúdo base + DLCs (fase 1: localStorage)
import { storage } from './storage.js?v=2026-02-11_205704';

let cache = null;

async function fetchJSON(path){
  const res = await fetch(path);
  if(!res.ok) throw new Error('Falha ao carregar ' + path);
  return await res.json();
}

export async function ensureBaseContentLoaded(){
  if(cache) return cache;
  const base = await fetchJSON('src/content/base/manifest.json');

  const enabled = storage.get().dlcEnabled || [];
  const dlcs = [];
  for(const id of enabled){
    try{
      const m = await fetchJSON(`src/content/dlc/${id}/manifest.json`);
      dlcs.push(m);
    }catch(e){
      console.warn('DLC não carregou', id, e);
    }
  }

  // merge
  const packs = [base, ...dlcs];
  const out = { packs, ships: [], ranks: [], missions: [], countries: [] };

  for(const p of packs){
    if(p.files?.ships) out.ships.push(...await fetchJSON(p.files.ships));
    if(p.files?.ranks) out.ranks.push(...await fetchJSON(p.files.ranks));
    if(p.files?.missions) out.missions.push(...await fetchJSON(p.files.missions));
    if(p.files?.countries) out.countries.push(...await fetchJSON(p.files.countries));
  }

  cache = out;
  return out;
}
