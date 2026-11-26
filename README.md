# SpeechNote-Team — старт команды ТПУ

Это учебная копия с частично заполненными компонентами. Семь студентов дополняют по одному файлу. В каждом файле есть три подписанные точки вставки. Карточки рассчитаны на эту версию. Открывайте в PyCharm именно папку SpeechNote-Team.

| Участник | Карточка | Ветка |
| --- | --- | --- |
| 1 | [Шапка и структура](TEAM_GUIDES/01-page.md) | feature/page |
| 2 | [Оформление](TEAM_GUIDES/02-theme.md) | feature/theme |
| 3 | [Микрофон](TEAM_GUIDES/03-microphone.md) | feature/microphone |
| 4 | [Аудиофайл](TEAM_GUIDES/04-audio-file.md) | feature/audio-file |
| 5 | [Расшифровка](TEAM_GUIDES/05-transcript.md) | feature/transcript |
| 6 | [Действия с текстом](TEAM_GUIDES/06-text-actions.md) | feature/text-actions |
| 7 | [Статус и справка](TEAM_GUIDES/07-status-help.md) | feature/status-help |

Координатор начинает с [публикации основы и приглашения команды](TEAM_GUIDES/Координатор.md). Каждый студент проходит [подключение GitHub и работу в PyCharm](TEAM_GUIDES/00-PyCharm.md), затем открывает свою карточку. Для выполнения требования преподавателя предусмотрена [установка Ubuntu через WSL 2](TEAM_GUIDES/WSL2-Ubuntu.md).

## На подготовленном ПК

В терминале PowerShell **из SpeechNote-Team** выполните команды ниже. Они используют уже установленные библиотеки, локальные веса и учебный WAV. Python загружает исходники из текущего каталога. В этом режиме кнопки и оформление будут меняться по мере выполнения карточек.

```powershell
$env:PYTHONUTF8="1"
$env:CUDA_VISIBLE_DEVICES="-1"
$env:OMP_NUM_THREADS="4"
$env:PATH="C:\Program Files\iGameCenter\SAVIConverter\tools;" + $env:PATH
& ..\SpeechNote\.venv\Scripts\python.exe -B -m whisperlivekit.basic_server --host 127.0.0.1 --port 8001 --model tiny --model_dir ../SpeechNote/.venv/faster-whisper-tiny --language ru --backend faster-whisper --backend-policy localagreement --pcm-input --log-level INFO --warmup-file examples/speechnote-ru.wav
```

