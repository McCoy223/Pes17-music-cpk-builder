/* =============================================
   PES 17 Music CPK Builder — app.js
   Generates a ZIP with correct folder structure
   ready to pack into a CPK file.
   ============================================= */

/* ── Slot definitions ─────────────────────────────────── */
// Each slot maps to its internal PES 17 filename.
// The file will be placed at: Asset/Audio/BGM/<file>
const SLOTS = [
  // Menu & UI
  { cat: 'Menu & UI',        id: 'bgm_menu_main',     label: 'Main Menu BGM',        file: 'bgm_menu_main' },
  { cat: 'Menu & UI',        id: 'bgm_myclub',        label: 'MyClub Menu BGM',       file: 'bgm_myclub' },
  { cat: 'Menu & UI',        id: 'bgm_matchday',      label: 'Matchday Screen BGM',   file: 'bgm_matchday' },
  { cat: 'Menu & UI',        id: 'bgm_results',       label: 'Results Screen BGM',    file: 'bgm_results' },
  { cat: 'Menu & UI',        id: 'bgm_lineup',        label: 'Lineup Screen BGM',     file: 'bgm_lineup' },
  { cat: 'Menu & UI',        id: 'bgm_replay',        label: 'Replay Menu BGM',       file: 'bgm_replay' },
  { cat: 'Menu & UI',        id: 'bgm_edit',          label: 'Edit Mode BGM',         file: 'bgm_edit' },
  // Match Atmosphere
  { cat: 'Match Atmosphere', id: 'bgm_kickoff',       label: 'Kick-off Intro',        file: 'bgm_kickoff' },
  { cat: 'Match Atmosphere', id: 'bgm_halftime',      label: 'Half-time BGM',         file: 'bgm_halftime' },
  { cat: 'Match Atmosphere', id: 'bgm_pregame',       label: 'Pre-game Tunnel BGM',   file: 'bgm_pregame' },
  { cat: 'Match Atmosphere', id: 'bgm_warmup',        label: 'Warmup BGM',            file: 'bgm_warmup' },
  { cat: 'Match Atmosphere', id: 'bgm_goal_01',       label: 'Goal Jingle 1',         file: 'bgm_goal_01' },
  { cat: 'Match Atmosphere', id: 'bgm_goal_02',       label: 'Goal Jingle 2',         file: 'bgm_goal_02' },
  { cat: 'Match Atmosphere', id: 'bgm_goal_03',       label: 'Goal Jingle 3',         file: 'bgm_goal_03' },
  { cat: 'Match Atmosphere', id: 'bgm_ft_win',        label: 'Full-time Win Jingle',  file: 'bgm_ft_win' },
  { cat: 'Match Atmosphere', id: 'bgm_ft_lose',       label: 'Full-time Loss Jingle', file: 'bgm_ft_lose' },
  { cat: 'Match Atmosphere', id: 'bgm_ft_draw',       label: 'Full-time Draw Jingle', file: 'bgm_ft_draw' },
  // Anthems
  { cat: 'Anthems',          id: 'anthem_ucl',        label: 'UCL Anthem',            file: 'anthem_ucl' },
  { cat: 'Anthems',          id: 'anthem_uel',        label: 'UEL Anthem',            file: 'anthem_uel' },
  { cat: 'Anthems',          id: 'anthem_club_01',    label: 'Club Anthem Slot 1',    file: 'anthem_club_01' },
  { cat: 'Anthems',          id: 'anthem_club_02',    label: 'Club Anthem Slot 2',    file: 'anthem_club_02' },
  { cat: 'Anthems',          id: 'anthem_club_03',    label: 'Club Anthem Slot 3',    file: 'anthem_club_03' },
  { cat: 'Anthems',          id: 'anthem_club_04',    label: 'Club Anthem Slot 4',    file: 'anthem_club_04' },
  // Commentary
  { cat: 'Commentary',       id: 'commentary_intro',  label: 'Commentary Intro',      file: 'commentary_intro' },
  // Highlights
  { cat: 'Highlights',       id: 'bgm_hl_01',         label: 'Highlights Pack 1',     file: 'bgm_hl_01' },
  { cat: 'Highlights',       id: 'bgm_hl_02',         label: 'Highlights Pack 2',     file: 'bgm_hl_02' },
  { cat: 'Highlights',       id: 'bgm_hl_03',         label: 'Highlights Pack 3',     file: 'bgm_hl_03' },
  { cat: 'Highlights',       id: 'bgm_hl_04',         label: 'Highlights Pack 4',     file: 'bgm_hl_04' },
];

/* ── State ────────────────────────────────────────────── */
// assignments[slotId] = { name, ext, size, file: File, url: objectURL }
let assignments   = {};
let currentAudio  = null;
let currentPlayId = null;
let dragSrcId     = null;

/* ── Helpers ──────────────────────────────────────────── */
function fmtSize(b) {
  if (!b) return '';
  return b < 1048576 ? Math.round(b / 1024) + ' KB' : (b / 1048576).toFixed(1) + ' MB';
}

