import { storage } from '../storage.js';
import { toast } from '../ui.js';

function project(lon, lat, width, height){
  // Equirectangular projection (lon:-180..180, lat:-90..90)
  const x = (lon + 180) / 360 * width;
  const y = (90 - lat) / 180 * height;
  return [x, y];
}

function ringToPath(ring, width, height){
  let d = '';
  for(let i=0;i<ring.length;i++){
    const [lon, lat] = ring[i];
    const [x,y] = project(lon, lat, width, height);
    d += (i===0 ? 'M' : 'L') + x.toFixed(2) + ' ' + y.toFixed(2) + ' ';
  }
  return d + 'Z ';
}

function geomToPath(geom, width, height){
  const t = geom.type;
  const coords = geom.coordinates;
  let d = '';
  if(t === 'Polygon'){
    for(const ring of coords) d += ringToPath(ring, width, height);
  }else if(t === 'MultiPolygon'){
    for(const poly of coords){
      for(const ring of poly) d += ringToPath(ring, width, height);
    }
  }
  return d;
}

export async function renderWorldMap(mount){
  const s = storage.get();
  const conquered = new Set(s.world.conquered || []);
  const enemies = new Set(s.world.enemies || []);

  const width = 1000, height = 520;

  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.classList.add('world');

  let geo;
  try{
    const res = await fetch('assets/map/ne_110m_admin_0_countries.geojson');
    if(!res.ok) throw new Error('HTTP ' + res.status);
    geo = await res.json();
  }catch(err){
    mount.innerHTML = `
      <div class="card">
        <div class="card__title">Mapa indisponível</div>
        <div class="card__body">
          Este build está sem a pasta <b>assets/</b>. Para ativar o mapa mundial, envie o arquivo GeoJSON em <code>assets/map/</code>.
        </div>
      </div>
    `;
    console.warn('World map: falha ao carregar GeoJSON', err);
    return;
  }

  // For performance: render paths as one per feature (ISO_A3).
  for(const f of geo.features){
    const iso = f.properties?.ISO_A3 || f.properties?.ADM0_A3 || 'UNK';
    const d = geomToPath(f.geometry, width, height);
    if(!d) continue;

    const p = document.createElementNS('http://www.w3.org/2000/svg','path');
    p.setAttribute('d', d);
    p.classList.add('country');
    p.dataset.id = iso;

    if(conquered.has(iso)) p.classList.add('conquered');
    if(enemies.has(iso)) p.classList.add('enemy');

    p.addEventListener('click', (e) => {
      e.stopPropagation();
      const code = iso;
      toast('Selecionado: ' + (f.properties?.NAME_PT || f.properties?.NAME_EN || f.properties?.NAME || code));
      svg.querySelectorAll('.country.selected').forEach(x => x.classList.remove('selected'));
      p.classList.add('selected');
      mount.dispatchEvent(new CustomEvent('country:selected', { detail: { iso: code, props: f.properties } }));
    });

    svg.appendChild(p);
  }

  mount.innerHTML = '';
  mount.appendChild(svg);

  const note = document.createElement('div');
  note.className = 'small';
  note.style.padding = '10px 8px';
  note.style.color = 'rgba(255,255,255,.65)';
  note.textContent = 'Mapa real: Natural Earth (escala 110m). Toque em um país para selecionar.';
  mount.appendChild(note);
}
