/**
 * ふたりリスト — プライバシー優先（名前は端末内のみ）
 */

const STORAGE_KEY = 'futari-list:v2';

const MEMBERS = [
  { id: 'member_a', label: '自分', emoji: '🙋' },
  { id: 'member_b', label: '相手', emoji: '🙋' },
  { id: 'both', label: 'ふたり', emoji: '💕' },
];

const LEGACY_MEMBER_IDS = { yuya: 'member_a', yuki: 'member_b' };

const TYPES = [
  { id: 'all', label: 'すべて' },
  { id: 'place', label: '🗺️ 行きたいところ' },
  { id: 'activity', label: '✨ やりたいこと' },
];

const STATUSES = [
  { id: 'all', label: 'すべて' },
  { id: 'someday', label: '💭 いつか', badge: 'いつか' },
  { id: 'planned', label: '📅 候補', badge: '候補' },
  { id: 'done', label: '✅ 達成', badge: '達成' },
];

const TAGS = ['食事', '旅行', '映画', 'おうち', 'イベント', 'アウトドア', '記念日'];

let state = loadState();
let activeType = 'all';
let activeStatus = 'all';
let editingId = null;
let formType = 'place';
let formTags = new Set();

const els = {
  headerSubtitle: document.getElementById('header-subtitle'),
  typeFilters: document.getElementById('type-filters'),
  statusFilters: document.getElementById('status-filters'),
  itemList: document.getElementById('item-list'),
  resultCount: document.getElementById('result-count'),
  emptyState: document.getElementById('empty-state'),
  viewList: document.getElementById('view-list'),
  viewShare: document.getElementById('view-share'),
  navBtns: document.querySelectorAll('.nav-btn'),
  fabAdd: document.getElementById('fab-add'),
  modal: document.getElementById('item-modal'),
  itemForm: document.getElementById('item-form'),
  modalTitle: document.getElementById('modal-title'),
  modalClose: document.getElementById('modal-close'),
  typeToggle: document.getElementById('type-toggle'),
  tagPicker: document.getElementById('tag-picker'),
  itemTitle: document.getElementById('item-title'),
  itemMemo: document.getElementById('item-memo'),
  itemStatus: document.getElementById('item-status'),
  itemPinned: document.getElementById('item-pinned'),
  itemDelete: document.getElementById('item-delete'),
  memberPicker: document.getElementById('member-picker'),
  labelMemberA: document.getElementById('label-member-a'),
  labelMemberB: document.getElementById('label-member-b'),
  saveLabels: document.getElementById('save-labels'),
  inviteCode: document.getElementById('invite-code'),
  copyInvite: document.getElementById('copy-invite'),
  joinCode: document.getElementById('join-code'),
  joinWorkspace: document.getElementById('join-workspace'),
  exportJson: document.getElementById('export-json'),
  importJson: document.getElementById('import-json'),
  importMerge: document.getElementById('import-merge'),
  supabaseUrl: document.getElementById('supabase-url'),
  supabaseKey: document.getElementById('supabase-key'),
  saveSync: document.getElementById('save-sync'),
  syncNow: document.getElementById('sync-now'),
  syncStatus: document.getElementById('sync-status'),
  toast: document.getElementById('toast'),
};

function defaultState() {
  return {
    version: 1,
    workspace: {
      id: crypto.randomUUID(),
      inviteCode: generateInviteCode(),
      name: 'ふたりリスト',
    },
    settings: {
      currentMember: 'member_a',
      memberLabels: {},
      supabaseUrl: '',
      supabaseAnonKey: '',
    },
    items: [],
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return migrateState(JSON.parse(raw));
  } catch {
    return defaultState();
  }
}

