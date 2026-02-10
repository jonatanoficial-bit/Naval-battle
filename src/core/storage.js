const KEY = 'bn1_state_v1';

const defaultState = {
  sound: true,
  profile: { name: '', avatar: '⚓' },
  rank: { id:'recruta', xp:0 },
  wallet: { credits: 120000, steel: 8000, fuel: 3500, intel: 120 },
  fleet: [
    { id:'sub_attack', lvl:1, qty:1 },
    { id:'destroyer_modern', lvl:1, qty:1 },
  ],
  world: {
    conquered: ['BRA'], // só pra demo
    enemies: ['RUS'],
  },
  dlcEnabled: [],
  ui: { bgDim: 0.62 },
};

function load(){
  try{
    const raw = localStorage.getItem(KEY);
    if(!raw) return structuredClone(defaultState);
    const parsed = JSON.parse(raw);
    return { ...structuredClone(defaultState), ...parsed };
  }catch{
    return structuredClone(defaultState);
  }
}
function save(state){ localStorage.setItem(KEY, JSON.stringify(state)); }

let state = load();

export const storage = {
  get(){ return state; },
  set(mutator){
    const next = structuredClone(state);
    mutator(next);
    state = next;
    save(state);
    return state;
  },
  reset(){
    state = structuredClone(defaultState);
    save(state);
  },
  getProfile(){ return state.profile; },
  setProfile(profile){
    this.set(s => { s.profile = { ...s.profile, ...profile }; });
  },
  toggleSound(){
    const v = !state.sound;
    this.set(s => { s.sound = v; });
    return v;
  }
};
