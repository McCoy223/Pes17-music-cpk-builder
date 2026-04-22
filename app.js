/* =============================================
   PES 17 Music CPK Builder — Application Logic
   ============================================= */

/* --- SLOT DATA --- */
const SLOTS = [
  { cat: 'Menu & UI',        id: 'bgm_menu_main',     name: 'Main Menu BGM',       file: 'bgm_menu_main.adx' },
  { cat: 'Menu & UI',        id: 'bgm_menu_myclub',   name: 'MyClub Menu BGM',     file: 'bgm_myclub.adx' },
  { cat: 'Menu & UI',        id: 'bgm_menu_matchday', name: 'Matchday Screen BGM', file: 'bgm_matchday.adx' },
  { cat: 'Menu & UI',        id: 'bgm_menu_results',  name: 'Results Screen BGM',  file: 'bgm_results.adx' },
  { cat: 'Menu & UI',        id: 'bgm_menu_lineup',   name: 'Lineup Screen BGM',   file: 'bgm_lineup.adx' },
  { cat: 'Menu & UI',        id: 'bgm_menu_replay',   name: 'Replay Menu BGM',     file: 'bgm_replay.adx' },
  { cat: 'Menu & UI',        id: 'bgm_menu_edit',     name: 'Edit Mode BGM',       file: 'bgm_edit.adx' },
  { cat: 'Match Atmosphere', id: 'bgm_kickoff',       name: 'Kick-off Intro',      file: 'bgm_kickoff.adx' },
  { cat: 'Match Atmosphere', id: 'bgm_halftime',      name: 'Half-time BGM',       file: 'bgm_halftime.adx' },
  { cat: 'Match Atmosphere', id: 'bgm_pregame',       name: 'Pre-game Tunnel BGM', file: 'bgm_pregame.adx' },
  { cat: 'Match Atmosphere', id: 'bgm_warmup',        name: 'Warmup BGM',          file: 'bgm_warmup.adx' },
  { cat: 'Match Atmosphere', id: 'bgm_goal_01',       name: 'Goal Jingle 1',       file: 'bgm_goal_01.adx' },
  { cat: 'Match Atmosphere', id: 'bgm_goal_02',       name: 'Goal Jingle 2',       file: 'bgm_goal_02.adx' },
  { cat: 'Match Atmosphere', id: 'bgm_goal_03',       name: 'Goal Jingle 3',       file: 'bgm_goal_03.adx' },
  { cat: 'Match Atmosphere', id: 'bgm_ft_win',        name: 'FT Win Jingle',       file: 'bgm_ft_win.adx' },
  { cat: 'Match Atmosphere', id: 'bgm_ft_lose',       name: 'FT Loss Jingle',      file: 'bgm_ft_lose.adx' },
  { cat: 'Match Atmosphere', id: 'bgm_ft_draw',       name: 'FT Draw Jingle',      file: 'bgm_ft_draw.adx' },
  { cat: 'Anthems',          id: 'anthem_ucl',        name: 'UCL Anthem',          file: 'anthem_ucl.adx' },
  { cat: 'Anthems',          id: 'anthem_uel',        name: 'UEL Anthem',          file: 'anthem_uel.adx' },
  { cat: 'Anthems',          id: 'anthem_club_01',    name: 'Club Anthem Slot 1',  file: 'anthem_club_01.adx' },
  { cat: 'Anthems',          id: 'anthem_club_02',    name: 'Club Anthem Slot 2',  file: 'anthem_club_02.adx' },
  { cat: 'Anthems',          id: 'anthem_club_03',    name: 'Club Anthem Slot 3',  file: 'anthem_club_03.adx' },
  { cat: 'Anthems',          id: 'anthem_club_04',    name: 'Club Anthem Slot 4',  file: 'anthem_club_04.adx' },
  { cat: 'Commentary',       id: 'commentary_intro',  name: 'Commentary Intro',    file: 'commentary_intro.adx' },
  { cat: 'Highlights',       id: 'bgm_hl_01',         name: 'Highlights Pack 1',   file: 'bgm_hl_01.adx' },
  { cat: 'Highlights',       id: 'bgm_hl_02',         name: 'Highlights Pack 2',   file: 'bgm_hl_02.adx' },
  { cat: 'Highlights',       id: 'bgm_hl_03',         name: 'Highlights Pack 3',   file: 'bgm_hl_03.adx' },
  { cat: 'Highlights',       id: 'bgm_hl_04',         name: 'Highlights Pack 4',   file: 'bgm_hl_04.adx' },
];

/* --- STATE --- */
let assignments   = {};
let filterStatus  = 'all';
let currentAudio  = null;
let currentPlayId = null;
let dragSrcId     = null;

/* --- UTILITIES --- */

/**
 * Format a byte count into a human-readable string.
 * @param {number} bytes
 * @returns {string}
 */
