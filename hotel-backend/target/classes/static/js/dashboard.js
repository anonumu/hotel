// Сводка и поэтажный план отеля
let globalRoomsCache = [];
let globalGuestsCache = [];
let globalBookingsCache = [];
let currentFloorFilter = 'all';

let selectedCockpitBookingId = null;
let cockpitFilterMode = 'ALL'; // 'ALL' | 'UNPAID' | 'CHECKED_IN'

async function renderDashboard() {
  const [rooms, guests, rev, bookings, payments, staff] = await Promise.all([
    api('/rooms'),
    api('/guests'),
    api('/reports/revenue'),
    api('/bookings'),
    api('/payments'),
    api('/staff')
  ]);

  if (!rooms) return;

  globalRoomsCache = rooms;
  globalGuestsCache = guests || [];
  globalBookingsCache = bookings || [];
  globalPaymentsCache = payments || [];
  globalStaffCache = staff || [];

  // Показываем баннер восстановления, если фонд номеров пуст
  const emptyBanner = document.getElementById('empty-db-banner');
  if (emptyBanner) {
    emptyBanner.style.display = rooms.length === 0 ? 'flex' : 'none';
  }

  const total = rooms.length;
  const occupied = rooms.filter(r => r.status === 'OCCUPIED').length;
  const availableRoomsList = rooms.filter(r => r.status === 'AVAILABLE');
  const available = availableRoomsList.length;
  const bookedRooms = rooms.filter(r => r.status === 'BOOKED').length;
  const cleaning = rooms.filter(r => r.status === 'CLEANING').length;
  const repair = rooms.filter(r => r.status === 'OUT_OF_ORDER').length;
  const rate = total > 0 ? Math.round((occupied / total) * 100) : 0;

  // 1. Загрузка фонда (реальные цифры без хардкода)
  const rateEl = document.getElementById('dash-kpi-rate');
  if (rateEl) rateEl.innerText = `${rate}%`;

  const occTrendEl = document.getElementById('dash-kpi-occ-trend');
  if (occTrendEl) {
    occTrendEl.innerText = `Свободно: ${available} • Бронь: ${bookedRooms} • Уборка: ${cleaning}${repair ? ' • Ремонт: ' + repair : ''}`;
  }

  const occMetaEl = document.getElementById('dash-kpi-occ-meta');
  if (occMetaEl) occMetaEl.innerText = `${occupied} из ${total} номеров занято`;

  // 2. Выручка за период (реальные данные и динамическая диаграмма)
  const totalRev = Number(rev?.totalRevenue || 0);
  const revEl = document.getElementById('dash-kpi-rev');
  if (revEl) revEl.innerText = formatRub(totalRev);

  const txCount = rev?.totalPaymentsCount ?? rev?.totalTransactions ?? globalPaymentsCache.length;
  const byMethod = rev?.revenueByPaymentMethod || rev?.revenueByMethod || {};
  const cardVal = Number(byMethod.CARD ?? byMethod.card ?? 0);
  const cashVal = Number(byMethod.CASH ?? byMethod.cash ?? 0);
  const transferVal = Number(byMethod.TRANSFER ?? byMethod.transfer ?? 0);

  const revTrendEl = document.getElementById('dash-kpi-rev-trend');
  if (revTrendEl) {
    revTrendEl.innerText = `${txCount} плат. • Карта: ${formatRub(cardVal)} • Нал: ${formatRub(cashVal)}`;
  }

  renderDashboardRevenueBars({ CARD: cardVal, TRANSFER: transferVal, CASH: cashVal, totalRev });

  // 3. Средний срок проживания (реальный расчёт без фейка 3.4)
  const activeOrCompletedBooks = globalBookingsCache.filter(b => b.status !== 'CANCELLED' && b.checkInDate && b.checkOutDate);
  let avgStayText = '0 ноч.';
  let stayValues = [];
  if (activeOrCompletedBooks.length > 0) {
    stayValues = activeOrCompletedBooks.map(b => calculateNights(b.checkInDate, b.checkOutDate));
    const totalNights = stayValues.reduce((sum, n) => sum + n, 0);
    avgStayText = `${(totalNights / activeOrCompletedBooks.length).toFixed(1)} ноч.`;
  }
  const avgStayEl = document.getElementById('dash-kpi-avg-stay');
  if (avgStayEl) avgStayEl.innerText = avgStayText;

  const checkedInGuestsCount = globalGuestsCache.filter(g => g.checkedIn).length;
  const avgTrendEl = document.getElementById('dash-kpi-avg-trend');
  if (avgTrendEl) {
    avgTrendEl.innerText = `Броней: ${activeOrCompletedBooks.length} • Проживают: ${checkedInGuestsCount}`;
  }
  renderDashboardStaySpline(stayValues);

  // 4. Доступно к заселению (только реально свободные номера из БД)
  const availEl = document.getElementById('dash-kpi-avail');
  if (availEl) availEl.innerText = `${available} ном.`;

  const availPillEl = document.getElementById('dash-avail-pill');
  if (availPillEl) availPillEl.innerText = available > 0 ? 'Готовы к заезду' : 'Нет свободных';

  const chipsBox = document.getElementById('dash-avail-chips');
  if (chipsBox) {
    const topFree = availableRoomsList.slice(0, 3);
    const chipsHtml = topFree.length > 0
      ? topFree.map((r, idx) => `
          <button type="button" class="finnova-mini-chip ${idx === 0 ? 'active' : ''}" onclick="event.stopPropagation(); openBookingWithRoom(${r.id})" title="Забронировать № ${escapeHtml(r.roomNumber)} (${formatRub(r.pricePerNight)}/сут.)">
            № ${escapeHtml(r.roomNumber)}
          </button>
        `).join('')
      : '<span style="font-size:11.5px; color:#64748b">Свободных номеров нет</span>';

    chipsBox.innerHTML = `
      ${chipsHtml}
      <button type="button" class="finnova-payout-btn" onclick="event.stopPropagation(); openQuickBookingFromCard()">Заселить</button>
    `;
  }

  // Синхронизируем динамический список этажей под реальный фонд
  syncDashboardFloorSelect(rooms);

  // Отрисовка всех разделов сводки с учётом активных фильтров
  filterDashboardContent();

  // Отрисовка текущих постояльцев в номерах
  renderCurrentOccupantsTable();

  updateNavCounts({
    rooms: rooms.length,
    guests: globalGuestsCache.length,
    bookings: globalBookingsCache.length,
    staff: globalStaffCache.length
  });
}

