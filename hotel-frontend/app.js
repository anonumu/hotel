// ==========================================================================
// ИС «Гостиница» — Клиентская часть
// Студент: Сигналов Владислав Алексеевич (Группа 3 ИС-3)
// Преподаватель: Самсонов Илья Валерьевич
//
// Базовый URL для REST API Spring Boot (порт 8080)
// ==========================================================================

const API_BASE = 'http://localhost:8080/api/v1';

// Текущее состояние подключения и выбранная роль
let isApiOnline = false;
let currentRole = 'ADMIN';

// Встроенные данные на случай оффлайн-демонстрации (из data.sql)
const store = {
  rooms: [
    { id: 1, roomNumber: '101', type: 'STANDARD', status: 'AVAILABLE', floor: 1, pricePerNight: 3500.00, maxGuests: 2, description: 'Уютный стандартный номер с двуспальной кроватью' },
    { id: 2, roomNumber: '102', type: 'STANDARD', status: 'AVAILABLE', floor: 1, pricePerNight: 3500.00, maxGuests: 2, description: 'Стандартный номер с двумя раздельными кроватями' },
    { id: 3, roomNumber: '201', type: 'SUPERIOR', status: 'OCCUPIED', floor: 2, pricePerNight: 5000.00, maxGuests: 2, description: 'Улучшенный номер с балконом' },
    { id: 4, roomNumber: '202', type: 'SUPERIOR', status: 'BOOKED', floor: 2, pricePerNight: 5200.00, maxGuests: 3, description: 'Семейный номер с дополнительным спальным местом' },
    { id: 5, roomNumber: '301', type: 'DELUXE', status: 'CLEANING', floor: 3, pricePerNight: 7500.00, maxGuests: 3, description: 'Делюкс с панорамными окнами и ванной' },
    { id: 6, roomNumber: '302', type: 'SUITE', status: 'AVAILABLE', floor: 3, pricePerNight: 11000.00, maxGuests: 4, description: 'Двухкомнатный представительский люкс' },
    { id: 7, roomNumber: '401', type: 'PRESIDENTIAL', status: 'OUT_OF_ORDER', floor: 4, pricePerNight: 25000.00, maxGuests: 4, description: 'Президентский номер (плановый ремонт)' }
  ],
  guests: [
    { id: 1, firstName: 'Иван', lastName: 'Смирнов', email: 'ivan.smirnov@mail.ru', phone: '+7 (916) 111-22-33', passportNumber: '4510 123456', nationality: 'Россия', checkInDate: '2026-11-01', checkOutDate: '2026-11-08', checkedIn: true },
    { id: 2, firstName: 'Анна', lastName: 'Кузнецова', email: 'a.kuznetsova@gmail.com', phone: '+7 (926) 333-44-55', passportNumber: '4512 654321', nationality: 'Россия', checkInDate: '2026-11-10', checkOutDate: '2026-11-15', checkedIn: false },
    { id: 3, firstName: 'Джон', lastName: 'Миллер', email: 'j.miller@yahoo.com', phone: '+1 (555) 789-01-23', passportNumber: 'US89341209', nationality: 'США', checkInDate: '2026-10-20', checkOutDate: '2026-10-25', checkedIn: false },
    { id: 4, firstName: 'Елена', lastName: 'Попова', email: 'elena.popova@yandex.ru', phone: '+7 (903) 777-88-99', passportNumber: '4515 987654', nationality: 'Россия', checkInDate: null, checkOutDate: null, checkedIn: false }
  ],
  bookings: [
    { id: 1, roomId: 3, guestId: 1, checkInDate: '2026-11-01', checkOutDate: '2026-11-08', status: 'CHECKED_IN', totalPrice: 35000.00, guestCount: 2, createdAt: '2026-10-25T12:00:00' },
    { id: 2, roomId: 4, guestId: 2, checkInDate: '2026-11-10', checkOutDate: '2026-11-15', status: 'CONFIRMED', totalPrice: 26000.00, guestCount: 2, createdAt: '2026-11-02T15:30:00' },
    { id: 3, roomId: 1, guestId: 3, checkInDate: '2026-10-20', checkOutDate: '2026-10-25', status: 'CHECKED_OUT', totalPrice: 17500.00, guestCount: 1, createdAt: '2026-10-15T09:15:00' }
  ],
  staff: [
    { id: 1, firstName: 'Михаил', lastName: 'Орлов', position: 'MANAGER', email: 'm.orlov@hotel.ru', phone: '+7 (900) 100-01-01', hireDate: '2023-01-15', active: true },
    { id: 2, firstName: 'Екатерина', lastName: 'Волкова', position: 'RECEPTIONIST', email: 'e.volkova@hotel.ru', phone: '+7 (900) 100-01-02', hireDate: '2023-06-01', active: true },
    { id: 3, firstName: 'Ольга', lastName: 'Соколова', position: 'MAID', email: 'o.sokolova@hotel.ru', phone: '+7 (900) 100-01-03', hireDate: '2023-09-10', active: true },
    { id: 4, firstName: 'Дмитрий', lastName: 'Морозов', position: 'ACCOUNTANT', email: 'd.morozov@hotel.ru', phone: '+7 (900) 100-01-04', hireDate: '2022-11-01', active: true },
    { id: 5, firstName: 'Сергей', lastName: 'Васильев', position: 'ADMIN', email: 'admin@hotel.ru', phone: '+7 (900) 100-01-05', hireDate: '2022-01-10', active: true }
  ],
  tariffs: [
    { id: 1, name: 'Стандарт Базовый', roomType: 'STANDARD', pricePerNight: 3500.00, seasonStart: null, seasonEnd: null, active: true },
    { id: 2, name: 'Улучшенный Осенний', roomType: 'SUPERIOR', pricePerNight: 5000.00, seasonStart: '2026-09-01', seasonEnd: '2026-11-30', active: true },
    { id: 3, name: 'Делюкс Круглогодичный', roomType: 'DELUXE', pricePerNight: 7500.00, seasonStart: null, seasonEnd: null, active: true },
    { id: 4, name: 'Люкс Праздничный', roomType: 'SUITE', pricePerNight: 14000.00, seasonStart: '2026-12-25', seasonEnd: '2027-01-10', active: true }
  ],
  payments: [
    { id: 1, bookingId: 1, amount: 35000.00, method: 'CARD', paidAt: '2026-11-01 14:10', description: 'Полная оплата картой' },
    { id: 2, bookingId: 2, amount: 10000.00, method: 'TRANSFER', paidAt: '2026-11-02 16:00', description: 'Предоплата по счету' },
    { id: 3, bookingId: 3, amount: 17500.00, method: 'CASH', paidAt: '2026-10-25 11:30', description: 'Оплата наличными' }
  ]
};

