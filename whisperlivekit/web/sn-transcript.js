// The server sends full snapshots. Only the final snapshot is appended to history.
SN.transcript = (() => {
  let history = "";
  let current = "";
  let draft = "";
  const text = () => [history, current].filter(Boolean).join("\n\n");
  function render() {
    SN.el("transcript").textContent = text();
    SN.el("draft").textContent = draft;
/* ШАГ 5.1 */
    document.dispatchEvent(new Event("sn-control-change"));
  }
  function update(snapshot) {
/* ШАГ 5.2 */
    current = (snapshot.lines || []).map(line => line.text || "").join(" ");
/* ШАГ 5.3 */
    render();
  }
  function append(value) {
    history = [history, value.trim()].filter(Boolean).join("\n\n");
    current = draft = "";
    render();
  }
  return {
    text, update, append,
    finish() { append([current, draft].filter(Boolean).join(" ")); },
    interrupted() { append(current); },
    clear() { history = current = draft = ""; render(); }
  };
})();
