// Работа с модальными окнами и обновление данных

function showModalAlert(modalId, message) {
  const alertEl = document.getElementById(`${modalId}-alert`);
  if (!alertEl) return;
  alertEl.style.display = 'flex';
  alertEl.innerHTML = `<strong>Внимание:</strong> <span>${escapeHtml(message)}</span>`;
}

function clearModalAlert(modalId) {
  const alertEl = document.getElementById(`${modalId}-alert`);
  if (alertEl) {
    alertEl.style.display = 'none';
    alertEl.innerHTML = '';
  }
}

// Проверка соединения с Spring Boot

async function refreshAllViews() {
  try {
    const [rooms, guests, bookings, payments, staff] = await Promise.all([
      api('/rooms'),
      api('/guests'),
      api('/bookings'),
      api('/payments'),
      api('/staff')
    ]);

    if (rooms) globalRoomsCache = rooms;
    if (guests) globalGuestsCache = guests;
    if (bookings) globalBookingsCache = bookings;
    if (payments) globalPaymentsCache = payments;
    if (staff) globalStaffCache = staff;

    await Promise.all([
      renderDashboard(),
      renderRooms(rooms),
      renderBookings(bookings, rooms, guests),
      renderGuests(guests, bookings, rooms),
      renderTariffs(),
      renderStaff(),
      renderReports(),
      populateBookingSelects(rooms, guests, bookings)
    ]);
  } catch (e) {
    console.warn('Ошибка синхронизации представлений:', e);
  }
}

function openModal(id) {
  clearModalAlert(id);
  const m = document.getElementById(id);
  if (m) m.classList.add('active');
  if (id === 'modal-add-booking') {
    populateBookingSelects();
  }
}

function closeModal(id) {
  clearModalAlert(id);
  const m = document.getElementById(id);
  if (m) m.classList.remove('active');
}