Дождитесь Application startup complete и откройте [командную страницу](http://127.0.0.1:8001/). Этот терминал занят сервером. Для Git откройте второй Terminal через «+». Для остановки командного процесса нажмите Ctrl+C в первом терминале. Если порт занят уже запущенной командной копией, откройте её страницу.

## На компьютере другого участника

Сначала клонируйте командный репозиторий и переключитесь на свою ветку от team-main по инструкции PyCharm. Установите зависимости и модель один раз по шагам ниже. Для запуска используйте порт 8001.

Для выбранной версии нужны 64-разрядный Python 3.11–3.13, Git и FFmpeg. На компьютере для защиты использован Python 3.13.3. Найденный FFmpeg из iGameCenter запускающий скрипт подхватывает автоматически. На другом компьютере добавьте каталог своего FFmpeg в PATH текущего терминала.

```powershell
git --version
python --version
ffmpeg -version
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -e .
.\.venv\Scripts\python.exe -m pip check
```

Для автономного запуска заранее загрузите четыре файла проверенной ревизии многоязычной модели. Команда `hf` входит в зависимости WhisperLiveKit.

```powershell
.\.venv\Scripts\hf.exe download Systran/faster-whisper-tiny config.json tokenizer.json vocabulary.txt model.bin --revision d90ca5fe260221311c53c58e660288d3deb8d356 --local-dir .venv/faster-whisper-tiny
.\start-speechnote.ps1 -Port 8001
```

При наличии локального каталога скрипт передаёт его серверу через `--model_dir`. При его отсутствии WhisperLiveKit загружает `tiny` при первом старте. Контрольный WAV для прогрева уже входит в проект. Модель и виртуальное окружение в Git не включены. [Оригинал модели](https://huggingface.co/Systran/faster-whisper-tiny/tree/d90ca5fe260221311c53c58e660288d3deb8d356)

<details>
<summary>Если Windows прерывает сборку редактируемого пакета</summary>

На компьютере для защиты вложенный процесс сборки pip завершался с ошибкой. Из корня проекта в PowerShell применён следующий способ. Он использует тот же набор зависимостей из `pyproject.toml` и регистрирует исходную папку в созданном окружении.

```powershell
$python = (Resolve-Path .venv\Scripts\python.exe).Path
$env:PYTHONUTF8 = "1"
$requirements = python -c "import tomllib; p=tomllib.load(open('pyproject.toml','rb')); print(*p['project']['dependencies'],*p['build-system']['requires'],sep='\n')"
& $python -m pip install $requirements
$build = New-Item -Force -ItemType Directory .venv\buildtmp
$env:TEMP = $build.FullName
$env:TMP = $build.FullName
& $python -c "from setuptools.build_meta import build_editable; print(build_editable('.venv'))"
$wheel = (Get-ChildItem .venv\whisperlivekit*.whl | Select-Object -First 1).FullName
& $python -m pip install --no-deps $wheel
& $python -m pip check
```

</details>

## Устройство приложения

База — WhisperLiveKit 0.2.28, коммит `edcbaef02f386d4774f978e4a87e59029337d045`. Профиль запуска использует Faster-Whisper, политику LocalAgreement, язык `ru`, модель `tiny` и CPU. Установка CUDA, Docker и дополнительных моделей для этого профиля не требуется. [Исходный проект и его документация](https://github.com/QuentinFuxa/WhisperLiveKit/tree/edcbaef02f386d4774f978e4a87e59029337d045)

Штатная страница находится в `whisperlivekit/web/live_transcription.html`, стили и логика — в соседних `live_transcription.css` и `live_transcription.js`. Исходный обработчик `GET /` вызывает `get_inline_ui_html()` из `web_interface.py`. В SpeechNote этот сборщик встраивает `speechnote.html`, CSS, клиентский JavaScript и штатные `pcm_worklet.js` и `recorder_worker.js` в один ответ. Страница работает без CDN и сборки Node.js. Исходные ресурсы стандартного клиента по-прежнему доступны инструментам upstream, включая сборщик расширения Chrome.

| Действие | Как оно выполнено |
| --- | --- |
| Статус сервера | `GET /health` проверяет поле `ready`. |
| Микрофон | Браузер получает медиапоток через `getUserMedia`. В проверенном профиле AudioWorklet и Worker готовят моно PCM 16 кГц для `/asr?language=ru`. Пустой бинарный пакет завершает ввод. Клиент ждёт `ready_to_stop`. |
| Аудиофайл | `POST /v1/audio/transcriptions` принимает multipart-поля `file`, `language=ru`, `response_format=json`. Сервер декодирует файл через FFmpeg. Лимит исходного сервера — 512 МиБ. |
| Текст | Клиент отображает подтверждённые строки и предварительный буфер, пропускает интервалы тишины. Копирование, TXT и очистка выполняются в браузере. |


## Последующий запуск на сервере

На Linux-сервере с Python 3.11–3.13 и FFmpeg клонируйте командный репозиторий, перейдите в корень и выполните команды. Для Ubuntu пакет FFmpeg устанавливается через `sudo apt install ffmpeg`. Профиль рассчитан на CPU.

```bash
python3 -m venv .venv
.venv/bin/python -m pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu
.venv/bin/python -m pip install -e .
.venv/bin/hf download Systran/faster-whisper-tiny config.json tokenizer.json vocabulary.txt model.bin --revision d90ca5fe260221311c53c58e660288d3deb8d356 --local-dir .venv/faster-whisper-tiny
CUDA_VISIBLE_DEVICES=-1 OMP_NUM_THREADS=4 .venv/bin/python -m whisperlivekit.basic_server \
  --host 127.0.0.1 --port 8000 --model tiny --model_dir .venv/faster-whisper-tiny \
  --language ru --backend faster-whisper --backend-policy localagreement \
  --pcm-input --log-level INFO --warmup-file examples/speechnote-ru.wav
```

Для закрытой демонстрации с другого компьютера откройте на нём SSH-туннель, заменив `user@server` адресом своей учётной записи:

```bash
ssh -N -L 127.0.0.1:8080:127.0.0.1:8000 user@server
```

Откройте [локальный вход в туннель](http://127.0.0.1:8080/). Микрофон берётся с компьютера выступающего, распознавание выполняется на сервере. Для доступа по общему домену настройте HTTPS, авторизацию на обратном прокси и передачу WebSocket для `/asr`. Клиент выбирает `wss:` при открытии по HTTPS.

## Авторы и лицензия

WhisperLiveKit создан Quentin Fuxa и участниками исходного проекта. Его лицензия Apache-2.0 и сведения об авторстве сохранены в [LICENSE](LICENSE) и [CITATION.cff](CITATION.cff). SpeechNote изменяет веб-интерфейс в рамках учебного проекта цифровых кафедр ТПУ. [Исходный репозиторий](https://github.com/QuentinFuxa/WhisperLiveKit) · [Дополнительный обзор на Хабре](https://habr.com/ru/articles/976422/)
