(() => {
  const copy = SN.el("copy"), save = SN.el("save"), clear = SN.el("clear");
  document.addEventListener("sn-control-change", () => {
    const disabled = SN.busy || !SN.transcript.text();
    for (const button of [copy, save, clear]) button.disabled = disabled;
  });
  copy.onclick = async () => {
    try {
      await navigator.clipboard.writeText(SN.transcript.text());
      SN.notice("Текст скопирован.");
    } catch {
      const range = document.createRange();
      range.selectNodeContents(SN.el("transcript"));
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      SN.notice("Браузер ограничил доступ к буферу. Текст выделен для ручного копирования.", true);
    }
  };
  save.onclick = () => {
    const url = URL.createObjectURL(new Blob([SN.transcript.text()], {type:"text/plain;charset=utf-8"}));
    const link = document.createElement("a");
    link.href = url;
    link.download = "SpeechNote-" + new Date().toISOString().slice(0, 10) + ".txt";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  };
  clear.onclick = () => {
    SN.transcript.clear();
    SN.notice("Расшифровка очищена.");
  };
})();