function migrateState(data) {
  const base = defaultState();
  const settings = { ...base.settings, ...data.settings };
  settings.memberLabels = settings.memberLabels || {};

  if (LEGACY_MEMBER_IDS[settings.currentMember]) {
    settings.currentMember = LEGACY_MEMBER_IDS[settings.currentMember];
  }

  const items = (Array.isArray(data.items) ? data.items : []).map((item) => ({
    ...item,
    createdBy: LEGACY_MEMBER_IDS[item.createdBy] || item.createdBy,
    updatedBy: LEGACY_MEMBER_IDS[item.updatedBy] || item.updatedBy,
  }));

  return {
    ...base,
    ...data,
    workspace: { ...base.workspace, ...data.workspace },
    settings,
    items,
  };
}

function saveState() {
  state.workspace.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `FLST-${code}`;
}

function memberLabel(id) {
  const member = MEMBERS.find((m) => m.id === id) || MEMBERS[0];
  const custom = state.settings.memberLabels?.[member.id];
  return custom ? { ...member, label: custom } : member;
}

function createItem(data) {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    type: data.type || 'place',
    title: data.title.trim(),
    memo: (data.memo || '').trim(),
    tags: data.tags || [],
    status: data.status || 'someday',
    createdBy: state.settings.currentMember,
    updatedBy: state.settings.currentMember,
    pinned: !!data.pinned,
    createdAt: now,
    updatedAt: now,
    completedAt: data.status === 'done' ? now : null,
  };
}

function updateItem(existing, data) {
  const now = new Date().toISOString();
  const status = data.status || existing.status;
  return {
    ...existing,
    type: data.type ?? existing.type,
    title: data.title.trim(),
    memo: (data.memo || '').trim(),
    tags: data.tags || [],
    status,
    pinned: !!data.pinned,
    updatedBy: state.settings.currentMember,
    updatedAt: now,
    completedAt: status === 'done' ? (existing.completedAt || now) : null,
  };
}

function getFilteredItems() {
  return state.items
    .filter((item) => activeType === 'all' || item.type === activeType)
    .filter((item) => activeStatus === 'all' || item.status === activeStatus)
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      const order = { planned: 0, someday: 1, done: 2 };
      const sd = order[a.status] - order[b.status];
      if (sd !== 0) return sd;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
}

