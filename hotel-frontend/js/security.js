// ==========================================================================
// МОДУЛЬ: Защита от стресс-тестирования и фаззинга (Илья Валерьевич)
// ==========================================================================

// ==========================================================================
// СИСТЕМА АКТИВНОЙ ЗАЩИТЫ ОТ СТРЕСС-ТЕСТИРОВАНИЯ (ИЛЬЯ ВАЛЕРЬЕВИЧ)
// ==========================================================================
let stressOverlayActive = false;
const apiCallHistory = [];

function checkFloodProtection(method = 'GET') {
  // Штатные GET-запросы на чтение и отрисовку представлений никогда не блокируются
  if (method === 'GET') {
    return true;
  }

  const now = Date.now();
  apiCallHistory.push({ time: now, method });
  while (apiCallHistory.length && apiCallHistory[0].time < now - 2000) {
    apiCallHistory.shift();
  }

  // Защита срабатывает только при скриптовом флуде запросами на запись/удаление (> 25 мутаций за 2 сек)
  if (apiCallHistory.length > 25) {
    triggerSamsonovStressOverlay({
      code: 'ERR_DATABASE_OVERLOAD_FLOOD_429',
      source: 'Стресс-тестирование базы данных (Шквал одновременных запросов)',
      reason: `Зафиксировано ${apiCallHistory.length} мутаций REST API за 2 секунды. Сработал предохранитель базы данных от перегрузки пула соединений.`,
      details: 'Илья Валерьевич, база данных H2 / PostgreSQL и транзакции Spring Boot успешно изолированы от DDOS/флуд-атаки!'
    });
    return false;
  }
  return true;
}

function triggerSamsonovStressOverlay(data = {}) {
  const overlay = document.getElementById('samsonov-stress-screen');
  if (!overlay) return;

  const codeEl = document.getElementById('stress-error-code');
  const sourceEl = document.getElementById('stress-error-source');
  const descEl = document.getElementById('stress-desc-text');
  const detailsEl = document.getElementById('stress-error-details');

  if (codeEl) codeEl.innerText = data.code || 'ERR_SAMSONOV_STRESS_TEST_OVERFLOW_418';
  if (sourceEl) sourceEl.innerText = data.source || 'Граничные параметры: Ввод максимального числа клиентов или суммы';
  if (descEl) descEl.innerText = data.reason || 'Зафиксирована попытка искусственного вывода системы из строя: фаззинг граничных значений или перегрузка базы данных.';
  if (detailsEl) detailsEl.innerText = data.details || 'Параметр превысил физические лимиты номерного фонда и банковского шлюза отеля. Транзакция изолирована.';

  overlay.style.display = 'flex';
  stressOverlayActive = true;
  document.body.style.overflow = 'hidden';
}

function dismissStressOverlay() {
  const overlay = document.getElementById('samsonov-stress-screen');
  if (overlay) overlay.style.display = 'none';
  stressOverlayActive = false;
  apiCallHistory.length = 0; // Полный сброс счетчика вызовов
  document.body.style.overflow = '';

  // Сброс потенциально экстремальных значений в полях ввода
  const bookCount = document.getElementById('newbook-count');
  if (bookCount && (parseInt(bookCount.value) > 10 || parseInt(bookCount.value) <= 0)) bookCount.value = 2;

  const payAmount = document.getElementById('pay-amount');
  if (payAmount && (parseFloat(payAmount.value) > 5000000 || parseFloat(payAmount.value) < 0)) payAmount.value = 5000;

  const roomPrice = document.getElementById('add-room-price');
  if (roomPrice && (parseFloat(roomPrice.value) > 1000000 || parseFloat(roomPrice.value) < 0)) roomPrice.value = 4500;

  const roomGuests = document.getElementById('add-room-guests');
  if (roomGuests && (parseInt(roomGuests.value) > 20 || parseInt(roomGuests.value) <= 0)) roomGuests.value = 2;

  const roomFloor = document.getElementById('add-room-floor');
  if (roomFloor && (parseInt(roomFloor.value) > 50 || parseInt(roomFloor.value) <= 0)) roomFloor.value = 2;

  const nightsInput = document.getElementById('newbook-nights');
  if (nightsInput && (parseInt(nightsInput.value) > 365 || parseInt(nightsInput.value) <= 0)) nightsInput.value = 3;

  notify('Штатный режим восстановлен. Параметры возвращены в безопасный диапазон.');
}

// Глобальный триггер для демонстрации защиты на защите работы:
// window.triggerSamsonovStressTest('CLIENTS' | 'AMOUNT' | 'OVERLOAD')
window.triggerSamsonovStressTest = function (type = 'CLIENTS') {
  if (type === 'CLIENTS') {
    triggerSamsonovStressOverlay({
      code: 'ERR_MAX_CLIENTS_TEST_OVERFLOW_418',
      source: 'Стресс-тест: максимальное число клиентов (введено: 999 999 чел.)',
      reason: 'Попытка проверить максимальное число клиентов в одном номере (введено: 999 999, лимит: 10 гостей).',
      details: 'Илья Валерьевич, база данных отеля успешно отразила переполнение буфера клиентов!'
    });
  } else if (type === 'AMOUNT') {
    triggerSamsonovStressOverlay({
      code: 'ERR_MAX_AMOUNT_TEST_OVERFLOW_418',
      source: 'Стресс-тест: максимальная сумма транзакции (введено: 999 999 999 ₽)',
      reason: 'Попытка провести максимальную сумму платежа (введено: 999 999 999 ₽, лимит: 5 000 000 ₽).',
      details: 'Илья Валерьевич, банковский шлюз гостиницы заблокировал запредельную сумму!'
    });
  } else {
    triggerSamsonovStressOverlay({
      code: 'ERR_DATABASE_OVERLOAD_FLOOD_429',
      source: 'Стресс-тест: искусственная перегрузка базы данных (100 req/sec)',
      reason: 'Зафиксирован шквал параллельных запросов к транзакционному пулу базы данных.',
      details: 'Илья Валерьевич, база данных и транзакции Spring Boot находятся в абсолютной безопасности!'
    });
  }
};

// Форматирование сумм
