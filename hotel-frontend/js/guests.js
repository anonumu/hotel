// ==========================================================================
// МОДУЛЬ: Служба приема, регистрация гостей, Check-In/Check-Out, Folio Invoice
// ==========================================================================

// ==========================================================================
// 4. СЛУЖБА ПРИЕМА И ГОСТИ (Ясная привязка к номеру, ночи и быстрое заселение)
// ==========================================================================
async function renderGuests(cachedGuests, cachedBooks, cachedRooms) {
  const [guests, bookings, rooms] = (cachedGuests && cachedBooks && cachedRooms)
    ? [cachedGuests, cachedBooks, cachedRooms]
    : await Promise.all([
      api('/guests'),
      api('/bookings'),
      api('/rooms')
    ]);

  if (!guests) return;
  globalGuestsCache = guests;
  globalBookingsCache = bookings || [];
  globalRoomsCache = rooms || [];
  updateNavCounts({ guests: guests.length });

  const tbody = document.getElementById('guests-tbody');
  if (!tbody) return;

  if (guests.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:24px">Гости не зарегистрированы</td></tr>';
    return;
  }

  tbody.innerHTML = guests.map(g => {
    const gId = g.id;
    const isGuestCheckedIn = g.checkedIn !== undefined ? g.checkedIn : g.isCheckedIn;

    // Находим активную бронь этого гостя (с поддержкой разных структур DTO)
    const checkedInBooking = globalBookingsCache.find(b =>
      ((b.guestId === gId) || (b.guest_id === gId) || (b.guest && b.guest.id === gId)) &&
      b.status === 'CHECKED_IN'
    );
    const confirmedBooking = globalBookingsCache.find(b =>
      ((b.guestId === gId) || (b.guest_id === gId) || (b.guest && b.guest.id === gId)) &&
      (b.status === 'CONFIRMED' || b.status === 'PENDING')
    );

    let assignedRoomInfo = '<span style="color:var(--text-dim)">Бронь не оформлена</span>';
    let checkInActionBtn = '';

    if (isGuestCheckedIn || checkedInBooking) {
      const activeB = checkedInBooking || confirmedBooking;
      const bRoomId = activeB ? (activeB.roomId || activeB.room_id || (activeB.room && activeB.room.id)) : null;
      const room = globalRoomsCache.find(r => r.id === bRoomId);
      const inDate = activeB ? activeB.checkInDate : g.checkInDate;
      const outDate = activeB ? activeB.checkOutDate : g.checkOutDate;
      const nights = calculateNights(inDate, outDate);
      const remainingBadge = getRemainingNightsBadge(outDate, 'CHECKED_IN');

      assignedRoomInfo = `
        <span class="room-assigned-pill">
          № ${room ? room.roomNumber : (bRoomId || '—')} (${room ? LABELS.types[room.type] || room.type : ''})
        </span>
        <div style="font-size:11px; color:var(--text-muted); margin-top:2px">${inDate || '—'} → ${outDate || '—'}</div>
        <div style="margin-top:3px; display:flex; align-items:center; gap:5px; flex-wrap:wrap">
          <span class="stay-nights-pill">${nights} ноч.</span>
          ${remainingBadge}
        </div>
      `;
      checkInActionBtn = `
        <button class="btn btn-xs btn-secondary" onclick="checkOutGuest(${g.id})">
          Выселить
        </button>
      `;
    } else if (confirmedBooking) {
      const bRoomId = confirmedBooking.roomId || confirmedBooking.room_id || (confirmedBooking.room && confirmedBooking.room.id);
      const room = globalRoomsCache.find(r => r.id === bRoomId);
      const nights = calculateNights(confirmedBooking.checkInDate, confirmedBooking.checkOutDate);
      const remainingBadge = getRemainingNightsBadge(confirmedBooking.checkOutDate, 'CONFIRMED');

      assignedRoomInfo = `
        <span class="room-assigned-pill" style="border-color:#d4c8b6">
          Забронирован № ${room ? room.roomNumber : bRoomId}
        </span>
        <div style="font-size:11px; color:var(--text-muted); margin-top:2px">${confirmedBooking.checkInDate} → ${confirmedBooking.checkOutDate}</div>
        <div style="margin-top:3px; display:flex; align-items:center; gap:5px; flex-wrap:wrap">
          <span class="stay-nights-pill">${nights} ноч.</span>
          ${remainingBadge}
        </div>
      `;
      checkInActionBtn = `
        <button class="btn btn-xs btn-brass" onclick="checkInGuest(${g.id})">
          Заселить в № ${room ? room.roomNumber : ''}
        </button>
      `;
    } else {
      // У гостя нет брони: кнопка быстрого подбора свободного номера
      checkInActionBtn = `
        <button class="btn btn-xs btn-primary" onclick="openQuickCheckInModal(${g.id})">
          Заселить в номер...
        </button>
      `;
    }

    const isLive = isGuestCheckedIn || !!checkedInBooking;

    return `
      <tr>
        <td>
          <strong>${escapeHtml(g.firstName)} ${escapeHtml(g.lastName)}</strong>
          <div style="font-size:11px; color:var(--text-muted)">${escapeHtml(g.email)}</div>
        </td>
        <td>${assignedRoomInfo}</td>
        <td><code>${escapeHtml(g.passportNumber)}</code></td>
        <td>${escapeHtml(g.phone)}</td>
        <td>${escapeHtml(g.nationality || 'Россия')}</td>
        <td>
          <span class="door-hanger-card ${isLive ? 'OCCUPIED' : (confirmedBooking ? 'BOOKED' : 'AVAILABLE')}" style="display:inline-block; padding:2px 8px; margin:0">
            ${isLive ? 'Проживает' : (confirmedBooking ? 'Ожидает заезда' : 'Не заселен')}
          </span>
        </td>
        <td>${checkInActionBtn}</td>
      </tr>
    `;
  }).join('');
}

