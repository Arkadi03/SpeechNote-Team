SN.speakers = () => SN.el("speakers").checked;
SN.setSpeakerAvailability = available => {
  const box = SN.el("speakers");
  box.disabled = !available;
  if (!available) box.checked = false;
  SN.el("speaker-state").textContent = available
    ? "Настройка применяется к следующим записям и загрузкам в обоих разделах."
    : "Для разделения голосов запустите сервер с профилем диаризации (см. README).";
};

(() => {
  const token = SN.el("llm-token");
  const address = SN.el("llm-url");
  address.addEventListener("input", () => { token.value = ""; });
  window.addEventListener("pagehide", () => { token.value = ""; });
  function endpoint() {
    let url;
    try { url = new URL(address.value.trim()); }
    catch { throw new Error("Укажите полный URL API в настройках."); }
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (url.username || url.password || url.search || url.hash ||
        !(url.protocol === "https:" || (local && url.protocol === "http:"))) {
      throw new Error("Введите HTTPS-адрес без пароля, параметров и фрагмента. Для localhost доступен HTTP.");
    }
    url.pathname = url.pathname.replace(/\/+$/, "");
    if (!url.pathname.endsWith("/chat/completions")) {
      url.pathname = (url.pathname === "/" ? "/v1" : url.pathname) + "/chat/completions";
    }
    return url;
  }
  SN.llmConfig = () => {
    const model = SN.el("llm-model").value.trim();
    if (!model) throw new Error("Укажите имя модели в настройках.");
    const url = endpoint();
    const headers = {"Content-Type":"application/json"};
    if (token.value.trim()) headers.Authorization = "Bearer " + token.value.trim();
    return {model, url, headers};
  };
})();
