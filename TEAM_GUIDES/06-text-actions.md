# Участник 6. Действия

1. Выполните разделы «Подключение» и «Своя ветка» в [инструкции PyCharm](00-PyCharm.md). Имя вашей ветки — `feature/text-actions`.
2. В левой панели Project откройте `whisperlivekit/web/sn-actions.js`. Все три коммита касаются этого файла.
3. Запустите командную копию по README на порту 8001. После каждого изменения сохраните файл (Ctrl+S) и обновите страницу (Ctrl+F5).

## 1. Копировать расшифровку

Нажмите Ctrl+F, найдите `/* ШАГ 6.1 */`, затем Esc. Замените следующий блок целиком, включая строку метки.

```
/* ШАГ 6.1 */
```

Вставьте на его место следующий код.

```js
  copy.onclick = async () => {
    try {
      await navigator.clipboard.writeText(SN.transcript.text());
      SN.notice("Текст скопирован.");
    } catch {
      const range = document.createRange();
      range.selectNodeContents(SN.el("transcript"));
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      SN.notice("Браузер ограничил доступ к буферу. Текст выделен для ручного копирования.", true);
    }
  };
```

Проверка. Загрузите WAV, нажмите Копировать и вставьте в Блокнот через Ctrl+V. Сравните текст.

Откройте Commit (Ctrl+K), отметьте только `whisperlivekit/web/sn-actions.js`, изучите разницу и нажмите Commit с сообщением **Копировать расшифровку**.

## 2. Скачать UTF-8 TXT

Нажмите Ctrl+F, найдите `/* ШАГ 6.2 */`, затем Esc. Замените следующий блок целиком, включая строку метки.

```
/* ШАГ 6.2 */
```

Вставьте на его место следующий код.

```js
  save.onclick = () => {
    const url = URL.createObjectURL(new Blob([SN.transcript.text()], {type:"text/plain;charset=utf-8"}));
    const link = document.createElement("a");
    link.href = url;
    link.download = "SpeechNote-" + new Date().toISOString().slice(0, 10) + ".txt";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  };
```

Проверка. Нажмите Скачать TXT и откройте файл в Блокноте. Проверьте кириллицу.

Откройте Commit (Ctrl+K), отметьте только `whisperlivekit/web/sn-actions.js`, изучите разницу и нажмите Commit с сообщением **Скачать UTF-8 TXT**.

## 3. Очистить расшифровку

Нажмите Ctrl+F, найдите `/* ШАГ 6.3 */`, затем Esc. Замените следующий блок целиком, включая строку метки.

```
/* ШАГ 6.3 */
```

Вставьте на его место следующий код.

```js
  clear.onclick = () => {
    SN.transcript.clear();
    SN.notice("Расшифровка очищена.");
  };
```

Проверка. Нажмите Очистить. Текст исчезнет, кнопки действий станут недоступными.

Откройте Commit (Ctrl+K), отметьте только `whisperlivekit/web/sn-actions.js`, изучите разницу и нажмите Commit с сообщением **Очистить расшифровку**.

После трёх проверок выполните Push и откройте PR по [инструкции PyCharm](00-PyCharm.md). Опишите своими словами результат каждой проверки и укажите использование выданных заготовок.