function renderDashboardRevenueBars({ CARD, TRANSFER, CASH, totalRev }) {
  const barsContainer = document.getElementById('dash-revenue-bars');
  if (!barsContainer) return;

  // Берём последние 6 платежей или группировку по способам оплаты, чтобы график отражал реальную кассу
  const recentPayments = [...globalPaymentsCache]
    .sort((a, b) => (a.id || 0) - (b.id || 0))
    .slice(-6);

  let items = [];
  if (recentPayments.length > 0) {
    const maxVal = Math.max(...recentPayments.map(p => Number(p.amount) || 0), 1);
    items = recentPayments.map((p, i) => ({
      label: `#${p.id}`,
      pct: Math.max(14, Math.round(((Number(p.amount) || 0) / maxVal) * 100)),
      title: `Платёж #${p.id}: ${formatRub(p.amount)}`,
      highlight: i === recentPayments.length - 1
    }));
  } else {
    const methodItems = [
      { label: 'Карта', val: CARD },
      { label: 'Счёт', val: TRANSFER },
      { label: 'Нал', val: CASH }
    ];
    const maxM = Math.max(CARD, TRANSFER, CASH, 1);
    items = methodItems.map(m => ({
      label: m.label,
      pct: totalRev > 0 ? Math.max(12, Math.round((m.val / maxM) * 100)) : 10,
      title: `${m.label}: ${formatRub(m.val)}`,
      highlight: m.val === maxM && totalRev > 0
    }));
  }

  barsContainer.innerHTML = items.map(it => `
    <div class="chart-bar-col" title="${escapeHtml(it.title)}">
      <div class="chart-bar ${it.highlight ? 'highlight' : ''}" style="height:${it.pct}%"></div>
      <span>${escapeHtml(it.label)}</span>
    </div>
  `).join('');
}

