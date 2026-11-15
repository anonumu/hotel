// ==========================================================================
// МОДУЛЬ: Финансы, тарифы и прием платежей
// ==========================================================================

// ==========================================================================
// 6. ТАРИФЫ И КАССА
// ==========================================================================
async function renderTariffs() {
  const [tariffs, payments] = await Promise.all([
    api('/tariffs'),
    api('/payments')
  ]);

  const tBody = document.getElementById('tariffs-tbody');
  if (tBody && tariffs) {
    tBody.innerHTML = tariffs.map(t => `
      <tr>
        <td><strong>${escapeHtml(t.name)}</strong></td>
        <td>${LABELS.types[t.roomType] || t.roomType}</td>
        <td><strong>${formatRub(t.pricePerNight)}</strong></td>
        <td>${t.seasonStart ? `${t.seasonStart} → ${t.seasonEnd}` : 'Круглый год'}</td>
        <td>
          <span class="door-hanger-card ${t.active ? 'AVAILABLE' : 'OUT_OF_ORDER'}" style="display:inline-block; padding:2px 7px; margin:0">
            ${t.active ? 'Активен' : 'Архив'}
          </span>
        </td>
      </tr>
    `).join('');
  }

  const pBody = document.getElementById('payments-tbody');
  if (pBody && payments) {
    if (payments.length === 0) {
      pBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:20px">Платежи не зарегистрированы</td></tr>';
      return;
    }
    pBody.innerHTML = payments.map(p => `
      <tr>
        <td><strong>#${p.id}</strong></td>
        <td>Бронь #${p.bookingId || (p.booking ? p.booking.id : '—')}</td>
        <td><strong style="color:#2b5932">${formatRub(p.amount)}</strong></td>
        <td><span class="room-assigned-pill">${LABELS.methods[p.method] || p.method}</span></td>
        <td>${p.paidAt ? p.paidAt.substring(0, 16) : '—'}</td>
        <td>${escapeHtml(p.description || 'Оплата проживания')}</td>
      </tr>
    `).join('');
  }
}

async function openPaymentModal(preselectBookingId = null) {
  const [books, payments, guests] = await Promise.all([
    api('/bookings'),
    api('/payments'),
    api('/guests')
  ]);
  if (books) globalBookingsCache = books;
  if (payments) globalPaymentsCache = payments;
  if (guests) globalGuestsCache = guests;

  const sel = document.getElementById('pay-booking-sel');
  if (sel) {
    const activeBooks = (books || []).filter(b => b.status !== 'CANCELLED');
    if (activeBooks.length === 0) {
      sel.innerHTML = '<option value="">Нет доступных бронирований для оплаты</option>';
    } else {
      sel.innerHTML = activeBooks.map(b => {
        const g = b.guest || globalGuestsCache.find(x => x.id === (b.guestId || b.guest_id));
        const gLabel = g ? `${g.firstName} ${g.lastName}` : `Гость #${b.guestId || b.id}`;
        const paid = globalPaymentsCache
          .filter(p => (p.bookingId || p.booking_id || (p.booking && p.booking.id)) === b.id)
          .reduce((s, p) => s + (Number(p.amount) || 0), 0);
        const due = Math.max(0, Number(b.totalPrice || 0) - paid);
        const balHint = due <= 0 ? 'Оплачено' : `Остаток: ${formatRub(due)}`;
        return `
          <option value="${b.id}" data-due="${due}" data-total="${b.totalPrice}">
            Бронь #${b.id} — ${escapeHtml(gLabel)} • ${formatRub(b.totalPrice)} (${balHint}) [${LABELS.bookingStatuses[b.status] || b.status}]
          </option>
        `;
      }).join('');

      if (preselectBookingId && activeBooks.some(b => String(b.id) === String(preselectBookingId))) {
        sel.value = String(preselectBookingId);
      } else {
        // По умолчанию выбираем первую бронь с неоплаченным остатком
        const unpaid = activeBooks.find(b => {
          const paid = globalPaymentsCache
            .filter(p => (p.bookingId || p.booking_id || (p.booking && p.booking.id)) === b.id)
            .reduce((s, p) => s + (Number(p.amount) || 0), 0);
          return (Number(b.totalPrice || 0) - paid) > 0;
        });
        if (unpaid) sel.value = String(unpaid.id);
      }
    }
  }
  onPaymentBookingChange();
  clearModalAlert('modal-add-payment');
  openModal('modal-add-payment');
}

function onPaymentBookingChange() {
  const sel = document.getElementById('pay-booking-sel');
  const amtEl = document.getElementById('pay-amount');
  if (!sel || !amtEl) return;
  const opt = sel.selectedOptions[0];
  if (!opt || !opt.value) {
    amtEl.value = '';
    return;
  }
  const due = parseFloat(opt.dataset.due || '0');
  const total = parseFloat(opt.dataset.total || '5000');
  amtEl.value = due > 0 ? due : (total > 0 ? total : 5000);
}

async function submitPayment(e) {
  e.preventDefault();
  const btn = document.getElementById('add-payment-submit-btn');
  const origText = btn ? btn.innerHTML : 'Провести платеж';
  if (btn) { btn.disabled = true; btn.innerHTML = 'Проведение...'; }

  clearModalAlert('modal-add-payment');

  const bookingVal = document.getElementById('pay-booking-sel')?.value;
  const amountRaw = document.getElementById('pay-amount')?.value;
  const desc = (document.getElementById('pay-desc')?.value || '').trim();

  if (!bookingVal) {
    showModalAlert('modal-add-payment', 'Выберите бронирование для проведения оплаты');
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }

  if (hasInjectionPayload(desc)) {
    triggerSamsonovStressOverlay({
      code: 'ERR_SECURITY_INJECTION_418',
      source: 'Форма оплаты: поле «Назначение платежа»',
      reason: 'Обнаружена попытка XSS/SQL-инъекции в примечании к платежу.',
      details: 'Потенциально опасная строка заблокирована до обращения к БД.'
    });
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }

  if (amountRaw === '' || amountRaw === null || amountRaw === undefined) {
    showModalAlert('modal-add-payment', 'Укажите сумму платежа');
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }

  const amountNum = parseFloat(amountRaw);
  if (isNaN(amountNum) || amountNum < 0 || amountNum > 5000000) {
    triggerSamsonovStressOverlay({
      code: amountNum < 0 ? 'ERR_NEGATIVE_PAYMENT_OVERFLOW_418' : 'ERR_MAX_PAYMENT_OVERFLOW_418',
      source: 'Форма оплаты: поле «Сумма платежа» = ' + (isNaN(amountNum) ? amountRaw : formatRub(amountNum)),
      reason: `Некорректная или запредельная сумма платежа (${amountRaw}, допустимо: от 1 до 5 000 000 ₽).`,
      details: 'Платёжный шлюз отклонил аномальную транзакцию.'
    });
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }

  if (amountNum === 0) {
    showModalAlert('modal-add-payment', 'Сумма платежа должна быть строго больше 0 ₽');
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }

  const payload = {
    bookingId: parseInt(bookingVal, 10),
    amount: amountNum,
    method: document.getElementById('pay-method').value,
    description: desc || 'Оплата за проживание'
  };

  try {
    await api('/payments', { method: 'POST', body: JSON.stringify(payload) });
    notify('Платеж успешно проведен');
    closeModal('modal-add-payment');
    await refreshAllViews();
  } catch (err) {
    if (!err.isStress) {
      showModalAlert('modal-add-payment', err.message);
      notify(err.message, 'err');
    }
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
  }
}

