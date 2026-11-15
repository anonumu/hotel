// Номерной фонд
async function renderRooms(cachedRooms) {
  const rooms = cachedRooms || await api('/rooms');
  if (!rooms) return;
  globalRoomsCache = rooms;
  updateNavCounts({ rooms: rooms.length });
  displayRoomsTable(rooms);
}

function displayRoomsTable(rooms) {
  const tbody = document.getElementById('rooms-tbody');
  if (!tbody) return;

  if (rooms.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; color:var(--text-muted); padding:28px">
          <div>Номера не найдены</div>
          <div style="margin-top:10px">
            <button type="button" class="btn btn-xs btn-primary" onclick="restoreDemoData()">Восстановить стартовые номера</button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = rooms.map(r => `
    <tr>
      <td><strong>№ ${r.roomNumber}</strong></td>
      <td>${LABELS.types[r.type] || r.type}</td>
      <td>${r.floor} этаж</td>
      <td>${r.maxGuests} чел.</td>
      <td><strong>${formatRub(r.pricePerNight)}</strong></td>
      <td>
        <span class="door-hanger-card ${r.status}" style="display:inline-block; padding:3px 8px; margin:0">
          ${LABELS.roomStatuses[r.status] || r.status}
        </span>
      </td>
      <td>
        <div style="display:flex; gap:6px">
          <button class="btn btn-xs btn-secondary" onclick="openRoomStatusModal(${r.id}, '${r.roomNumber}', '${r.status}')">
            Статус
          </button>
          <button class="btn btn-xs btn-danger" onclick="removeRoom(${r.id})">
            Удалить
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterRoomsList() {
  const search = (document.getElementById('room-search-input')?.value || '').trim().toLowerCase();
  const status = document.getElementById('room-status-filter')?.value || '';

  const filtered = globalRoomsCache.filter(r => {
    const matchNum = !search || r.roomNumber.toLowerCase().includes(search);
    const matchStatus = !status || r.status === status;
    return matchNum && matchStatus;
  });

  displayRoomsTable(filtered);
}

let selectedRoomId = null;
function openRoomStatusModal(id, num, status) {
  selectedRoomId = id;
  document.getElementById('status-modal-num').innerText = num;
  document.getElementById('modal-room-status-sel').value = status;
  openModal('modal-status');
}

async function applyRoomStatus() {
  const st = document.getElementById('modal-room-status-sel').value;
  if (!selectedRoomId) return;

  const btn = document.getElementById('modal-status-submit-btn');
  const origText = btn ? btn.innerHTML : 'Сохранить';
  if (btn) { btn.disabled = true; btn.innerHTML = 'Сохранение...'; }

  clearModalAlert('modal-status');

  try {
    await api(`/rooms/${selectedRoomId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: st })
    });
    notify('Статус номера обновлен');
    closeModal('modal-status');
    await refreshAllViews();
    renderReports();
  } catch (err) {
    showModalAlert('modal-status', err.message);
    notify(err.message, 'err');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
  }
}

// Создание номера

async function submitRoom(e) {
  e.preventDefault();
  const btn = document.getElementById('add-room-submit-btn');
  const origText = btn ? btn.innerHTML : 'Создать номер';
  if (btn) { btn.disabled = true; btn.innerHTML = 'Сохранение...'; }

  clearModalAlert('modal-add-room');

  const roomNum = document.getElementById('add-room-num').value.trim();
  const floorVal = parseInt(document.getElementById('add-room-floor').value, 10);
  const guestsVal = parseInt(document.getElementById('add-room-guests').value, 10);
  const priceVal = parseFloat(document.getElementById('add-room-price').value);
  const descVal = document.getElementById('add-room-desc').value.trim();

  if (hasInjectionPayload(roomNum) || hasInjectionPayload(descVal)) {
    triggerSamsonovStressOverlay({
      code: 'ERR_SECURITY_INJECTION_418',
      source: 'Форма добавления номера',
      reason: 'Обнаружена попытка XSS/SQL-инъекции при добавлении номера.',
      details: 'Некорректные управляющие конструкции заблокированы.'
    });
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }

  if (!roomNum) {
    showModalAlert('modal-add-room', 'Укажите номер комнаты (например, 103)');
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }

  if (isNaN(floorVal) || floorVal < 1 || floorVal > 50) {
    triggerSamsonovStressOverlay({
      code: 'ERR_FLOOR_OUT_OF_RANGE_418',
      source: 'Форма добавления номера: поле «Этаж» = ' + document.getElementById('add-room-floor').value,
      reason: `Этаж ${document.getElementById('add-room-floor').value} не существует в здании комплекса (допустимо: 1–50).`,
      details: 'Введён недопустимый параметр этажности.'
    });
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }

  if (isNaN(guestsVal) || guestsVal < 0 || guestsVal > 20) {
    triggerSamsonovStressOverlay({
      code: 'ERR_MAX_ROOM_CAPACITY_OVERFLOW_418',
      source: 'Форма добавления номера: поле «Вместимость» = ' + document.getElementById('add-room-guests').value,
      reason: `Попытка установить недопустимую вместимость номера (${document.getElementById('add-room-guests').value} чел., допустимо: 1–20 чел.).`,
      details: 'Сработал ограничитель строительных норм отеля.'
    });
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }

  if (guestsVal === 0) {
    showModalAlert('modal-add-room', 'Вместимость номера должна быть не менее 1 человека');
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }

  if (isNaN(priceVal) || priceVal < 0 || priceVal > 1000000) {
    triggerSamsonovStressOverlay({
      code: priceVal < 0 ? 'ERR_NEGATIVE_PRICE_OVERFLOW_418' : 'ERR_MAX_PRICE_OVERFLOW_418',
      source: 'Форма добавления номера: поле «Тариф за сутки» = ' + document.getElementById('add-room-price').value,
      reason: `Попытка установить некорректный или запредельный тариф (${document.getElementById('add-room-price').value} ₽, допустимо: 1–1 000 000 ₽).`,
      details: 'Операция заблокирована защитой тарификации.'
    });
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }

  if (priceVal === 0) {
    showModalAlert('modal-add-room', 'Тариф за сутки должен быть строго больше 0 ₽');
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }

  const room = {
    roomNumber: roomNum,
    type: document.getElementById('add-room-type').value,
    status: document.getElementById('add-room-status') ? document.getElementById('add-room-status').value : 'AVAILABLE',
    floor: floorVal,
    maxGuests: guestsVal,
    pricePerNight: priceVal,
    description: descVal
  };

  try {
    await api('/rooms', { method: 'POST', body: JSON.stringify(room) });
    notify(`Номер ${room.roomNumber} успешно добавлен`);
    closeModal('modal-add-room');
    e.target.reset();
    await refreshAllViews();
  } catch (err) {
    if (!err.isStress) {
      showModalAlert('modal-add-room', err.message);
      notify(err.message, 'err');
    }
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
  }
}

async function removeRoom(id) {
  if (!confirm('Вы действительно хотите удалить этот номер из фонда?')) return;
  try {
    await api(`/rooms/${id}`, { method: 'DELETE' });
    notify('Номер успешно удален');
    await refreshAllViews();
  } catch (err) {
    notify(err.message, 'err');
  }
}

// Создание бронирования