// Открытие модального окна быстрого заселения (выбор номера и ночей)
function openQuickCheckInModal(guestId) {
  const guest = globalGuestsCache.find(g => g.id === guestId);
  if (!guest) return;

  const idInput = document.getElementById('checkin-guest-id');
  const nameInput = document.getElementById('checkin-guest-name');
  if (idInput) idInput.value = guestId;
  if (nameInput) nameInput.value = `${guest.firstName} ${guest.lastName} (паспорт: ${guest.passportNumber})`;

  // Задаем даты и ночи
  const today = new Date();
  const dateInStr = today.toISOString().split('T')[0];
  const nights = 3;
  const outDate = new Date();
  outDate.setDate(today.getDate() + nights);
  const dateOutStr = outDate.toISOString().split('T')[0];

  const inInput = document.getElementById('checkin-date');
  const outInput = document.getElementById('checkin-checkout-date');
  const nightsInput = document.getElementById('checkin-nights');

  if (inInput) inInput.value = dateInStr;
  if (outInput) outInput.value = dateOutStr;
  if (nightsInput) nightsInput.value = nights;

  updateRoomOptionsForDates(dateInStr, dateOutStr, 'checkin-room-select');
  recalculateCheckInSummary();
  clearModalAlert('modal-quick-checkin');
  openModal('modal-quick-checkin');
}

// Интерактивное управление датами и ночами в окне быстрого заселения (защита от некорректных дат)
function onQuickCheckInNightsInput() {
  const nightsInput = document.getElementById('checkin-nights');
  const inInput = document.getElementById('checkin-date');
  const outInput = document.getElementById('checkin-checkout-date');
  const nights = parseInt(nightsInput?.value, 10);
  const newOut = safeAddDaysIso(inInput?.value, Number.isFinite(nights) && nights > 0 ? Math.min(nights, 365) : 1);
  if (outInput && newOut) outInput.value = newOut;

  if (inInput?.value && outInput?.value) {
    updateRoomOptionsForDates(inInput.value, outInput.value, 'checkin-room-select');
  }
  recalculateCheckInSummary();
}

function onQuickCheckInDateChange() {
  const nightsInput = document.getElementById('checkin-nights');
  const inInput = document.getElementById('checkin-date');
  const outInput = document.getElementById('checkin-checkout-date');
  const nights = parseInt(nightsInput?.value, 10);
  const newOut = safeAddDaysIso(inInput?.value, Number.isFinite(nights) && nights > 0 ? Math.min(nights, 365) : 1);
  if (outInput && newOut) outInput.value = newOut;

  if (inInput?.value && outInput?.value) {
    updateRoomOptionsForDates(inInput.value, outInput.value, 'checkin-room-select');
  }
  recalculateCheckInSummary();
}

function onQuickCheckInOutDateChange() {
  const inInput = document.getElementById('checkin-date');
  const outInput = document.getElementById('checkin-checkout-date');
  const nightsInput = document.getElementById('checkin-nights');
  const inDate = new Date(inInput?.value);
  const outDate = new Date(outInput?.value);

  if (!isNaN(inDate) && !isNaN(outDate) && outDate > inDate) {
    const nights = Math.max(1, Math.ceil((outDate - inDate) / (1000 * 60 * 60 * 24)));
    if (nightsInput) nightsInput.value = nights;
  }
  updateRoomOptionsForDates(inInput.value, outInput.value, 'checkin-room-select');
  recalculateCheckInSummary();
}

