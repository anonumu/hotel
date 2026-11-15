// ==========================================================================
// МОДУЛЬ: Персонал, смены и отметка присутствия «На работе / Выходной»
// ==========================================================================

// ==========================================================================
// 5. ПЕРСОНАЛ
// ==========================================================================
function filterStaffView(mode, btn) {
  staffFilterMode = mode;
  document.querySelectorAll('#staff-filter-tabs .floor-tab-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderStaffCards(globalStaffCache);
}

function renderStaffCards(staff) {
  const allCount = staff.length;
  const activeCount = staff.filter(s => s.active).length;
  const offCount = allCount - activeCount;

  const cAll = document.getElementById('staff-count-all');
  const cAct = document.getElementById('staff-count-active');
  const cOff = document.getElementById('staff-count-off');
  if (cAll) cAll.innerText = allCount;
  if (cAct) cAct.innerText = activeCount;
  if (cOff) cOff.innerText = offCount;

  const grid = document.getElementById('staff-grid');
  if (!grid) return;

  const filtered = staff.filter(s => {
    if (staffFilterMode === 'ACTIVE') return Boolean(s.active);
    if (staffFilterMode === 'OFF') return !s.active;
    return true;
  });

  if (filtered.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:32px; color:#64748b">В выбранном фильтре сотрудники отсутствуют</div>';
    return;
  }

  grid.innerHTML = filtered.map(s => `
    <div class="staff-card">
      <div class="staff-top">
        <div>
          <div class="staff-name">${escapeHtml(s.firstName)} ${escapeHtml(s.lastName)}</div>
          <div class="staff-pos">${LABELS.positions[s.position] || s.position}</div>
        </div>
        <button type="button"
                class="door-hanger-card ${s.active ? 'AVAILABLE' : 'OUT_OF_ORDER'}"
                style="margin:0; padding:4px 10px"
                title="Нажмите, чтобы переключить рабочий статус"
                onclick="toggleStaffStatus(${s.id}, ${!s.active})">
          ${s.active ? 'На работе' : 'Не на работе'}
        </button>
      </div>
      <div class="staff-details">
        <div>Телефон: <strong>${escapeHtml(s.phone)}</strong></div>
        <div>Email: <strong>${escapeHtml(s.email)}</strong></div>
        <div>Принят: <span>${s.hireDate || '2023-01-15'}</span></div>
      </div>
      <div style="display:flex; gap:6px; align-items:center">
        <button class="btn btn-sm ${s.active ? 'btn-brass' : 'btn-primary'}" style="flex:1; white-space:nowrap" onclick="toggleStaffStatus(${s.id}, ${!s.active})">
          ${s.active ? 'Выходной' : 'На работу'}
        </button>
        <button class="btn btn-sm btn-secondary" style="white-space:nowrap" onclick="openStaffSchedule(${s.id})">
          График
        </button>
        <button class="btn btn-sm btn-danger" style="white-space:nowrap" onclick="removeStaff(${s.id})">
          Удалить
        </button>
      </div>
    </div>
  `).join('');
}

async function renderStaff() {
  const staff = await api('/staff');
  if (!staff) return;
  globalStaffCache = staff;
  updateNavCounts({ staff: staff.length });
  renderStaffCards(staff);
}

async function toggleStaffStatus(id, targetActive) {
  try {
    const updated = await api(`/staff/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ active: Boolean(targetActive) })
    });
    const isNowActive = updated ? Boolean(updated.active) : Boolean(targetActive);
    notify(isNowActive ? 'Сотрудник отмечен: На работе (На смене)' : 'Сотрудник отмечен: Не на работе (Выходной)');

    if (currentScheduleStaffId === id) {
      updateShiftModalStatusUI(id, isNowActive);
    }
    await refreshAllViews();
  } catch (err) {
    if (!err.isStress) notify(err.message, 'err');
  }
}

function updateShiftModalStatusUI(id, isAtWork) {
  const statusEl = document.getElementById('sch-status');
  if (statusEl) {
    statusEl.innerText = isAtWork ? 'На работе (На смене)' : 'Не на работе (Выходной)';
    statusEl.style.color = isAtWork ? '#059669' : '#d97706';
  }
  const toggleBtn = document.getElementById('sch-toggle-btn');
  if (toggleBtn) {
    toggleBtn.innerText = isAtWork ? 'Отметить: Не на работе' : 'Отметить: На работе';
    toggleBtn.className = `btn ${isAtWork ? 'btn-brass' : 'btn-primary'}`;
    toggleBtn.dataset.nextActive = String(!isAtWork);
  }
}

function toggleStaffFromModal() {
  if (!currentScheduleStaffId) return;
  const toggleBtn = document.getElementById('sch-toggle-btn');
  const nextActive = toggleBtn?.dataset.nextActive === 'true';
  toggleStaffStatus(currentScheduleStaffId, nextActive);
}


async function submitStaff(e) {
  e.preventDefault();
  const btn = document.getElementById('add-staff-submit-btn');
  const origText = btn ? btn.innerHTML : 'Добавить в штат';
  if (btn) { btn.disabled = true; btn.innerHTML = 'Добавление...'; }

  clearModalAlert('modal-add-staff');

  const activeSelect = document.getElementById('staff-active');
  const member = {
    firstName: document.getElementById('staff-fn').value.trim(),
    lastName: document.getElementById('staff-ln').value.trim(),
    position: document.getElementById('staff-pos').value,
    email: document.getElementById('staff-em').value.trim(),
    phone: document.getElementById('staff-ph').value.trim(),
    hireDate: document.getElementById('staff-date').value || new Date().toISOString().split('T')[0],
    active: activeSelect ? activeSelect.value !== 'false' : true
  };

  if (
    hasInjectionPayload(member.firstName) ||
    hasInjectionPayload(member.lastName) ||
    hasInjectionPayload(member.email) ||
    hasInjectionPayload(member.phone)
  ) {
    triggerSamsonovStressOverlay({
      code: 'ERR_SECURITY_INJECTION_418',
      source: 'Форма приема сотрудника',
      reason: 'Обнаружена попытка XSS/SQL-инъекции в карточке сотрудника.',
      details: 'Потенциально опасная нагрузка заблокирована.'
    });
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }

  if (!member.firstName || !member.lastName || !member.phone || !member.email) {
    showModalAlert('modal-add-staff', 'Заполните Имя, Фамилию, Телефон и Email сотрудника');
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email)) {
    showModalAlert('modal-add-staff', 'Введите корректный Email сотрудника');
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }

  try {
    await api('/staff', { method: 'POST', body: JSON.stringify(member) });
    notify('Сотрудник принят в штат');
    closeModal('modal-add-staff');
    e.target.reset();
    await refreshAllViews();
  } catch (err) {
    if (!err.isStress) {
      showModalAlert('modal-add-staff', err.message);
      notify(err.message, 'err');
    }
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
  }
}

async function removeStaff(id) {
  if (!confirm('Исключить сотрудника из штата?')) return;
  try {
    await api(`/staff/${id}`, { method: 'DELETE' });
    notify('Сотрудник исключен из штата');
    await refreshAllViews();
  } catch (err) {
    notify(err.message, 'err');
  }
}


async function openStaffSchedule(id) {
  const sch = await api(`/staff/${id}/schedule`);
  if (!sch) return;

  currentScheduleStaffId = id;
  const isAtWork = sch.status === 'На смене';

  document.getElementById('sch-name').innerText = sch.fullName;
  document.getElementById('sch-pos').innerText = LABELS.positions[sch.position] || sch.position;
  document.getElementById('sch-hours').innerText = sch.shiftHours;
  document.getElementById('sch-plan').innerText = sch.workSchedule;
  document.getElementById('sch-zone').innerText = sch.assignedFloor;
  updateShiftModalStatusUI(id, isAtWork);

  openModal('modal-staff-shift');
}

