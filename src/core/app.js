import { router } from './router.js?v=2026-02-11_205704';
import { storage } from './storage.js?v=2026-02-11_205704';
import { setBackground, toast } from './ui.js?v=2026-02-11_205704';
import { ensureBaseContentLoaded } from './content.js?v=2026-02-11_205704';

const bgByRoute = {
  home: 'assets/img/backgrounds/bg_001_home.png',
  profile: 'assets/img/backgrounds/bg_002_profile_create.png',
  hq: 'assets/img/backgrounds/bg_008_hq.png',
  world: 'assets/img/backgrounds/bg_003_world_domination.png',
  fleet: 'assets/img/backgrounds/bg_009_hangar.png',
  shop: 'assets/img/backgrounds/bg_010_shop_real.png',
  research: 'assets/img/backgrounds/bg_011_research_lab.png',
  ranks: 'assets/img/backgrounds/bg_012_ranks_office.png',
  battlePlanning: 'assets/img/backgrounds/bg_004_battle_planning.png',
  battleNarration: 'assets/img/backgrounds/bg_005_battle_surface_night.png',
  battleUnderwater: 'assets/img/backgrounds/bg_006_battle_underwater.png',
  intel: 'assets/img/backgrounds/bg_007_intel_briefing.png',
  admin: 'assets/img/backgrounds/bg_008_hq.png',
  settings: 'assets/img/backgrounds/bg_008_hq.png',
  upgrades: 'assets/img/backgrounds/bg_009_hangar.png',
};

const tabs = Array.from(document.querySelectorAll('.tab'));
function setActiveTab(route){
  tabs.forEach(t => t.classList.toggle('active', t.dataset.route === route));
}

function requireProfile(nextHash){
  const p = storage.getProfile();
  if(!p?.name){
    location.hash = '#/profile?next=' + encodeURIComponent(nextHash || '#/home');
    return false;
  }
  return true;
}

async function init(){
  await ensureBaseContentLoaded();

  document.getElementById('btnSound').addEventListener('click', () => {
    const v = storage.toggleSound();
    toast(v ? 'Som: ligado' : 'Som: desligado');
  });

  router.onChange((route) => {
    const name = route.name;

    // Gate: routes that need profile
    const gated = ['hq','world','fleet','shop','research','ranks','battlePlanning','battleNarration','battleUnderwater','intel'];
    if(gated.includes(name) && !requireProfile(location.hash)){
      return;
    }

    setBackground(bgByRoute[name] || bgByRoute.home);
    setActiveTab(['home','hq','world','fleet','ranks'].includes(name) ? name : '');

    document.getElementById('bottombar').style.display = (name === 'admin') ? 'none' : 'flex';

    route.render();
  });

  // First run: if no profile, go profile; else home
  const p = storage.getProfile();
  if(!p?.name){
    location.hash = '#/profile';
  } else if(!location.hash){
    location.hash = '#/home';
  } else {
    router.handle();
  }
}

init();
