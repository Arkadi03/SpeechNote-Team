(() => {
  const badge = SN.el("connection");
  let pending = false;
  async function check() {
    if (pending) return;
    pending = true;
    try {
      const response = await fetch(SN.endpoint("health"), {cache: "no-store", signal: AbortSignal.timeout(5000)});
      if (!response.ok) throw new Error();
      const health = await response.json();
      if (!health.ready) throw new Error();
      SN.setSpeakerAvailability(health.diarization_available === true);
      badge.dataset.state = "ready";
      badge.textContent = "Сервер готов";
    } catch {
      badge.dataset.state = "error";
      badge.textContent = "Нет связи с сервером";
    } finally {
      pending = false;
    }
  }
  document.addEventListener("sn-check", check);
  window.addEventListener("online", check);
  window.addEventListener("offline", check);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) check(); });
  setInterval(() => { if (!document.hidden) check(); }, 30000);
  check();
  const steps = [
    "Для записи нажмите «Начать запись», разрешите браузеру использовать микрофон и произнесите несколько фраз. Нажмите «Остановить» и дождитесь завершения.",
    "Для готовой записи выберите «Аудиофайл», укажите файл и нажмите «Распознать файл». Новый результат добавится после предыдущего.",
    "Пока идёт запись, предварительные слова выделяются курсивом и могут измениться. После завершения скопируйте текст или скачайте его в TXT. Обновление страницы очищает расшифровку.",
    "Если микрофон недоступен, проверьте разрешение в браузере и выбранное устройство Windows. Открывайте SpeechNote через localhost или HTTPS."
  ];
  const list = document.createElement("ol");
  for (const step of steps) {
    const li = document.createElement("li");
    li.textContent = step;
    list.append(li);
  }
  SN.el("help-text").append(list);
})();
