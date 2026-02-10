import { views } from './views.js';

function parseHash(){
  const raw = (location.hash || '#/home').replace(/^#\//,'');
  const [path, qs] = raw.split('?');
  const params = new URLSearchParams(qs || '');
  const name = (path || 'home').trim();

  return { name, params };
}

export const router = {
  _handlers: [],
  onChange(fn){ this._handlers.push(fn); },
  handle(){
    const { name, params } = parseHash();
    const render = views[name] || views.home;
    const route = { name, params, render: () => render(params) };
    this._handlers.forEach(h => h(route));
  }
};

window.addEventListener('hashchange', () => router.handle());
window.addEventListener('load', () => router.handle());