// Справочники наименований
const LABELS = {
  types: {
    STANDARD: 'Стандарт',
    SUPERIOR: 'Супериор',
    DELUXE: 'Делюкс',
    SUITE: 'Люкс',
    PRESIDENTIAL: 'Президентский'
  },
  roomStatuses: {
    AVAILABLE: 'Свободен',
    OCCUPIED: 'Занят',
    BOOKED: 'Бронь',
    CLEANING: 'На уборке',
    OUT_OF_ORDER: 'Ремонт'
  },
  bookingStatuses: {
    PENDING: 'Ожидает',
    CONFIRMED: 'Подтверждено',
    CHECKED_IN: 'Заселен',
    CHECKED_OUT: 'Выселен',
    CANCELLED: 'Аннулировано'
  },
  positions: {
    MANAGER: 'Менеджер по бронированию',
    RECEPTIONIST: 'Портье (Ресепшн)',
    MAID: 'Горничная',
    ACCOUNTANT: 'Главный бухгалтер',
    ADMIN: 'Администратор системы'
  },
  methods: {
    CASH: 'Наличный расчет',
    CARD: 'Банковская карта',
    TRANSFER: 'Безналичный перевод'
  }
};

// Форматирование суммы в рубли
function formatRub(val) {
  return `${(Number(val) || 0).toLocaleString('ru-RU')} ₽`;
}

// Проверка соединения с Spring Boot бэкендом
async function checkBackendConnection() {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2000);
    const res = await fetch(`${API_BASE}/rooms`, { signal: ctrl.signal });
    clearTimeout(timer);
    if (res.ok) {
      isApiOnline = true;
      syncServerStatus(true);
      return true;
    }
  } catch (e) {
    // Сервер не запущен
  }
  isApiOnline = false;
  syncServerStatus(false);
  return false;
}

function syncServerStatus(online) {
  const txt = document.getElementById('server-status-label');
  if (txt) {
    if (online) {
      txt.className = 'badge badge-AVAILABLE';
      txt.innerText = 'Сервер Spring Boot подключен (8080)';
    } else {
      txt.className = 'badge badge-BOOKED';
      txt.innerText = 'Демо-режим (оффлайн)';
    }
  }
}

