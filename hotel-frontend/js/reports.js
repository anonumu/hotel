// Отчеты и аналитика
async function renderReports() {
  const [occ, rev, staffRep, guestsRep] = await Promise.all([
    api('/reports/occupancy'),
    api('/reports/revenue'),
    api('/reports/staff-performance'),
    api('/reports/guests')
  ]);

  if (occ) {
    const rawRate = occ.occupancyRatePercentage !== undefined
      ? occ.occupancyRatePercentage
      : (occ.occupancyRate !== undefined ? occ.occupancyRate : 0);
    const rateVal = Math.round(Number(rawRate) || 0);
    const totalRooms = occ.totalRooms !== undefined ? occ.totalRooms : 0;
    const occupied = occ.occupiedRooms !== undefined ? occ.occupiedRooms : 0;
    const available = occ.availableRooms !== undefined ? occ.availableRooms : 0;
    const cleaning = occ.cleaningRooms !== undefined ? occ.cleaningRooms : 0;
    const booked = occ.bookedRooms !== undefined ? occ.bookedRooms : 0;
    const repair = occ.outOfOrderRooms !== undefined ? occ.outOfOrderRooms : 0;

    const rateEl = document.getElementById('rep-occ-rate');
    if (rateEl) rateEl.innerText = `${rateVal}%`;

    const totalEl = document.getElementById('rep-occ-total');
    if (totalEl) totalEl.innerText = `Всего ${totalRooms} номеров в фонде`;

    const breakdownEl = document.getElementById('rep-occ-breakdown');
    if (breakdownEl) {
      breakdownEl.innerHTML = `Занято: <strong>${occupied}</strong> • Свободно: <strong>${available}</strong> • Бронь: <strong>${booked}</strong> • Уборка: <strong>${cleaning}</strong> • Ремонт: <strong>${repair}</strong>`;
    }
  }

  if (rev) {
    const totalRev = Number(rev.totalRevenue) || 0;
    const txCount = rev.totalPaymentsCount !== undefined
      ? rev.totalPaymentsCount
      : (rev.totalTransactions !== undefined ? rev.totalTransactions : 0);
    const byMethod = rev.revenueByPaymentMethod || rev.revenueByMethod || rev.byMethod || {};

    const cardSum = Number(byMethod.CARD ?? byMethod.card ?? 0);
    const cashSum = Number(byMethod.CASH ?? byMethod.cash ?? 0);
    const transferSum = Number(byMethod.TRANSFER ?? byMethod.transfer ?? 0);

    const revTotalEl = document.getElementById('rep-rev-total');
    if (revTotalEl) revTotalEl.innerText = formatRub(totalRev);

    const txEl = document.getElementById('rep-rev-tx');
    if (txEl) txEl.innerText = `${txCount} платежей проведено`;

    const revSubEl = document.getElementById('rep-rev-sub');
    if (revSubEl) {
      const avgCheck = txCount > 0 ? Math.round(totalRev / txCount) : 0;
      revSubEl.innerText = txCount > 0
        ? `Средний чек платежа: ${formatRub(avgCheck)}`
        : 'Сумма всех подтвержденных кассовых поступлений';
    }

    const cardEl = document.getElementById('rep-card-sum');
    if (cardEl) cardEl.innerText = formatRub(cardSum);

    const cashEl = document.getElementById('rep-cash-sum');
    if (cashEl) cashEl.innerText = formatRub(cashSum);

    const transferEl = document.getElementById('rep-transfer-sum');
    if (transferEl) transferEl.innerText = formatRub(transferSum);

    const baseRev = totalRev > 0 ? totalRev : 1;
    const cardPct = totalRev > 0 ? Math.round((cardSum / baseRev) * 100) : 0;
    const transferPct = totalRev > 0 ? Math.round((transferSum / baseRev) * 100) : 0;
    const cashPct = totalRev > 0 ? Math.round((cashSum / baseRev) * 100) : 0;

    const cardBar = document.getElementById('rep-card-bar');
    if (cardBar) cardBar.style.width = `${cardPct}%`;

    const transferBar = document.getElementById('rep-transfer-bar');
    if (transferBar) transferBar.style.width = `${transferPct}%`;

    const cashBar = document.getElementById('rep-cash-bar');
    if (cashBar) cashBar.style.width = `${cashPct}%`;
  }

  const guestsSumEl = document.getElementById('rep-guests-summary');
  if (guestsSumEl && guestsRep) {
    const byNat = guestsRep.guestsByNationality || {};
    const natStr = Object.entries(byNat).map(([k, v]) => `${escapeHtml(k)}: <strong>${v}</strong>`).join(' • ');
    guestsSumEl.innerHTML = `Всего гостей в базе: <strong>${guestsRep.totalGuests || 0}</strong> • Сейчас проживают: <strong>${guestsRep.currentlyCheckedIn || 0}</strong> • Броней: <strong>${guestsRep.totalBookings || 0}</strong>${natStr ? `<div style="margin-top:6px; color:#64748b">География: ${natStr}</div>` : ''}`;
  }

  const staffList = (staffRep && (staffRep.staffStats || staffRep.stats || staffRep.staffMemberStats)) || [];
  const repStaffSub = document.getElementById('rep-staff-subtitle');
  if (repStaffSub && staffRep) {
    repStaffSub.innerText = `Сейчас на работе: ${staffRep.activeStaff ?? 0} из ${staffRep.totalStaff ?? staffList.length} • Средняя оценка: ${staffRep.averageRating ?? '—'}`;
  }
  const list = document.getElementById('rep-staff-kpi');
  if (list) {
    if (staffList.length === 0) {
      list.innerHTML = '<div style="color:var(--text-muted); font-size:13px">Сотрудники в базе отсутствуют</div>';
    } else {
      list.innerHTML = staffList.map(s => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid var(--slate-100)">
          <div>
            <div style="display:flex; align-items:center; gap:8px">
              <span style="font-weight:700; color:var(--text-main); font-size:13px">${escapeHtml(s.name)}</span>
              ${s.active !== undefined ? `<span class="door-hanger-card ${s.active ? 'AVAILABLE' : 'OUT_OF_ORDER'}" style="padding:1px 6px; font-size:10px">${s.active ? 'На работе' : 'Выходной'}</span>` : ''}
            </div>
            <div style="font-size:11.5px; color:var(--text-muted)">${LABELS.positions[s.position] || s.position} • ${s.shift || 'Смена'}</div>
          </div>
          <div style="text-align:right">
            <div style="color:#4f46e5; font-weight:700; font-size:12.5px">Оценка: ${s.rating}</div>
            <div style="font-size:11px; color:var(--text-dim)">Смен: ${s.tasksCompleted || 0}</div>
          </div>
        </div>
      `).join('');
    }
  }
}

