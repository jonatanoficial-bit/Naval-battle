import { storage } from '../storage.js?v=2026-02-11_205704';
import { toast } from '../ui.js?v=2026-02-11_205704';

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
    if(!res.ok) throw new Error('map_http_' + res.status);
    geo = await res.json();
  }catch(err){
    // Fallback online (optional). If offline or blocked, show placeholder without crashing.
    try{
      const remote = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson';
      const r = await fetch(remote, { cache:'no-store' });
      if(!r.ok) throw new Error('remote_http_' + r.status);
      geo = await r.json();
      toast('Mapa local não encontrado. Usando fallback online.');
    }catch{
      mount.innerHTML = `<div class="card" style="padding:14px"><div class="badge">Mapa indisponível</div><div style="height:10px"></div><div class="small">O arquivo do mapa não está disponível em <code>assets/map/</code>. Para ativar o mapa real, envie <code>ne_110m_admin_0_countries.geojson</code> para essa pasta.</div></div>`;
      return;
    }
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