// Запросы к REST API с переключением на локальное хранилище
async function api(endpoint, options = {}) {
  if (isApiOnline) {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Ошибка сервера (${res.status})`);
      }
      if (res.status === 204) return null;
      return await res.json();
    } catch (err) {
      console.warn('API error, переключаемся в оффлайн-режим:', err.message);
      isApiOnline = false;
      syncServerStatus(false);
      notify('Сервер недоступен, работаем в демо-режиме', 'err');
    }
  }
  return mockApi(endpoint, options);
}

// Реактивный локальный бэкенд для автономной работы
function mockApi(endpoint, options = {}) {
  const method = options.method || 'GET';
  const data = options.body ? JSON.parse(options.body) : null;

  // 1. Номера
  if (endpoint.startsWith('/rooms')) {
    if (endpoint === '/rooms' && method === 'GET') return [...store.rooms];
    if (endpoint === '/rooms' && method === 'POST') {
      const item = { id: Date.now(), status: data.status || 'AVAILABLE', ...data };
      store.rooms.push(item);
      return item;
    }
    const match = endpoint.match(/\/rooms\/(\d+)/);
    if (match) {
      const id = parseInt(match[1]);
      const room = store.rooms.find(r => r.id === id);
      if (endpoint.endsWith('/status') && method === 'PATCH') {
        if (room) room.status = data.status;
        return room;
      }
      if (method === 'DELETE') {
        const hasBooking = store.bookings.some(b => b.roomId === id && b.status !== 'CANCELLED');
        if (hasBooking) {
          throw new Error(`Нельзя удалить номер, к нему привязаны бронирования`);
        }
        store.rooms = store.rooms.filter(r => r.id !== id);
        return null;
      }
      return room;
    }
  }

  // 2. Бронирования
  if (endpoint.startsWith('/bookings')) {
    if (endpoint.startsWith('/bookings/availability')) {
      return store.rooms.filter(r => r.status === 'AVAILABLE');
    }
    if (endpoint === '/bookings' && method === 'GET') {
      return store.bookings.map(b => ({
        ...b,
        room: store.rooms.find(r => r.id === b.roomId),
        guest: store.guests.find(g => g.id === b.guestId)
      }));
    }
    if (endpoint === '/bookings' && method === 'POST') {
      const room = store.rooms.find(r => r.id === parseInt(data.roomId));
      const newBook = {
        id: Date.now(),
        roomId: parseInt(data.roomId),
        guestId: parseInt(data.guestId),
        checkInDate: data.checkInDate,
        checkOutDate: data.checkOutDate,
        status: 'CONFIRMED',
        totalPrice: room ? room.pricePerNight * 5 : 17500,
        guestCount: data.guestCount || 1,
        createdAt: new Date().toISOString()
      };
      store.bookings.push(newBook);
      if (room) room.status = 'BOOKED';
      return newBook;
    }
    const match = endpoint.match(/\/bookings\/(\d+)/);
    if (match) {
      const id = parseInt(match[1]);
      const book = store.bookings.find(b => b.id === id);
      if (method === 'DELETE') {
        if (book) book.status = 'CANCELLED';
        const r = store.rooms.find(x => x.id === book.roomId);
        if (r) r.status = 'AVAILABLE';
        return book;
      }
      return book;
    }
  }

  // 3. Гости
  if (endpoint.startsWith('/guests')) {
    if (endpoint === '/guests' && method === 'GET') return [...store.guests];
    if (endpoint === '/guests' && method === 'POST') {
      const g = { id: Date.now(), ...data, checkedIn: false };
      store.guests.push(g);
      return g;
    }
    const match = endpoint.match(/\/guests\/(\d+)/);
    if (match) {
      const id = parseInt(match[1]);
      const guest = store.guests.find(g => g.id === id);
      if (endpoint.endsWith('/checkin') && method === 'POST') {
        if (guest) {
          guest.checkedIn = true;
          guest.checkInDate = new Date().toISOString().split('T')[0];
          const b = store.bookings.find(x => x.guestId === id && x.status !== 'CANCELLED');
          if (b) {
            b.status = 'CHECKED_IN';
            const r = store.rooms.find(x => x.id === b.roomId);
            if (r) r.status = 'OCCUPIED';
          }
        }
        return guest;
      }
      if (endpoint.endsWith('/checkout') && method === 'POST') {
        if (guest) {
          guest.checkedIn = false;
          guest.checkOutDate = new Date().toISOString().split('T')[0];
          const b = store.bookings.find(x => x.guestId === id && x.status === 'CHECKED_IN');
          if (b) {
            b.status = 'CHECKED_OUT';
            const r = store.rooms.find(x => x.id === b.roomId);
            if (r) r.status = 'CLEANING';
          }
        }
        return guest;
      }
      return guest;
    }
  }

  // 4. Персонал
  if (endpoint.startsWith('/staff')) {
    if (endpoint === '/staff' && method === 'GET') return [...store.staff];
    if (endpoint === '/staff' && method === 'POST') {
      const s = { id: Date.now(), ...data, active: true };
      store.staff.push(s);
      return s;
    }
    const match = endpoint.match(/\/staff\/(\d+)/);
    if (match) {
      const id = parseInt(match[1]);
      const member = store.staff.find(s => s.id === id);
      if (endpoint.endsWith('/schedule')) {
        return {
          staffId: id,
          fullName: member ? `${member.firstName} ${member.lastName}` : 'Сотрудник',
          position: member ? member.position : 'RECEPTIONIST',
          shiftHours: '08:00 — 20:00',
          workSchedule: '2/2 (Дневная смена)',
          assignedFloor: '1-й и 2-й этажи',
          status: 'На смене'
        };
      }
      if (method === 'DELETE') {
        store.staff = store.staff.filter(s => s.id !== id);
        return null;
      }
      return member;
    }
  }

  // 5. Тарифы
  if (endpoint.startsWith('/tariffs')) {
    if (endpoint === '/tariffs' && method === 'GET') return [...store.tariffs];
  }

  // 6. Платежи
  if (endpoint.startsWith('/payments')) {
    if (endpoint === '/payments' && method === 'GET') return [...store.payments];
    if (endpoint === '/payments' && method === 'POST') {
      const p = {
        id: Date.now(),
        bookingId: parseInt(data.bookingId),
        amount: parseFloat(data.amount),
        method: data.method,
        paidAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        description: data.description || 'Оплата'
      };
      store.payments.push(p);
      const b = store.bookings.find(x => x.id === p.bookingId);
      if (b && b.status === 'PENDING') b.status = 'CONFIRMED';
      return p;
    }
  }

  // 7. Счета (Invoice)
  if (endpoint.startsWith('/invoices/')) {
    const bookId = parseInt(endpoint.split('/')[2]);
    const b = store.bookings.find(x => x.id === bookId) || store.bookings[0];
    const r = store.rooms.find(x => x.id === b.roomId) || store.rooms[0];
    const g = store.guests.find(x => x.id === b.guestId) || store.guests[0];
    const p = store.payments.find(x => x.bookingId === b.id);
    const paid = p ? p.amount : b.totalPrice;

    return {
      invoiceNumber: `INV-${String(b.id).padStart(6, '0')}`,
      issueDate: new Date().toISOString().split('T')[0],
      bookingId: b.id,
      guestFullName: `${g.firstName} ${g.lastName}`,
      guestPassport: g.passportNumber,
      guestPhone: g.phone,
      roomNumber: r.roomNumber,
      roomType: r.type,
      pricePerNight: r.pricePerNight,
      checkInDate: b.checkInDate,
      checkOutDate: b.checkOutDate,
      numberOfNights: 7,
      totalAmount: b.totalPrice,
      paidAmount: paid,
      balanceDue: Math.max(0, b.totalPrice - paid),
      paymentStatus: b.totalPrice <= paid ? 'ОПЛАЧЕНО' : 'К ОПЛАТЕ'
    };
  }

  // 8. Отчеты
  if (endpoint.startsWith('/reports/')) {
    if (endpoint === '/reports/occupancy') {
      const total = store.rooms.length;
      const occ = store.rooms.filter(r => r.status === 'OCCUPIED').length;
      const rate = total > 0 ? Math.round((occ / total) * 100) : 0;
      return {
        totalRooms: total,
        occupiedRooms: occ,
        occupancyRate: rate,
        occupancyRatePercentage: rate,
        availableRooms: store.rooms.filter(r => r.status === 'AVAILABLE').length,
        cleaningRooms: store.rooms.filter(r => r.status === 'CLEANING').length,
        bookedRooms: store.rooms.filter(r => r.status === 'BOOKED').length,
        outOfOrderRooms: store.rooms.filter(r => r.status === 'OUT_OF_ORDER').length
      };
    }
    if (endpoint === '/reports/revenue') {
      const total = store.payments.reduce((acc, p) => acc + p.amount, 0);
      const byMethod = {
        CARD: store.payments.filter(p => p.method === 'CARD').reduce((a, b) => a + b.amount, 0),
        CASH: store.payments.filter(p => p.method === 'CASH').reduce((a, b) => a + b.amount, 0),
        TRANSFER: store.payments.filter(p => p.method === 'TRANSFER').reduce((a, b) => a + b.amount, 0)
      };
      return {
        totalRevenue: total,
        totalPaymentsCount: store.payments.length,
        totalTransactions: store.payments.length,
        revenueByPaymentMethod: byMethod,
        revenueByMethod: byMethod
      };
    }
    if (endpoint === '/reports/staff-performance') {
      return {
        staffStats: [
          { name: 'Екатерина Волкова', position: 'RECEPTIONIST', shift: 'Дневная смена', rating: 4.9, tasksCompleted: 24 },
          { name: 'Ольга Соколова', position: 'MAID', shift: 'Утренняя смена', rating: 4.8, tasksCompleted: 42 },
          { name: 'Михаил Орлов', position: 'MANAGER', shift: 'Стандарт', rating: 5.0, tasksCompleted: 18 }
        ]
      };
    }
  }

  return null;
}

// ==========================================================================
// Навигация по вкладкам интерфейса
// ==========================================================================
function setupNavigation() {
  const links = document.querySelectorAll('.nav-link');
  links.forEach(link => {
    link.addEventListener('click', () => {
      const view = link.getAttribute('data-view');
      navigateTo(view);
    });
  });
}

// Обновление бейджей с количеством в шапке навигации
function updateNavCounts(counts = {}) {
  if (counts.rooms !== undefined && counts.rooms !== null) {
    const el = document.getElementById('nav-rooms-badge');
    if (el) el.innerText = `(${counts.rooms})`;
  }
  if (counts.bookings !== undefined && counts.bookings !== null) {
    const el = document.getElementById('nav-bookings-badge');
    if (el) el.innerText = `(${counts.bookings})`;
  }
  if (counts.guests !== undefined && counts.guests !== null) {
    const el = document.getElementById('nav-guests-badge');
    if (el) el.innerText = `(${counts.guests})`;
  }
  if (counts.staff !== undefined && counts.staff !== null) {
    const el = document.getElementById('nav-staff-badge');
    if (el) el.innerText = `(${counts.staff})`;
  }
}

function navigateTo(viewName) {
  document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.screen-view').forEach(el => el.classList.remove('active'));

  const nav = document.querySelector(`.nav-link[data-view="${viewName}"]`);
  const screen = document.getElementById(`view-${viewName}`);

  if (nav) nav.classList.add('active');
  if (screen) screen.classList.add('active');

  const titles = {
    dashboard: { tag: 'Сводка отеля', main: 'Дашборд' },
    rooms: { tag: 'Номерной фонд', main: 'Управление номерами' },
    bookings: { tag: 'Бронирования', main: 'Журнал бронирований' },
    guests: { tag: 'Служба приема', main: 'База постояльцев' },
    staff: { tag: 'Персонал', main: 'Сотрудники и смены' },
    tariffs: { tag: 'Финансы', main: 'Тарифы и касса' },
    reports: { tag: 'Аналитика', main: 'Отчеты и показатели' }
  };

  const meta = titles[viewName] || { tag: 'Отель', main: 'Управление' };
  const eyebrow = document.getElementById('header-eyebrow');
  const title = document.getElementById('header-title');
  if (eyebrow) eyebrow.innerText = meta.tag;
  if (title) title.innerText = meta.main;

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

// ==========================================================================
// 1. ДАШБОРД (Главная страница)
// ==========================================================================
async function renderDashboard() {
  const [rooms, guests, rev] = await Promise.all([
    api('/rooms'),
    api('/guests'),
    api('/reports/revenue')
  ]);

  if (!rooms) return;

  const total = rooms.length;
  const occupied = rooms.filter(r => r.status === 'OCCUPIED').length;
  const available = rooms.filter(r => r.status === 'AVAILABLE').length;
  const cleaning = rooms.filter(r => r.status === 'CLEANING').length;
  const rate = total > 0 ? Math.round((occupied / total) * 100) : 0;

  document.getElementById('dash-kpi-rate').innerText = `${rate}%`;
  document.getElementById('dash-kpi-avail').innerText = available;
  document.getElementById('dash-kpi-clean').innerText = cleaning;
  document.getElementById('dash-kpi-rev').innerText = formatRub(rev?.totalRevenue || 0);

  updateNavCounts({
    rooms: rooms.length,
    guests: guests ? guests.length : null
  });

  // Шахматка номерного фонда
  const matrix = document.getElementById('dash-matrix');
  if (matrix) {
    matrix.innerHTML = rooms.map(r => `
      <div class="room-card" onclick="openRoomStatusModal(${r.id}, '${r.roomNumber}', '${r.status}')">
        <div style="display:flex; justify-content:space-between; align-items:center">
          <span class="num">№ ${r.roomNumber}</span>
          <span style="font-size:11px; color:var(--text-muted); background:var(--bg-subtle); padding:1px 5px; border-radius:3px">${r.floor} эт.</span>
        </div>
        <div class="type">${LABELS.types[r.type] || r.type}</div>
        <div class="price">${formatRub(r.pricePerNight)}</div>
        <div style="margin-top:4px">
          <span class="badge badge-${r.status}">${LABELS.roomStatuses[r.status] || r.status}</span>
        </div>
      </div>
    `).join('');
  }

  // Текущие постояльцы отеля
  const arrivals = document.getElementById('dash-arrivals');
  if (arrivals && guests) {
    const inHotel = guests.filter(g => (g.checkedIn !== undefined ? g.checkedIn : g.isCheckedIn));
    arrivals.innerHTML = inHotel.length ? inHotel.map(g => `
      <tr>
        <td><strong>${g.firstName} ${g.lastName}</strong></td>
        <td>${g.phone}</td>
        <td>${g.passportNumber}</td>
        <td>
          <span class="badge badge-AVAILABLE">В отеле</span>
        </td>
        <td>
          <button class="btn btn-sm btn-secondary" onclick="checkOutGuest(${g.id})">
            Выселить
          </button>
        </td>
      </tr>
    `).join('') : '<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:20px">В отеле сейчас нет проживающих гостей</td></tr>';
  }
}

// ==========================================================================
// 2. НОМЕРА
// ==========================================================================
let roomCatalog = [];

async function renderRooms() {
  const rooms = await api('/rooms');
  roomCatalog = rooms || [];
  updateNavCounts({ rooms: roomCatalog.length });
  displayRoomsTable(roomCatalog);
}

function displayRoomsTable(rooms) {
  const tbody = document.getElementById('rooms-tbody');
  if (!tbody) return;

  if (!rooms || rooms.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:20px">Номера не найдены</td></tr>';
    return;
  }

  tbody.innerHTML = rooms.map(r => `
    <tr>
      <td><strong>№ ${r.roomNumber}</strong></td>
      <td>${LABELS.types[r.type] || r.type}</td>
      <td>${r.floor} этаж</td>
      <td>${r.maxGuests} чел.</td>
      <td><strong style="color:var(--primary)">${formatRub(r.pricePerNight)}</strong></td>
      <td>
        <span class="badge badge-${r.status}">${LABELS.roomStatuses[r.status] || r.status}</span>
      </td>
      <td>
        <div class="table-actions">
          <button class="btn btn-sm btn-secondary" onclick="openRoomStatusModal(${r.id}, '${r.roomNumber}', '${r.status}')">
            Сменить статус
          </button>
          <button class="btn btn-sm btn-danger" onclick="removeRoom(${r.id})">
            Удалить
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterRoomsList() {
  const q = document.getElementById('room-search-input').value.toLowerCase();
  const st = document.getElementById('room-status-filter').value;

  const res = roomCatalog.filter(r => {
    const mQ = r.roomNumber.toLowerCase().includes(q) || (r.description && r.description.toLowerCase().includes(q));
    const mS = !st || r.status === st;
    return mQ && mS;
  });
  displayRoomsTable(res);
}

// ==========================================================================
// 3. БРОНИРОВАНИЯ
// ==========================================================================
async function renderBookings() {
  const [books, rooms, guests] = await Promise.all([
    api('/bookings'),
    api('/rooms'),
    api('/guests')
  ]);

  if (!books) return;

  updateNavCounts({ bookings: books.length });

  const tbody = document.getElementById('bookings-tbody');
  if (tbody) {
    if (books.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:20px">Бронирований пока нет</td></tr>';
    } else {
      tbody.innerHTML = books.map(b => {
        const room = b.room || (rooms ? rooms.find(r => r.id === (b.roomId || b.room_id)) : null);
        const guest = b.guest || (guests ? guests.find(g => g.id === (b.guestId || b.guest_id)) : null);

        return `
          <tr>
            <td>#${b.id}</td>
            <td>
              <strong>${guest ? `${guest.firstName} ${guest.lastName}` : 'Гость #' + (b.guestId || b.id)}</strong>
              <div style="font-size:11px; color:var(--text-muted)">${guest?.phone || ''}</div>
            </td>
            <td><strong>№ ${room ? room.roomNumber : (b.roomId || '-')}</strong> (${room ? LABELS.types[room.type] : ''})</td>
            <td>${b.checkInDate} &rarr; ${b.checkOutDate}</td>
            <td><strong style="color:var(--primary)">${formatRub(b.totalPrice)}</strong></td>
            <td>
              <span class="badge badge-${b.status}">${LABELS.bookingStatuses[b.status] || b.status}</span>
            </td>
            <td>
              <div class="table-actions">
                <button class="btn btn-sm btn-secondary" onclick="openInvoiceSheet(${b.id})">
                  Счёт
                </button>
                ${b.status !== 'CANCELLED' ? `
                  <button class="btn btn-sm btn-danger" onclick="cancelBooking(${b.id})">
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

  // Заполнение списков в модальном окне бронирования
  populateBookingSelects(rooms, guests);
}

// Заполнение выпадающих списков комнат и гостей
async function populateBookingSelects(roomsList = null, guestsList = null) {
  try {
    const rooms = roomsList || await api('/rooms');
    const guests = guestsList || await api('/guests');

    const rSel = document.getElementById('newbook-room');
    const gSel = document.getElementById('newbook-guest');

    if (rSel && rooms) {
      rSel.innerHTML = rooms.map(r => `
        <option value="${r.id}">№ ${r.roomNumber} — ${LABELS.types[r.type] || r.type} (${formatRub(r.pricePerNight)}/сутки) [${LABELS.roomStatuses[r.status] || r.status}]</option>
      `).join('');
    }

    if (gSel && guests) {
      gSel.innerHTML = guests.map(g => `
        <option value="${g.id}">${g.firstName} ${g.lastName} (${g.phone})</option>
      `).join('');
    }
  } catch (e) {
    console.warn('Ошибка заполнения списков бронирования:', e);
  }
}

// ==========================================================================
// 4. ГОСТИ
// ==========================================================================
async function renderGuests() {
  const guests = await api('/guests');
  const tbody = document.getElementById('guests-tbody');
  if (!tbody || !guests) return;

  updateNavCounts({ guests: guests.length });

  if (guests.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:20px">Гости не зарегистрированы</td></tr>';
    return;
  }

  tbody.innerHTML = guests.map(g => {
    const isInside = g.checkedIn !== undefined ? g.checkedIn : g.isCheckedIn;
    return `
      <tr>
        <td><strong>${g.firstName} ${g.lastName}</strong></td>
        <td>${g.passportNumber}</td>
        <td>${g.phone}</td>
        <td>${g.email}</td>
        <td>${g.nationality || 'Россия'}</td>
        <td>
          <span class="badge ${isInside ? 'badge-AVAILABLE' : 'badge-OUT_OF_ORDER'}">
            ${isInside ? 'В отеле' : 'Не заселен'}
          </span>
        </td>
        <td>
          ${!isInside ? `
            <button class="btn btn-sm btn-primary" onclick="checkInGuest(${g.id})">
              Заселить
            </button>
          ` : `
            <button class="btn btn-sm btn-secondary" onclick="checkOutGuest(${g.id})">
              Выселить
            </button>
          `}
        </td>
      </tr>
    `;
  }).join('');
}

// ==========================================================================
// 5. ПЕРСОНАЛ
// ==========================================================================
async function renderStaff() {
  const staff = await api('/staff');
  const grid = document.getElementById('staff-grid');
  if (!grid || !staff) return;

  updateNavCounts({ staff: staff.length });

  if (staff.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:var(--text-muted); padding:20px">Штат сотрудников пуст</div>';
    return;
  }

  grid.innerHTML = staff.map(s => `
    <div class="staff-card">
      <div class="staff-header" style="display:flex; justify-content:space-between; align-items:flex-start">
        <div>
          <div class="staff-name">${s.firstName} ${s.lastName}</div>
          <div class="staff-pos">${LABELS.positions[s.position] || s.position}</div>
        </div>
        <span class="badge ${s.active ? 'badge-AVAILABLE' : 'badge-OUT_OF_ORDER'}">
          ${s.active ? 'В штате' : 'Отпуск'}
        </span>
      </div>
      <div class="staff-details">
        <div>Телефон: <span style="color:var(--text-main)">${s.phone}</span></div>
        <div>Email: <span style="color:var(--text-main)">${s.email}</span></div>
        <div>Принят: <span>${s.hireDate || '2023-01-15'}</span></div>
      </div>
      <div class="staff-footer">
        <button class="btn btn-sm btn-secondary" style="flex:1" onclick="openStaffSchedule(${s.id})">
          График смен
        </button>
        <button class="btn btn-sm btn-danger" onclick="removeStaff(${s.id})">
          Удалить
        </button>
      </div>
    </div>
  `).join('');
}

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
        <td><strong>${t.name}</strong></td>
        <td>${LABELS.types[t.roomType] || t.roomType}</td>
        <td><strong style="color:var(--primary)">${formatRub(t.pricePerNight)}</strong></td>
        <td>${t.seasonStart ? `${t.seasonStart} &rarr; ${t.seasonEnd}` : 'Круглый год'}</td>
        <td>
          <span class="badge ${t.active ? 'badge-AVAILABLE' : 'badge-OUT_OF_ORDER'}">
            ${t.active ? 'Активен' : 'Архив'}
          </span>
        </td>
      </tr>
    `).join('');
  }

  const pBody = document.getElementById('payments-tbody');
  if (pBody) {
    if (!payments || payments.length === 0) {
      pBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:20px">Платежей пока не зарегистрировано</td></tr>';
    } else {
      pBody.innerHTML = payments.map(p => `
        <tr>
          <td>#${p.id}</td>
          <td>Бронь #${p.bookingId || p.booking?.id || '-'}</td>
          <td><strong style="color:var(--success)">${formatRub(p.amount)}</strong></td>
          <td>${LABELS.methods[p.method] || p.method}</td>
          <td>${p.paidAt ? p.paidAt.substring(0, 16) : '-'}</td>
          <td>${p.description || 'Оплата'}</td>
        </tr>
      `).join('');
    }
  }
}

// Открытие окна регистрации платежа
async function openPaymentModal() {
  const books = await api('/bookings');
  const sel = document.getElementById('pay-booking-sel');
  if (sel && books) {
    const activeBooks = books.filter(b => b.status !== 'CANCELLED');
    if (activeBooks.length === 0) {
      notify('Нет активных бронирований для проведения оплаты', 'err');
      return;
    }
    sel.innerHTML = activeBooks.map(b => {
      const gName = b.guest ? `${b.guest.firstName} ${b.guest.lastName}` : `Гость #${b.guestId}`;
      const rNum = b.room ? b.room.roomNumber : b.roomId;
      return `<option value="${b.id}">Бронь #${b.id} — ${gName} (№ ${rNum}, сумма: ${formatRub(b.totalPrice)})</option>`;
    }).join('');
  }
  openModal('modal-add-payment');
}

// Проведение платежа
async function submitPayment(e) {
  e.preventDefault();
  const payload = {
    bookingId: parseInt(document.getElementById('pay-booking-sel').value),
    amount: parseFloat(document.getElementById('pay-amount').value),
    method: document.getElementById('pay-method').value,
    description: document.getElementById('pay-desc').value.trim()
  };

  try {
    await api('/payments', { method: 'POST', body: JSON.stringify(payload) });
    notify('Платеж успешно зарегистрирован');
    closeModal('modal-add-payment');
    renderTariffs();
    renderDashboard();
    renderReports();
  } catch (err) {
    notify(err.message, 'err');
  }
}

// ==========================================================================
// 7. ОТЧЕТЫ И АНАЛИТИКА
// ==========================================================================
async function renderReports() {
  const [occ, rev, staffRep] = await Promise.all([
    api('/reports/occupancy'),
    api('/reports/revenue'),
    api('/reports/staff-performance')
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
    if (totalEl) totalEl.innerText = `Всего ${totalRooms} номеров`;

    const breakdownEl = document.getElementById('rep-occ-breakdown');
    if (breakdownEl) {
      breakdownEl.innerText = `Занято: ${occupied} • Свободно: ${available} • Бронь: ${booked} • Уборка: ${cleaning} • Ремонт: ${repair}`;
    }
  }

  if (rev) {
    const totalRev = Number(rev.totalRevenue) || 0;
    const txCount = rev.totalPaymentsCount !== undefined 
      ? rev.totalPaymentsCount 
      : (rev.totalTransactions !== undefined ? rev.totalTransactions : 0);
    const byMethod = rev.revenueByPaymentMethod || rev.revenueByMethod || {};

    const cardSum = Number(byMethod.CARD || byMethod.card || 0);
    const cashSum = Number(byMethod.CASH || byMethod.cash || 0);
    const transferSum = Number(byMethod.TRANSFER || byMethod.transfer || 0);

    const revTotalEl = document.getElementById('rep-rev-total');
    if (revTotalEl) revTotalEl.innerText = formatRub(totalRev);

    const txEl = document.getElementById('rep-rev-tx');
    if (txEl) txEl.innerText = `${txCount} платежей`;

    const cardEl = document.getElementById('rep-card-sum');
    if (cardEl) cardEl.innerText = formatRub(cardSum);

    const cashEl = document.getElementById('rep-cash-sum');
    if (cashEl) cashEl.innerText = formatRub(cashSum);

    const transferEl = document.getElementById('rep-transfer-sum');
    if (transferEl) transferEl.innerText = formatRub(transferSum);
  }

  if (staffRep && staffRep.staffStats) {
    const list = document.getElementById('rep-staff-kpi');
    if (list) {
      list.innerHTML = staffRep.staffStats.map(s => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid var(--border-color)">
          <div>
            <div style="font-weight:600; color:var(--text-main)">${s.name}</div>
            <div style="font-size:11.5px; color:var(--text-muted)">${LABELS.positions[s.position] || s.position} • ${s.shift}</div>
          </div>
          <div style="text-align:right">
            <div style="color:var(--warning); font-weight:700">Рейтинг: ${s.rating}</div>
            <div style="font-size:11px; color:var(--text-dim)">Смен: ${s.tasksCompleted}</div>
          </div>
        </div>
      `).join('');
    }
  }
}

// ==========================================================================
// Управление модальными окнами
// ==========================================================================
function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add('active');
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove('active');
}

// Смена статуса номера
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

  try {
    await api(`/rooms/${selectedRoomId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: st })
    });
    notify('Статус номера успешно обновлен');
    closeModal('modal-status');
    renderRooms();
    renderDashboard();
    renderReports();
  } catch (err) {
    notify(err.message, 'err');
  }
}

// Создание нового номера
async function submitRoom(e) {
  e.preventDefault();
  const room = {
    roomNumber: document.getElementById('add-room-num').value.trim(),
    type: document.getElementById('add-room-type').value,
    status: document.getElementById('add-room-status') ? document.getElementById('add-room-status').value : 'AVAILABLE',
    floor: parseInt(document.getElementById('add-room-floor').value),
    maxGuests: parseInt(document.getElementById('add-room-guests').value),
    pricePerNight: parseFloat(document.getElementById('add-room-price').value),
    description: document.getElementById('add-room-desc').value.trim()
  };

  try {
    await api('/rooms', { method: 'POST', body: JSON.stringify(room) });
    notify(`Номер ${room.roomNumber} успешно добавлен`);
    closeModal('modal-add-room');
    e.target.reset();
    renderRooms();
    renderDashboard();
    populateBookingSelects();
  } catch (err) {
    notify(err.message, 'err');
  }
}

async function removeRoom(id) {
  if (!confirm('Вы действительно хотите удалить этот номер?')) return;
  try {
    await api(`/rooms/${id}`, { method: 'DELETE' });
    notify('Номер удален');
    renderRooms();
    renderDashboard();
    populateBookingSelects();
  } catch (err) {
    notify(err.message, 'err');
  }
}

// Создание бронирования
async function submitBooking(e) {
  e.preventDefault();
  const payload = {
    roomId: parseInt(document.getElementById('newbook-room').value),
    guestId: parseInt(document.getElementById('newbook-guest').value),
    checkInDate: document.getElementById('newbook-checkin').value,
    checkOutDate: document.getElementById('newbook-checkout').value,
    guestCount: parseInt(document.getElementById('newbook-count').value)
  };

  try {
    await api('/bookings', { method: 'POST', body: JSON.stringify(payload) });
    notify('Бронирование оформлено');
    closeModal('modal-add-booking');
    renderBookings();
    renderDashboard();
  } catch (err) {
    notify(err.message, 'err');
  }
}

async function cancelBooking(id) {
  if (!confirm('Отменить это бронирование?')) return;
  try {
    await api(`/bookings/${id}`, { method: 'DELETE' });
    notify('Бронирование отменено');
    renderBookings();
    renderDashboard();
  } catch (err) {
    notify(err.message, 'err');
  }
}

// Регистрация нового гостя
async function submitGuest(e) {
  e.preventDefault();
  const guest = {
    firstName: document.getElementById('guest-fn').value,
    lastName: document.getElementById('guest-ln').value,
    phone: document.getElementById('guest-ph').value,
    email: document.getElementById('guest-em').value,
    passportNumber: document.getElementById('guest-pass').value,
    nationality: document.getElementById('guest-nat').value || 'Россия'
  };

  try {
    await api('/guests', { method: 'POST', body: JSON.stringify(guest) });
    notify('Гость зарегистрирован в базе');
    closeModal('modal-add-guest');
    renderGuests();
  } catch (err) {
    notify(err.message, 'err');
  }
}

async function checkInGuest(id) {
  try {
    await api(`/guests/${id}/checkin`, { method: 'POST' });
    notify('Гость заселен в номер');
    renderGuests();
    renderDashboard();
    renderRooms();
  } catch (err) {
    notify(err.message, 'err');
  }
}

async function checkOutGuest(id) {
  try {
    await api(`/guests/${id}/checkout`, { method: 'POST' });
    notify('Гость выселен, номер передан на уборку');
    renderGuests();
    renderDashboard();
    renderRooms();
  } catch (err) {
    notify(err.message, 'err');
  }
}

// Добавление сотрудника
async function submitStaff(e) {
  e.preventDefault();
  const member = {
    firstName: document.getElementById('staff-fn').value,
    lastName: document.getElementById('staff-ln').value,
    position: document.getElementById('staff-pos').value,
    email: document.getElementById('staff-em').value,
    phone: document.getElementById('staff-ph').value,
    hireDate: document.getElementById('staff-date').value || new Date().toISOString().split('T')[0]
  };

  try {
    await api('/staff', { method: 'POST', body: JSON.stringify(member) });
    notify('Сотрудник принят в штат');
    closeModal('modal-add-staff');
    renderStaff();
  } catch (err) {
    notify(err.message, 'err');
  }
}

async function removeStaff(id) {
  if (!confirm('Исключить сотрудника из штата?')) return;
  try {
    await api(`/staff/${id}`, { method: 'DELETE' });
    notify('Сотрудник удален');
    renderStaff();
  } catch (err) {
    notify(err.message, 'err');
  }
}

// Расписание сотрудника
async function openStaffSchedule(id) {
  const sch = await api(`/staff/${id}/schedule`);
  if (!sch) return;

  document.getElementById('sch-name').innerText = sch.fullName;
  document.getElementById('sch-pos').innerText = LABELS.positions[sch.position] || sch.position;
  document.getElementById('sch-hours').innerText = sch.shiftHours;
  document.getElementById('sch-plan').innerText = sch.workSchedule;
  document.getElementById('sch-zone').innerText = sch.assignedFloor;
  document.getElementById('sch-status').innerText = sch.status;

  openModal('modal-staff-shift');
}

// Просмотр и печать счета (Invoice)
async function openInvoiceSheet(bookingId) {
  const inv = await api(`/invoices/${bookingId}`);
  if (!inv) return;

  document.getElementById('inv-code').innerText = inv.invoiceNumber;
  document.getElementById('inv-date-val').innerText = `Дата: ${inv.issueDate}`;
  document.getElementById('inv-guest-name').innerText = inv.guestFullName;
  document.getElementById('inv-guest-passport').innerText = `Паспорт: ${inv.guestPassport}`;
  document.getElementById('inv-guest-phone').innerText = `Телефон: ${inv.guestPhone}`;
  document.getElementById('inv-room-info').innerText = `№ ${inv.roomNumber} (${LABELS.types[inv.roomType] || inv.roomType})`;
  document.getElementById('inv-dates-info').innerText = `${inv.checkInDate} — ${inv.checkOutDate}`;
  document.getElementById('inv-rate-info').innerText = `${formatRub(inv.pricePerNight)}/сутки (${inv.numberOfNights} ночей)`;
  document.getElementById('inv-charge-total').innerText = formatRub(inv.totalAmount);
  document.getElementById('inv-sum-total').innerText = formatRub(inv.totalAmount);
  document.getElementById('inv-paid-sum').innerText = formatRub(inv.paidAmount);
  document.getElementById('inv-due-sum').innerText = formatRub(inv.balanceDue);
  document.getElementById('inv-status-label').innerText = inv.paymentStatus;

  openModal('modal-folio');
}

// Всплывающие уведомления
function notify(msg, type = 'ok') {
  const rack = document.getElementById('toast-rack');
  if (!rack) return;

  const t = document.createElement('div');
  t.className = `toast ${type === 'ok' ? '' : 'err'}`;
  t.innerText = msg;
  rack.appendChild(t);

  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateX(20px)';
    setTimeout(() => t.remove(), 250);
  }, 2800);
}

// Часы в шапке
function tickClock() {
  const el = document.getElementById('live-clock');
  if (el) {
    const d = new Date();
    el.innerText = d.toLocaleTimeString('ru-RU');
  }
}

// Запуск приложения
window.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  await checkBackendConnection();
  navigateTo('dashboard');
  populateBookingSelects();
  setInterval(checkBackendConnection, 15000);
});
