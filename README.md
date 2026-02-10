# Naval Battle: Global Domination (Fase 2) — Mobile-first (Vanilla)

Projeto em **HTML + CSS + JavaScript puro**, com **arquitetura expansível (DLC)** e **Admin local**.

## Rodar localmente

Por ser um app que carrega arquivos JSON via `fetch`, rode com um servidor local.

### Opção A (Python)
```bash
cd naval-battle-global-domination-fase2-build-2026-02-10
python -m http.server 8000
```
Abra:
- `http://localhost:8000`

### Opção B (VS Code)
Use a extensão **Live Server** e clique em **Go Live**.

## Deploy no GitHub Pages

1. Crie um repositório e envie os arquivos.
2. No GitHub: **Settings → Pages**
3. Em "Build and deployment": selecione **Deploy from a branch**
4. Branch: `main` / folder: `/ (root)`

## Estrutura (pensada para DLC)

- `src/content/base/` contém o conteúdo base (ships/ranks/missions/countries).
- `src/content/dlc/<id>/manifest.json` pode adicionar novos arquivos.
- Lista de DLCs ativadas fica em `localStorage` (Admin).

## Admin (local)
- Acesse `#/admin` ou `admin/index.html`
- PIN padrão: **0000**
- Permite ativar/desativar DLC e exportar/importar save.

## Mapa “real”
Nesta fase, o mapa é **SVG simplificado** (demo) para já ter cliques e estados.
Na **Fase 2**, substituímos por **GeoJSON/SVG completo de países reais** (camada funcional), mantendo o fundo cinematográfico como estética.

## Substituir navios/submarinos por imagens reais
Quando você tiver as imagens reais (PNG/WebP), basta:
- colocar em `assets/img/ships/`
- adicionar as referências no conteúdo JSON (fase 2)

## Build
- build: 2026-02-10 (fase 2)