function ext(filename) {
  return filename.slice(filename.lastIndexOf('.')).toLowerCase();
}

/* ── Stats & progress ─────────────────────────────────── */
function updateStats() {
  const total    = SLOTS.length;
  const done     = Object.keys(assignments).length;
  const pct      = Math.round((done / total) * 100);

  document.getElementById('s-total').textContent = total;
  document.getElementById('s-done').textContent  = done;
  document.getElementById('s-left').textContent  = total - done;
  document.getElementById('prog').style.width    = pct + '%';

  // Enable download button only when at least one slot is filled
  document.getElementById('dl-btn').disabled = done === 0;
}

/* ── Render ───────────────────────────────────────────── */
function render() {
  const search = document.getElementById('search').value.toLowerCase();
  const filt   = document.getElementById('filt').value;
  const cats   = [...new Set(SLOTS.map(s => s.cat))];
  const list   = document.getElementById('slot-list');
  let html = '';

  cats.forEach(cat => {
    const rows = SLOTS.filter(s => {
      const ms = !search || s.label.toLowerCase().includes(search) || s.file.includes(search);
      const mf = filt === 'all'  ? true
               : filt === 'set'  ? !!assignments[s.id]
               :                   !assignments[s.id];
      return s.cat === cat && ms && mf;
    });
    if (!rows.length) return;

    html += `
      <div class="cat-head">
        <span class="cat-name">${cat}</span>
        <span class="cat-hr"></span>
        <span class="cat-ct">${rows.length} slot${rows.length !== 1 ? 's' : ''}</span>
      </div>`;

    rows.forEach(slot => {
      const a   = assignments[slot.id];
      const isp = currentPlayId === slot.id;

      const fileCol = a
        ? `<div class="fname" title="${a.name}">${a.name}</div>
           <div class="fsize">${fmtSize(a.size)}</div>`
        : `<div class="none">No file</div>`;

      const actions = a
        ? `<button class="icon-btn play ${isp ? 'playing' : ''}" title="${isp ? 'Stop' : 'Preview'}"
             onclick="togglePlay('${slot.id}')">${isp ? '■' : '▶'}</button>
           <button class="icon-btn del" title="Remove" onclick="remove('${slot.id}')">✕</button>`
        : `<button class="choose-btn" onclick="choose('${slot.id}')">Choose</button>`;

      html += `
        <div class="slot-row${a ? ' has-file' : ''}" id="row-${slot.id}"
          draggable="true"
          ondragstart="dragStart(event,'${slot.id}')"
          ondragover="dragOver(event,'${slot.id}')"
          ondrop="drop(event,'${slot.id}')"
          ondragleave="dragLeave('${slot.id}')">
          <div>
            <div class="slot-label">${slot.label}</div>
            <div class="slot-key">${slot.file}.mp3</div>
          </div>
          <div class="file-cell">${fileCol}</div>
          <span class="badge ${a ? 'ready' : 'empty'}">${a ? '✓ Ready' : '— Empty'}</span>
          <div class="row-actions">${actions}</div>
        </div>`;
    });
  });

  list.innerHTML = html || '<div class="empty-msg">No slots match your filter.</div>';
}

/* ── File assignment ──────────────────────────────────── */
function choose(slotId) {
  const inp  = document.createElement('input');
  inp.type   = 'file';
  inp.accept = 'audio/*,.mp3,.ogg,.wav';
  inp.onchange = e => { if (e.target.files[0]) assign(slotId, e.target.files[0]); };
  inp.click();
}

function assign(slotId, file) {
  if (assignments[slotId]?.url) URL.revokeObjectURL(assignments[slotId].url);
  assignments[slotId] = {
    name: file.name,
    ext:  ext(file.name),
    size: file.size,
    file: file,
    url:  URL.createObjectURL(file),
  };
  updateStats();
  render();
  toast('Assigned: ' + file.name);
}

function remove(slotId) {
  if (currentPlayId === slotId) stopAudio();
  if (assignments[slotId]?.url) URL.revokeObjectURL(assignments[slotId].url);
  delete assignments[slotId];
  updateStats();
  render();
  toast('Track removed');
}

function clearAll() {
  if (!Object.keys(assignments).length) return;
  if (!confirm('Remove all assigned tracks?')) return;
  stopAudio();
  Object.values(assignments).forEach(a => { if (a.url) URL.revokeObjectURL(a.url); });
  assignments = {};
  updateStats();
  render();
  toast('Cleared all tracks');
}

/* ── Bulk upload ─────────────────────────────────────── */
function bulkUpload(files) {
  const empty = SLOTS.filter(s => !assignments[s.id]);
  let n = 0;
  Array.from(files).forEach((f, i) => {
    if (i < empty.length) { assign(empty[i].id, f); n++; }
  });
  if (n) toast(`Auto-assigned ${n} file${n !== 1 ? 's' : ''}`);
}