function fmt(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

/* --- STATS --- */

/** Recalculate and update the four stat cells. */
function updateStats() {
  const total    = SLOTS.length;
  const assigned = Object.keys(assignments).length;
  const pct      = Math.round((assigned / total) * 100);

  document.getElementById('stat-total').textContent    = total;
  document.getElementById('stat-assigned').textContent = assigned;
  document.getElementById('stat-empty').textContent    = total - assigned;
  document.getElementById('stat-pct').textContent      = pct + '%';
  document.getElementById('progress-bar').style.width  = pct + '%';
}

/* --- RENDER --- */

/** Build and inject the slot card HTML based on current state and filters. */
function renderSlots() {
  const search    = document.getElementById('search-input').value.toLowerCase();
  const cats      = [...new Set(SLOTS.map(s => s.cat))];
  const container = document.getElementById('slots-container');
  let html = '';

  cats.forEach(cat => {
    const rows = SLOTS.filter(s => {
      const matchSearch = !search ||
        s.name.toLowerCase().includes(search) ||
        s.id.includes(search) ||
        s.file.includes(search);

      const matchFilter =
        filterStatus === 'all'      ? true :
        filterStatus === 'assigned' ? !!assignments[s.id] :
                                      !assignments[s.id];

      return s.cat === cat && matchSearch && matchFilter;
    });

    if (!rows.length) return;

    html += `
      <div class="cat-header">
        <div class="cat-title">${cat}</div>
        <div class="cat-line"></div>
        <div class="cat-count">${rows.length} slot${rows.length !== 1 ? 's' : ''}</div>
      </div>
      <div class="slot-grid">
    `;

    rows.forEach(slot => {
      const a         = assignments[slot.id];
      const isPlaying = currentPlayId === slot.id;

      const assignedCol = a
        ? `<div class="file-name" title="${a.name}">${a.name}</div>
           <div class="file-size">${fmt(a.size)}</div>`
        : `<div class="no-file">No file assigned</div>`;

      const actionsCol = a
        ? `<button class="icon-btn play ${isPlaying ? 'stop' : ''}"
             title="${isPlaying ? 'Stop' : 'Preview'}"
             onclick="togglePlay('${slot.id}')">
             ${isPlaying ? '■' : '▶'}
           </button>
           <button class="icon-btn del" title="Remove" onclick="removeSlot('${slot.id}')">✕</button>`
        : `<button class="choose-btn" onclick="chooseFile('${slot.id}')">Choose</button>`;

      html += `
        <div class="slot-card${a ? ' assigned' : ''}" id="card-${slot.id}"
          draggable="true"
          ondragstart="onDragStart(event,'${slot.id}')"
          ondragover="onDragOver(event,'${slot.id}')"
          ondrop="onDrop(event,'${slot.id}')"
          ondragleave="onDragLeave('${slot.id}')">
          <div class="slot-info">
            <div class="slot-name">${slot.name}</div>
            <div class="slot-file">${slot.file}</div>
          </div>
          <div class="slot-assigned">${assignedCol}</div>
          <div>
            <span class="badge ${a ? 'badge-ready' : 'badge-empty'}">
              ${a ? '✓ Ready' : '— Empty'}
            </span>
          </div>
          <div class="slot-actions">${actionsCol}</div>
        </div>
      `;
    });

    html += '</div>';
  });

  if (!html) {
    html = '<div class="empty-state">No slots match your current filter.</div>';
  }

  container.innerHTML = html;
}

/* --- FILE ASSIGNMENT --- */

/** Open a file picker for a specific slot. */
function chooseFile(slotId) {
  const inp   = document.createElement('input');
  inp.type    = 'file';
  inp.accept  = 'audio/*';
  inp.onchange = e => {
    if (e.target.files[0]) assignFile(slotId, e.target.files[0]);
  };
  inp.click();
}

/**
 * Assign a File object to the given slot, revoking any existing object URL.
 * @param {string} slotId
 * @param {File}   file
 */
function assignFile(slotId, file) {
  if (assignments[slotId]?.url) URL.revokeObjectURL(assignments[slotId].url);
  assignments[slotId] = { name: file.name, size: file.size, url: URL.createObjectURL(file) };
  updateStats();
  renderSlots();
  showToast('✓  Assigned: ' + file.name);
}

/** Remove the assignment for a slot. */
function removeSlot(slotId) {
  if (currentPlayId === slotId) stopAudio();
  if (assignments[slotId]?.url) URL.revokeObjectURL(assignments[slotId].url);
  delete assignments[slotId];
  updateStats();
  renderSlots();
  showToast('Removed track');
}

/** Clear every assignment after user confirmation. */
function clearAll() {
  if (!Object.keys(assignments).length) return;
  if (!confirm('Clear all assigned tracks?')) return;
  stopAudio();
  Object.values(assignments).forEach(a => { if (a.url) URL.revokeObjectURL(a.url); });
  assignments = {};
  updateStats();
  renderSlots();
  showToast('All tracks cleared');
}

/**
 * Auto-assign an array of Files to the next available empty slots.
 * @param {FileList|File[]} files
 */
function handleBulkUpload(files) {
  const emptySlots = SLOTS.filter(s => !assignments[s.id]);
  let count = 0;
  Array.from(files).forEach((f, i) => {
    if (i < emptySlots.length) {
      assignFile(emptySlots[i].id, f);
      count++;
    }
  });
  showToast(`Auto-assigned ${count} file${count !== 1 ? 's' : ''}`);
}

/* --- AUDIO PLAYBACK --- */

/** Toggle playback for a slot; stops any currently playing audio first. */
function togglePlay(slotId) {
  if (currentPlayId === slotId) { stopAudio(); renderSlots(); return; }
  stopAudio();
  const a = assignments[slotId];
  if (!a) return;
  currentAudio    = new Audio(a.url);
  currentPlayId   = slotId;
  currentAudio.play();
  currentAudio.onended = () => { currentPlayId = null; currentAudio = null; renderSlots(); };
  renderSlots();
}

/** Stop and discard the current Audio instance. */
function stopAudio() {
  if (currentAudio) { currentAudio.pause(); currentAudio = null; }
  currentPlayId = null;
}

/* --- DRAG & DROP (slot-to-slot swap) --- */

function onDragStart(e, id) {
  dragSrcId = id;
  document.getElementById('card-' + id)?.classList.add('dragging');
}

function onDragOver(e, id) {
  e.preventDefault();
  document.getElementById('card-' + id)?.classList.add('drag-over');
}

function onDragLeave(id) {
  document.getElementById('card-' + id)?.classList.remove('drag-over', 'dragging');
}

function onDrop(e, id) {
  e.preventDefault();
  document.getElementById('card-' + id)?.classList.remove('drag-over');

  if (!dragSrcId || dragSrcId === id) { dragSrcId = null; return; }

  // Swap assignments
  const tmp = assignments[dragSrcId];
  if (assignments[id]) assignments[dragSrcId] = assignments[id];
  else delete assignments[dragSrcId];
  if (tmp) assignments[id] = tmp;
  else delete assignments[id];

  dragSrcId = null;
  renderSlots();
  updateStats();
  showToast('Tracks swapped');
}

/* --- DROP ZONE (page-level file drop) --- */

function dzOver(e) {
  e.preventDefault();
  document.getElementById('drop-zone').classList.add('hovering');
}

function dzLeave() {
  document.getElementById('drop-zone').classList.remove('hovering');
}

function dzDrop(e) {
  e.preventDefault();
  document.getElementById('drop-zone').classList.remove('hovering');
  handleBulkUpload(e.dataTransfer.files);
}

// Accept drops that land outside a slot card or the explicit drop zone
document.addEventListener('dragover', e => e.preventDefault());
document.addEventListener('drop', e => {
  if (!e.target.closest('.slot-card') && !e.target.closest('.drop-zone')) {
    e.preventDefault();
    handleBulkUpload(e.dataTransfer.files);
  }
});

/* --- EXPORT --- */

/** Build and download a plain-text CPK manifest file. */
function exportManifest() {
  const assigned = SLOTS.filter(s => assignments[s.id]);
  if (!assigned.length) { showToast('No tracks assigned yet'); return; }

  const cats = [...new Set(assigned.map(s => s.cat))];

  let out = '# =============================================\n';
  out    += '# PES 17 Music CPK Manifest\n';
  out    += `# Generated: ${new Date().toLocaleString()}\n`;
  out    += `# Assigned: ${assigned.length} / ${SLOTS.length} slots\n`;
  out    += '# =============================================\n\n';
  out    += '# Instructions:\n';
  out    += '# 1. Rename your source files as shown below\n';
  out    += '# 2. Place them in:  Asset/Audio/BGM/\n';
  out    += '# 3. Use CPK Tools to pack folder into music.cpk\n';
  out    += '# 4. Copy music.cpk to:  PES 2017/Data/\n\n';

  cats.forEach(cat => {
    out += `## ${cat}\n`;
    assigned
      .filter(s => s.cat === cat)
      .forEach(s => {
        out += `${s.file.padEnd(30)} <-- ${assignments[s.id].name}\n`;
      });
    out += '\n';
  });

  const unassigned = SLOTS.filter(s => !assignments[s.id]);
  if (unassigned.length) {
    out += '## Unassigned Slots (keeping original PES audio)\n';
    unassigned.forEach(s => { out += `${s.file.padEnd(30)} (original)\n`; });
  }

  const blob = new Blob([out], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'music_cpk_manifest.txt';
  a.click();
  URL.revokeObjectURL(url);
  showToast('✓  Manifest exported!');
}

/* --- TABS --- */

/**
 * Switch between the Track Slots and Guide tabs.
 * @param {string}      name  - section id suffix ('slots' | 'guide')
 * @param {HTMLElement} el    - the clicked tab button
 */
function switchTab(name, el) {
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('sec-' + name).classList.add('active');
}

/* --- TOAST --- */

/** Display a temporary toast notification. */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2500);
}

/* --- INIT --- */
updateStats();
renderSlots();
