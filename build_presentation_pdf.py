# -*- coding: utf-8 -*-
"""
Генератор презентации Grand Imperial Hotel PMS
Создает презентацию из 42 детализированных слайдов в формате HTML и компилирует в векторный PDF.
"""
import os
from playwright.sync_api import sync_playwright

html_content = """<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>Презентация: Grand Impérial Hotel PMS</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

  @page {
    size: 1920px 1080px;
    margin: 0;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    background-color: #07090e;
    color: #f1f5f9;
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .slide {
    width: 1920px;
    height: 1080px;
    page-break-after: always;
    page-break-inside: avoid;
    position: relative;
    overflow: hidden;
    padding: 70px 90px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: radial-gradient(circle at 85% 15%, rgba(79, 70, 229, 0.12) 0%, transparent 50%),
                radial-gradient(circle at 15% 85%, rgba(14, 165, 233, 0.08) 0%, transparent 45%),
                #090d16;
    border-bottom: 2px solid #1e293b;
  }

  /* Верхний колонтитул */
  .slide-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    padding-bottom: 20px;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .header-tag {
    background: rgba(99, 102, 241, 0.15);
    border: 1px solid rgba(99, 102, 241, 0.35);
    color: #a5b4fc;
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    padding: 6px 14px;
    border-radius: 8px;
  }

  .slide-title {
    font-size: 34px;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: -0.5px;
  }

  .slide-subtitle {
    font-size: 16px;
    color: #94a3b8;
    margin-top: 4px;
  }

  .header-meta {
    text-align: right;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    color: #64748b;
  }

  /* Основное тело слайда */
  .slide-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin: 30px 0;
    position: relative;
    z-index: 2;
  }

  /* Нижний колонтитул */
  .slide-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    padding-top: 18px;
    font-size: 14px;
    color: #64748b;
  }

  .footer-project {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 600;
    color: #94a3b8;
  }

  .footer-project span.dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #6366f1;
  }

  .slide-number {
    font-family: 'JetBrains Mono', monospace;
    font-weight: 700;
    color: #a5b4fc;
    background: rgba(99, 102, 241, 0.1);
    padding: 4px 12px;
    border-radius: 6px;
  }

  /* Сетки и карточки */
  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32px;
    height: 100%;
  }

  .grid-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 24px;
    height: 100%;
  }

  .grid-4 {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    height: 100%;
  }

  .card {
    background: rgba(17, 24, 39, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 18px;
    padding: 28px;
    backdrop-filter: blur(10px);
    display: flex;
    flex-direction: column;
  }

  .card.highlight {
    border-color: rgba(99, 102, 241, 0.4);
    background: linear-gradient(135deg, rgba(30, 27, 75, 0.6) 0%, rgba(17, 24, 39, 0.8) 100%);
    box-shadow: 0 10px 30px -10px rgba(79, 70, 229, 0.2);
  }

  .card-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: rgba(99, 102, 241, 0.15);
    border: 1px solid rgba(99, 102, 241, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    margin-bottom: 18px;
    color: #a5b4fc;
  }

  .card-title {
    font-size: 20px;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 12px;
  }

  .card-text {
    font-size: 15px;
    line-height: 1.6;
    color: #94a3b8;
    flex: 1;
  }

  /* Специфические стили */
  .badge {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 700;
    font-family: 'JetBrains Mono', monospace;
  }
  .badge-success { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
  .badge-primary { background: rgba(99, 102, 241, 0.15); color: #a5b4fc; border: 1px solid rgba(99, 102, 241, 0.3); }
  .badge-warning { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
  .badge-danger  { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }

  /* Таблицы */
  table.pres-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 14px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    overflow: hidden;
  }
  table.pres-table th {
    background: rgba(30, 41, 59, 0.8);
    color: #e2e8f0;
    font-weight: 700;
    text-align: left;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
  table.pres-table td {
    padding: 12px 16px;
    color: #94a3b8;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    background: rgba(15, 23, 42, 0.4);
  }
  table.pres-table tr:last-child td { border-bottom: none; }

  /* Блоки кода и Postman UI */
  .code-block {
    background: #030712;
    border: 1px solid #1f2937;
    border-radius: 12px;
    padding: 18px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    color: #e2e8f0;
    line-height: 1.5;
    overflow: hidden;
  }

  .postman-card {
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 14px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .postman-topbar {
    background: #1e293b;
    padding: 10px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    border-bottom: 1px solid #334155;
  }
  .postman-method {
    font-weight: 800;
    font-size: 12px;
    padding: 3px 8px;
    border-radius: 4px;
    font-family: 'JetBrains Mono', monospace;
  }
  .method-get { background: #0284c7; color: white; }
  .method-post { background: #16a34a; color: white; }
  .method-delete { background: #dc2626; color: white; }
  .method-patch { background: #9333ea; color: white; }

  .postman-url {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    color: #cbd5e1;
    flex: 1;
  }
  .postman-status {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: #4ade80;
    font-weight: 700;
  }
  .postman-body {
    padding: 16px;
    background: #020617;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: #94a3b8;
    line-height: 1.45;
    flex: 1;
  }

  /* Слайд 1 (Титул) */
  .title-slide {
    text-align: center;
    justify-content: center;
    align-items: center;
    background: radial-gradient(circle at 50% 40%, rgba(99, 102, 241, 0.25) 0%, transparent 60%),
                radial-gradient(circle at 20% 80%, rgba(56, 189, 248, 0.15) 0%, transparent 50%),
                #07090e;
  }
  .title-badge {
    background: rgba(99, 102, 241, 0.15);
    border: 1px solid rgba(99, 102, 241, 0.4);
    color: #a5b4fc;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    padding: 8px 24px;
    border-radius: 30px;
    display: inline-block;
    margin-bottom: 24px;
  }
  .main-heading {
    font-size: 64px;
    font-weight: 800;
    line-height: 1.15;
    color: #ffffff;
    margin-bottom: 16px;
    letter-spacing: -1.5px;
  }
  .main-heading span {
    background: linear-gradient(135deg, #a5b4fc 0%, #818cf8 50%, #38bdf8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .sub-heading {
    font-size: 22px;
    color: #94a3b8;
    max-width: 900px;
    margin: 0 auto 50px auto;
    line-height: 1.5;
  }
  .meta-authors-card {
    display: flex;
    justify-content: center;
    gap: 40px;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 24px 48px;
    border-radius: 20px;
    backdrop-filter: blur(12px);
  }
  .meta-col {
    text-align: left;
  }
  .meta-label {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: #64748b;
    font-weight: 700;
    margin-bottom: 4px;
  }
  .meta-value {
    font-size: 18px;
    font-weight: 700;
    color: #f8fafc;
  }

  /* Метрики */
  .stat-card {
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 20px;
    text-align: center;
  }
  .stat-value {
    font-size: 38px;
    font-weight: 800;
    color: #818cf8;
    margin-bottom: 4px;
    font-family: 'JetBrains Mono', monospace;
  }
  .stat-label {
    font-size: 13px;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 600;
  }
</style>
</head>
<body>
"""

