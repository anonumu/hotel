// Навигация между разделами
const VIEW_METADATA = {
  dashboard: {
    title: 'Сводка и бронирования',
    subtitle: 'Управление номерным фондом, постояльцами и кассой гостиницы в едином пространстве.'
  },
  rooms: {
    title: 'Реестр номерного фонда',
    subtitle: 'Каталог номеров отеля, категории, этажность, вместимость и тарифы.'
  },
  bookings: {
    title: 'Журнал бронирований',
    subtitle: 'Учет предварительных и активных броней номерного фонда комплекса.'
  },
  guests: {
    title: 'Служба приема и постояльцы',
    subtitle: 'Регистрация гостей, прикрепление к номерам и статус фактического проживания.'
  },
  staff: {
    title: 'Штатное расписание и сотрудники',
    subtitle: 'Управление рабочими сменами, должностями и показателями эффективности.'
  },
  tariffs: {
    title: 'Тарифная сетка и касса',
    subtitle: 'Базовые тарифы и кассовый журнал входящих финансовых платежей.'
  },
  reports: {
    title: 'Финансовая аналитика и отчеты',
    subtitle: 'Статистика загрузки фонда, динамика выручки и эффективность персонала.'
  }
};

function setupNavigation() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      if (view) navigateTo(view);
    });
  });
}

function navigateTo(viewName) {
  document.querySelectorAll('.screen-view').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));

  const target = document.getElementById(`view-${viewName}`);
  const btn = document.querySelector(`.nav-item[data-view="${viewName}"]`);
  if (target) target.classList.add('active');
  if (btn) btn.classList.add('active');

  const meta = VIEW_METADATA[viewName] || VIEW_METADATA.dashboard;
  const titleEl = document.getElementById('page-main-title');
  const subEl = document.getElementById('page-main-subtitle');
  if (titleEl) titleEl.innerText = meta.title;
  if (subEl) subEl.innerText = meta.subtitle;

  switch (viewName) {
    case 'dashboard': renderDashboard(); break;
    case 'rooms': renderRooms(); break;
    case 'bookings': renderBookings(); break;
    case 'guests': renderGuests(); break;
    case 'staff': renderStaff(); break;
    case 'tariffs': renderTariffs(); break;
    case 'reports': renderReports(); break;
  }
}

function updateNavCounts(counts = {}) {
  if (counts.rooms !== undefined) {
    const el = document.getElementById('nav-rooms-badge');
    if (el) el.innerText = counts.rooms;
  }
  if (counts.bookings !== undefined) {
    const el = document.getElementById('nav-bookings-badge');
    if (el) el.innerText = counts.bookings;
  }
  if (counts.guests !== undefined) {
    const el = document.getElementById('nav-guests-badge');
    if (el) el.innerText = counts.guests;
  }
  if (counts.staff !== undefined) {
    const el = document.getElementById('nav-staff-badge');
    if (el) el.innerText = counts.staff;
  }
}
