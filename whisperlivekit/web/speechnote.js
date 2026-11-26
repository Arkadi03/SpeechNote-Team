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