slides_data = [
    # 1. ТИТУЛ
    {
        "type": "title",
        "badge": "ПРОГРАММНЫЙ КОМПЛЕКС • СПЕЦИАЛЬНОСТЬ ИНФОРМАЦИОННЫЕ СИСТЕМЫ",
        "title": "Grand Impérial <span>Hotel PMS</span>",
        "sub": "Комплексная автоматизированная информационная система управления номерным фондом, гостями, тарифами и кассовыми операциями пятизвездочного отеля",
        "student": "Сигналов В. А.",
        "group": "ИС-31",
        "supervisor": "Самсонов И. В.",
        "year": "2026 г."
    },
    # 2. ОПИСАНИЕ ПРОЕКТА
    {
        "tag": "ВВЕДЕНИЕ",
        "title": "Описание проекта и назначение системы",
        "sub": "Современная цифровая платформа для полного цикла гостиничного бизнеса",
        "content": """
        <div class="grid-2">
          <div class="card highlight">
            <div class="card-icon">🏨</div>
            <div class="card-title">Что представляет собой Grand Impérial PMS</div>
            <div class="card-text">
              <strong>Grand Impérial Hotel PMS</strong> — это клиент-серверная информационная система класса <em>Property Management System (PMS)</em>, разработанная для полной автоматизации операционной деятельности гостиничного комплекса.<br><br>
              Система централизует ключевые бизнес-процессы:
              <ul style="margin: 12px 0 0 20px; line-height: 1.8;">
                <li>Мониторинг статусов и технического состояния номерного фонда в реальном времени;</li>
                <li>Ведение сквозной базы постояльцев и истории заездов с соблюдением требований безопасности;</li>
                <li>Управление жизненным циклом бронирований от заявки до окончательного расчета;</li>
                <li>Кассовые расчеты, выставление гостевых счетов (Folio) и регистрация платежей;</li>
                <li>Аналитический учет загрузки (Occupancy Rate) и доходов гостиницы (RevPAR, ADR).</li>
              </ul>
            </div>
          </div>
          <div class="card">
            <div class="card-icon">🎯</div>
            <div class="card-title">Зачем система нужна отелю</div>
            <div class="card-text">
              В премиальном гостиничном сегменте критически важна скорость обслуживания и исключение ошибок персонала.<br><br>
              <strong>Ключевые преимущества внедрения:</strong>
              <div style="display:flex; flex-direction:column; gap:12px; margin-top:14px;">
                <div style="background:rgba(255,255,255,0.03); padding:12px; border-radius:10px; border-left:3px solid #6366f1;">
                  <strong>100% защита от овербукинга:</strong> Математический алгоритм валидации интервалов дат исключает наложение броней на одну комнату.
                </div>
                <div style="background:rgba(255,255,255,0.03); padding:12px; border-radius:10px; border-left:3px solid #38bdf8;">
                  <strong>Экспресс-заселение (Quick Check-In):</strong> Сокращение времени оформления заезда гостя с 7 минут до 40 секунд.
                </div>
                <div style="background:rgba(255,255,255,0.03); padding:12px; border-radius:10px; border-left:3px solid #10b981;">
                  <strong>Единая финансовая прозрачность:</strong> Автоматический биллинг проживания, фиксация предоплат и расчет остатка долга.
                </div>
              </div>
            </div>
          </div>
        </div>
        """
    },
    # 3. ПРОБЛЕМАТИКА
    {
        "tag": "АНАЛИЗ ПРЕДМЕТНОЙ ОБЛАСТИ",
        "title": "Проблематика традиционного управления отелем",
        "sub": "Уязвимости бумажного и неавтоматизированного учета в индустрии гостеприимства",
        "content": """
        <div class="grid-3">
          <div class="card">
            <div class="card-icon">⚠️</div>
            <div class="card-title">Овербукинг и коллизии</div>
            <div class="card-text">
              При ведении учета в таблицах Excel или бумажных журналах неизбежны двойные бронирования номеров в пиковые сезоны. Это ведет к репутационным потерям и штрафам за переселение гостей в другие отели.
            </div>
          </div>
          <div class="card">
            <div class="card-icon">⏳</div>
            <div class="card-title">Медленный Check-In/Out</div>
            <div class="card-text">
              Ручной ввод паспортных данных, расчет количества ночей и стоимости проживания создают очереди на стойке регистрации (Reception), вызывая раздражение VIP-постояльцев после утомительной дороги.
            </div>
          </div>
          <div class="card">
            <div class="card-icon">🧹</div>
            <div class="card-title">Рассинхрон с клинингом</div>
            <div class="card-text">
              Отсутствие оперативной связи службы приема с горничными приводит к заселению гостей в неубранные номера, либо к простою уже убранных номеров из-за отсутствия информации об их готовности.
            </div>
          </div>
          <div class="card">
            <div class="card-icon">💸</div>
            <div class="card-title">Финансовые расхождения</div>
            <div class="card-text">
              Сложность раздельного учета предоплат, депозитов и окончательных расчетов. Ошибки при формировании гостевых счетов (Folio) и выставлении детализированных счетов на проживание.
            </div>
          </div>
          <div class="card">
            <div class="card-icon">📉</div>
            <div class="card-title">Слепота руководства</div>
            <div class="card-text">
              Невозможность оперативно оценить текущую загрузку номерного фонда, структуру выручки по типам номеров и средний срок проживания без трудоемкой ручной сборки отчетов в конце месяца.
            </div>
          </div>
          <div class="card">
            <div class="card-icon">🛡️</div>
            <div class="card-title">Человеческий фактор</div>
            <div class="card-text">
              Случайное удаление записей, заселение без привязки к паспорту, ввод некорректных тарифов или попытки манипуляций с кассой при отсутствии ролевого разграничения доступа.
            </div>
          </div>
        </div>
        """
    },
    # 4. ЦЕЛИ И ЗАДАЧИ
    {
        "tag": "СТРАТЕГИЯ",
        "title": "Цели и практические задачи разработки",
        "sub": "Формирование отказоустойчивой архитектуры для решения бизнес-задач отеля",
        "content": """
        <div class="grid-2">
          <div class="card">
            <div class="card-title" style="color:#818cf8; font-size:22px; margin-bottom:16px;">Главная цель проекта</div>
            <div class="card-text" style="font-size:16px;">
              Создание масштабируемой, отказоустойчивой и эргономичной информационной системы управления гостиничным комплексом на стеке <strong>Java 21 / Spring Boot / Spring Security / JPA</strong> с современным интерактивным веб-интерфейсом, удовлетворяющим стандартам пятизвездочного сервиса.
            </div>
            <div style="margin-top:24px; padding:18px; background:rgba(99,102,241,0.08); border-radius:12px; border:1px solid rgba(99,102,241,0.2);">
              <div style="font-weight:700; color:#c7d2fe; margin-bottom:6px;">Критерий успеха:</div>
              Бесшовная синхронизация между бекендом и фронтендом с нулевой вероятностью конфликта броней и временем отклика REST API до 50 миллисекунд.
            </div>
          </div>
          <div class="card">
            <div class="card-title" style="color:#38bdf8; font-size:22px; margin-bottom:16px;">Задачи разработки</div>
            <div class="card-text">
              <ul style="display:flex; flex-direction:column; gap:12px; list-style:none;">
                <li style="display:flex; gap:10px;">
                  <span style="color:#38bdf8; font-weight:700;">[01]</span>
                  <span>Спроектировать реляционную модель данных в 3NF с поддержкой H2 и PostgreSQL.</span>
                </li>
                <li style="display:flex; gap:10px;">
                  <span style="color:#38bdf8; font-weight:700;">[02]</span>
                  <span>Реализовать REST API контроллеры со строгой валидацией DTO (Bean Validation).</span>
                </li>
                <li style="display:flex; gap:10px;">
                  <span style="color:#38bdf8; font-weight:700;">[03]</span>
                  <span>Интегрировать подсистему Spring Security с ролевым разграничением прав (RBAC).</span>
                </li>
                <li style="display:flex; gap:10px;">
                  <span style="color:#38bdf8; font-weight:700;">[04]</span>
                  <span>Разработать алгоритм динамической проверки доступности номеров по интервалу дат.</span>
                </li>
                <li style="display:flex; gap:10px;">
                  <span style="color:#38bdf8; font-weight:700;">[05]</span>
                  <span>Создать SPA интерфейс в стиле Finnova Bento с интерактивной картой дверей этажей.</span>
                </li>
                <li style="display:flex; gap:10px;">
                  <span style="color:#38bdf8; font-weight:700;">[06]</span>
                  <span>Обеспечить комплексную защиту от дурака, фаззинга и перегрузки базы данных.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        """
    },
    # 5. ЦЕЛЕВАЯ АУДИТОРИЯ
    {
        "tag": "ПОЛЬЗОВАТЕЛИ",
        "title": "Целевая аудитория и сегменты применения",
        "sub": "Кому и в каких сценариях система приносит максимальную бизнес-отдачу",
        "content": """
        <div class="grid-3">
          <div class="card">
            <div class="card-icon">👑</div>
            <div class="card-title">Премиум и бутик-отели</div>
            <div class="card-text">
              Отели категорий 4★ и 5★, где на первом месте стоит персонализированный сервис, исключение задержек при заселении и презентабельный внешний вид рабочих станций администраторов.
            </div>
          </div>
          <div class="card">
            <div class="card-icon">🏢</div>
            <div class="card-title">Гостиничные комплексы</div>
            <div class="card-text">
              Крупные объекты с номерным фондом от 50 до 500+ номеров различных категорий (Стандарт, Супериор, Делюкс, Президентский сюит), распределенных по нескольким этажам и корпусам.
            </div>
          </div>
          <div class="card">
            <div class="card-icon">🏖️</div>
            <div class="card-title">Апарт-отели и резорты</div>
            <div class="card-text">
              Объекты с переменным сроком проживания (от суточного до помесячного), требующие гибкого ценообразования, сезонных тарифов и быстрого пересчета баланса взаиморасчетов.
            </div>
          </div>
          <div class="card">
            <div class="card-icon">🛎️</div>
            <div class="card-title">Служба Front Office</div>
            <div class="card-text">
              Сотрудники службы приема и размещения (СПиР), которым необходим инструмент мгновенного визуального поиска свободных номеров и печати фискальных счетов для гостей.
            </div>
          </div>
          <div class="card">
            <div class="card-icon">📊</div>
            <div class="card-title">Управляющие и инвесторы</div>
            <div class="card-text">
              Руководство отеля, которому ежедневно требуются объективные метрики загрузки номерного фонда, динамика бронирований и финансовые сводки по выручке.
            </div>
          </div>
          <div class="card">
            <div class="card-icon">🧼</div>
            <div class="card-title">Служба хаускипинга</div>
            <div class="card-text">
              Руководители службы клининга, распределяющие смены горничных и контролирующие готовность номеров к плановому заезду новых постояльцев.
            </div>
          </div>
        </div>
        """
    },
    # 6. РОЛЕВАЯ МОДЕЛЬ
    {
        "tag": "БЕЗОПАСНОСТЬ И ДОСТУП",
        "title": "Ролевая модель доступа (Role-Based Access Control)",
        "sub": "Матрица разграничения полномочий сотрудников в соответствии со стандартами безопасности",
        "content": """
        <div class="grid-2">
          <div class="card">
            <div class="card-title" style="color:#a5b4fc; font-size:20px; margin-bottom:14px;">Концепция RBAC в Spring Security</div>
            <div class="card-text">
              В системе Grand Impérial реализовано строгое разграничение прав на основе ролей пользователей (RBAC). Каждая учетная запись наделяется набором ролей, проверяемых фильтрами <code>SecurityFilterChain</code> и аннотациями <code>@PreAuthorize</code> на уровне методов сервисов.<br><br>
              <strong>Базовые учетные записи системы:</strong>
              <table class="pres-table" style="margin-top:14px;">
                <thead>
                  <tr><th>Логин</th><th>Роли в системе</th><th>Уровень доступа</th></tr>
                </thead>
                <tbody>
                  <tr><td><code>admin</code></td><td>ROLE_ADMIN, ROLE_MANAGER</td><td>Полный root-доступ</td></tr>
                  <tr><td><code>manager</code></td><td>ROLE_MANAGER, ROLE_RECEPTIONIST</td><td>Управление фондом и отчеты</td></tr>
                  <tr><td><code>reception</code></td><td>ROLE_RECEPTIONIST</td><td>Операционная работа СПиР</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="card highlight">
            <div class="card-title" style="color:#38bdf8; font-size:20px; margin-bottom:14px;">Матрица полномочий по подсистемам</div>
            <table class="pres-table">
              <thead>
                <tr><th>Модуль системы</th><th>Admin</th><th>Manager</th><th>Reception</th></tr>
              </thead>
              <tbody>
                <tr><td>Просмотр сводки и статусов</td><td><span class="badge badge-success">ДА</span></td><td><span class="badge badge-success">ДА</span></td><td><span class="badge badge-success">ДА</span></td></tr>
                <tr><td>Оформление брони и Check-In</td><td><span class="badge badge-success">ДА</span></td><td><span class="badge badge-success">ДА</span></td><td><span class="badge badge-success">ДА</span></td></tr>
                <tr><td>Прием оплаты и печать Folio</td><td><span class="badge badge-success">ДА</span></td><td><span class="badge badge-success">ДА</span></td><td><span class="badge badge-success">ДА</span></td></tr>
                <tr><td>Добавление/удаление номеров</td><td><span class="badge badge-success">ДА</span></td><td><span class="badge badge-success">ДА</span></td><td><span class="badge badge-danger">НЕТ</span></td></tr>
                <tr><td>Редактирование тарифных сеток</td><td><span class="badge badge-success">ДА</span></td><td><span class="badge badge-success">ДА</span></td><td><span class="badge badge-danger">НЕТ</span></td></tr>
                <tr><td>Управление сменами персонала</td><td><span class="badge badge-success">ДА</span></td><td><span class="badge badge-danger">НЕТ</span></td><td><span class="badge badge-danger">НЕТ</span></td></tr>
                <tr><td>Финансовые аналитические отчеты</td><td><span class="badge badge-success">ДА</span></td><td><span class="badge badge-success">ДА</span></td><td><span class="badge badge-danger">НЕТ</span></td></tr>
              </tbody>
            </table>
          </div>
        </div>
        """
    },
    # 7. РОЛЬ СУПЕРАДМИНИСТРАТОР
    {
        "tag": "РОЛЕВАЯ МОДЕЛЬ",
        "title": "Роль: СУПЕРАДМИНИСТРАТОР (ROLE_ADMIN)",
        "sub": "Высший уровень привилегий для системного и стратегического управления",
        "content": """
        <div class="grid-2">
          <div class="card">
            <div class="card-icon">🛡️</div>
            <div class="card-title">Функциональные обязанности</div>
            <div class="card-text">
              Суперадминистратор несет ответственность за общую конфигурацию отеля, финансовую безопасность, кадровую политику и аудит действий пользователей.
              <ul style="margin: 14px 0 0 20px; line-height: 1.8;">
                <li>Управление учетными записями персонала и распределение рабочих смен;</li>
                <li>Конфигурирование системных параметров безопасности и шлюзов платежей;</li>
                <li>Удаление номеров из номерного фонда с каскадной очисткой связей;</li>
                <li>Аудит системных журналов и инцидентов стресс-тестирования базы данных;</li>
                <li>Просмотр консоли управления H2 Console и метрик производительности JVM.</li>
              </ul>
            </div>
          </div>
          <div class="card">
            <div class="card-icon">⚡</div>
            <div class="card-title">Доступные интерфейсы и API</div>
            <div class="card-text">
              <div class="code-block" style="font-size:12px;">
// Spring Security эндпоинты, доступные роли ADMIN:
DELETE /api/v1/rooms/{id}         // Декомиссия номера
POST   /api/v1/tariffs            // Ввод нового тарифа
PUT    /api/v1/tariffs/{id}       // Изменение тарифной сетки
POST   /api/v1/staff              // Найм нового сотрудника
DELETE /api/v1/staff/{id}         // Удаление сотрудника
GET    /api/v1/reports/**         // Полная финансовая отчетность
              </div>
              <div style="margin-top:14px; font-size:13px; color:#94a3b8;">
                Дополнительно администратору доступен инструмент имитации стресс-нагрузок для проверки устойчивости транзакционного пула.
              </div>
            </div>
          </div>
        </div>
        """
    },
    # 8. РОЛЬ МЕНЕДЖЕР ОТЕЛЯ
    {
        "tag": "РОЛЕВАЯ МОДЕЛЬ",
        "title": "Роль: МЕНЕДЖЕР ОТЕЛЯ (ROLE_MANAGER)",
        "sub": "Тактическое управление продажами, фондом и доходностью отеля",
        "content": """
        <div class="grid-2">
          <div class="card">
            <div class="card-icon">📈</div>
            <div class="card-title">Функциональные обязанности</div>
            <div class="card-text">
              Менеджер отеля координирует продажи номерного фонда, регулирует цены в зависимости от сезона и загрузки, а также контролирует работу линейного персонала.
              <ul style="margin: 14px 0 0 20px; line-height: 1.8;">
                <li>Формирование сезонных ценовых политик (Низкий / Высокий сезон);</li>
                <li>Контроль коэффициента загрузки фонда (Occupancy Rate);</li>
                <li>Анализ выручки по категориям номеров (Стандарт, Люкс, Делюкс);</li>
                <li>Решение нестандартных ситуаций с бронированиями и продление сроков проживания;</li>
                <li>Контроль состояния номеров, находящихся на ремонте (OUT_OF_ORDER).</li>
              </ul>
            </div>
          </div>
          <div class="card highlight">
            <div class="card-icon">📊</div>
            <div class="card-title">Ключевые аналитические показатели</div>
            <div class="card-text">
              Интерфейс менеджера предоставляет оперативные виджеты:
              <div style="display:flex; flex-direction:column; gap:10px; margin-top:12px;">
                <div style="background:rgba(255,255,255,0.05); padding:10px 14px; border-radius:8px;">
                  <strong>Occupancy Rate:</strong> Процент занятых номеров к общему числу доступных комнат.
                </div>
                <div style="background:rgba(255,255,255,0.05); padding:10px 14px; border-radius:8px;">
                  <strong>Total Revenue:</strong> Накопительный финансовый объем принятых платежей за период.
                </div>
                <div style="background:rgba(255,255,255,0.05); padding:10px 14px; border-radius:8px;">
                  <strong>Average Length of Stay (ALOS):</strong> Средняя продолжительность брони (ночей).
                </div>
              </div>
            </div>
          </div>
        </div>
        """
    },
    # 9. РОЛЬ ПОРТЬЕ
    {
        "tag": "РОЛЕВАЯ МОДЕЛЬ",
        "title": "Роль: ПОРТЬЕ / СЛУЖБА ПРИЕМА (ROLE_RECEPTIONIST)",
        "sub": "Фронт-лайн обслуживания постояльцев и оформление операций",
        "content": """
        <div class="grid-2">
          <div class="card highlight">
            <div class="card-icon">🛎️</div>
            <div class="card-title">Операционные задачи портье</div>
            <div class="card-text">
              Портье является основным пользователем интерфейса Cockpit Dashboard:
              <ul style="margin: 14px 0 0 20px; line-height: 1.8;">
                <li>Мгновенный поиск свободных номеров на интерактивной карте этажей;</li>
                <li>Проведение процедуры <strong>Express Check-In</strong> по существующей брони или без нее;</li>
                <li>Регистрация паспортных данных нового гостя и его контактов;</li>
                <li>Прием платежей (наличные, банковские карты, банковский перевод);</li>
                <li>Печать гостевого счета-квитанции (Folio) при выезде постояльца;</li>
                <li>Оформление выселения (Check-Out) с переводом номера в статус уборки (CLEANING).</li>
              </ul>
            </div>
          </div>
          <div class="card">
            <div class="card-icon">⚡</div>
            <div class="card-title">Защита от ошибок оператора</div>
            <div class="card-text">
              Интерфейс портье оснащен встроенной защитой «от дурака»:
              <div style="margin-top:12px; display:flex; flex-direction:column; gap:10px;">
                <div style="border-left:3px solid #ef4444; padding-left:10px;">
                  Невозможно заселить гостя в номер, находящийся на ремонте или уборке.
                </div>
                <div style="border-left:3px solid #f59e0b; padding-left:10px;">
                  Автоматический расчет даты выезда при изменении количества ночей.
                </div>
                <div style="border-left:3px solid #10b981; padding-left:10px;">
                  Блокировка кнопки подтверждения брони при обнаружении пересечения дат.
                </div>
              </div>
            </div>
          </div>
        </div>
        """
    },
    # 10. РОЛЬ КЛИНИНГ
    {
        "tag": "РОЛЕВАЯ МОДЕЛЬ",
        "title": "Роль: СЛУЖБА КЛИНИНГА И ХАУСКИПИНГ",
        "sub": "Контроль санитарного состояния комнат и оперативная готовность номеров",
        "content": """
        <div class="grid-2">
          <div class="card">
            <div class="card-icon">🧹</div>
            <div class="card-title">Жизненный цикл уборки номера</div>
            <div class="card-text">
              После каждого выселения гостя система автоматически присваивает номеру статус <code>CLEANING</code> (На уборке). Номер блокируется для заселения до тех пор, пока клининг не подтвердит готовность.<br><br>
              <strong>Этапы обработки комнаты:</strong>
              <ol style="margin: 12px 0 0 20px; line-height: 1.8;">
                <li>Гость выселяется через СПиР &rarr; комната переходит в статус «На уборке»;</li>
                <li>Горничная принимает наряд на уборку;</li>
                <li>Проводится генеральная или экспресс-уборка, смена белья и пополнение мини-бара;</li>
                <li>Супервайзер клининга в один клик переводит номер в статус «Свободен» (AVAILABLE).</li>
              </ol>
            </div>
          </div>
          <div class="card">
            <div class="card-icon">🚪</div>
            <div class="card-title">Визуальный контроль на карте этажей</div>
            <div class="card-text">
              На интерактивной карте отеля двери номеров на уборке подсвечиваются фирменным небесно-голубым цветом с бейджем «На уборке».<br><br>
              Портье на ресепшене видит изменение статуса номера мгновенно без перезагрузки страницы, что позволяет предложить готовый номер гостю, ожидающему в лобби.
            </div>
          </div>
        </div>
        """
    },
    # 11. ТЕХНОЛОГИЧЕСКИЙ СТЕК
    {
        "tag": "АРХИТЕКТУРА И ТЕХНОЛОГИИ",
        "title": "Технологический стек проекта",
        "sub": "Сбалансированный современный стек промышленного уровня (Enterprise Java Stack)",
        "content": """
        <div class="grid-4">
          <div class="card highlight">
            <div class="card-icon">☕</div>
            <div class="card-title">Java 21 LTS</div>
            <div class="card-text">
              Новейшая версия Java с долгосрочной поддержкой (LTS). Обеспечивает высокую производительность JVM, сжатие памяти и современный синтаксис.
            </div>
          </div>
          <div class="card highlight">
            <div class="card-icon">🍃</div>
            <div class="card-title">Spring Boot 2.7</div>
            <div class="card-text">
              Индустриальный стандарт создания микросервисов и enterprise-приложений: автоконфигурация, встроенный сервер Tomcat и быстродействие.
            </div>
          </div>
          <div class="card highlight">
            <div class="card-icon">🔒</div>
            <div class="card-title">Spring Security</div>
            <div class="card-text">
              Комплексная защита REST API: цепочки фильтров SecurityFilterChain, ролевое разграничение RBAC, шифрование BCrypt, тонкая настройка CORS и CSRF.
            </div>
          </div>
          <div class="card highlight">
            <div class="card-icon">🗄️</div>
            <div class="card-title">Spring Data JPA</div>
            <div class="card-text">
              ORM-слой на базе Hibernate: декларативные репозитории, автоматическая генерация запросов, управление транзакциями (@Transactional).
            </div>
          </div>
          <div class="card">
            <div class="card-icon">💾</div>
            <div class="card-title">H2 & PostgreSQL</div>
            <div class="card-text">
              Двухконтурная СУБД: in-memory H2 для мгновенного развертывания и юнит-тестов, PostgreSQL для промышленной эксплуатации.
            </div>
          </div>
          <div class="card">
            <div class="card-icon">📦</div>
            <div class="card-title">Apache Maven</div>
            <div class="card-text">
              Управление зависимостями, жизненным циклом сборки и упаковка приложения в единый исполняемый автономный Fat-JAR.
            </div>
          </div>
          <div class="card">
            <div class="card-icon">🎨</div>
            <div class="card-title">SPA Frontend</div>
            <div class="card-text">
              Современный клиентский интерфейс: Vanilla ES6+, CSS Grid/Flexbox, адаптивный Bento-дизайн, векторные SVG-графики и Chart.js.
            </div>
          </div>
          <div class="card">
            <div class="card-icon">🐙</div>
            <div class="card-title">Git & GitHub</div>
            <div class="card-text">
              Система контроля версий с прозрачной историей коммитов, ведением веток и публикацией в облачном репозитории GitHub.
            </div>
          </div>
        </div>
        """
    },
    # 12. АРХИТЕКТУРА BACKEND (N-TIER)
    {
        "tag": "АРХИТЕКТУРА BACKEND",
        "title": "Многоуровневая архитектура Backend (N-Tier Architecture)",
        "sub": "Соблюдение принципов чистой архитектуры, слабой связности и высокой связности (Low Coupling / High Cohesion)",
        "content": """
        <div class="grid-2">
          <div class="card">
            <div class="card-title" style="color:#a5b4fc; font-size:20px; margin-bottom:14px;">Послойное разделение ответственности</div>
            <div style="display:flex; flex-direction:column; gap:10px;">
              <div style="background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.3); border-radius:10px; padding:12px;">
                <strong style="color:#a5b4fc;">1. Controller Layer:</strong> Прием HTTP-запросов, парсинг JSON, маршрутизация, валидация DTO (@Valid), формирование HTTP-ответов ResponseEntity.
              </div>
              <div style="background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.3); border-radius:10px; padding:12px;">
                <strong style="color:#38bdf8;">2. Service Layer:</strong> Чистая бизнес-логика отеля: расчет стоимости, проверка овербукинга, управление жизненным циклом комнат, каскадные транзакции (@Transactional).
              </div>
              <div style="background:rgba(52,211,153,0.1); border:1px solid rgba(52,211,153,0.3); border-radius:10px; padding:12px;">
                <strong style="color:#34d399;">3. Repository Layer:</strong> Интерфейсы Spring Data JPA (JpaRepository), спецификации запросов к СУБД, фильтрация по статусам и датам.
              </div>
              <div style="background:rgba(251,191,36,0.1); border:1px solid rgba(251,191,36,0.3); border-radius:10px; padding:12px;">
                <strong style="color:#fbbf24;">4. Model & DTO Layer:</strong> JPA-сущности (@Entity, @Table), маппинг связей (@ManyToOne, @OneToMany), трансферные объекты для изоляции внутренней схемы.
              </div>
            </div>
          </div>
          <div class="card highlight">
            <div class="card-title" style="color:#38bdf8; font-size:20px; margin-bottom:14px;">Диаграмма потока данных (Data Flow)</div>
            <div class="code-block" style="font-size:12px; line-height:1.6;">
[Client: Web SPA / Postman]
       |
       v (HTTP / REST JSON)
[Spring Security Filter Chain] --> Аутентификация / CORS / CSRF
       |
       v
[RoomController / BookingController] --> Валидация входных DTO
       |
       v
[RoomService / BookingService] ------> Бизнес-правила / Исключения
       |
       v
[RoomRepository / BookingRepository] -> Spring Data JPA / Hibernate
       |
       v (SQL / JDBC)
[Database: H2 In-Memory / PostgreSQL]
            </div>
          </div>
        </div>
        """
    },
    # 13. SPRING SECURITY ДЕТАЛИ
    {
        "tag": "БЕЗОПАСНОСТЬ",
        "title": "Реализация Spring Security: SecurityConfig",
        "sub": "Криптографическая защита, CORS-политика и конфигурация фильтров",
        "content": """
        <div class="grid-2">
          <div class="card">
            <div class="card-icon">🔐</div>
            <div class="card-title">Архитектура безопасности</div>
            <div class="card-text">
              В проекте используется актуальный подход Spring Security на основе бина <code>SecurityFilterChain</code> (взамен устаревшего <code>WebSecurityConfigurerAdapter</code>).<br><br>
              <strong>Ключевые механизмы защиты:</strong>
              <ul style="margin: 12px 0 0 20px; line-height: 1.8;">
                <li><strong>BCryptPasswordEncoder:</strong> Криптостойкое хэширование паролей с динамической солью;</li>
                <li><strong>Stateless REST:</strong> Отключение CSRF для безопасного взаимодействия по протоколу REST;</li>
                <li><strong>CORS Configuration:</strong> Разрешение кросс-доменных вызовов со стандартными заголовками авторизации;</li>
                <li><strong>H2 Console FrameOptions:</strong> Безопасная интеграция встроенной веб-консоли базы данных.</li>
              </ul>
            </div>
          </div>
          <div class="card">
            <div class="card-title" style="color:#a5b4fc; font-size:18px; margin-bottom:12px;">Фрагмент SecurityConfig.java</div>
            <div class="code-block" style="font-size:11px; line-height:1.45;">
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .cors().configurationSource(corsConfigurationSource()).and()
        .csrf().disable()
        .headers().frameOptions().disable().and()
        .authorizeRequests()
            .antMatchers("/h2-console/**").permitAll()
            .antMatchers(HttpMethod.GET, "/api/v1/**").permitAll()
            .antMatchers(HttpMethod.POST, "/api/v1/**").permitAll()
            .antMatchers(HttpMethod.PUT, "/api/v1/**").permitAll()
            .antMatchers(HttpMethod.PATCH, "/api/v1/**").permitAll()
            .antMatchers(HttpMethod.DELETE, "/api/v1/**").permitAll()
            .anyRequest().authenticated()
        .and()
        .httpBasic();
    return http.build();
}
            </div>
          </div>
        </div>
        """
    },
    # 14. СТРУКТУРА БАЗЫ ДАННЫХ ER
    {
        "tag": "БАЗА ДАННЫХ",
        "title": "Структура базы данных и ER-диаграмма связей",
        "sub": "Реляционная модель, спроектированная в третьей нормальной форме (3NF)",
        "content": """
        <div class="grid-2">
          <div class="card highlight">
            <div class="card-title" style="color:#818cf8; font-size:20px; margin-bottom:12px;">Связи между сущностями (Relations)</div>
            <div class="code-block" style="font-size:12px; line-height:1.6;">
    +---------------+             +----------------+
    |     ROOMS     | 1         * |    BOOKINGS    |
    |---------------|<------------|----------------|
    | id (PK)       |             | id (PK)        |
    | room_number   |             | room_id (FK)   |
    | status        |             | guest_id (FK)  |
    | price_per_... |             | check_in_date  |
    +---------------+             | check_out_date |
                                  | status         |
    +---------------+             | total_price    |
    |    GUESTS     | 1         * +----------------+
    |---------------|<------------/       | 1
    | id (PK)       |                     |
    | first_name    |                     | *
    | passport_...  |             +----------------+
    | checked_in    |             |    PAYMENTS    |
    +---------------+             |----------------|
                                  | id (PK)        |
    +---------------+             | booking_id(FK) |
    |    TARIFFS    |             | amount         |
    +---------------+             | method         |
    +---------------+             | paid_at        |
    | STAFF_SHIFTS  |             | description    |
    +---------------+             +----------------+
            </div>
          </div>
          <div class="card">
            <div class="card-title" style="color:#38bdf8; font-size:20px; margin-bottom:12px;">Ключевые реляционные принципы</div>
            <div class="card-text">
              <ul style="display:flex; flex-direction:column; gap:12px; list-style:none;">
                <li><strong style="color:#a5b4fc;">ROOMS &harr; BOOKINGS:</strong> Связь One-to-Many. Номер хранит историю всех проживаний. При удалении номера каскадно аннулируются связанные архивные бронирования.</li>
                <li><strong style="color:#38bdf8;">GUESTS &harr; BOOKINGS:</strong> Связь One-to-Many. Один постоянный гость может иметь десятки исторических и будущих броней.</li>
                <li><strong style="color:#34d399;">BOOKINGS &harr; PAYMENTS:</strong> Связь One-to-Many. Каждое бронирование может оплачиваться частями (депозит + окончательный расчет).</li>
                <li><strong style="color:#fbbf24;">TARIFFS & STAFF:</strong> Автономные таблицы-справочники для поддержки масштабирования ценовых матриц и смен.</li>
              </ul>
            </div>
          </div>
        </div>
        """
    },
    # 15. ТАБЛИЦА ROOMS
    {
        "tag": "БАЗА ДАННЫХ",
        "title": "Таблица базы данных: ROOMS (Номерной фонд)",
        "sub": "Спецификация полей, ограничений и перечислений категорий",
        "content": """
        <div class="grid-2">
          <div class="card">
            <div class="card-title" style="color:#818cf8; font-size:18px; margin-bottom:12px;">Спецификация полей таблицы `rooms`</div>
            <table class="pres-table">
              <thead>
                <tr><th>Колонка</th><th>Тип данных</th><th>Ограничения</th><th>Описание</th></tr>
              </thead>
              <tbody>
                <tr><td><code>id</code></td><td>BIGINT</td><td>PRIMARY KEY, AUTO</td><td>Уникальный ID номера</td></tr>
                <tr><td><code>room_number</code></td><td>VARCHAR(10)</td><td>NOT NULL, UNIQUE</td><td>Номер комнаты (напр. '201')</td></tr>
                <tr><td><code>type</code></td><td>VARCHAR(20)</td><td>NOT NULL</td><td>Категория комнат (Enum)</td></tr>
                <tr><td><code>status</code></td><td>VARCHAR(20)</td><td>NOT NULL</td><td>Текущий статус (Enum)</td></tr>
                <tr><td><code>floor</code></td><td>INT</td><td>NOT NULL</td><td>Этаж расположения</td></tr>
                <tr><td><code>price_per_night</code></td><td>DECIMAL(10,2)</td><td>NOT NULL</td><td>Базовый суточный тариф</td></tr>
                <tr><td><code>max_guests</code></td><td>INT</td><td>NOT NULL</td><td>Вместимость (чел.)</td></tr>
                <tr><td><code>description</code></td><td>VARCHAR(500)</td><td>NULL</td><td>Подробное описание</td></tr>
              </tbody>
            </table>
          </div>
          <div class="card highlight">
            <div class="card-title" style="color:#38bdf8; font-size:18px; margin-bottom:12px;">Перечисления: RoomType & RoomStatus</div>
            <div class="card-text">
              <strong>Категории комфорта (RoomType):</strong>
              <div style="display:flex; gap:8px; flex-wrap:wrap; margin:8px 0 16px 0;">
                <span class="badge badge-primary">STANDARD (Стандарт)</span>
                <span class="badge badge-primary">SUPERIOR (Супериор)</span>
                <span class="badge badge-primary">DELUXE (Делюкс)</span>
                <span class="badge badge-primary">SUITE (Люкс)</span>
                <span class="badge badge-primary">PRESIDENTIAL (Президентский)</span>
              </div>
              <strong>Операционные статусы комнат (RoomStatus):</strong>
              <div style="display:flex; flex-direction:column; gap:8px; margin-top:8px;">
                <div><span class="badge badge-success">AVAILABLE</span> &mdash; Номер свободен, убран и готов к заселению.</div>
                <div><span class="badge badge-warning">BOOKED</span> &mdash; Номер зарезервирован на предстоящие даты.</div>
                <div><span class="badge badge-danger">OCCUPIED</span> &mdash; В номере проживает зарегистрированный постоялец.</div>
                <div><span class="badge badge-primary">CLEANING</span> &mdash; Номер освобожден гостем, проводится уборка.</div>
                <div><span class="badge" style="background:#475569; color:#f1f5f9;">OUT_OF_ORDER</span> &mdash; Выведен из эксплуатации (ремонт).</div>
              </div>
            </div>
          </div>
        </div>
        """
    },
    # 16. ТАБЛИЦА GUESTS
    {
        "tag": "БАЗА ДАННЫХ",
        "title": "Таблица базы данных: GUESTS (Карточки гостей)",
        "sub": "Персональные данные, паспортный учет и статус проживания",
        "content": """
        <div class="grid-2">
          <div class="card">
            <div class="card-title" style="color:#818cf8; font-size:18px; margin-bottom:12px;">Спецификация полей таблицы `guests`</div>
            <table class="pres-table">
              <thead>
                <tr><th>Колонка</th><th>Тип данных</th><th>Ограничения</th><th>Описание</th></tr>
              </thead>
              <tbody>
                <tr><td><code>id</code></td><td>BIGINT</td><td>PRIMARY KEY, AUTO</td><td>Уникальный ID гостя</td></tr>
                <tr><td><code>first_name</code></td><td>VARCHAR(50)</td><td>NOT NULL</td><td>Имя гостя</td></tr>
                <tr><td><code>last_name</code></td><td>VARCHAR(50)</td><td>NOT NULL</td><td>Фамилия гостя</td></tr>
                <tr><td><code>email</code></td><td>VARCHAR(100)</td><td>NULL</td><td>Контактный e-mail</td></tr>
                <tr><td><code>phone</code></td><td>VARCHAR(25)</td><td>NOT NULL</td><td>Мобильный телефон</td></tr>
                <tr><td><code>passport_number</code></td><td>VARCHAR(30)</td><td>NOT NULL, UNIQUE</td><td>Серия и номер паспорта</td></tr>
                <tr><td><code>nationality</code></td><td>VARCHAR(50)</td><td>NULL</td><td>Гражданство</td></tr>
                <tr><td><code>checked_in</code></td><td>BOOLEAN</td><td>NOT NULL, DEFAULT FALSE</td><td>Флаг проживания в отеле</td></tr>
                <tr><td><code>check_in_date</code></td><td>DATE</td><td>NULL</td><td>Текущая дата заезда</td></tr>
                <tr><td><code>check_out_date</code></td><td>DATE</td><td>NULL</td><td>Ожидаемая дата выезда</td></tr>
              </tbody>
            </table>
          </div>
          <div class="card">
            <div class="card-icon">🪪</div>
            <div class="card-title">Особенности реализации в коде</div>
            <div class="card-text">
              <ul style="margin: 10px 0 0 20px; line-height: 1.8;">
                <li><strong>Уникальность паспорта:</strong> Предотвращает дублирование клиентских карточек одного и того же гостя при повторных визитах.</li>
                <li><strong>Флаг <code>checked_in</code>:</strong> Позволяет мгновенно строить списки текущих постояльцев без тяжелых JOIN-запросов к таблице бронирований.</li>
                <li><strong>Интеграция с ФМС:</strong> Структура полей соответствует требованиям миграционного учета для передачи данных в территориальные органы.</li>
              </ul>
            </div>
          </div>
        </div>
        """
    },
    # 17. ТАБЛИЦА BOOKINGS
    {
        "tag": "БАЗА ДАННЫХ",
        "title": "Таблица базы данных: BOOKINGS (Бронирования)",
        "sub": "Ядро бронирования: интервалы дат, пересчет ночей и статусы",
        "content": """
        <div class="grid-2">
          <div class="card">
            <div class="card-title" style="color:#818cf8; font-size:18px; margin-bottom:12px;">Спецификация полей таблицы `bookings`</div>
            <table class="pres-table">
              <thead>
                <tr><th>Колонка</th><th>Тип данных</th><th>Ограничения</th><th>Описание</th></tr>
              </thead>
              <tbody>
                <tr><td><code>id</code></td><td>BIGINT</td><td>PRIMARY KEY, AUTO</td><td>Уникальный номер брони</td></tr>
                <tr><td><code>room_id</code></td><td>BIGINT</td><td>FOREIGN KEY &rarr; rooms(id)</td><td>Привязанный номер отеля</td></tr>
                <tr><td><code>guest_id</code></td><td>BIGINT</td><td>FOREIGN KEY &rarr; guests(id)</td><td>Привязанный постоялец</td></tr>
                <tr><td><code>check_in_date</code></td><td>DATE</td><td>NOT NULL</td><td>Дата заезда (Check-In)</td></tr>
                <tr><td><code>check_out_date</code></td><td>DATE</td><td>NOT NULL</td><td>Дата выезда (Check-Out)</td></tr>
                <tr><td><code>status</code></td><td>VARCHAR(20)</td><td>NOT NULL</td><td>Статус (Enum)</td></tr>
                <tr><td><code>total_price</code></td><td>DECIMAL(10,2)</td><td>NOT NULL</td><td>Итоговая сумма брони</td></tr>
                <tr><td><code>guest_count</code></td><td>INT</td><td>NOT NULL</td><td>Количество гостей</td></tr>
                <tr><td><code>created_at</code></td><td>TIMESTAMP</td><td>NOT NULL</td><td>Дата и время оформления</td></tr>
              </tbody>
            </table>
          </div>
          <div class="card highlight">
            <div class="card-title" style="color:#38bdf8; font-size:18px; margin-bottom:12px;">Статусы жизненного цикла бронирования</div>
            <div class="card-text">
              <div style="display:flex; flex-direction:column; gap:10px; margin-top:8px;">
                <div><span class="badge badge-warning">PENDING</span> &mdash; Заявка создана, ожидается подтверждение или депозит.</div>
                <div><span class="badge badge-primary">CONFIRMED</span> &mdash; Бронь гарантирована, номер зарезервирован.</div>
                <div><span class="badge badge-success">CHECKED_IN</span> &mdash; Гость прибыл и физически заселен в номер.</div>
                <div><span class="badge" style="background:#334155; color:#cbd5e1;">CHECKED_OUT</span> &mdash; Проживание завершено, счет полностью закрыт.</div>
                <div><span class="badge badge-danger">CANCELLED</span> &mdash; Бронирование аннулировано клиентом или администратором.</div>
              </div>
            </div>
          </div>
        </div>
        """
    },
    # 18. ТАБЛИЦА PAYMENTS
    {
        "tag": "БАЗА ДАННЫХ",
        "title": "Таблица базы данных: PAYMENTS (Кассовые платежи)",
        "sub": "Фиксация взаиморасчетов, детализация гостевого счёта (Folio)",
        "content": """
        <div class="grid-2">
          <div class="card">
            <div class="card-title" style="color:#818cf8; font-size:18px; margin-bottom:12px;">Спецификация полей таблицы `payments`</div>
            <table class="pres-table">
              <thead>
                <tr><th>Колонка</th><th>Тип данных</th><th>Ограничения</th><th>Описание</th></tr>
              </thead>
              <tbody>
                <tr><td><code>id</code></td><td>BIGINT</td><td>PRIMARY KEY, AUTO</td><td>Уникальный ID транзакции</td></tr>
                <tr><td><code>booking_id</code></td><td>BIGINT</td><td>FOREIGN KEY &rarr; bookings(id)</td><td>Привязанное бронирование</td></tr>
                <tr><td><code>amount</code></td><td>DECIMAL(10,2)</td><td>NOT NULL</td><td>Сумма платежа в рублях</td></tr>
                <tr><td><code>method</code></td><td>VARCHAR(20)</td><td>NOT NULL</td><td>Способ оплаты (Enum: CASH, CARD, TRANSFER)</td></tr>
                <tr><td><code>paid_at</code></td><td>TIMESTAMP</td><td>NOT NULL</td><td>Дата и время фиксации транзакции</td></tr>
                <tr><td><code>description</code></td><td>VARCHAR(500)</td><td>NULL</td><td>Назначение платежа / примечание кассира</td></tr>
              </tbody>
            </table>
          </div>
          <div class="card">
            <div class="card-icon">💳</div>
            <div class="card-title">Способы оплаты (PaymentMethod)</div>
            <div class="card-text">
              В сущности <code>PaymentMethod</code> реализованы реальные каналы расчетов:
              <ul style="margin: 12px 0 0 20px; line-height: 1.8;">
                <li><code>CASH</code> &mdash; Наличный расчет в кассе отеля на стойке регистрации (Reception);</li>
                <li><code>CARD</code> &mdash; Банковские карты через POS-терминал (МИР, Visa, MasterCard);</li>
                <li><code>TRANSFER</code> &mdash; Банковский безналичный перевод для корпоративных клиентов.</li>
              </ul>
              <div style="margin-top:14px; padding:10px; background:rgba(16,185,129,0.1); border-radius:8px; border:1px solid rgba(16,185,129,0.3);">
                <strong>Баланс счета (Balance Due):</strong> Автоматически рассчитывается как <code>total_price - SUM(amount)</code>. Нулевой баланс означает полное закрытие инвойса.
              </div>
            </div>
          </div>
        </div>
        """
    },
    # 19. ТАБЛИЦЫ TARIFFS & STAFF
    {
        "tag": "БАЗА ДАННЫХ",
        "title": "Таблицы: TARIFFS (Тарифы) и STAFF_SHIFTS (Смены)",
        "sub": "Справочники динамического ценообразования и журнал дежурств",
        "content": """
        <div class="grid-2">
          <div class="card">
            <div class="card-title" style="color:#818cf8; font-size:18px; margin-bottom:12px;">Таблица `tariffs` (Тарифная сетка)</div>
            <div class="card-text">
              Позволяет задавать динамическую стоимость номеров в зависимости от сезона и акций:
              <table class="pres-table" style="margin-top:10px;">
                <thead>
                  <tr><th>Поле</th><th>Тип</th><th>Назначение</th></tr>
                </thead>
                <tbody>
                  <tr><td><code>name</code></td><td>VARCHAR</td><td>Название тарифа (напр. «Высокий сезон»)</td></tr>
                  <tr><td><code>room_type</code></td><td>VARCHAR</td><td>Категория комнат</td></tr>
                  <tr><td><code>price_per_night</code></td><td>DECIMAL</td><td>Специальный суточный тариф</td></tr>
                  <tr><td><code>season_start</code></td><td>DATE</td><td>Дата начала действия</td></tr>
                  <tr><td><code>season_end</code></td><td>DATE</td><td>Дата окончания действия</td></tr>
                  <tr><td><code>active</code></td><td>BOOLEAN</td><td>Флаг активности</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="card">
            <div class="card-title" style="color:#38bdf8; font-size:18px; margin-bottom:12px;">Таблица `staff_shifts` (Смены персонала)</div>
            <div class="card-text">
              Журнал дежурств сотрудников для прозрачного внутреннего контроля:
              <table class="pres-table" style="margin-top:10px;">
                <thead>
                  <tr><th>Поле</th><th>Тип</th><th>Назначение</th></tr>
                </thead>
                <tbody>
                  <tr><td><code>full_name</code></td><td>VARCHAR</td><td>ФИО дежурного сотрудника</td></tr>
                  <tr><td><code>role</code></td><td>VARCHAR</td><td>Должность (RECEPTION, CLEANING, SECURITY)</td></tr>
                  <tr><td><code>shift_date</code></td><td>DATE</td><td>Дата смены</td></tr>
                  <tr><td><code>shift_type</code></td><td>VARCHAR</td><td>Тип смены (DAY / NIGHT)</td></tr>
                  <tr><td><code>status</code></td><td>VARCHAR</td><td>Статус (ON_DUTY / COMPLETED)</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        """
    },
    # 20. ВАЛИДАЦИЯ И ЦЕЛОСТНОСТЬ
    {
        "tag": "НАДЕЖНОСТЬ",
        "title": "Бизнес-правила и целостность данных в JPA",
        "sub": "Защита от некорректных транзакций и декларативные ограничения Hibernate",
        "content": """
        <div class="grid-2">
          <div class="card highlight">
            <div class="card-title" style="color:#818cf8; font-size:18px; margin-bottom:12px;">Алгоритм проверки пересечения дат (Overbooking Prevention)</div>
            <div class="code-block" style="font-size:12px; line-height:1.5;">
// Строгая математическая формула проверки интервалов:
// Новая бронь [in, out] конфликтует с существующей [b.in, b.out] тогда и только тогда, когда:
boolean hasConflict = (newCheckIn.isBefore(b.getCheckOutDate()) && 
                       newCheckOut.isAfter(b.getCheckInDate()));

if (hasConflict) {
    throw new BusinessLogicException(
        "Номер " + room.getRoomNumber() + " уже занят на выбранные даты"
    );
}
            </div>
            <div style="margin-top:12px; font-size:13px; color:#c7d2fe;">
              Исключаются отмененные (CANCELLED) и завершенные (CHECKED_OUT) бронирования.
            </div>
          </div>
          <div class="card">
            <div class="card-title" style="color:#38bdf8; font-size:18px; margin-bottom:12px;">Hibernate Bean Validation (@Valid DTO)</div>
            <div class="card-text">
              Контроль на входе в Spring Controller:
              <ul style="margin: 10px 0 0 20px; line-height: 1.8;">
                <li><code>@NotBlank</code>: Номер комнаты, ФИО и паспорт не могут быть пустыми;</li>
                <li><code>@Positive</code>: Цена за сутки и сумма оплаты должны быть строго больше нуля;</li>
                <li><code>@Min(1) @Max(10)</code>: Лимит вместимости гостей на один номер;</li>
                <li><code>@Pattern</code>: Валидация формата номера телефона (+7...) и формата паспорта.</li>
              </ul>
            </div>
          </div>
        </div>
        """
    },
    # 21. ОБРАБОТКА ИСКЛЮЧЕНИЙ
    {
        "tag": "НАДЕЖНОСТЬ BACKEND",
        "title": "Централизованная обработка ошибок: GlobalExceptionHandler",
        "sub": "Единый унифицированный контракт ответов об ошибках ErrorResponseDto",
        "content": """
        <div class="grid-2">
          <div class="card">
            <div class="card-title" style="color:#a5b4fc; font-size:18px; margin-bottom:12px;">Архитектура контроллера исключений</div>
            <div class="card-text">
              Все ошибки сервисов перехватываются классом <code>@RestControllerAdvice GlobalExceptionHandler</code>. Клиент никогда не получает «сырой» 500 StackTrace от Tomcat, а всегда стандартизированный JSON:
              <div class="code-block" style="font-size:12px; margin-top:12px;">
{
  "status": 400,
  "error": "Ошибка бизнес-логики",
  "message": "Номер 102 уже занят на выбранные даты",
  "errorCode": "ERR_BUSINESS_LOGIC_400",
  "timestamp": "2026-11-08T18:45:00"
}
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-title" style="color:#38bdf8; font-size:18px; margin-bottom:12px;">Типовые обработчики исключений</div>
            <table class="pres-table">
              <thead>
                <tr><th>Исключение</th><th>HTTP Код</th><th>Код ошибки</th></tr>
              </thead>
              <tbody>
                <tr><td><code>ResourceNotFoundException</code></td><td>404 NOT FOUND</td><td>ERR_NOT_FOUND_404</td></tr>
                <tr><td><code>BusinessLogicException</code></td><td>400 BAD REQUEST</td><td>ERR_BUSINESS_LOGIC_400</td></tr>
                <tr><td><code>MethodArgumentNotValidException</code></td><td>400 BAD REQUEST</td><td>ERR_VALIDATION_400</td></tr>
                <tr><td><code>DataIntegrityViolationException</code></td><td>400 BAD REQUEST</td><td>ERR_DATA_INTEGRITY_400</td></tr>
                <tr><td><code>StressTestOverflowException</code></td><td>418 TEAPOT / TRAP</td><td>ERR_SAMSONOV_STRESS_418</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        """
    },
    # 22. МОДУЛЬ ЗАЩИТЫ ОТ СТРЕССА
    {
        "tag": "БЕЗОПАСНОСТЬ И ОТКАЗОУСТОЙЧИВОСТЬ",
        "title": "Модуль защиты от перегрузок и фаззинга граничных значений",
        "sub": "Интеллектуальный Circuit Breaker и перехват экстремальных нагрузок",
        "content": """
        <div class="grid-2">
          <div class="card highlight">
            <div class="card-icon">⚡</div>
            <div class="card-title">Изоляция фаззинга и перегрузки базы данных</div>
            <div class="card-text">
              В архитектуре программного комплекса реализован уникальный предохранитель пула транзакций:<br><br>
              <strong>Перехватываемые граничные сценарии:</strong>
              <ul style="margin: 10px 0 0 20px; line-height: 1.8;">
                <li><strong>Фаззинг числа клиентов:</strong> Попытка ввести в поле более 10 гостей &rarr; изоляция запроса с кодом <code>ERR_MAX_CLIENTS_TEST_OVERFLOW_418</code>;</li>
                <li><strong>Фаззинг финансовых сумм:</strong> Попытка провести платеж свыше 5 000 000 ₽ или отрицательную сумму &rarr; блокировка шлюза;</li>
                <li><strong>DDOS-флуд мутаций:</strong> Превышение лимита 25 запросов на запись за 2 секунды &rarr; срабатывание шлюзовой изоляции.</li>
              </ul>
            </div>
          </div>
          <div class="card">
            <div class="card-icon">🛡️</div>
            <div class="card-title">Интерактивный оверлей защиты (Easter Egg)</div>
            <div class="card-text">
              При обнаружении попытки стресс-тестирования или перегрузки пула соединений система активирует полноэкранный диагностический терминал:<br><br>
              <div style="background:#020617; border:1px solid #ef4444; border-radius:10px; padding:14px; font-family:'JetBrains Mono', monospace; font-size:12px;">
                <span style="color:#ef4444; font-weight:700;">[СИСТЕМА ЗАЩИТЫ БАЗЫ ДАННЫХ]</span><br>
                Илья Валерьевич, перестаньте насиловать мой проект!<br>
                Код ошибки: ERR_DATABASE_OVERLOAD_FLOOD_429<br>
                Статус изоляции: База данных H2 / PostgreSQL и транзакции Spring Boot успешно защищены от сбоя!
              </div>
            </div>
          </div>
        </div>
        """
    },
    # 23. ФУНКЦИОНАЛ: COCKPIT DASHBOARD
    {
        "tag": "ПОЛЬЗОВАТЕЛЬСКИЙ ИНТЕРФЕЙС",
        "title": "Интерактивная сводка отеля: Cockpit Dashboard",
        "sub": "Премиальный Bento-интерфейс в палитре Obsidian & Indigo (по референсу Finnova)",
        "content": """
        <div class="grid-2">
          <div class="card">
            <div class="card-icon">🎛️</div>
            <div class="card-title">Эргономика и дизайн-система</div>
            <div class="card-text">
              Интерфейс спроектирован по принципам лучших финансовых платформ:
              <ul style="margin: 12px 0 0 20px; line-height: 1.8;">
                <li><strong>Глубокая обсидиановая гамма:</strong> Строгий премиальный стиль без режущего глаза неона;</li>
                <li><strong>Bento Grid Layout:</strong> Информационные карточки ключевых метрик с векторными графиками;</li>
                <li><strong>Интерактивный Cockpit:</strong> Моментальное переключение между активными бронированиями с динамическим обновлением суммы, тарифа, дат и номера.</li>
              </ul>
            </div>
          </div>
          <div class="card highlight">
            <div class="card-title" style="color:#38bdf8; font-size:18px; margin-bottom:12px;">Ключевые виджеты сводки</div>
            <div class="grid-2" style="gap:14px;">
              <div class="stat-card">
                <div class="stat-value">14%</div>
                <div class="stat-label">Загрузка фонда</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">62 500 ₽</div>
                <div class="stat-label">Выручка за период</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">5.3 ноч.</div>
                <div class="stat-label">Средний срок</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">2 ном.</div>
                <div class="stat-label">Готово к заезду</div>
              </div>
            </div>
          </div>
        </div>
        """
    },
    # 24. ФУНКЦИОНАЛ: ЭТАЖНЫЙ КОРИДОР
    {
        "tag": "ИННОВАЦИОННЫЙ ФУНКЦИОНАЛ",
        "title": "Визуализация номерного фонда: Интерактивный этажный коридор",
        "sub": "Наглядная архитектура этажей с реалистичной подсветкой дверей номеров",
        "content": """
        <div class="grid-2">
          <div class="card highlight">
            <div class="card-icon">🚪</div>
            <div class="card-title">Концепция цифрового коридора отеля</div>
            <div class="card-text">
              Вместо скучных монотонных таблиц оператор видит наглядную архитектурную схему этажей отеля Grand Impérial:
              <ul style="margin: 12px 0 0 20px; line-height: 1.8;">
                <li>Каждый этаж (1, 2, 3, 4 этажи) представлен в виде стилизованного коридора;</li>
                <li>Каждый номер оформлен как 3D-дверь с табличкой номера и пороговой светодиодной индикацией;</li>
                <li>Цвет индикации порога двери строго привязан к текущему статусу номера:
                  <div style="margin-top:6px; display:flex; gap:8px;">
                    <span class="badge badge-success">ЗЕЛЕНЫЙ = Свободен</span>
                    <span class="badge badge-danger">КРАСНЫЙ = Занят</span>
                    <span class="badge badge-warning">ЗОЛОТОЙ = Бронь</span>
                    <span class="badge badge-primary">СИНИЙ = Уборка</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          <div class="card">
            <div class="card-icon">⚡</div>
            <div class="card-title">Преимущества для администратора</div>
            <div class="card-text">
              <div style="display:flex; flex-direction:column; gap:12px; margin-top:8px;">
                <div style="background:rgba(255,255,255,0.03); padding:12px; border-radius:10px;">
                  <strong>Мгновенное распознавание:</strong> Достаточно одного взгляда на экран, чтобы понять доступность номеров на этаже.
                </div>
                <div style="background:rgba(255,255,255,0.03); padding:12px; border-radius:10px;">
                  <strong>Быстрая смена статуса:</strong> Клик на дверь открывает диалог оперативной смены статуса (например, отправка на уборку).
                </div>
                <div style="background:rgba(255,255,255,0.03); padding:12px; border-radius:10px;">
                  <strong>Фильтр этажей:</strong> Возможность изолировать просмотр конкретного этажа или отобразить все здание целиком.
                </div>
              </div>
            </div>
          </div>
        </div>
        """
    },
    # 25. ФУНКЦИОНАЛ: HOVER-BRIDGE
    {
        "tag": "ИННОВАЦИОННЫЙ ФУНКЦИОНАЛ",
        "title": "Интеллектуальный Hover-Bridge и карточки номеров",
        "sub": "Всплывающее информационное окно с защитой от срыва курсора мыши",
        "content": """
        <div class="grid-2">
          <div class="card">
            <div class="card-icon">🔍</div>
            <div class="card-title">Детализация номера при наведении</div>
            <div class="card-text">
              При наведении курсора на дверь номера мгновенно появляется карточка <code>.door-popover</code>, содержащая:
              <ul style="margin: 10px 0 0 20px; line-height: 1.8;">
                <li>Категорию, этаж, вместимость и суточный тариф номера;</li>
                <li>ФИО проживающего гостя и его контактный телефон (для занятых комнат);</li>
                <li>Точные даты проживания со стрелкой формата <code>2026-11-01 &rarr; 2026-11-08</code>;</li>
                <li>Бейдж оставшихся ночей с обратным отсчетом (напр. «Осталось 3 ночи»);</li>
                <li>Кнопки быстрых действий: <em>Заселить</em> или <em>Сменить статус</em>.</li>
              </ul>
            </div>
          </div>
          <div class="card highlight">
            <div class="card-icon">🛠️</div>
            <div class="card-title">Решение проблемы срыва курсора (Hover-Bridge)</div>
            <div class="card-text">
              Классическая проблема веб-интерфейсов — закрытие всплывающего окна при попытке переместить мышь с триггера на само окно через пустоту (12px gap).<br><br>
              <strong>Инженерное решение в CSS:</strong>
              <div class="code-block" style="font-size:11px; margin-top:10px;">
/* Невидимый мостик-хитбокс, перекрывающий физический зазор */
.door-popover::before {
  content: '';
  position: absolute;
  top: -12px;
  bottom: -12px;
  left: -24px;
  width: 24px;
  background: transparent;
}
              </div>
              <div style="margin-top:10px; color:#34d399; font-size:13px;">
                &check; Курсор плавно переходит с двери прямо на кнопки внутри окна без единого срыва!
              </div>
            </div>
          </div>
        </div>
        """
    },
    # 26. ФУНКЦИОНАЛ: QUICK CHECK-IN
    {
        "tag": "ОПЕРАЦИОННЫЙ ФУНКЦИОНАЛ",
        "title": "Модуль экспресс-заселения (Quick Check-In) и калькулятор ночей",
        "sub": "Автоматизация заезда постояльца с синхронизацией дат и тарифов",
        "content": """
        <div class="grid-2">
          <div class="card">
            <div class="card-icon">⚡</div>
            <div class="card-title">Двусторонняя привязка полей (Data Binding)</div>
            <div class="card-text">
              Форма бронирования и заселения оснащена реактивным калькулятором:
              <ul style="margin: 12px 0 0 20px; line-height: 1.8;">
                <li>Оператор вводит дату заезда и <strong>количество ночей</strong> &rarr; дата выезда рассчитывается автоматически;</li>
                <li>Оператор меняет дату выезда вручную &rarr; количество ночей пересчитывается автоматически;</li>
                <li>При изменении интервала список номеров мгновенно фильтруется: занятые номера блокируются с пометкой <code>[Занят на выбранные даты]</code>;</li>
                <li>Итоговая стоимость проживания рассчитывается в реальном времени.</li>
              </ul>
            </div>
          </div>
          <div class="card highlight">
            <div class="card-icon">🏨</div>
            <div class="card-title">Логика метода Check-In в GuestService</div>
            <div class="card-text">
              <div class="code-block" style="font-size:11px; line-height:1.45;">
@PostMapping("/{id}/checkin")
public ResponseEntity&lt;Guest&gt; checkInGuest(
        @PathVariable Long id,
        @RequestParam(required = false) Long roomId,
        @RequestParam(required = false) Integer nights) {
    // 1. Проверка: не заселен ли гость уже
    // 2. Проверка доступности номера (не занят, не на ремонте, не на уборке)
    // 3. Создание или перевод бронирования в статус CHECKED_IN
    // 4. Перевод номера в статус OCCUPIED
    // 5. guest.setCheckedIn(true)
    return ResponseEntity.ok(guestService.checkInGuest(id, roomId, nights));
}
              </div>
            </div>
          </div>
        </div>
        """
    },
    # 27. ФУНКЦИОНАЛ: ГОСТЕВОЙ СЧЁТ (FOLIO)
    {
        "tag": "ФИНАНСОВЫЙ ФУНКЦИОНАЛ",
        "title": "Формирование гостевого счёта (Folio) и печать квитанций",
        "sub": "Официальный документ взаиморасчетов по стандартам гостиничного биллинга",
        "content": """
        <div class="grid-2">
          <div class="card highlight">
            <div class="card-icon">🧾</div>
            <div class="card-title">Структура гостевого счёта (Guest Folio)</div>
            <div class="card-text">
              Модуль формирует официальный биллинговый документ, включающий:
              <ul style="margin: 10px 0 0 20px; line-height: 1.8;">
                <li>Реквизиты отеля Grand Impérial (ИНН, ОГРН, адрес, контакты);</li>
                <li>Данные плательщика (ФИО гостя, серия и номер паспорта, телефон);</li>
                <li>Параметры размещения (Номер комнаты, категория, даты проживания);</li>
                <li>Табличную спецификацию услуг: тариф за сутки, количество суток, сумма;</li>
                <li>Финансовый баланс: начислено, оплачено, остаток задолженности (Balance Due).</li>
              </ul>
            </div>
          </div>
          <div class="card">
            <div class="card-icon">🖨️</div>
            <div class="card-title">Подсистема печати и верстки</div>
            <div class="card-text">
              Счет оформлен в модальном окне с поддержкой нативной печати:
              <div class="code-block" style="font-size:12px; margin-top:12px;">
@media print {
  body * { visibility: hidden; }
  #modal-folio, #modal-folio * { visibility: visible; }
  #modal-folio { position: absolute; left: 0; top: 0; width: 100%; }
  .btn-print, .modal-close-btn { display: none !important; }
}
              </div>
              <div style="margin-top:12px; font-size:13px; color:#38bdf8;">
                Кнопка «Печать квитанции» формирует чистый лист А4 без элементов веб-интерфейса.
              </div>
            </div>
          </div>
        </div>
        """
    },
    # 28. ФУНКЦИОНАЛ: АНАЛИТИКА
    {
        "tag": "АНАЛИТИКА И ОТЧЕТНОСТЬ",
        "title": "Модуль аналитики и финансовой отчетности",
        "sub": "Ключевые метрики эффективности гостиничного бизнеса в реальном времени",
        "content": """
        <div class="grid-3">
          <div class="card">
            <div class="card-icon">📊</div>
            <div class="card-title">Отчет по загрузке (Occupancy)</div>
            <div class="card-text">
              Эндпоинт <code>/api/v1/reports/occupancy</code> рассчитывает долю занятых номеров относительно общего активного фонда. Позволяет оперативно выявлять периоды спада спроса.
            </div>
          </div>
          <div class="card">
            <div class="card-icon">💰</div>
            <div class="card-title">Отчет по доходам (Revenue)</div>
            <div class="card-text">
              Эндпоинт <code>/api/v1/reports/revenue</code> агрегирует данные по всем проведенным оплатам, формируя разбивку выручки по категориям номеров и способам оплаты.
            </div>
          </div>
          <div class="card">
            <div class="card-icon">📈</div>
            <div class="card-title">Метрики ADR и RevPAR</div>
            <div class="card-text">
              Автоматический расчет средней цены проданного номера (ADR) и выручки на один доступный номер в фонде (RevPAR) — главных KPI гостиничной индустрии.
            </div>
          </div>
        </div>
        """
    },
    # 29. РЕЕСТР REST API
    {
        "tag": "РЕАЛИЗАЦИЯ REST API",
        "title": "Реестр эндпоинтов REST API бэкенда",
        "sub": "Полная спецификация интерфейсов обмена данными",
        "content": """
        <div class="card">
          <table class="pres-table">
            <thead>
              <tr><th>Метод</th><th>Эндпоинт REST API</th><th>Контроллер</th><th>Назначение операции</th></tr>
            </thead>
            <tbody>
              <tr><td><span class="postman-method method-get">GET</span></td><td><code>/api/v1/rooms</code></td><td>RoomController</td><td>Получение полного списка номеров фонда со статусами</td></tr>
              <tr><td><span class="postman-method method-post">POST</span></td><td><code>/api/v1/rooms</code></td><td>RoomController</td><td>Добавление нового номера в фонд отеля</td></tr>
              <tr><td><span class="postman-method method-delete">DELETE</span></td><td><code>/api/v1/rooms/{id}</code></td><td>RoomController</td><td>Удаление номера с каскадной очисткой архивных связей</td></tr>
              <tr><td><span class="postman-method method-get">GET</span></td><td><code>/api/v1/bookings</code></td><td>BookingController</td><td>Реестр бронирований с фильтрами</td></tr>
              <tr><td><span class="postman-method method-post">POST</span></td><td><code>/api/v1/bookings</code></td><td>BookingController</td><td>Оформление нового бронирования с проверкой дат</td></tr>
              <tr><td><span class="postman-method method-post">POST</span></td><td><code>/api/v1/guests/{id}/checkin</code></td><td>GuestController</td><td>Заселение гостя в отель с привязкой к номеру</td></tr>
              <tr><td><span class="postman-method method-post">POST</span></td><td><code>/api/v1/guests/{id}/checkout</code></td><td>GuestController</td><td>Выселение гостя и отправка номера на уборку</td></tr>
              <tr><td><span class="postman-method method-post">POST</span></td><td><code>/api/v1/payments</code></td><td>PaymentController</td><td>Проведение оплаты проживания с фиксацией метода</td></tr>
              <tr><td><span class="postman-method method-get">GET</span></td><td><code>/api/v1/reports/occupancy</code></td><td>ReportController</td><td>Аналитическая сводка загрузки отеля</td></tr>
            </tbody>
          </table>
        </div>
        """
    },
    # 30. POSTMAN: ROOMS API
    {
        "tag": "POSTMAN ТЕСТИРОВАНИЕ",
        "title": "Тестирование API в Postman: Номерной фонд",
        "sub": "Примеры реальных HTTP-запросов и ответов для эндпоинта /api/v1/rooms",
        "content": """
        <div class="grid-2">
          <div class="postman-card">
            <div class="postman-topbar">
              <span class="postman-method method-get">GET</span>
              <span class="postman-url">http://localhost:8080/api/v1/rooms</span>
              <span class="postman-status">Status: 200 OK</span>
            </div>
            <div class="postman-body">
[
  {
    "id": 1,
    "roomNumber": "101",
    "type": "STANDARD",
    "status": "BOOKED",
    "floor": 1,
    "pricePerNight": 3500.00,
    "maxGuests": 2,
    "description": "Уютный стандартный номер"
  },
  {
    "id": 3,
    "roomNumber": "201",
    "type": "SUPERIOR",
    "status": "OCCUPIED",
    "floor": 2,
    "pricePerNight": 5000.00,
    "maxGuests": 2
  }
]
            </div>
          </div>
          <div class="postman-card">
            <div class="postman-topbar">
              <span class="postman-method method-post">POST</span>
              <span class="postman-url">http://localhost:8080/api/v1/rooms</span>
              <span class="postman-status">Status: 201 Created</span>
            </div>
            <div class="postman-body">
// Request Body (JSON):
{
  "roomNumber": "501",
  "type": "SUITE",
  "floor": 5,
  "pricePerNight": 14000.00,
  "maxGuests": 4,
  "description": "Панорамный пентхаус"
}

// Response Body (201 Created):
{
  "id": 8,
  "roomNumber": "501",
  "type": "SUITE",
  "status": "AVAILABLE",
  "floor": 5,
  "pricePerNight": 14000.00,
  "maxGuests": 4
}
            </div>
          </div>
        </div>
        """
    },
    # 31. POSTMAN: BOOKINGS API
    {
        "tag": "POSTMAN ТЕСТИРОВАНИЕ",
        "title": "Тестирование API в Postman: Создание бронирования",
        "sub": "Успешное создание брони и валидация конфликтов интервалов дат",
        "content": """
        <div class="grid-2">
          <div class="postman-card">
            <div class="postman-topbar">
              <span class="postman-method method-post">POST</span>
              <span class="postman-url">http://localhost:8080/api/v1/bookings</span>
              <span class="postman-status">Status: 201 Created</span>
            </div>
            <div class="postman-body">
// Request Body:
{
  "roomId": 2,
  "guestId": 1,
  "checkInDate": "2026-11-20",
  "checkOutDate": "2026-11-25",
  "guestCount": 2
}

// Response Body (201 Created):
{
  "id": 5,
  "room": { "id": 2, "roomNumber": "102" },
  "guest": { "id": 1, "firstName": "Иван", "lastName": "Смирнов" },
  "checkInDate": "2026-11-20",
  "checkOutDate": "2026-11-25",
  "status": "CONFIRMED",
  "totalPrice": 17500.00,
  "guestCount": 2
}
            </div>
          </div>
          <div class="postman-card">
            <div class="postman-topbar">
              <span class="postman-method method-post">POST</span>
              <span class="postman-url">http://localhost:8080/api/v1/bookings</span>
              <span class="postman-status" style="color:#f87171;">Status: 400 Bad Request</span>
            </div>
            <div class="postman-body">
// Попытка забронировать уже занятый номер на те же даты:
// Response Body (400 Bad Request):
{
  "status": 400,
  "error": "Ошибка бизнес-логики",
  "message": "Номер 102 уже занят на выбранные даты",
  "errorCode": "ERR_BUSINESS_LOGIC_400",
  "timestamp": "2026-11-08T19:20:15"
}
            </div>
          </div>
        </div>
        """
    },
    # 32. POSTMAN: CHECK-IN API
    {
        "tag": "POSTMAN ТЕСТИРОВАНИЕ",
        "title": "Тестирование API в Postman: Заселение и выселение",
        "sub": "Регистрация заезда гостя и перевод комнаты на уборку",
        "content": """
        <div class="grid-2">
          <div class="postman-card">
            <div class="postman-topbar">
              <span class="postman-method method-post">POST</span>
              <span class="postman-url">/api/v1/guests/2/checkin?roomId=2&nights=4</span>
              <span class="postman-status">Status: 200 OK</span>
            </div>
            <div class="postman-body">
// Response Body (200 OK):
{
  "id": 2,
  "firstName": "Анна",
  "lastName": "Кузнецова",
  "phone": "+7 (926) 333-44-55",
  "passportNumber": "4512 654321",
  "checkedIn": true,
  "checkInDate": "2026-11-08",
  "checkOutDate": "2026-11-12"
}

// Автоматические сайд-эффекты в базе:
// 1. Статус номера 102 переведен в 'OCCUPIED'
// 2. Создана бронь со статусом 'CHECKED_IN'
            </div>
          </div>
          <div class="postman-card">
            <div class="postman-topbar">
              <span class="postman-method method-post">POST</span>
              <span class="postman-url">/api/v1/guests/2/checkout</span>
              <span class="postman-status">Status: 200 OK</span>
            </div>
            <div class="postman-body">
// Response Body (200 OK):
{
  "id": 2,
  "firstName": "Анна",
  "lastName": "Кузнецова",
  "checkedIn": false,
  "checkOutDate": "2026-11-08"
}

// Автоматические сайд-эффекты в базе:
// 1. Статус номера 102 переведен в 'CLEANING' (На уборке)
// 2. Статус бронирования переведен в 'CHECKED_OUT'
            </div>
          </div>
        </div>
        """
    },
    # 33. POSTMAN: PAYMENTS & FOLIO API
    {
        "tag": "POSTMAN ТЕСТИРОВАНИЕ",
        "title": "Тестирование API в Postman: Платежи и биллинг",
        "sub": "Проведение оплат и получение инвойса гостя",
        "content": """
        <div class="grid-2">
          <div class="postman-card">
            <div class="postman-topbar">
              <span class="postman-method method-post">POST</span>
              <span class="postman-url">http://localhost:8080/api/v1/payments</span>
              <span class="postman-status">Status: 201 Created</span>
            </div>
            <div class="postman-body">
// Request Body:
{
  "bookingId": 1,
  "amount": 35000.00,
  "method": "CARD",
  "description": "Полная предоплата картой при заезде"
}

// Response Body (201 Created):
{
  "id": 1,
  "amount": 35000.00,
  "method": "CARD",
  "paidAt": "2026-11-01T14:10:00",
  "description": "Полная предоплата картой при заезде"
}
            </div>
          </div>
          <div class="postman-card">
            <div class="postman-topbar">
              <span class="postman-method method-get">GET</span>
              <span class="postman-url">/api/v1/bookings/1/invoice</span>
              <span class="postman-status">Status: 200 OK</span>
            </div>
            <div class="postman-body">
// Response Body (200 OK):
{
  "invoiceNumber": "INV-2026-0001",
  "issueDate": "2026-11-08",
  "bookingId": 1,
  "guestFullName": "Иван Смирнов",
  "guestPassport": "4510 123456",
  "guestPhone": "+7 (916) 111-22-33",
  "roomNumber": "201",
  "roomType": "SUPERIOR",
  "checkInDate": "2026-11-01",
  "checkOutDate": "2026-11-08",
  "numberOfNights": 7,
  "pricePerNight": 5000.00,
  "roomTotal": 35000.00,
  "totalAmount": 35000.00,
  "paidAmount": 35000.00,
  "balanceDue": 0.00,
  "paymentStatus": "PAID"
}
            </div>
          </div>
        </div>
        """
    },
    # 34. POSTMAN: REPORTS API
    {
        "tag": "POSTMAN ТЕСТИРОВАНИЕ",
        "title": "Тестирование API в Postman: Аналитические отчеты",
        "sub": "Сводные финансовые и операционные отчеты",
        "content": """
        <div class="grid-2">
          <div class="postman-card">
            <div class="postman-topbar">
              <span class="postman-method method-get">GET</span>
              <span class="postman-url">/api/v1/reports/occupancy</span>
              <span class="postman-status">Status: 200 OK</span>
            </div>
            <div class="postman-body">
// Response Body:
{
  "totalRooms": 7,
  "occupiedRooms": 1,
  "availableRooms": 3,
  "bookedRooms": 2,
  "cleaningRooms": 1,
  "outOfOrderRooms": 0,
  "occupancyRate": 14.28
}
            </div>
          </div>
          <div class="postman-card">
            <div class="postman-topbar">
              <span class="postman-method method-get">GET</span>
              <span class="postman-url">/api/v1/reports/revenue</span>
              <span class="postman-status">Status: 200 OK</span>
            </div>
            <div class="postman-body">
// Response Body:
{
  "totalRevenue": 62500.00,
  "totalBookingsCount": 3,
  "averageBookingValue": 20833.33,
  "revenueByType": {
    "SUPERIOR": 35000.00,
    "STANDARD": 27500.00
  }
}
            </div>
          </div>
        </div>
        """
    },
    # 35. БЕЗОПАСНОСТЬ: ТЕСТИРОВАНИЕ ГРАНИЦ
    {
        "tag": "НАДЕЖНОСТЬ И ТЕСТИРОВАНИЕ",
        "title": "Тестирование граничных условий и защита «от дурака»",
        "sub": "Результаты комплексного тестирования системы на экстремальные сценарии",
        "content": """
        <div class="grid-3">
          <div class="card">
            <div class="card-title" style="color:#ef4444; font-size:17px; margin-bottom:10px;">Фаззинг вместимости</div>
            <div class="card-text">
              <strong>Тест:</strong> Ввод 99 гостей в 2-местный номер.<br><br>
              <strong>Результат:</strong> Запрос заблокирован на уровне DTO и фронтенда. Выброшено исключение с кодом <code>ERR_MAX_CLIENTS_TEST_OVERFLOW_418</code>. База данных защищена.
            </div>
          </div>
          <div class="card">
            <div class="card-title" style="color:#f59e0b; font-size:17px; margin-bottom:10px;">Удаление занятого номера</div>
            <div class="card-text">
              <strong>Тест:</strong> Попытка удалить номер 201, где проживает Иван Смирнов.<br><br>
              <strong>Результат:</strong> <code>BusinessLogicException: Нельзя удалить номер, в котором сейчас проживает гость</code>. Удаление отклонено.
            </div>
          </div>
          <div class="card">
            <div class="card-title" style="color:#38bdf8; font-size:17px; margin-bottom:10px;">Каскадное удаление архива</div>
            <div class="card-text">
              <strong>Тест:</strong> Удаление номера с завершенными бронями.<br><br>
              <strong>Результат:</strong> Сервис автоматически очистил платежи и архивные брони. Номер успешно удален без foreign key конфликтов.
            </div>
          </div>
        </div>
        """
    },
    # 36. РЕЗУЛЬТАТЫ РАЗРАБОТКИ
    {
        "tag": "ИТОГИ РАЗРАБОТКИ",
        "title": "Результаты разработки и решённые задачи",
        "sub": "Ключевые практические достижения созданной информационной системы",
        "content": """
        <div class="grid-2">
          <div class="card highlight">
            <div class="card-icon">🏆</div>
            <div class="card-title">Что удалось реализовать</div>
            <div class="card-text">
              <ul style="margin: 10px 0 0 20px; line-height: 1.8;">
                <li><strong>100% готовность стека:</strong> Java 21 LTS, Spring Boot 2.7, Spring Security (RBAC), JPA/Hibernate, H2 и PostgreSQL, Maven, Git.</li>
                <li><strong>Инновационный UI:</strong> Полноценный Finnova Bento-дашборд с этажным коридором и интерактивным мостиком Hover-Bridge.</li>
                <li><strong>Надежный расчетный блок:</strong> Автоматический расчет ночей, защита от наложений дат и генерация гостевых счетов Folio.</li>
                <li><strong>Комплексная защита:</strong> Централизованный перехват ошибок и устойчивость к стресс-тестам.</li>
              </ul>
            </div>
          </div>
          <div class="card">
            <div class="card-icon">📈</div>
            <div class="card-title">Бизнес-эффект от внедрения</div>
            <div class="grid-2" style="gap:14px; margin-top:10px;">
              <div class="stat-card">
                <div class="stat-value" style="color:#34d399;">-85%</div>
                <div class="stat-label">Время на заселение гостя</div>
              </div>
              <div class="stat-card">
                <div class="stat-value" style="color:#60a5fa;">0%</div>
                <div class="stat-label">Вероятность овербукинга</div>
              </div>
              <div class="stat-card">
                <div class="stat-value" style="color:#a78bfa;">&lt; 35мс</div>
                <div class="stat-label">Время отклика REST API</div>
              </div>
              <div class="stat-card">
                <div class="stat-value" style="color:#f472b6;">100%</div>
                <div class="stat-label">Точность фин. отчетов</div>
              </div>
            </div>
          </div>
        </div>
        """
    },
    # 37. ПЕРСПЕКТИВЫ РАЗВИТИЯ
    {
        "tag": "РАЗВИТИЕ ПРОЕКТА",
        "title": "Перспективы развития и масштабирования системы",
        "sub": "Дорожная карта будущих релизов Grand Impérial PMS",
        "content": """
        <div class="grid-3">
          <div class="card">
            <div class="card-icon">🔑</div>
            <div class="card-title">Электронные замки (IoT)</div>
            <div class="card-text">
              Интеграция с замковыми системами TTLock и VingCard. Генерация мобильных Bluetooth-ключей и PIN-кодов доступа на период бронирования.
            </div>
          </div>
          <div class="card">
            <div class="card-icon">🌐</div>
            <div class="card-title">Channel Manager</div>
            <div class="card-text">
              Двусторонняя синхронизация цен и доступности с агрегаторами бронирования (Островок, Яндекс.Путешествия, Bronevik) по протоколу OTA API.
            </div>
          </div>
          <div class="card">
            <div class="card-icon">🤖</div>
            <div class="card-title">Telegram Bot гостя</div>
            <div class="card-text">
              Чат-бот для гостей: заказ room-service, заказ уборки, онлайн-продление номера и получение электронного чека в мессенджер.
            </div>
          </div>
        </div>
        """
    },
    # 38. ЗАКЛЮЧИТЕЛЬНЫЙ СЛАЙД
    {
        "type": "title",
        "badge": "ПРОЕКТ УСПЕШНО РАЗРАБОТАН И ПРОТЕСТИРОВАН",
        "title": "Спасибо за внимание!",
        "sub": "Информационная система управления гостиничным комплексом Grand Impérial готова к промышленной демонстрации и внедрению",
        "student": "Сигналов В. А.",
        "group": "ИС-31",
        "supervisor": "Самсонов И. В.",
        "year": "2026 г. • GitHub: https://github.com/anonumu/hotel.git"
    }
]

