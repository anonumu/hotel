// ==========================================================================
// МОДУЛЬ: Точка входа приложения и глобальные слушатели событий
// ==========================================================================


window.addEventListener('error', (event) => {
  if (event && event.message) {
    triggerSamsonovStressOverlay({
      code: 'ERR_FRONTEND_RUNTIME_EXCEPTION',
      source: 'Клиентское ядро интерфейса',
      reason: event.message,
      details: 'Нештатная ошибка интерфейса перехвачена и изолирована без потери данных.'
    });
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event?.reason;
  const msg = (reason && reason.message) ? reason.message : String(reason || '');
  if (!msg || reason?.handledByApi || reason?.name === 'AbortError') return;
  triggerSamsonovStressOverlay({
    code: 'ERR_FRONTEND_PROMISE_EXCEPTION',
    source: 'Асинхронный обработчик интерфейса',
    reason: msg,
    details: 'Нештатная асинхронная ошибка перехвачена без остановки работы системы.'
  });
});

window.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  await checkBackendConnection();
  await navigateTo('dashboard');
  populateBookingSelects();
  setInterval(checkBackendConnection, 15000);

  // Интерактивные триггеры защиты от стресс-тестирования Ильей Валерьевичем
  const emblem = document.querySelector('.brand-emblem-box');
  if (emblem) {
    emblem.style.cursor = 'pointer';
    emblem.addEventListener('dblclick', () => {
      window.triggerSamsonovStressTest('OVERFLOW');
    });
  }

  // Горячая клавиша Ctrl+Shift+S для демонстрации перехвата на защите
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && (e.key === 'S' || e.key === 's' || e.key === 'Ы' || e.key === 'ы')) {
      e.preventDefault();
      window.triggerSamsonovStressTest('CLIENTS');
    }
  });
});
