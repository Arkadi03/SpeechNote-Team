# Микрофон и настоящая диаризация

Ветка `v2/audio`. Начните с [общего порядка в PyCharm и плана перехода](Переход.md). Каждый шаг — одно самостоятельное изменение и один личный коммит. Откройте указанный путь в своей ветке. При создании нового файла используйте тот же путь. Ссылки ведут на полную реализацию v2 для сверки.

## 1. Завершить потоковую запись

Файл [whisperlivekit/web/sn-mic.js](../whisperlivekit/web/sn-mic.js), ориентир в v2 — строка 109. Реализуйте старые метки 3.1–3.3. В start рядом с language добавьте параметр сессии. Сохраните обработку EOF.

Фрагмент для сверки:

```
      url.searchParams.set("diarization", String(SN.speakers()));
      s.socket = new WebSocket(url);
      deadline(s, 15000, "Сервер не ответил на запрос записи.");
      s.socket.onerror = () => end(s, "Не удалось подключить микрофон к серверу.");
```

**Проверка.** Запишите и остановите фразу дважды. Проверьте таймер и два финальных результата.

**Сообщение коммита:** «Завершить потоковую запись».

## 2. Изолировать режим говорящих

Файл [whisperlivekit/audio_processor.py](../whisperlivekit/audio_processor.py), ориентир в v2 — строка 86. Примите необязательный параметр. Скопируйте Namespace при выборе режима перед созданием очередей и TokensAlignment.

Фрагмент для сверки:

```
        session_diarization = kwargs.pop('session_diarization', None)
        session_pcm_input = kwargs.pop('pcm_input', None)
        # Output mode of the session: "full" resends the whole transcript on
        # every update, so history must never be pruned away (issue #372);
```

**Проверка.** Проверьте вызовы с отсутствующим параметром и с false. Первый сохраняет серверный режим, второй отключает диаризацию только в этой сессии.

**Сообщение коммита:** «Изолировать режим говорящих».

## 3. Подключить переключатель к API

Файл [whisperlivekit/basic_server.py](../whisperlivekit/basic_server.py), ориентир в v2 — строка 80. Опубликуйте способность модели в health, примите флаг в /asr и POST. Передайте его в оба AudioProcessor и отклоните недоступную операцию.

Фрагмент для сверки:

```
        "diarization_available": getattr(transcription_engine, "diarization_model", None) is not None,
    })


```

**Проверка.** На базовом сервере health возвращает false, принудительный запрос получает REST 400 или сообщение ошибки WebSocket.

**Сообщение коммита:** «Подключить переключатель к API».

## 4. Сохранить неопределённую метку

Файл [whisperlivekit/timed_objects.py](../whisperlivekit/timed_objects.py), ориентир в v2 — строка 191. В Segment.to_dict пометьте исходный speaker=-1. В _format_openai_response из basic_server.py выводите такой текст без придуманной подписи.

Фрагмент для сверки:

```
            _dict["speaker_assigned"] = False
        if self.translation:
            _dict['translation'] = self.translation
        if self.detected_language:
```

**Проверка.** Проверьте форматирование меток 1, 2, -1. При доступном NeMo отдельно запишите двух собеседников и укажите результат настоящего разделения.

**Сообщение коммита:** «Сохранить неопределённую метку».

В PR перечислите собственные изменения и наблюдения. Укажите использование подготовленных с ИИ заготовок.
