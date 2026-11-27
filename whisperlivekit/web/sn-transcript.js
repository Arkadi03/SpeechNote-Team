// The server sends full snapshots. Only the final snapshot is appended to history.
SN.transcript = (() => {
  const notebooks = new Map();
  let notebook = "meeting";
  let history = "";
  let current = "";
  let draft = "";
  const text = () => [history, current].filter(Boolean).join("\n\n");
  function render() {
    SN.el("transcript").textContent = text();
    SN.el("draft").textContent = draft;
    SN.el("empty").hidden = Boolean(text() || draft);
    document.dispatchEvent(new Event("sn-control-change"));
  }
  function update(snapshot) {
    current = (snapshot.lines || [])
      .filter(line => Number(line.speaker) !== -2 && line.text)
      .map(line => SN.speakers() && line.speaker_assigned !== false && Number(line.speaker) > 0
        ? "Говорящий " + line.speaker + ": " + line.text.trim() : line.text.trim()).filter(Boolean).join("\n");
    draft = (snapshot.buffer_transcription || "").trim();
    render();
  }
  function append(value) {
    history = [history, value.trim()].filter(Boolean).join("\n\n");
    current = draft = "";
    render();
  }
  return {
    text, update, append,
    select(name) {
      notebooks.set(notebook, history);
      notebook = name;
      history = notebooks.get(name) || "";
      current = draft = "";
      render();
    },
    finish() { append([current, draft].filter(Boolean).join(" ")); },
    interrupted() { append(current); },
    clear() { history = current = draft = ""; render(); }
  };
})();