// Перерасчет стоимости в окне быстрого заселения
function recalculateCheckInSummary() {
  const roomSelect = document.getElementById('checkin-room-select');
  const selectedOption = roomSelect?.selectedOptions[0];
  const roomId = parseInt(roomSelect?.value);
  const room = globalRoomsCache.find(r => r.id === roomId);

  const inInput = document.getElementById('checkin-date');
  const outInput = document.getElementById('checkin-checkout-date');
  const nightsInput = document.getElementById('checkin-nights');

  const inDateStr = inInput?.value;
  const outDateStr = outInput?.value;
  const nights = parseInt(nightsInput?.value) || calculateNights(inDateStr, outDateStr);

  const rateEl = document.getElementById('checkin-summary-rate');
  const nightsEl = document.getElementById('checkin-summary-nights');
  const datesEl = document.getElementById('checkin-summary-dates');
  const totalEl = document.getElementById('checkin-summary-total');
  const badgeEl = document.getElementById('checkin-status-badge');
  const submitBtn = document.getElementById('checkin-submit-btn');

  if (datesEl) datesEl.innerText = `${inDateStr || '—'} — ${outDateStr || '—'}`;
  if (nightsEl) nightsEl.innerText = `${nights} ноч.`;

  if (!room || !selectedOption || selectedOption.disabled) {
    if (rateEl) rateEl.innerText = '—';
    if (totalEl) totalEl.innerText = '—';
    if (badgeEl) {
      badgeEl.className = 'calc-status-badge conflict';
      badgeEl.innerHTML = '&times; Выберите доступный свободный номер';
    }
    if (submitBtn) submitBtn.disabled = true;
    return;
  }

  const pricePerNight = room.pricePerNight || 0;
  const total = nights * pricePerNight;
  if (rateEl) rateEl.innerText = `${formatRub(pricePerNight)}/сут.`;
  if (totalEl) totalEl.innerText = formatRub(total);

  if (badgeEl) {
    badgeEl.className = 'calc-status-badge available';
    badgeEl.innerHTML = `&check; Номер № ${room.roomNumber} (${LABELS.types[room.type] || room.type}) готов к заселению на ${nights} ноч.!`;
  }
  if (submitBtn) submitBtn.disabled = false;
}

// Отправка быстрого заселения
async function submitQuickCheckIn(e) {
  e.preventDefault();
  const guestId = parseInt(document.getElementById('checkin-guest-id').value);
  const roomId = parseInt(document.getElementById('checkin-room-select').value);
  const nightsRaw = parseInt(document.getElementById('checkin-nights').value, 10);

  if (isNaN(nightsRaw) || nightsRaw <= 0 || nightsRaw > 365) {
    triggerSamsonovStressOverlay({
      code: 'ERR_CHECKIN_NIGHTS_OVERFLOW_418',
      source: `Быстрое заселение: указано ночей = ${document.getElementById('checkin-nights').value}`,
      reason: `Попытка оформить заезд на аномальный срок (${document.getElementById('checkin-nights').value} ноч., допустимо: 1–365 ноч.).`,
      details: 'Сработала защита сроков проживания от некорректных граничных значений.'
    });
    return;
  }

  if (!roomId) {
    showModalAlert('modal-quick-checkin', 'Пожалуйста, выберите свободный номер');
    return;
  }

  const btn = document.getElementById('checkin-submit-btn');
  const origText = btn ? btn.innerHTML : 'Заселить в номер';
  if (btn) { btn.disabled = true; btn.innerHTML = 'Заселение...'; }

  clearModalAlert('modal-quick-checkin');

  try {
    await api(`/guests/${guestId}/checkin?roomId=${roomId}&nights=${nightsRaw}`, { method: 'POST' });
    notify('Гость успешно заселен в номер');
    closeModal('modal-quick-checkin');
    await refreshAllViews();
  } catch (err) {
    showModalAlert('modal-quick-checkin', err.message);
    notify(err.message, 'err');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
  }
}

// Прямое заселение гостя с уже существующей бронью
async function checkInGuest(id) {
  try {
    await api(`/guests/${id}/checkin`, { method: 'POST' });
    notify('Гость успешно заселен в номер');
    await refreshAllViews();
  } catch (err) {
    notify(err.message, 'err');
    // Если у гостя нет предварительной брони — сразу открываем окно выбора номера!
    if (err.message && err.message.includes('нет активного бронирования')) {
      openQuickCheckInModal(id);
    }
  }
}

// Выселение гостя
async function checkOutGuest(id) {
  try {
    await api(`/guests/${id}/checkout`, { method: 'POST' });
    notify('Гость выселен, номер передан на уборку');
    await refreshAllViews();
  } catch (err) {
    notify(err.message, 'err');
  }
}


