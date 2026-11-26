(() => {
  const copy = SN.el("copy"), save = SN.el("save"), clear = SN.el("clear");
  document.addEventListener("sn-control-change", () => {
    const disabled = SN.busy || !SN.transcript.text();
    for (const button of [copy, save, clear]) button.disabled = disabled;
  });
/* ШАГ 6.1 */
/* ШАГ 6.2 */
/* ШАГ 6.3 */
})();
