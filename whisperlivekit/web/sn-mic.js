(() => {
  const button = SN.el("record");
  let active = null;
  function sync() {
    button.disabled = active ? active.phase === "finishing" : SN.busy;
    const labels = {connecting:"Отменить", recording:"Остановить", finishing:"Завершение…"};
    button.textContent = labels[active?.phase] || "Начать запись";
    button.classList.toggle("recording", active?.phase === "recording");
    document.querySelector(".monitor").classList.toggle("active", active?.phase === "recording");
  }
  document.addEventListener("sn-control-change", sync);

  function release(s) {
    clearInterval(s.clock);
    clearTimeout(s.deadline);
    s.stream?.getTracks().forEach(track => track.stop());
    s.node?.disconnect();
    s.source?.disconnect();
    s.worker?.terminate();
    if (s.context && s.context.state !== "closed") s.context.close().catch(() => {});
    for (const url of s.urls) URL.revokeObjectURL(url);
  }
  function end(s, error, cancelled = false) {
    if (active !== s) return;
    active = null;
    release(s);
    if (s.socket && s.socket.readyState < WebSocket.CLOSING) s.socket.close();
    if (error) SN.transcript.interrupted();
    else SN.transcript.finish();
    SN.lock(false);
    SN.notice(error || (s.heard ? "Запись обработана." : "Речь в записи не распознана."), Boolean(error) && !cancelled);
    if (error && !cancelled) document.dispatchEvent(new Event("sn-check"));
  }
  function deadline(s, ms, message) {
    clearTimeout(s.deadline);
    s.deadline = setTimeout(() => end(s, message), ms);
  }
  function eof(s) {
    if (active === s && s.socket.readyState === WebSocket.OPEN) s.socket.send(new ArrayBuffer(0));
  }
  function send(s, data) {
    if (active !== s || s.socket.readyState !== WebSocket.OPEN) return;
    if (s.socket.bufferedAmount > 4 * 1024 * 1024) {
      end(s, "Соединение слишком медленное. Сохранён подтверждённый текст.");
      return;
    }
    s.socket.send(data);
  }
  function blobUrl(s, id, suffix = "") {
    const source = SN.el(id).textContent + suffix;
    const url = URL.createObjectURL(new Blob([source], {type:"application/javascript"}));
    s.urls.push(url);
    return url;
  }
  async function capture(s, usePCM) {
    if (usePCM) {
      s.context = new AudioContext({sampleRate:16000});
      await s.context.resume();
      if (active !== s) return;
      await s.context.audioWorklet.addModule(blobUrl(s, "pcm-worklet"));
      if (active !== s) return;
      s.node = new AudioWorkletNode(s.context, "pcm-forwarder", {numberOfOutputs:0, channelCount:1});
      // A barrier lets the upstream worker send queued PCM chunks before EOF.
      const barrier = "\nself.addEventListener('message', e => { if (e.data.command === 'finish') self.postMessage({drained:true}); });";
      s.worker = new Worker(blobUrl(s, "pcm-worker", barrier));
      s.worker.onerror = () => end(s, "Браузер прервал обработку звука.");
      s.worker.onmessage = ({data}) => data.drained ? eof(s) : send(s, data.buffer);
      s.worker.postMessage({command:"init", config:{sampleRate:s.context.sampleRate}});
      s.node.port.onmessage = ({data}) => {
        if (active === s && s.phase === "recording") s.worker.postMessage({command:"record", buffer:data.buffer}, [data.buffer]);
      };
      s.source = s.context.createMediaStreamSource(s.stream);
      s.source.connect(s.node);
    } else {
      s.recorder = new MediaRecorder(s.stream);
      s.recorder.ondataavailable = ({data}) => { if (data.size) send(s, data); };
      s.recorder.onstop = () => eof(s);
      s.recorder.onerror = () => end(s, "Браузер прервал запись.");
      s.recorder.start(250);
    }
    s.phase = "recording";
    s.started = Date.now();
    SN.el("timer").textContent = "00:00";
    s.clock = setInterval(() => {
      const sec = Math.floor((Date.now() - s.started) / 1000);
      SN.el("timer").textContent = [Math.floor(sec / 60), sec % 60].map(n => String(n).padStart(2, "0")).join(":");
    }, 250);
    clearTimeout(s.deadline);
    sync();
    SN.notice("Идёт запись. Говорите в микрофон.");
  }
  async function start() {
    if (SN.busy) return;
    if (!navigator.mediaDevices?.getUserMedia) { SN.notice("Для записи откройте localhost или HTTPS в браузере с поддержкой микрофона.", true); return; }
    const s = {phase:"connecting", urls:[], heard:false};
    active = s;
    SN.lock(true);
    SN.notice("Ожидаем разрешения на микрофон…");
    try {
      s.stream = await navigator.mediaDevices.getUserMedia({audio:{channelCount:1}});
      if (active !== s) {
        s.stream.getTracks().forEach(track => track.stop());
        return;
      }
      SN.notice("Подключаем микрофон к серверу…");
      const url = SN.endpoint("asr");
      url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
      url.searchParams.set("language", "ru");
      url.searchParams.set("diarization", String(SN.speakers()));
      s.socket = new WebSocket(url);
      deadline(s, 15000, "Сервер не ответил на запрос записи.");
      s.socket.onerror = () => end(s, "Не удалось подключить микрофон к серверу.");
      s.socket.onclose = () => end(s, "Связь прервана. Сохранён подтверждённый текст.");
      s.stream.getAudioTracks()[0].onended = () => { if (active === s && s.phase === "recording") stop(s); };
      s.socket.onmessage = async ({data}) => {
        if (active !== s) return;
        try {
          const message = JSON.parse(data);
          if (message.type === "config") await capture(s, message.useAudioWorklet);
          else if (message.type === "ready_to_stop") end(s);
          else if (message.type === "error" || message.status === "error") end(s, "Сервер не смог обработать запись.");
          else if (Array.isArray(message.lines)) {
            SN.transcript.update(message);
            s.heard = Boolean(message.buffer_transcription?.trim() || message.lines.some(line => Number(line.speaker) !== -2 && line.text?.trim()));
          }
        } catch { end(s, "Не удалось обработать поток звука. Проверьте браузер и подключение."); }
      };
    } catch (error) {
      const messages = {NotAllowedError:"Доступ к микрофону запрещён. Разрешите запись в настройках сайта.", NotFoundError:"Микрофон не найден.", NotReadableError:"Микрофон занят или недоступен."};
      end(s, messages[error.name] || "Не удалось начать запись.");
    }
  }
  function stop(s) {
    s.phase = "finishing";
    clearInterval(s.clock);
    sync();
    SN.notice("Завершаем распознавание…");
    deadline(s, 120000, "Сервер не завершил запись вовремя. Сохранён подтверждённый текст.");
    if (s.worker) {
      s.source.disconnect();
      s.node.port.onmessage = null;
      s.worker.postMessage({command:"finish"});
    } else if (s.recorder.state !== "inactive") s.recorder.stop();
    s.stream.getTracks().forEach(track => track.stop());
  }
  button.onclick = () => {
    if (!active) start();
    else if (active.phase === "recording") stop(active);
    else if (active.phase === "connecting") end(active, "Запись отменена.", true);
  };
  window.addEventListener("pagehide", () => {
    if (active) end(active, "Запись остановлена.");
  });
})();