/* ── Drop zone ────────────────────────────────────────── */
function dzOver(e)  { e.preventDefault(); document.getElementById('dz').classList.add('over'); }
function dzLeave()  { document.getElementById('dz').classList.remove('over'); }
function dzDrop(e)  { e.preventDefault(); dzLeave(); bulkUpload(e.dataTransfer.files); }

document.addEventListener('dragover', e => e.preventDefault());
document.addEventListener('drop', e => {
  if (!e.target.closest('.slot-row') && !e.target.closest('.dropzone')) {
    e.preventDefault(); bulkUpload(e.dataTransfer.files);
  }
});

/* ── Drag-to-swap between slots ───────────────────────── */
function dragStart(e, id) {
  dragSrcId = id;
  document.getElementById('row-' + id)?.classList.add('dragging');
}
function dragOver(e, id) {
  e.preventDefault();
  document.getElementById('row-' + id)?.classList.add('drag-over');
}
function dragLeave(id) {
  document.getElementById('row-' + id)?.classList.remove('drag-over', 'dragging');
}
function drop(e, id) {
  e.preventDefault();
  document.getElementById('row-' + id)?.classList.remove('drag-over');
  if (!dragSrcId || dragSrcId === id) { dragSrcId = null; return; }
  const tmp = assignments[dragSrcId];
  if (assignments[id]) assignments[dragSrcId] = assignments[id];
  else delete assignments[dragSrcId];
  if (tmp) assignments[id] = tmp;
  else delete assignments[id];
  dragSrcId = null;
  render(); updateStats();
  toast('Tracks swapped');
}

/* ── Audio preview ────────────────────────────────────── */
function togglePlay(slotId) {
  if (currentPlayId === slotId) { stopAudio(); render(); return; }
  stopAudio();
  const a = assignments[slotId]; if (!a) return;
  currentAudio  = new Audio(a.url);
  currentPlayId = slotId;
  currentAudio.play();
  currentAudio.onended = () => { currentPlayId = null; currentAudio = null; render(); };
  render();
}
function stopAudio() {
  if (currentAudio) { currentAudio.pause(); currentAudio = null; }
  currentPlayId = null;
}

/* ── ZIP generation ───────────────────────────────────── */
async function buildZip() {
  const filled = SLOTS.filter(s => assignments[s.id]);
  if (!filled.length) { toast('No tracks assigned yet'); return; }

  // Show overlay
  const overlay = document.getElementById('building');
  overlay.classList.add('show');

  try {
    const zip     = new JSZip();
    const bgmPath = 'music_cpk/Asset/Audio/BGM/';

    // Add each assigned file with the correct PES 17 filename
    const reads = filled.map(slot => {
      const a   = assignments[slot.id];
      const out = bgmPath + slot.file + a.ext;  // e.g. Asset/Audio/BGM/bgm_menu_main.mp3
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = e => { zip.file(out, e.target.result); resolve(); };
        reader.onerror = reject;
        reader.readAsArrayBuffer(a.file);
      });
    });

    await Promise.all(reads);

    // Add a README inside the ZIP
    const readme = buildReadme(filled);
    zip.file('music_cpk/README.txt', readme);

    // Generate and trigger download
    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 1 } });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'music_cpk.zip';
    a.click();
    URL.revokeObjectURL(url);

    toast('✓ ZIP downloaded — ' + filled.length + ' track' + (filled.length !== 1 ? 's' : ''));
  } catch (err) {
    console.error(err);
    toast('Error building ZIP. Check the console.');
  } finally {
    overlay.classList.remove('show');
  }
}

function buildReadme(filled) {
  const lines = [
    'PES 17 Music CPK — File Manifest',
    '=================================',
    `Generated: ${new Date().toLocaleString()}`,
    `Tracks included: ${filled.length} / ${SLOTS.length}`,
    '',
    'HOW TO USE',
    '----------',
    '1. Extract this ZIP.',
    '2. Open CPK Tools and point it at the "music_cpk" folder.',
    '3. Pack it into music.cpk.',
    '4. Copy music.cpk into your PES 2017/Data/ folder.',
    '5. Launch PES 17 — your custom music will play.',
    '',
    'FOLDER STRUCTURE',
    '----------------',
    'music_cpk/',
    '  Asset/',
    '    Audio/',
    '      BGM/',
    ...filled.map(s => `        ${s.file}${assignments[s.id].ext}  <-- ${assignments[s.id].name}`),
    '',
    'UNASSIGNED SLOTS (will use original PES audio)',
    '----------------------------------------------',
    ...SLOTS.filter(s => !assignments[s.id]).map(s => `  ${s.file}  (${s.label})`),
  ];
  return lines.join('\n');
}

/* ── Toast ────────────────────────────────────────────── */
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2600);
}

/* ── Init ─────────────────────────────────────────────── */
updateStats();
render();