function renderDashboardStaySpline(durations) {
  const box = document.getElementById('dash-stay-spline');
  if (!box) return;

  if (!durations || durations.length === 0) {
    box.innerHTML = `
      <svg width="100%" height="52" viewBox="0 0 240 52" fill="none" preserveAspectRatio="none">
        <line x1="8" y1="42" x2="232" y2="42" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="4 4"/>
      </svg>
    `;
    return;
  }

  const pts = durations.length === 1 ? [durations[0], durations[0]] : durations.slice(-8);
  const maxD = Math.max(...pts, 1);
  const coords = pts.map((val, idx) => {
    const x = Math.round(12 + (idx * 216) / (pts.length - 1));
    const y = Math.round(44 - (val / maxD) * 34);
    return { x, y, val };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x} ${c.y}`).join(' ');
  const areaPath = `${linePath} L${coords[coords.length - 1].x} 52 L${coords[0].x} 52 Z`;

  box.innerHTML = `
    <svg width="100%" height="52" viewBox="0 0 240 52" fill="none" preserveAspectRatio="none">
      <defs>
        <linearGradient id="splineGradientDyn" x1="0" y1="0" x2="0" y2="52" gradientUnits="userSpaceOnUse">
          <stop stop-color="#818cf8" stop-opacity="0.45"/>
          <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <path d="${areaPath}" fill="url(#splineGradientDyn)"/>
      <path d="${linePath}" stroke="#4f46e5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      ${coords.map(c => `<circle cx="${c.x}" cy="${c.y}" r="3.5" fill="#4f46e5" stroke="#ffffff" stroke-width="2"><title>${c.val} ноч.</title></circle>`).join('')}
    </svg>
  `;
}

function syncDashboardFloorSelect(rooms) {
  const floorSel = document.getElementById('dash-filter-floor');
  const prev = currentFloorFilter || (floorSel ? floorSel.value : 'all') || 'all';
  const roomFloors = (rooms || []).map(r => Number(r.floor) || 1);
  const stdFloors = [...new Set([1, 2, 3, 4, ...roomFloors])].sort((a, b) => a - b);

  if (floorSel) {
    floorSel.innerHTML = '<option value="all">Все этажи здания</option>' +
      stdFloors.map(f => `<option value="${f}">${f}-й этаж</option>`).join('');
    if ([...floorSel.options].some(o => o.value === String(prev))) {
      floorSel.value = String(prev);
      currentFloorFilter = String(prev);
    } else {
      floorSel.value = 'all';
      currentFloorFilter = 'all';
    }
  }

  const tabsNav = document.getElementById('floor-tabs-nav');
  if (tabsNav) {
    tabsNav.innerHTML = `<button type="button" class="floor-tab-btn ${String(currentFloorFilter) === 'all' ? 'active' : ''}" data-floor="all" onclick="filterFloorView('all')">Все этажи</button>` +
      stdFloors.map(f => `<button type="button" class="floor-tab-btn ${String(currentFloorFilter) === String(f) ? 'active' : ''}" data-floor="${f}" onclick="filterFloorView(${f})">${f}-й этаж</button>`).join('');
  }
}

function navigateToAvailableRooms() {
  navigateTo('rooms');
  const sel = document.getElementById('room-status-filter');
  if (sel) {
    sel.value = 'AVAILABLE';
    filterRoomsList();
  }
}

function openQuickBookingFromCard() {
  const freeRoom = globalRoomsCache.find(r => r.status === 'AVAILABLE');
  if (freeRoom) {
    openBookingWithRoom(freeRoom.id);
  } else {
    openModal('modal-add-booking');
  }
}

async function restoreDemoData() {
  try {
    await api('/system/reset-demo', { method: 'POST' });
    notify('Стартовый номерной фонд, гости, брони и платежи восстановлены');
    await refreshAllViews();
    renderReports();
  } catch (err) {
    notify(err.message || 'Не удалось восстановить данные', 'err');
  }
}

// Отрисовка флагманского двухпанельного темного кокпита
function renderDashboardCockpit(filteredBookingsOverride = null) {
  const listEl = document.getElementById('cockpit-bookings-list');
  const detailEl = document.getElementById('cockpit-detail-container');
  if (!listEl || !detailEl) return;

  const baseBookings = filteredBookingsOverride !== null ? filteredBookingsOverride : globalBookingsCache;
  let activeBooks = baseBookings.filter(b => b.status !== 'CANCELLED');
  if (cockpitFilterMode === 'UNPAID') {
    activeBooks = activeBooks.filter(b => b.status === 'CONFIRMED' || b.status === 'PENDING');
  } else if (cockpitFilterMode === 'CHECKED_IN') {
    activeBooks = activeBooks.filter(b => b.status === 'CHECKED_IN');
  }

  const countEl = document.getElementById('cockpit-count-badge');
  if (countEl) countEl.innerText = activeBooks.length;

  if (activeBooks.length === 0) {
    listEl.innerHTML = '<div style="color:var(--slate-400); padding:24px; text-align:center; font-size:13px">В данной категории бронирований нет</div>';
    detailEl.innerHTML = '<div style="color:var(--slate-400); padding:32px; text-align:center; font-size:14px">Выберите бронирование для просмотра деталей</div>';
    return;
  }

  if (!selectedCockpitBookingId || !activeBooks.some(b => b.id === selectedCockpitBookingId)) {
    selectedCockpitBookingId = activeBooks[0].id;
  }

  const today = new Date().toISOString().split('T')[0];
  listEl.innerHTML = activeBooks.map(b => {
    const isSelected = b.id === selectedCockpitBookingId;
    const guest = b.guest || globalGuestsCache.find(g => g.id === (b.guestId || b.guest_id || (b.guest && b.guest.id)));
    const guestName = guest ? `${guest.firstName} ${guest.lastName}` : `Гость #${b.id}`;
    const initials = guest ? `${guest.firstName[0] || ''}${guest.lastName[0] || ''}` : 'Г';
    const room = b.room || globalRoomsCache.find(r => r.id === (b.roomId || b.room_id || (b.room && b.room.id)));
    const statusLabel = LABELS.bookingStatuses[b.status] || b.status;
    const nights = calculateNights(b.checkInDate, b.checkOutDate);

    let relativeText = `${nights} ноч.`;
    if (b.status === 'CHECKED_IN') {
      const remaining = Math.round((new Date(b.checkOutDate) - new Date(today)) / (1000 * 60 * 60 * 24));
      relativeText = remaining === 0 ? 'Выезд сегодня' : (remaining > 0 ? `Осталось ${remaining} ноч.` : `Просрочено (${Math.abs(remaining)} дн.)`);
    } else if (b.checkInDate === today) {
      relativeText = 'Заезд сегодня';
    } else if (b.checkInDate > today) {
      const daysUntil = calculateNights(today, b.checkInDate);
      relativeText = `Заезд через ${daysUntil} дн.`;
    }

    return `
      <div class="cockpit-item ${isSelected ? 'selected' : ''}" onclick="selectCockpitBooking(${b.id})">
        <div class="cockpit-avatar">${initials}</div>
        <div class="cockpit-item-info">
          <div class="cockpit-item-title"># БРОНЬ-${b.id} • ${room ? `№ ${room.roomNumber}` : 'Номер не назначен'}</div>
          <div class="cockpit-item-sub">${escapeHtml(guestName)} • ${relativeText}</div>
        </div>
        <div class="cockpit-item-status status-${b.status.toLowerCase()}">${statusLabel}</div>
        <div class="cockpit-item-amount">${formatRub(b.totalPrice)}</div>
      </div>
    `;
  }).join('');

  const selBook = activeBooks.find(b => b.id === selectedCockpitBookingId) || activeBooks[0];
  if (!selBook) return;

  const selGuest = selBook.guest || globalGuestsCache.find(g => g.id === (selBook.guestId || selBook.guest_id || (selBook.guest && selBook.guest.id)));
  const selRoom = selBook.room || globalRoomsCache.find(r => r.id === (selBook.roomId || selBook.room_id || (selBook.room && selBook.room.id)));
  const guestInitials = selGuest ? `${selGuest.firstName[0] || ''}${selGuest.lastName[0] || ''}` : 'ГИ';
  const nights = calculateNights(selBook.checkInDate, selBook.checkOutDate);
  const roomPricePerNight = selRoom ? selRoom.pricePerNight : (selBook.totalPrice / (nights || 1));
  const stayCost = roomPricePerNight * nights;
  const extraServices = Math.max(0, selBook.totalPrice - stayCost);
  const statusLabel = LABELS.bookingStatuses[selBook.status] || selBook.status;

  // Реальный расчёт оплаченной суммы и остатка по кассовым платежам из БД
  const paidForBooking = globalPaymentsCache
    .filter(p => (p.bookingId || p.booking_id || (p.booking && p.booking.id)) === selBook.id)
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const balanceDue = Math.max(0, Number(selBook.totalPrice || 0) - paidForBooking);
  const paymentColor = balanceDue <= 0 ? '#6ee7b7' : '#fde68a';
  const paymentText = balanceDue <= 0
    ? 'Оплачено (Баланс 0 ₽)'
    : `Долг: ${formatRub(balanceDue)} (внесено ${formatRub(paidForBooking)})`;

  detailEl.innerHTML = `
    <div class="cockpit-detail-top">
      <div>
        <div class="cockpit-tag-row">
          <span style="font-size:12px; opacity:0.8">Детали бронирования:</span>
          <span class="cockpit-status-chip">${statusLabel}</span>
        </div>
        <div class="cockpit-detail-h1"># БРОНЬ-${selBook.id}</div>
      </div>
      <div class="cockpit-detail-brand">
        <div class="cockpit-brand-pill">GRAND IMPÉRIAL PMS</div>
      </div>
      <div class="cockpit-guest-badge">
        <div class="cockpit-avatar">${guestInitials}</div>
        <div>
          <div style="font-weight:700; font-size:13px">${escapeHtml(selGuest ? `${selGuest.firstName} ${selGuest.lastName}` : 'Гость комплекса')}</div>
          <div style="font-size:11px; opacity:0.8">${selRoom ? `№ ${selRoom.roomNumber} (${LABELS.types[selRoom.type] || selRoom.type})` : 'Номер не назначен'}</div>
        </div>
      </div>
    </div>

    <div class="cockpit-detail-subcards">
      <div class="cockpit-subcard">
        <div class="cockpit-subcard-sum">${formatRub(stayCost)}</div>
        <div class="cockpit-subcard-label">Тариф номера (${nights} ноч.)</div>
        <div class="cockpit-subcard-date">${selBook.checkInDate} → ${selBook.checkOutDate}</div>
      </div>
      <div class="cockpit-subcard">
        <div class="cockpit-subcard-sum">${selRoom ? `№ ${selRoom.roomNumber}` : '—'}</div>
        <div class="cockpit-subcard-label">${selRoom ? `${LABELS.types[selRoom.type] || selRoom.type} • ${selRoom.floor} этаж` : 'Категория'}</div>
        <div class="cockpit-subcard-date">до ${selRoom ? selRoom.maxGuests : 2} гостей</div>
      </div>
      <div class="cockpit-subcard">
        <div class="cockpit-subcard-sum">${formatRub(paidForBooking)}</div>
        <div class="cockpit-subcard-label">Внесено по кассе</div>
        <div class="cockpit-subcard-date">${extraServices > 0 ? `Доп. услуги: ${formatRub(extraServices)}` : 'Учтено в инвойсе'}</div>
      </div>
      <div class="cockpit-subcard dashed" onclick="openPaymentWithBooking(${selBook.id})">
        <div class="cockpit-plus-icon">+</div>
        <div class="cockpit-subcard-label">Принять оплату</div>
      </div>
    </div>

    <div class="cockpit-detail-footer">
      <div class="cockpit-footer-col">
        <span class="foot-label">Тариф проживания</span>
        <span class="foot-val">${formatRub(stayCost)}</span>
      </div>
      <div class="cockpit-footer-col">
        <span class="foot-label">Итого по счету</span>
        <span class="foot-val">${formatRub(selBook.totalPrice)}</span>
      </div>
      <div class="cockpit-footer-col">
        <span class="foot-label">Статус оплаты</span>
        <span class="foot-val" style="color:${paymentColor}; font-size:14px">${paymentText}</span>
      </div>

      <div class="cockpit-footer-actions">
        <button class="cockpit-icon-btn" title="Печать счёта-квитанции" onclick="openInvoiceSheet(${selBook.id})">
          Печать квитанции
        </button>
        <button class="cockpit-primary-white-btn" onclick="openInvoiceSheet(${selBook.id})">
          Счёт (Folio)
        </button>
      </div>
    </div>
  `;
}

