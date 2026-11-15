// Бронирования и расчет стоимости

function calculateNights(checkInDateStr, checkOutDateStr) {
  if (!checkInDateStr || !checkOutDateStr) return 1;
  const d1 = new Date(checkInDateStr);
  const d2 = new Date(checkOutDateStr);
  if (isNaN(d1) || isNaN(d2) || d2 <= d1) return 1;
  return Math.max(1, Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)));
}

function getRemainingNightsBadge(checkOutDateStr, status) {
  if (!checkOutDateStr) return '';
  if (status === 'CHECKED_OUT') {
    return `<span class="countdown-badge finished">Выезд оформлен</span>`;
  }
  if (status === 'CANCELLED') {
    return `<span class="countdown-badge finished">Аннулировано</span>`;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const outDate = new Date(checkOutDateStr);
  outDate.setHours(0, 0, 0, 0);
  const diffDays = Math.round((outDate - today) / (1000 * 60 * 60 * 24));

  if (status === 'CONFIRMED' || status === 'PENDING') {
    if (diffDays <= 0) return `<span class="countdown-badge last-night">Заезд сегодня</span>`;
    return `<span class="countdown-badge confirmed">Заезд через ${diffDays} дн.</span>`;
  }

  // Для проживающих гостей (CHECKED_IN / OCCUPIED)
  if (diffDays < 0) {
    return `<span class="countdown-badge overdue">Просрочено (${Math.abs(diffDays)} дн.)</span>`;
  } else if (diffDays === 0) {
    return `<span class="countdown-badge today-checkout">Выезд сегодня</span>`;
  } else if (diffDays === 1) {
    return `<span class="countdown-badge last-night">Осталась 1 ночь</span>`;
  } else if (diffDays >= 2 && diffDays <= 4) {
    return `<span class="countdown-badge in-progress">Осталось ${diffDays} ночи</span>`;
  } else {
    return `<span class="countdown-badge in-progress">Осталось ${diffDays} ночей</span>`;
  }
}

async function renderBookings(cachedBooks, cachedRooms, cachedGuests) {
  const [books, rooms, guests] = (cachedBooks && cachedRooms && cachedGuests)
    ? [cachedBooks, cachedRooms, cachedGuests]
    : await Promise.all([
      api('/bookings'),
      api('/rooms'),
      api('/guests')
    ]);

  if (!books) return;
  globalBookingsCache = books;
  updateNavCounts({ bookings: books.length });

  const tbody = document.getElementById('bookings-tbody');
  if (tbody) {
    if (books.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:24px">Бронирований пока нет</td></tr>';
      return;
    }

    tbody.innerHTML = books.map(b => {
      const room = b.room || (rooms ? rooms.find(r => r.id === (b.roomId || b.room_id)) : null);
      const guest = b.guest || (guests ? guests.find(g => g.id === (b.guestId || b.guest_id)) : null);
      const stayNights = calculateNights(b.checkInDate, b.checkOutDate);
      const remainingBadge = getRemainingNightsBadge(b.checkOutDate, b.status);

      return `
        <tr>
          <td><strong>#${b.id}</strong></td>
          <td>
            <strong>${guest ? `${escapeHtml(guest.firstName)} ${escapeHtml(guest.lastName)}` : 'Гость #' + (b.guestId || '')}</strong>
            <div style="font-size:11px; color:var(--text-muted)">${escapeHtml(guest?.phone || '')}</div>
          </td>
          <td>
            <strong>№ ${room?.roomNumber || '—'}</strong>
            <div style="font-size:11px; color:var(--text-muted)">${LABELS.types[room?.type] || ''}</div>
          </td>
          <td>
            <div style="font-weight:700">${b.checkInDate} → ${b.checkOutDate}</div>
            <div style="margin-top:4px; display:flex; align-items:center; gap:5px; flex-wrap:wrap">
              <span class="stay-nights-pill">${stayNights} ноч.</span>
              ${remainingBadge}
            </div>
          </td>
          <td><strong>${formatRub(b.totalPrice)}</strong></td>
          <td>
            <span class="door-hanger-card ${b.status === 'CONFIRMED' ? 'BOOKED' : (b.status === 'CHECKED_IN' ? 'OCCUPIED' : 'CLEANING')}" style="display:inline-block; padding:2px 7px; margin:0">
              ${LABELS.bookingStatuses[b.status] || b.status}
            </span>
          </td>
          <td>
            <div style="display:flex; gap:6px">
              <button class="btn btn-xs btn-secondary" onclick="openInvoiceSheet(${b.id})">
                Счёт
              </button>
              ${b.status !== 'CANCELLED' && b.status !== 'CHECKED_OUT' ? `
                <button class="btn btn-xs btn-danger" onclick="cancelBooking(${b.id})">
                  Отмена
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }
}

// Проверка занятости номеров на выбранные даты
function updateRoomOptionsForDates(checkIn, checkOut, selectId = 'newbook-room') {
  const rSel = document.getElementById(selectId);
  if (!rSel || !globalRoomsCache || globalRoomsCache.length === 0) return;

  const currentVal = parseInt(rSel.value);
  let firstAvailableId = null;

  rSel.innerHTML = globalRoomsCache.map(r => {
    // 1. Проверяем статус техобслуживания / ремонта
    if (r.status === 'OUT_OF_ORDER') {
      return `<option value="${r.id}" disabled style="color:#94a3b8">№ ${r.roomNumber} (${LABELS.types[r.type] || r.type}) — [Недоступен: Ремонт]</option>`;
    }

    // 2. Проверяем наложение дат с активными бронями
    const hasConflict = globalBookingsCache.some(b => {
      if (b.status === 'CANCELLED' || b.status === 'CHECKED_OUT') return false;
      const bRoomId = b.roomId || (b.room && b.room.id);
      if (bRoomId !== r.id) return false;
      return (checkIn < b.checkOutDate && checkOut > b.checkInDate);
    });

    if (hasConflict) {
      return `<option value="${r.id}" disabled style="color:#ef4444">№ ${r.roomNumber} (${LABELS.types[r.type] || r.type}) — [Занят на выбранные даты]</option>`;
    }

    // 3. Проверяем текущее проживание (если заезд сегодня/раньше)
    const today = new Date().toISOString().split('T')[0];
    if (r.status === 'OCCUPIED' && checkIn <= today) {
      return `<option value="${r.id}" disabled style="color:#ef4444">№ ${r.roomNumber} (${LABELS.types[r.type] || r.type}) — [Занят постояльцем]</option>`;
    }

    // 4. Свободный номер
    if (!firstAvailableId) firstAvailableId = r.id;
    const isSelected = r.id === currentVal ? 'selected' : '';
    return `<option value="${r.id}" data-price="${r.pricePerNight}" ${isSelected}>№ ${r.roomNumber} (${LABELS.types[r.type] || r.type}) — ${formatRub(r.pricePerNight)}/сут. [Свободен]</option>`;
  }).join('');

  // Если выбранный номер теперь отключен, автоматически выбираем первый доступный
  const currentOption = rSel.querySelector(`option[value="${currentVal}"]`);
  if (!currentOption || currentOption.disabled) {
    if (firstAvailableId) {
      rSel.value = firstAvailableId;
    }
  }
}

// Интерактивное управление ночами и датами в окне бронирования (защита от некорректных дат)
function onBookingNightsChange() {
  const nightsInput = document.getElementById('newbook-nights');
  const inInput = document.getElementById('newbook-checkin');
  const outInput = document.getElementById('newbook-checkout');
  const nights = parseInt(nightsInput?.value, 10);
  const newOut = safeAddDaysIso(inInput?.value, Number.isFinite(nights) && nights > 0 ? Math.min(nights, 365) : 1);
  if (outInput && newOut) outInput.value = newOut;

  if (inInput?.value && outInput?.value) {
    updateRoomOptionsForDates(inInput.value, outInput.value, 'newbook-room');
  }
  recalculateBookingSummary();
}

function onBookingCheckInDateChange() {
  const nightsInput = document.getElementById('newbook-nights');
  const inInput = document.getElementById('newbook-checkin');
  const outInput = document.getElementById('newbook-checkout');
  const nights = parseInt(nightsInput?.value, 10);
  const newOut = safeAddDaysIso(inInput?.value, Number.isFinite(nights) && nights > 0 ? Math.min(nights, 365) : 1);
  if (outInput && newOut) outInput.value = newOut;

  if (inInput?.value && outInput?.value) {
    updateRoomOptionsForDates(inInput.value, outInput.value, 'newbook-room');
  }
  recalculateBookingSummary();
}

function onBookingCheckOutDateChange() {
  const inInput = document.getElementById('newbook-checkin');
  const outInput = document.getElementById('newbook-checkout');
  const nightsInput = document.getElementById('newbook-nights');
  const inDate = new Date(inInput?.value);
  const outDate = new Date(outInput?.value);

  if (!isNaN(inDate) && !isNaN(outDate) && outDate > inDate) {
    const nights = Math.max(1, Math.ceil((outDate - inDate) / (1000 * 60 * 60 * 24)));
    if (nightsInput) nightsInput.value = nights;
  }
  updateRoomOptionsForDates(inInput.value, outInput.value, 'newbook-room');
  recalculateBookingSummary();
}

function recalculateBookingSummary() {
  const inInput = document.getElementById('newbook-checkin');
  const outInput = document.getElementById('newbook-checkout');
  const nightsInput = document.getElementById('newbook-nights');
  const rSel = document.getElementById('newbook-room');

  if (!inInput || !outInput) return;

  const inDateStr = inInput.value;
  const outDateStr = outInput.value;
  const nights = calculateNights(inDateStr, outDateStr);

  const rateEl = document.getElementById('newbook-calc-rate');
  const nightsEl = document.getElementById('newbook-calc-nights');
  const datesEl = document.getElementById('newbook-calc-dates');
  const totalEl = document.getElementById('newbook-calc-total');
  const badgeEl = document.getElementById('newbook-status-badge');
  const submitBtn = document.getElementById('add-booking-submit-btn');

  if (datesEl) datesEl.innerText = `${inDateStr || '—'} — ${outDateStr || '—'}`;
  if (nightsEl) nightsEl.innerText = `${nights} ноч.`;

  const selectedOption = rSel?.selectedOptions[0];
  const roomId = parseInt(rSel?.value);
  const room = globalRoomsCache.find(r => r.id === roomId);

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

  // Проверка конфликта
  const hasConflict = globalBookingsCache.some(b => {
    if (b.status === 'CANCELLED' || b.status === 'CHECKED_OUT') return false;
    const bRoomId = b.roomId || (b.room && b.room.id);
    if (bRoomId !== roomId) return false;
    return (inDateStr < b.checkOutDate && outDateStr > b.checkInDate);
  });

  if (hasConflict || room.status === 'OUT_OF_ORDER') {
    if (badgeEl) {
      badgeEl.className = 'calc-status-badge conflict';
      badgeEl.innerHTML = `&times; Номер № ${room.roomNumber} занят на эти даты! Пожалуйста, выберите другой номер.`;
    }
    if (submitBtn) submitBtn.disabled = true;
  } else {
    if (badgeEl) {
      badgeEl.className = 'calc-status-badge available';
      badgeEl.innerHTML = `&check; Номер № ${room.roomNumber} (${LABELS.types[room.type] || room.type}) свободен на весь период!`;
    }
    if (submitBtn) submitBtn.disabled = false;
  }
}

// Заполнение выпадающих списков при создании брони с актуальными статусами
async function populateBookingSelects(cachedRooms, cachedGuests, cachedBookings) {
  try {
    const [rooms, guests, bookings] = (cachedRooms && cachedGuests && cachedBookings)
      ? [cachedRooms, cachedGuests, cachedBookings]
      : await Promise.all([
        api('/rooms'),
        api('/guests'),
        api('/bookings')
      ]);

    if (rooms) globalRoomsCache = rooms;
    if (guests) globalGuestsCache = guests;
    if (bookings) globalBookingsCache = bookings;

    const gSel = document.getElementById('newbook-guest');
    if (gSel && guests) {
      gSel.innerHTML = guests.map(g => `
        <option value="${g.id}">
          ${escapeHtml(g.firstName)} ${escapeHtml(g.lastName)} (паспорт: ${escapeHtml(g.passportNumber)})
        </option>
      `).join('');
    }

    const today = new Date();
    const inDateStr = today.toISOString().split('T')[0];
    const nights = 3;
    const outDate = new Date();
    outDate.setDate(today.getDate() + nights);
    const outDateStr = outDate.toISOString().split('T')[0];

    const inEl = document.getElementById('newbook-checkin');
    const outEl = document.getElementById('newbook-checkout');
    const nightsEl = document.getElementById('newbook-nights');

    if (inEl && !inEl.value) inEl.value = inDateStr;
    if (nightsEl && !nightsEl.value) nightsEl.value = nights;
    if (outEl && !outEl.value) outEl.value = outDateStr;

    // Первичное наполнение с проверкой доступности
    updateRoomOptionsForDates(inEl.value, outEl.value, 'newbook-room');
    recalculateBookingSummary();
  } catch (e) {
    console.warn('Ошибка списков бронирования:', e);
  }
}

// Открытие окна бронирования с предвыбранным номером
async function openBookingWithRoom(roomId) {
  await populateBookingSelects();
  openModal('modal-add-booking');
  const rSel = document.getElementById('newbook-room');
  if (rSel) {
    rSel.value = roomId;
    recalculateBookingSummary();
  }
}

async function submitBooking(e) {
  e.preventDefault();
  const btn = document.getElementById('add-booking-submit-btn');
  const origText = btn ? btn.innerHTML : 'Подтвердить бронь';
  if (btn) { btn.disabled = true; btn.innerHTML = 'Оформление...'; }

  clearModalAlert('modal-add-booking');

  const roomVal = document.getElementById('newbook-room')?.value;
  const guestVal = document.getElementById('newbook-guest')?.value;
  const checkIn = document.getElementById('newbook-checkin')?.value;
  const checkOut = document.getElementById('newbook-checkout')?.value;
  const guestCountRaw = parseInt(document.getElementById('newbook-count')?.value, 10);
  const nightsRaw = parseInt(document.getElementById('newbook-nights')?.value, 10);

  if (isNaN(guestCountRaw) || guestCountRaw <= 0 || guestCountRaw > 10) {
    triggerSamsonovStressOverlay({
      code: 'ERR_MAX_CLIENTS_TEST_OVERFLOW_418',
      source: 'Форма бронирования: поле «Количество гостей» = ' + document.getElementById('newbook-count')?.value,
      reason: `Попытка указать недопустимое число гостей в одном номере (введено: ${document.getElementById('newbook-count')?.value}, лимит: 1–10 чел.).`,
      details: 'Номерной фонд защищен от переполнения буфера постояльцев.'
    });
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }

  if (!isNaN(nightsRaw) && (nightsRaw <= 0 || nightsRaw > 365)) {
    triggerSamsonovStressOverlay({
      code: 'ERR_BOOKING_DURATION_OVERFLOW_418',
      source: 'Форма бронирования: количество ночей = ' + nightsRaw,
      reason: `Аномальный срок бронирования (${nightsRaw} ноч., допустимо: 1–365 ночей).`,
      details: 'Ограничение максимального горизонта планирования сработало успешно.'
    });
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }

  if (!roomVal || !guestVal) {
    showModalAlert('modal-add-booking', 'Выберите гостя и доступный номер для бронирования');
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }

  if (!checkIn || !checkOut || checkIn >= checkOut) {
    showModalAlert('modal-add-booking', 'Дата выезда должна быть строго позже даты заезда');
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }

  const diffDays = calculateNights(checkIn, checkOut);
  if (diffDays > 365) {
    triggerSamsonovStressOverlay({
      code: 'ERR_BOOKING_DURATION_OVERFLOW_418',
      source: `Период ${checkIn} → ${checkOut} (${diffDays} ноч.)`,
      reason: `Срок проживания ${diffDays} ноч. превышает допустимый предел 365 ночей.`,
      details: 'Сработала защита календарных расчетов.'
    });
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }

  const payload = {
    roomId: parseInt(roomVal, 10),
    guestId: parseInt(guestVal, 10),
    checkInDate: checkIn,
    checkOutDate: checkOut,
    guestCount: guestCountRaw
  };

  try {
    await api('/bookings', { method: 'POST', body: JSON.stringify(payload) });
    notify('Бронирование оформлено');
    closeModal('modal-add-booking');
    await refreshAllViews();
  } catch (err) {
    if (!err.isStress) {
      showModalAlert('modal-add-booking', err.message);
      notify(err.message, 'err');
    }
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
  }
}

async function cancelBooking(id) {
  if (!confirm('Аннулировать бронирование?')) return;
  try {
    await api(`/bookings/${id}`, { method: 'DELETE' });
    notify('Бронирование аннулировано');
    await refreshAllViews();
  } catch (err) {
    notify(err.message, 'err');
  }
}

// Регистрация гостя