async function submitGuest(e) {
  e.preventDefault();
  const btn = document.getElementById('add-guest-submit-btn');
  const origText = btn ? btn.innerHTML : 'Зарегистрировать';
  if (btn) { btn.disabled = true; btn.innerHTML = 'Регистрация...'; }

  clearModalAlert('modal-add-guest');

  const guest = {
    firstName: document.getElementById('guest-fn').value.trim(),
    lastName: document.getElementById('guest-ln').value.trim(),
    phone: document.getElementById('guest-ph').value.trim(),
    email: document.getElementById('guest-em').value.trim(),
    passportNumber: document.getElementById('guest-pass').value.trim(),
    nationality: document.getElementById('guest-nat').value.trim() || 'Россия'
  };

  if (
    hasInjectionPayload(guest.firstName) ||
    hasInjectionPayload(guest.lastName) ||
    hasInjectionPayload(guest.email) ||
    hasInjectionPayload(guest.phone) ||
    hasInjectionPayload(guest.passportNumber) ||
    hasInjectionPayload(guest.nationality)
  ) {
    triggerSamsonovStressOverlay({
      code: 'ERR_SECURITY_INJECTION_418',
      source: 'Форма регистрации гостя',
      reason: 'Обнаружена попытка XSS/SQL-инъекции в анкете гостя.',
      details: 'Потенциально опасные последовательности заблокированы.'
    });
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }

  // Штатные ошибки заполнения формы (обычные подсказки без оверлея)
  if (!guest.firstName || !guest.lastName || !guest.phone || !guest.email || !guest.passportNumber) {
    showModalAlert('modal-add-guest', 'Пожалуйста, заполните все обязательные поля: Имя, Фамилия, Телефон, Email и Паспорт');
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email)) {
    showModalAlert('modal-add-guest', 'Укажите корректный адрес электронной почты (например, ivan@mail.ru)');
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }

  try {
    await api('/guests', { method: 'POST', body: JSON.stringify(guest) });
    notify('Гость зарегистрирован в базе');
    closeModal('modal-add-guest');
    e.target.reset();
    document.getElementById('guest-nat').value = 'Россия';
    await refreshAllViews();
  } catch (err) {
    if (!err.isStress) {
      showModalAlert('modal-add-guest', err.message);
      notify(err.message, 'err');
    }
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
  }
}

// Добавление сотрудника

async function openInvoiceSheet(bookingId) {
  const inv = await api(`/invoices/${bookingId}`);
  if (!inv) return;

  const invCode = document.getElementById('inv-code');
  if (invCode) invCode.innerText = inv.invoiceNumber;

  const invDate = document.getElementById('inv-date-val');
  if (invDate) invDate.innerText = `Дата: ${inv.issueDate}`;

  const invGuest = document.getElementById('inv-guest-name');
  if (invGuest) invGuest.innerText = inv.guestFullName;

  const invPassport = document.getElementById('inv-guest-passport');
  if (invPassport) invPassport.innerText = `Паспорт: ${inv.guestPassport}`;

  const invPhone = document.getElementById('inv-guest-phone');
  if (invPhone) invPhone.innerText = `Телефон: ${inv.guestPhone}`;

  const invRoom = document.getElementById('inv-room-info');
  if (invRoom) invRoom.innerText = `№ ${inv.roomNumber} (${LABELS.types[inv.roomType] || inv.roomType})`;

  const invDates = document.getElementById('inv-dates-info');
  if (invDates) invDates.innerText = `${inv.checkInDate} → ${inv.checkOutDate}`;

  const invRate = document.getElementById('inv-rate-info');
  if (invRate) invRate.innerText = `${formatRub(inv.pricePerNight)}/сутки (${inv.numberOfNights} ночей)`;

  // Заполняем тариф за сутки и количество суток в строках спецификации счёта
  const rateUnitEl = document.getElementById('inv-rate-unit');
  if (rateUnitEl) rateUnitEl.innerText = formatRub(inv.pricePerNight);

  const nightsUnitEl = document.getElementById('inv-nights-unit');
  if (nightsUnitEl) nightsUnitEl.innerText = `${inv.numberOfNights} сут.`;

  const chargeTotal = document.getElementById('inv-charge-total');
  if (chargeTotal) chargeTotal.innerText = formatRub(inv.roomTotal || inv.totalAmount);

  const sumTotal = document.getElementById('inv-sum-total');
  if (sumTotal) sumTotal.innerText = formatRub(inv.totalAmount);

  const paidSum = document.getElementById('inv-paid-sum');
  if (paidSum) paidSum.innerText = formatRub(inv.paidAmount);

  const dueSum = document.getElementById('inv-due-sum');
  if (dueSum) dueSum.innerText = formatRub(inv.balanceDue);

  const statusLabel = document.getElementById('inv-status-label');
  if (statusLabel) {
    statusLabel.innerText = inv.paymentStatus;
    statusLabel.className = `badge ${inv.balanceDue <= 0 ? 'badge-success' : 'badge-warning'}`;
  }

  openModal('modal-folio');
}

