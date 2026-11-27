(() => {
  const input = SN.el("audiofile"), upload = SN.el("upload");
  function controls() { upload.disabled = SN.busy || !input.files.length; }
  input.onchange = () => {
    SN.el("filename").textContent = input.files[0]?.name || "Выбрать аудиофайл";
    SN.notice("");
    controls();
  };
  document.addEventListener("sn-control-change", controls);
  upload.onclick = async () => {
    const file = input.files[0];
    if (SN.busy || !file) return;
    if (!file.size) { SN.notice("Выбран пустой файл.", true); return; }
    if (file.size > 512 * 1024 * 1024) { SN.notice("Размер файла превышает 512 МБ.", true); return; }
    SN.lock(true);
    SN.notice("Распознаём «" + file.name + "»…");
    try {
      const data = new FormData();
      data.set("file", file);
      data.set("language", "ru");
      data.set("diarization", String(SN.speakers()));
      data.set("response_format", SN.speakers() ? "diarized_json" : "json");
      const response = await fetch(SN.endpoint("v1/audio/transcriptions"), {method:"POST", body:data});
      if (!response.ok) {
        const messages = {400:"Проверьте формат и содержимое аудиофайла.", 401:"Сервер запросил авторизацию.", 408:"Сервер не успел обработать запись.", 413:"Файл слишком большой.", 503:"Сервер занят. Повторите позже."};
        throw new Error(messages[response.status] || "Ошибка сервера (HTTP " + response.status + ").");
      }
      const result = await response.json();
      if (typeof result.text !== "string") throw new Error("Сервер вернул неожиданный ответ.");
      if (result.text.trim()) SN.transcript.append(result.text);
      SN.notice(result.text.trim() ? "Файл обработан." : "Речь в файле не распознана.");
    } catch (error) {
      SN.notice(error instanceof TypeError ? "Не удалось передать файл. Проверьте связь с сервером." : error.message, true);
      document.dispatchEvent(new Event("sn-check"));
    } finally {
      SN.lock(false);
    }
  };
})();
