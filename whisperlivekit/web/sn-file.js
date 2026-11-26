(() => {
  const input = SN.el("audiofile"), upload = SN.el("upload");
  function controls() { upload.disabled = SN.busy || !input.files.length; }
/* ШАГ 4.1 */
  input.onchange = controls;
  document.addEventListener("sn-control-change", controls);
  upload.onclick = async () => {
    const file = input.files[0];
    if (SN.busy || !file) return;
/* ШАГ 4.2 */
    SN.lock(true);
    SN.notice("Распознаём «" + file.name + "»…");
    try {
      const data = new FormData();
      data.set("file", file);
      data.set("language", "ru");
      data.set("response_format", "json");
      const response = await fetch(SN.endpoint("v1/audio/transcriptions"), {method:"POST", body:data});
/* ШАГ 4.3 */
      if (!response.ok) throw new Error("Ошибка загрузки");
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
