
import { clamp } from './utils.js?v=2026-02-11_205704';

const STORAGE_KEY = 'bn_phase1_state_v1';

export class Store{
  constructor(){
    this.state = this._load() || this._default();
  }

  _default(){
    return {
      coreVersion: '1.0.0',
      credits: 200000,
      xp: 0,
      player: null,
      fleet: ['sub_basic','frigate_basic'],
      upgrades: {}, // shipId: level
      world: {
        // iso_a3: 'player'|'enemy'|'neutral'
        owners: {}
      },
      enabledDLC: [],
      lastBattleLog: ''
    };
  }

  _load(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return null;
      return JSON.parse(raw);
    }catch{ return null; }
  }

  save(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  }

  reset(){
    this.state = this._default();
    this.save();
  }

  setPlayer({name, avatarId}){
    this.state.player = { name, avatarId, createdAt: Date.now() };
    this.save();
  }

  addCredits(v){
    this.state.credits = Math.max(0, Math.floor(this.state.credits + v));
    this.save();
  }

  addXp(v){
    this.state.xp = Math.max(0, Math.floor(this.state.xp + v));
    this.save();
  }

  addShip(shipId){
    this.state.fleet.push(shipId);
    this.save();
  }

  upgradeShip(shipId){
    const cur = this.state.upgrades[shipId] || 0;
    this.state.upgrades[shipId] = clamp(cur + 1, 0, 10);
    this.save();
  }

  setCountryOwner(iso3, owner){
    this.state.world.owners[iso3] = owner;
    this.save();
  }

  getCountryOwner(iso3){
    return this.state.world.owners[iso3] || 'neutral';
  }

  setLastBattleLog(text){
    this.state.lastBattleLog = text;
    this.save();
  }
}
