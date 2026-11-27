# Настройки и защита токена

Ветка `v2/settings`. Начните с [общего порядка в PyCharm и плана перехода](Переход.md). Каждый шаг — одно самостоятельное изменение и один личный коммит. Откройте указанный путь в своей ветке. При создании нового файла используйте тот же путь. Ссылки ведут на полную реализацию v2 для сверки.

## 1. Подключить статус и справку

Файл [whisperlivekit/web/sn-status.js](../whisperlivekit/web/sn-status.js), ориентир в v2 — строка 10. Закончите метки 7.1–7.3. После проверки ready сообщите интерфейсу значение diarization_available.

Фрагмент для сверки:

```
      const health = await response.json();
      if (!health.ready) throw new Error();
      SN.setSpeakerAvailability(health.diarization_available === true);
      badge.dataset.state = "ready";
```

**Проверка.** Отключите и восстановите сеть вкладки в DevTools. Проверьте индикатор и раскрытие справки.

**Сообщение коммита:** «Подключить статус и справку».

## 2. Связать настройки говорящих с сервером

Файл [whisperlivekit/web/sn-settings.js](../whisperlivekit/web/sn-settings.js), ориентир в v2 — строка 2. Создайте модуль настроек. Свяжите speakers и speaker-state с health, предоставьте SN.speakers для обеих студий.

Фрагмент для сверки:

```
SN.setSpeakerAvailability = available => {
  const box = SN.el("speakers");
  box.disabled = !available;
  if (!available) box.checked = false;
```

**Проверка.** В базовом профиле видна причина блокировки. С моделью переключатель задаёт режим следующего запроса.

**Сообщение коммита:** «Связать настройки говорящих с сервером».

## 3. Проверить URL и имя модели

Файл [whisperlivekit/web/sn-settings.js](../whisperlivekit/web/sn-settings.js), ориентир в v2 — строка 16. Через URL разберите базовый и полный путь; принимайте HTTPS или HTTP на loopback. Проверьте непустое имя и отсутствие секретов в URL.

Фрагмент для сверки:

```
  function endpoint() {
    let url;
    try { url = new URL(address.value.trim()); }
    catch { throw new Error("Укажите полный URL API в настройках."); }
```

**Проверка.** Проверьте /v1 и /v1/chat/completions, затем небезопасный http://example.com/v1.

**Сообщение коммита:** «Проверить URL и имя модели».

## 4. Ограничить время жизни токена

Файл [whisperlivekit/web/sn-settings.js](../whisperlivekit/web/sn-settings.js), ориентир в v2 — строка 14. Сформируйте заголовок только в SN.llmConfig. При смене адреса или уходе со страницы очистите пароль.

Фрагмент для сверки:

```
  address.addEventListener("input", () => { token.value = ""; });
  window.addEventListener("pagehide", () => { token.value = ""; });
  function endpoint() {
    let url;
```

**Проверка.** Введите тестовую строку, смените адрес и проверьте пустое поле. Не прикладывайте заголовки запросов к PR.

**Сообщение коммита:** «Ограничить время жизни токена».

В PR перечислите собственные изменения и наблюдения. Укажите использование подготовленных с ИИ заготовок.
