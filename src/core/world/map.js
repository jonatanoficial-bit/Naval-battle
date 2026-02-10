import { storage } from '../storage.js';
import { toast } from '../ui.js';

// Fase 1: SVG simplificado com alguns países-chave (DEMO).
// Fase 2: substituir por mapa real completo via GeoJSON/SVG.
export function renderWorldMap(mount){
  const s = storage.get();
  const conquered = new Set(s.world.conquered || []);
  const enemies = new Set(s.world.enemies || []);

  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 1000 520');
  svg.classList.add('world');

  const mk = (id, d) => {
    const p = document.createElementNS('http://www.w3.org/2000/svg','path');
    p.setAttribute('d', d);
    p.classList.add('country');
    p.dataset.id = id;
    if(conquered.has(id)) p.classList.add('conquered');
    if(enemies.has(id)) p.classList.add('enemy');
    p.addEventListener('click', (e) => {
      e.stopPropagation();
      const code = p.dataset.id;
      toast('Selecionado: ' + code + ' (Fase 1 demo)');
      // toggle highlight as selection
      svg.querySelectorAll('.country').forEach(x => x.classList.remove('selected'));
      p.classList.add('selected');
    });
    return p;
  };

  // Contornos aproximados (DEMO) — serão substituídos.
  const paths = [
    mk('USA', 'M140,150 L280,120 L360,160 L330,230 L220,250 L150,210 Z'),
    mk('BRA', 'M330,300 L420,280 L470,330 L450,420 L360,450 L310,380 Z'),
    mk('GBR', 'M470,140 L490,130 L505,150 L490,170 L470,160 Z'),
    mk('FRA', 'M500,185 L540,175 L555,210 L525,235 L495,220 Z'),
    mk('RUS', 'M600,110 L860,100 L930,160 L900,220 L650,210 L580,160 Z'),
    mk('CHN', 'M720,230 L840,220 L870,280 L820,330 L700,300 Z'),
    mk('AUS', 'M830,380 L920,370 L950,430 L900,480 L820,450 Z'),
    mk('ZAF', 'M520,410 L590,400 L610,440 L560,490 L500,460 Z'),
  ];

  const ocean = document.createElementNS('http://www.w3.org/2000/svg','rect');
  ocean.setAttribute('x','0'); ocean.setAttribute('y','0'); ocean.setAttribute('width','1000'); ocean.setAttribute('height','520');
  ocean.setAttribute('fill','rgba(0,0,0,0)');
  svg.appendChild(ocean);
  paths.forEach(p => svg.appendChild(p));

  mount.innerHTML = '';
  mount.appendChild(svg);

  const note = document.createElement('div');
  note.className = 'small';
  note.style.padding = '10px 8px';
  note.style.color = 'rgba(255,255,255,.65)';
  note.textContent = 'Nota: nesta fase o mapa é um SVG simplificado. Na Fase 2, trocamos por mapa real completo (GeoJSON) com países 100% fiéis.';
  mount.appendChild(note);
}