function selectCockpitBooking(id) {
  selectedCockpitBookingId = id;
  filterDashboardContent();
}

function setCockpitFilter(mode, btn) {
  cockpitFilterMode = mode;
  document.querySelectorAll('.cockpit-tab-pill').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  filterDashboardContent();
}

async function openPaymentWithBooking(bookingId) {
  await openPaymentModal(bookingId);
}

function toggleFilterDrawer() {
  const row = document.querySelector('.filter-toolbar-row');
  if (row) {
    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const search = document.getElementById('dash-global-search');
    if (search) search.focus();
  }
}

function resetDashboardFilters() {
  const catEl = document.getElementById('dash-filter-category');
  const stEl = document.getElementById('dash-filter-status');
  const perEl = document.getElementById('dash-filter-period');
  const flEl = document.getElementById('dash-filter-floor');
  const srchEl = document.getElementById('dash-global-search');
  if (catEl) catEl.value = '';
  if (stEl) stEl.value = '';
  if (perEl) perEl.value = 'all';
  if (flEl) flEl.value = 'all';
  if (srchEl) srchEl.value = '';
  currentFloorFilter = 'all';
  document.querySelectorAll('#floor-tabs-nav .floor-tab-btn').forEach(btn => {
    btn.classList.toggle('active', (btn.dataset.floor || '') === 'all');
  });
  filterDashboardContent();
  notify('Фильтры сводки сброшены');
}

