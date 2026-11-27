// Shared DOM and session contract for the SpeechNote panels.
const SN = {
  el: id => document.getElementById(id),
  busy: false,
  lock(value) {
    this.busy = value;
    for (const id of ["tab-mic", "tab-file", "audiofile"]) this.el(id).disabled = value;
    document.dispatchEvent(new Event("sn-control-change"));
  },
  notice(message, error = false) {
    this.el("notice").textContent = message;
    this.el("notice").dataset.error = String(error);
  },
  endpoint(path) {
    return new URL(path, document.baseURI);
  }
};
for (const name of ["mic", "file"]) {
  SN.el("tab-" + name).onclick = () => {
    if (SN.busy) return;
    for (const panel of ["mic", "file"]) {
      SN.el(panel + "-panel").hidden = panel !== name;
      SN.el("tab-" + panel).setAttribute("aria-pressed", String(panel === name));
    }
    SN.notice("");
  };
}
SN.mode = "meeting";
const sections = {
  meeting:["Совещание", "Запишите речь или выберите аудиофайл, чтобы получить текст на русском языке."],
  conference:["Конференция", "Распознайте выступление и подготовьте вопросы по его содержанию."],
  settings:["Настройки", "Выберите службу генерации вопросов и режим распознавания речи."]
};
const modeButtons = document.querySelectorAll("[data-mode]");
for (const button of modeButtons) {
  button.onclick = () => {
    const mode = button.dataset.mode;
    if (SN.busy || mode === SN.mode) return;
    SN.mode = mode;
    if (mode !== "settings") SN.transcript.select(mode);
    for (const item of modeButtons) item.setAttribute("aria-pressed", String(item === button));
    SN.el("studio").hidden = mode === "settings";
    SN.el("conference-tools").hidden = mode !== "conference";
    SN.el("settings").hidden = mode !== "settings";
    SN.el("title").textContent = sections[mode][0];
    SN.el("description").textContent = sections[mode][1];
    SN.notice("");
  };
}
document.addEventListener("sn-control-change", () => {
  for (const button of modeButtons) button.disabled = SN.busy;
});
