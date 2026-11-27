# Файлы, текст и экспорт

Ветка `v2/transcript`. Начните с [общего порядка в PyCharm и плана перехода](Переход.md). Каждый шаг — одно самостоятельное изменение и один личный коммит. Откройте указанный путь в своей ветке. При создании нового файла используйте тот же путь. Ссылки ведут на полную реализацию v2 для сверки.

## 1. Передать параметры загрузки

Файл [whisperlivekit/web/sn-file.js](../whisperlivekit/web/sn-file.js), ориентир в v2 — строка 21. Завершите метки 4.1–4.3. До fetch добавьте флаг и выбор response_format: json либо diarized_json.

Фрагмент для сверки:

```
      data.set("diarization", String(SN.speakers()));
      data.set("response_format", SN.speakers() ? "diarized_json" : "json");
      const response = await fetch(SN.endpoint("v1/audio/transcriptions"), {method:"POST", body:data});
      if (!response.ok) {
```

**Проверка.** Загрузите русский WAV и повреждённый файл. Предыдущий текст сохраняется после ошибки.

**Сообщение коммита:** «Передать параметры загрузки».

## 2. Отобразить подтверждённые слова и говорящих

Файл [whisperlivekit/web/sn-transcript.js](../whisperlivekit/web/sn-transcript.js), ориентир в v2 — строка 15. Закончите метки 5.1–5.3. Отфильтруйте тишину и проверьте speaker_assigned перед выводом номера говорящего.

Фрагмент для сверки:

```
  function update(snapshot) {
    current = (snapshot.lines || [])
      .filter(line => Number(line.speaker) !== -2 && line.text)
      .map(line => SN.speakers() && line.speaker_assigned !== false && Number(line.speaker) > 0
```

**Проверка.** Дважды передайте один снимок. Строка не повторяется. Неопределённая метка не отображается как участник 1.

**Сообщение коммита:** «Отобразить подтверждённые слова и говорящих».

## 3. Разделить истории студий

Файл [whisperlivekit/web/sn-transcript.js](../whisperlivekit/web/sn-transcript.js), ориентир в v2 — строка 30. Создайте Map и ключ текущей студии. При смене сохраняйте history, восстанавливайте текст другого раздела и сбрасывайте черновик.

Фрагмент для сверки:

```
    select(name) {
      notebooks.set(notebook, history);
      notebook = name;
      history = notebooks.get(name) || "";
```

**Проверка.** Внесите две разные фразы и переключитесь через настройки. Очистка одной студии сохраняет вторую.

**Сообщение коммита:** «Разделить истории студий».

## 4. Подключить действия с текстом

Файл [whisperlivekit/web/sn-actions.js](../whisperlivekit/web/sn-actions.js), ориентир в v2 — строка 20. Выполните метки 6.1–6.3. Используйте text() текущей студии и UTF-8 Blob, освободите временный URL.

Фрагмент для сверки:

```
  save.onclick = () => {
    const url = URL.createObjectURL(new Blob([SN.transcript.text()], {type:"text/plain;charset=utf-8"}));
    const link = document.createElement("a");
    link.href = url;
```

**Проверка.** Сравните содержимое скачанного TXT и буфера обмена с экраном, включая кириллицу.

**Сообщение коммита:** «Подключить действия с текстом».

В PR перечислите собственные изменения и наблюдения. Укажите использование подготовленных с ИИ заготовок.