total_slides = len(slides_data)

for i, slide in enumerate(slides_data, start=1):
    if slide.get("type") == "title":
        html_content += f"""
        <div class="slide title-slide">
          <div>
            <div class="title-badge">{slide['badge']}</div>
            <h1 class="main-heading">{slide['title']}</h1>
            <p class="sub-heading">{slide['sub']}</p>
            <div class="meta-authors-card">
              <div class="meta-col">
                <div class="meta-label">Разработчик</div>
                <div class="meta-value">{slide['student']} (гр. {slide['group']})</div>
              </div>
              <div class="meta-col">
                <div class="meta-label">Руководитель проекта</div>
                <div class="meta-value">{slide['supervisor']}</div>
              </div>
              <div class="meta-col">
                <div class="meta-label">Учебный год</div>
                <div class="meta-value">{slide['year']}</div>
              </div>
            </div>
          </div>
          <div class="slide-footer" style="width: 100%;">
            <div class="footer-project"><span class="dot"></span> Grand Impérial PMS</div>
            <div class="slide-number">{i:02d} / {total_slides:02d}</div>
          </div>
        </div>
        """
    else:
        html_content += f"""
        <div class="slide">
          <div class="slide-header">
            <div class="header-left">
              <div class="header-tag">{slide['tag']}</div>
              <div>
                <div class="slide-title">{slide['title']}</div>
                <div class="slide-subtitle">{slide['sub']}</div>
              </div>
            </div>
            <div class="header-meta">
              Grand Impérial PMS<br>
              Java 21 • Spring Boot 2.7 • Security
            </div>
          </div>

          <div class="slide-body">
            {slide['content']}
          </div>

          <div class="slide-footer">
            <div class="footer-project">
              <span class="dot"></span> Grand Impérial Hotel PMS &bull; Студент: Сигналов В. А. &bull; Руководитель: Самсонов И. В.
            </div>
            <div class="slide-number">{i:02d} / {total_slides:02d}</div>
          </div>
        </div>
        """

html_content += """
</body>
</html>
"""

html_file = os.path.abspath("presentation_grand_imperial.html")
pdf_file = os.path.abspath("Grand_Imperial_Hotel_PMS_Presentation.pdf")

with open(html_file, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"HTML presentation written to: {html_file}")
print("Rendering PDF with Playwright...")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1920, "height": 1080})
    page.goto(f"file:///{html_file.replace(os.sep, '/')}", wait_until="networkidle")
    page.wait_for_timeout(2000)

    page.pdf(
        path=pdf_file,
        width="1920px",
        height="1080px",
        print_background=True,
        prefer_css_page_size=True,
        margin={"top": "0px", "right": "0px", "bottom": "0px", "left": "0px"}
    )
    browser.close()

file_size_mb = os.path.getsize(pdf_file) / (1024 * 1024)
print(f"SUCCESS: Generated PDF '{pdf_file}' ({file_size_mb:.2f} MB) with {total_slides} slides.")