function filterDashboardContent() {
  const cat = document.getElementById('dash-filter-category')?.value || '';
  const st = document.getElementById('dash-filter-status')?.value || '';
  const period = document.getElementById('dash-filter-period')?.value || 'all';
  const flEl = document.getElementById('dash-filter-floor');
  const floorVal = String((flEl && flEl.value) ? flEl.value : (currentFloorFilter || 'all'));
  const query = (document.getElementById('dash-global-search')?.value || '').toLowerCase().trim();

  currentFloorFilter = floorVal;
  document.querySelectorAll('#floor-tabs-nav .floor-tab-btn').forEach(btn => {
    btn.classList.toggle('active', (btn.dataset.floor || '') === floorVal);
  });

  // Считаем реально активные фильтры
  let activeCount = 0;
  if (cat) activeCount++;
  if (st) activeCount++;
  if (period && period !== 'all') activeCount++;
  if (floorVal && floorVal !== 'all') activeCount++;
  if (query) activeCount++;
  const badgeEl = document.getElementById('dash-active-filters-count');
  if (badgeEl) badgeEl.innerText = activeCount;

  // Фильтруем комнаты (по категории, статусу и поиску по номеру/гостю/паспорту)
  let filteredRooms = globalRoomsCache.filter(r => {
    if (cat && r.type !== cat) return false;
    if (st && r.status !== st) return false;
    if (!query) return true;

    const matchRoom = r.roomNumber.toLowerCase().includes(query) ||
      (LABELS.types[r.type] || '').toLowerCase().includes(query) ||
      (LABELS.roomStatuses[r.status] || '').toLowerCase().includes(query);
    if (matchRoom) return true;

    const activeB = globalBookingsCache.find(b =>
      ((b.roomId || (b.room && b.room.id)) === r.id) && b.status !== 'CANCELLED' && b.status !== 'CHECKED_OUT'
    );
    if (activeB) {
      const g = activeB.guest || globalGuestsCache.find(x => x.id === (activeB.guestId || activeB.guest_id));
      if (g) {
        const gText = `${g.firstName} ${g.lastName} ${g.passportNumber} ${g.phone}`.toLowerCase();
        if (gText.includes(query)) return true;
      }
    }
    return false;
  });

  renderFloorCorridors(filteredRooms, floorVal);

  // Фильтруем бронирования в Кокпите (по периоду, категории/статусу комнаты, этажу и поиску)
  const filteredBookings = globalBookingsCache.filter(b => {
    if (period !== 'all') {
      const inMatch = (b.checkInDate || '').startsWith(period);
      const outMatch = (b.checkOutDate || '').startsWith(period);
      if (!inMatch && !outMatch) return false;
    }
    const r = b.room || globalRoomsCache.find(x => x.id === (b.roomId || b.room_id));
    if (cat && (!r || r.type !== cat)) return false;
    if (st && (!r || r.status !== st)) return false;
    if (floorVal !== 'all' && (!r || String(r.floor) !== String(floorVal))) return false;
    if (query) {
      const g = b.guest || globalGuestsCache.find(x => x.id === (b.guestId || b.guest_id));
      const haystack = `${b.id} ${r ? r.roomNumber : ''} ${g ? `${g.firstName} ${g.lastName} ${g.passportNumber} ${g.phone}` : ''}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  renderDashboardCockpit(filteredBookings);
}

// Фильтрация этажей (синхронизируется с селектом в шапке фильтров)
function filterFloorView(floor) {
  const targetFloor = (floor === undefined || floor === null || floor === '') ? 'all' : String(floor);
  currentFloorFilter = targetFloor;
  const flEl = document.getElementById('dash-filter-floor');
  if (flEl) {
    if (![...flEl.options].some(o => o.value === targetFloor)) {
      const opt = document.createElement('option');
      opt.value = targetFloor;
      opt.textContent = targetFloor === 'all' ? 'Все этажи здания' : `${targetFloor}-й этаж`;
      flEl.appendChild(opt);
    }
    flEl.value = targetFloor;
  }
  filterDashboardContent();
}

// Поэтажная отрисовка дверей
function renderFloorCorridors(rooms, selectedFloor) {
  const container = document.getElementById('floor-corridors-list');
  if (!container) return;

  // Группировка комнат по этажам
  const floorsMap = {};
  rooms.forEach(r => {
    const f = r.floor || 1;
    if (!floorsMap[f]) floorsMap[f] = [];
    floorsMap[f].push(r);
  });

  const floorNumbers = Object.keys(floorsMap).map(Number).sort((a, b) => a - b);
  const floorsToShow = selectedFloor === 'all' ? floorNumbers : [Number(selectedFloor)];

  if (floorsToShow.length === 0 || !floorsMap[floorsToShow[0]]) {
    container.innerHTML = '<div style="text-align:center; padding:30px; color:var(--text-muted)">Номера на выбранном этаже не найдены</div>';
    return;
  }

  const floorTitles = {
    1: 'Базовый уровень (Номера 101 — 102)',
    2: 'Повышенная комфортность (Номера 201 — 202)',
    3: 'Представительский уровень (Номера 301 — 302)',
    4: 'Президентский пентхаус (Номер 401)'
  };

  container.innerHTML = floorsToShow.map(fNum => {
    const fRooms = floorsMap[fNum] || [];
    const occCount = fRooms.filter(r => r.status === 'OCCUPIED').length;

    return `
      <div class="floor-corridor-wing">
        <div class="corridor-header">
          <div class="floor-title-badge">
            <span class="floor-num-pill">${fNum}-й этаж</span>
            <span class="floor-type-desc">${floorTitles[fNum] || 'Жилой этаж'}</span>
          </div>
          <div class="corridor-stats">
            Занятость: <strong>${occCount} из ${fRooms.length} номеров</strong>
          </div>
        </div>

        <div class="corridor-doors-grid">
          ${fRooms.map(r => generateDoorHtml(r)).join('')}
        </div>
      </div>
    `;
  }).join('');
}

// Генерация разметки реалистичной двери с всплывающим окном
function generateDoorHtml(room) {
  // Поиск активной брони и гостя для этого номера
  const activeBook = globalBookingsCache.find(b =>
    (b.roomId === room.id || (b.room && b.room.id === room.id)) &&
    b.status !== 'CANCELLED' && b.status !== 'CHECKED_OUT'
  );
  let occupantName = null;
  let datesText = null;
  let guestPhone = null;
  let nightsHtml = '';
  let remainingBadge = '';

  if (activeBook) {
    const guest = activeBook.guest || globalGuestsCache.find(g => g.id === (activeBook.guestId || activeBook.guest_id || (activeBook.guest && activeBook.guest.id)));
    if (guest) {
      occupantName = `${guest.firstName} ${guest.lastName}`;
      guestPhone = guest.phone;
    }
    datesText = `${activeBook.checkInDate} → ${activeBook.checkOutDate}`;
    const nights = calculateNights(activeBook.checkInDate, activeBook.checkOutDate);
    nightsHtml = `<span class="stay-nights-pill">${nights} ноч.</span>`;
    remainingBadge = getRemainingNightsBadge(activeBook.checkOutDate, activeBook.status);
  }

  // Описание для всплывающей карточки
  let statusDetailHtml = '';
  if (room.status === 'OCCUPIED') {
    statusDetailHtml = `
      <div class="popover-guest-box">
        <div class="title">Проживающий постоялец:</div>
        <div style="font-weight:700; color:var(--text-main)">${escapeHtml(occupantName || 'Постоялец')}</div>
        <div style="color:var(--text-muted); font-size:11px; margin-top:2px">${datesText || 'Период не указан'}</div>
        <div style="margin-top:6px; display:flex; gap:6px; align-items:center; flex-wrap:wrap">
          ${nightsHtml}
          ${remainingBadge}
        </div>
        ${guestPhone ? `<div style="color:var(--text-secondary); font-size:11px; margin-top:4px">${escapeHtml(guestPhone)}</div>` : ''}
      </div>
    `;
  } else if (room.status === 'BOOKED') {
    statusDetailHtml = `
      <div class="popover-guest-box">
        <div class="title">Бронь оформлена на:</div>
        <div style="font-weight:700; color:var(--text-main)">${escapeHtml(occupantName || 'Гость')}</div>
        <div style="color:var(--text-muted); font-size:11px; margin-top:2px">Заезд ожидается: ${datesText || 'В ближайшие дни'}</div>
        <div style="margin-top:6px; display:flex; gap:6px; align-items:center; flex-wrap:wrap">
          ${nightsHtml}
          ${remainingBadge}
        </div>
      </div>
    `;
  } else if (room.status === 'CLEANING') {
    statusDetailHtml = `
      <div class="popover-guest-box" style="background:#f1f5f9">
        <div class="title">Статус обслуживания:</div>
        <div style="color:var(--text-secondary)">Санитарная обработка и смена белья горничной</div>
      </div>
    `;
  } else if (room.status === 'AVAILABLE') {
    statusDetailHtml = `
      <div class="popover-guest-box" style="background:#f2f7f2">
        <div class="title" style="color:#2b5932">Готовность:</div>
        <div style="color:#2b5932; font-weight:600">Номер полностью чист, проверен и готов к заселению</div>
      </div>
    `;
  } else {
    statusDetailHtml = `
      <div class="popover-guest-box" style="background:#f5f4f2">
        <div class="title">Техническое обслуживание:</div>
        <div style="color:var(--text-muted)">Плановый ремонт оборудования</div>
      </div>
    `;
  }

  const amenities = {
    STANDARD: ['Двуспальная кровать', 'Wi-Fi', 'Душ', 'ТВ'],
    SUPERIOR: ['Кровать King-size', 'Балкон', 'Рабочая зона', 'Wi-Fi'],
    DELUXE: ['Панорамный вид', 'Ванна', 'Мини-бар', 'Сейф'],
    SUITE: ['2 комнаты', 'Гостиная', 'Кофемашина', 'Халаты'],
    PRESIDENTIAL: ['Терраса', 'Персональный сервис', 'Джакузи', 'Панорама']
  };
  const amenList = amenities[room.type] || ['Wi-Fi', 'Кондиционер'];

  return `
    <div class="door-wrapper">
      
      <div class="hotel-door ${room.status}" onclick="openRoomStatusModal(${room.id}, '${room.roomNumber}', '${room.status}')">
        
        <div class="door-plaque">
          <div class="door-number">${room.roomNumber}</div>
          <div class="door-category-label">${LABELS.types[room.type] || room.type}</div>
        </div>

        
        <div class="door-handle-lock">
          <div class="lock-sensor">
            <span class="lock-led"></span>
            <span>Key</span>
          </div>
          <div class="door-handle-hardware"></div>
        </div>

        
        <div>
          <div class="door-hanger-card ${room.status}">
            ${LABELS.roomStatuses[room.status] || room.status}
          </div>
          <div class="door-price-tag">${formatRub(room.pricePerNight)}/сут.</div>
        </div>

        
        <div class="door-threshold"></div>
      </div>

      
      <div class="door-popover">
        <div class="popover-header">
          <div>
            <div class="popover-suite-title">Номер ${room.roomNumber}</div>
            <div class="popover-suite-type">${LABELS.types[room.type] || room.type} • ${room.floor} этаж</div>
          </div>
          <div class="popover-status-badge door-hanger-card ${room.status}" style="margin:0; padding:3px 8px">
            ${LABELS.roomStatuses[room.status] || room.status}
          </div>
        </div>

        <div class="popover-details-list">
          <div class="popover-detail-row">
            <span>Тариф за сутки:</span>
            <strong>${formatRub(room.pricePerNight)}</strong>
          </div>
          <div class="popover-detail-row">
            <span>Вместимость:</span>
            <strong>до ${room.maxGuests} гостей</strong>
          </div>
        </div>

        ${statusDetailHtml}

        <div class="popover-amenities-tags">
          ${amenList.map(a => `<span class="amenity-tag">${a}</span>`).join('')}
        </div>

        <div class="popover-actions">
          <button class="btn btn-xs btn-secondary" style="flex:1" onclick="openRoomStatusModal(${room.id}, '${room.roomNumber}', '${room.status}')">
            Статус
          </button>
          ${room.status === 'AVAILABLE' ? `
            <button class="btn btn-xs btn-brass" style="flex:1" onclick="openBookingWithRoom(${room.id})">
              Забронировать
            </button>
          ` : ''}
          ${activeBook ? `
            <button class="btn btn-xs btn-primary" style="flex:1" onclick="openInvoiceSheet(${activeBook.id})">
              Счёт
            </button>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

// Отрисовка постояльцев в сводке
function renderCurrentOccupantsTable() {
  const tbody = document.getElementById('dash-arrivals');
  if (!tbody) return;

  const activeGuests = globalGuestsCache.filter(g => g.checkedIn);
  if (activeGuests.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:24px">В данный момент проживающих гостей нет</td></tr>';
    return;
  }

  tbody.innerHTML = activeGuests.map(g => {
    // Находим привязанную бронь и номер
    const b = globalBookingsCache.find(x =>
      ((x.guestId === g.id) || (x.guest_id === g.id) || (x.guest && x.guest.id === g.id)) &&
      (x.status === 'CHECKED_IN' || x.status === 'CONFIRMED')
    );
    const roomId = b ? (b.roomId || b.room_id || (b.room && b.room.id)) : null;
    const room = roomId ? globalRoomsCache.find(r => r.id === roomId) : null;

    const inDate = b ? b.checkInDate : g.checkInDate;
    const outDate = b ? b.checkOutDate : g.checkOutDate;
    const nights = calculateNights(inDate, outDate);
    const countdown = getRemainingNightsBadge(outDate, 'CHECKED_IN');

    return `
      <tr>
        <td><strong>${escapeHtml(g.firstName)} ${escapeHtml(g.lastName)}</strong></td>
        <td>
          ${room ? `
            <span class="room-assigned-pill">
              № ${room.roomNumber} (${LABELS.types[room.type] || room.type})
            </span>
          ` : `<span style="color:var(--text-dim)">Номер не определен</span>`}
        </td>
        <td>${escapeHtml(g.phone)}</td>
        <td><code>${escapeHtml(g.passportNumber)}</code></td>
        <td>
          <div>${inDate || '—'} → ${outDate || '—'}</div>
          <div style="margin-top:4px; display:flex; gap:6px; align-items:center">
            <span class="stay-nights-pill">${nights} ноч.</span>
            ${countdown}
          </div>
        </td>
        <td>
          <button class="btn btn-xs btn-secondary" onclick="checkOutGuest(${g.id})">
            Выселить
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