function exportData() {
  const payload = {
    exportedAt: new Date().toISOString(),
    workspace: state.workspace,
    settings: {
      currentMember: state.settings.currentMember,
      memberLabels: state.settings.memberLabels,
    },
    items: state.items,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `futari-list-${state.workspace.inviteCode}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('エクスポートしました');
}

function importData(file, merge) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data.items)) throw new Error('invalid');

      if (merge) {
        const map = new Map(state.items.map((i) => [i.id, i]));
        for (const item of data.items) {
          const existing = map.get(item.id);
          if (!existing || new Date(item.updatedAt) > new Date(existing.updatedAt)) {
            map.set(item.id, item);
          }
        }
        state.items = [...map.values()];
      } else {
        state.items = data.items;
        if (data.workspace) state.workspace = { ...state.workspace, ...data.workspace };
        if (data.settings?.currentMember) state.settings.currentMember = data.settings.currentMember;
        if (data.settings?.memberLabels) state.settings.memberLabels = data.settings.memberLabels;
      }

      if (data.settings?.memberLabels) {
        state.settings.memberLabels = {
          ...state.settings.memberLabels,
          ...data.settings.memberLabels,
        };
      }

      if (data.workspace?.inviteCode) {
        state.workspace.inviteCode = data.workspace.inviteCode;
        state.workspace.id = data.workspace.id || state.workspace.id;
      }

      saveState();
      renderAll();
      toast(merge ? 'マージしました' : 'インポートしました');
    } catch {
      toast('JSONの読み込みに失敗しました');
    }
  };
  reader.readAsText(file);
}

async function supabaseFetch(path, options = {}) {
  const { supabaseUrl, supabaseAnonKey } = state.settings;
  if (!supabaseUrl || !supabaseAnonKey) throw new Error('Supabase未設定');

  const res = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
      Prefer: options.prefer || 'return=minimal',
      ...options.headers,
    },
  });

  if (!res.ok) throw new Error(await res.text() || res.statusText);
  if (res.status === 204) return null;
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : null;
}

async function ensureWorkspaceOnServer() {
  const code = state.workspace.inviteCode;
  const existing = await supabaseFetch(
    `workspaces?invite_code=eq.${encodeURIComponent(code)}&select=id,invite_code,name`
  );

  if (existing?.length) {
    state.workspace.id = existing[0].id;
    return existing[0];
  }

  const created = await supabaseFetch('workspaces', {
    method: 'POST',
    prefer: 'return=representation',
    body: JSON.stringify({
      id: state.workspace.id,
      invite_code: code,
      name: state.workspace.name,
    }),
  });

  return created?.[0] || created;
}

async function syncToCloud() {
  setSyncStatus('同期中…', '');

  try {
    await ensureWorkspaceOnServer();
    const wsId = state.workspace.id;

    for (const item of state.items) {
      await supabaseFetch('wish_items', {
        method: 'POST',
        prefer: 'resolution=merge-duplicates,return=minimal',
        body: JSON.stringify({
          id: item.id,
          workspace_id: wsId,
          type: item.type,
          title: item.title,
          memo: item.memo,
          tags: item.tags,
          status: item.status,
          created_by: item.createdBy,
          updated_by: item.updatedBy,
          pinned: item.pinned,
          created_at: item.createdAt,
          updated_at: item.updatedAt,
          completed_at: item.completedAt,
        }),
      });
    }

    const remote = await supabaseFetch(
      `wish_items?workspace_id=eq.${wsId}&select=*&order=updated_at.desc`
    );

    if (Array.isArray(remote)) {
      state.items = remote.map(rowToItem);
      saveState();
      renderAll();
    }

    setSyncStatus('同期完了', 'ok');
    toast('クラウドと同期しました');
  } catch (err) {
    setSyncStatus(`同期エラー: ${err.message}`, 'err');
  }
}

async function joinWorkspaceByCode(code) {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return toast('コードを入力してください');

  if (state.settings.supabaseUrl && state.settings.supabaseAnonKey) {
    try {
      setSyncStatus('参加中…', '');
      const rows = await supabaseFetch(
        `workspaces?invite_code=eq.${encodeURIComponent(normalized)}&select=id,invite_code,name`
      );
      if (!rows?.length) {
        setSyncStatus('コードが見つかりません', 'err');
        return toast('ワークスペースが見つかりません');
      }
      state.workspace.id = rows[0].id;
      state.workspace.inviteCode = rows[0].invite_code;
      state.workspace.name = rows[0].name;
      saveState();
      await syncToCloud();
      renderShareView();
      toast('ワークスペースに参加しました');
    } catch (err) {
      setSyncStatus(err.message, 'err');
    }
    return;
  }

  state.workspace.inviteCode = normalized;
  saveState();
  renderShareView();
  toast('コードを保存しました。クラウド設定後に同期できます');
}

function rowToItem(row) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    memo: row.memo || '',
    tags: row.tags || [],
    status: row.status,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    pinned: row.pinned,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  };
}

function setSyncStatus(msg, type) {
  els.syncStatus.textContent = msg;
  els.syncStatus.className = 'sync-status' + (type ? ` sync-status--${type}` : '');
}

function toast(msg) {
  els.toast.textContent = msg;
  els.toast.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { els.toast.hidden = true; }, 2400);
}

function renderFilterButtons(container, options, active, onSelect) {
  container.innerHTML = options.map((opt) =>
    `<button type="button" class="filter-btn${active === opt.id ? ' filter-btn--active' : ''}" data-id="${opt.id}">${opt.label}</button>`
  ).join('');

  container.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => onSelect(btn.dataset.id));
  });
}

function renderMemberPicker() {
  els.memberPicker.innerHTML = MEMBERS.filter((m) => m.id !== 'both').map((m) => {
    const label = memberLabel(m.id);
    return `<button type="button" class="member-btn${state.settings.currentMember === m.id ? ' member-btn--active' : ''}" data-id="${m.id}">${label.emoji} ${escapeHtml(label.label)}</button>`;
  }).join('');

  els.memberPicker.querySelectorAll('.member-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.settings.currentMember = btn.dataset.id;
      saveState();
      renderMemberPicker();
      renderHeader();
      renderList();
    });
  });

  if (els.labelMemberA) {
    els.labelMemberA.value = state.settings.memberLabels?.member_a || '';
    els.labelMemberB.value = state.settings.memberLabels?.member_b || '';
  }
}

function saveMemberLabels() {
  const a = els.labelMemberA?.value.trim() || '';
  const b = els.labelMemberB?.value.trim() || '';
  state.settings.memberLabels = {};
  if (a) state.settings.memberLabels.member_a = a;
  if (b) state.settings.memberLabels.member_b = b;
  saveState();
  renderMemberPicker();
  renderHeader();
  renderList();
  toast('表示名を保存しました（端末内のみ）');
}

function renderTypeToggle(selected) {
  els.typeToggle.innerHTML = TYPES.filter((t) => t.id !== 'all').map((t) =>
    `<button type="button" class="type-btn${selected === t.id ? ' type-btn--active' : ''}" data-id="${t.id}">${t.label}</button>`
  ).join('');

  els.typeToggle.querySelectorAll('.type-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      formType = btn.dataset.id;
      renderTypeToggle(formType);
    });
  });
}

function renderTagPicker(selected) {
  els.tagPicker.innerHTML = TAGS.map((tag) =>
    `<button type="button" class="tag-btn${selected.has(tag) ? ' tag-btn--active' : ''}" data-tag="${tag}">${tag}</button>`
  ).join('');

  els.tagPicker.querySelectorAll('.tag-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tag = btn.dataset.tag;
      if (selected.has(tag)) selected.delete(tag);
      else selected.add(tag);
      renderTagPicker(selected);
    });
  });
}

function renderHeader() {
  const member = memberLabel(state.settings.currentMember);
  els.headerSubtitle.textContent = `${member.emoji} ${member.label} のリスト · 招待 ${state.workspace.inviteCode}`;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderList() {
  const items = getFilteredItems();
  els.resultCount.textContent = `${items.length} 件`;

  if (items.length === 0) {
    els.itemList.innerHTML = '';
    els.emptyState.hidden = false;
    return;
  }

  els.emptyState.hidden = true;
  els.itemList.innerHTML = items.map((item) => {
    const member = memberLabel(item.createdBy);
    const status = STATUSES.find((s) => s.id === item.status) || STATUSES[1];
    return `
      <article class="item-card${item.pinned ? ' item-card--pinned' : ''}" data-id="${item.id}">
        <div class="item-card__top">
          <h3 class="item-card__title">${escapeHtml(item.title)}</h3>
          ${item.pinned ? '<span class="item-card__pin">📌</span>' : ''}
        </div>
        ${item.memo ? `<p class="item-card__memo">${escapeHtml(item.memo)}</p>` : ''}
        <div class="item-card__meta">
          <span class="badge badge--type-${item.type}">${item.type === 'place' ? '行きたい' : 'やりたい'}</span>
          <span class="badge badge--status-${item.status}">${status.badge || status.label}</span>
          <span class="badge badge--member">${member.emoji} ${member.label}</span>
          ${item.tags.map((t) => `<span class="tag-chip">${escapeHtml(t)}</span>`).join('')}
        </div>
      </article>
    `;
  }).join('');

  els.itemList.querySelectorAll('.item-card').forEach((card) => {
    card.addEventListener('click', () => openEditModal(card.dataset.id));
  });
}

function renderShareView() {
  els.inviteCode.textContent = state.workspace.inviteCode;
  els.supabaseUrl.value = state.settings.supabaseUrl || '';
  els.supabaseKey.value = state.settings.supabaseAnonKey || '';
  renderMemberPicker();
}

function renderAll() {
  renderHeader();
  renderList();
  renderShareView();
}

function switchView(view) {
  els.navBtns.forEach((btn) => {
    btn.classList.toggle('nav-btn--active', btn.dataset.view === view);
  });
  els.viewList.hidden = view !== 'list';
  els.viewList.classList.toggle('view--active', view === 'list');
  els.viewShare.hidden = view !== 'share';
  els.viewShare.classList.toggle('view--active', view === 'share');
  els.fabAdd.hidden = view !== 'list';
  if (view === 'share') renderShareView();
}

function openAddModal() {
  editingId = null;
  formType = 'place';
  formTags = new Set();
  els.modalTitle.textContent = 'メモを追加';
  els.itemTitle.value = '';
  els.itemMemo.value = '';
  els.itemStatus.value = 'someday';
  els.itemPinned.checked = false;
  els.itemDelete.hidden = true;
  renderTypeToggle(formType);
  renderTagPicker(formTags);
  els.modal.showModal();
}

function openEditModal(id) {
  const item = state.items.find((i) => i.id === id);
  if (!item) return;

  editingId = id;
  formType = item.type;
  formTags = new Set(item.tags);
  els.modalTitle.textContent = 'メモを編集';
  els.itemTitle.value = item.title;
  els.itemMemo.value = item.memo;
  els.itemStatus.value = item.status;
  els.itemPinned.checked = item.pinned;
  els.itemDelete.hidden = false;
  renderTypeToggle(formType);
  renderTagPicker(formTags);
  els.modal.showModal();
}

function closeModal() {
  els.modal.close();
  editingId = null;
}

function onTypeSelect(id) {
  activeType = id;
  renderFilterButtons(els.typeFilters, TYPES, activeType, onTypeSelect);
  renderList();
}

function onStatusSelect(id) {
  activeStatus = id;
  renderFilterButtons(els.statusFilters, STATUSES, activeStatus, onStatusSelect);
  renderList();
}

els.navBtns.forEach((btn) => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});

els.fabAdd.addEventListener('click', openAddModal);
els.modalClose.addEventListener('click', closeModal);
els.modal.addEventListener('click', (e) => {
  if (e.target === els.modal) closeModal();
});

els.itemForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = {
    type: formType,
    title: els.itemTitle.value,
    memo: els.itemMemo.value,
    tags: [...formTags],
    status: els.itemStatus.value,
    pinned: els.itemPinned.checked,
  };

  if (editingId) {
    const idx = state.items.findIndex((i) => i.id === editingId);
    if (idx >= 0) state.items[idx] = updateItem(state.items[idx], data);
  } else {
    state.items.push(createItem(data));
  }

  saveState();
  renderAll();
  closeModal();
  toast(editingId ? '更新しました' : '追加しました');

  if (state.settings.supabaseUrl && state.settings.supabaseAnonKey) {
    syncToCloud().catch(() => {});
  }
});

els.itemDelete.addEventListener('click', () => {
  if (!editingId || !confirm('このメモを削除しますか？')) return;
  state.items = state.items.filter((i) => i.id !== editingId);
  saveState();
  renderAll();
  closeModal();
  toast('削除しました');
});

els.copyInvite.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(state.workspace.inviteCode);
    toast('招待コードをコピーしました');
  } catch {
    toast(state.workspace.inviteCode);
  }
});

els.joinWorkspace.addEventListener('click', () => joinWorkspaceByCode(els.joinCode.value));
els.exportJson.addEventListener('click', exportData);
els.importJson.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (file) importData(file, els.importMerge.checked);
  e.target.value = '';
});

els.saveSync.addEventListener('click', () => {
  state.settings.supabaseUrl = els.supabaseUrl.value.trim();
  state.settings.supabaseAnonKey = els.supabaseKey.value.trim();
  saveState();
  toast('同期設定を保存しました');
  if (state.settings.supabaseUrl && state.settings.supabaseAnonKey) syncToCloud();
});

els.syncNow.addEventListener('click', () => syncToCloud());

els.saveLabels?.addEventListener('click', saveMemberLabels);

renderFilterButtons(els.typeFilters, TYPES, activeType, onTypeSelect);
renderFilterButtons(els.statusFilters, STATUSES, activeStatus, onStatusSelect);
renderAll();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js').catch(() => {});
}
