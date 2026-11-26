(() => {
  const badge = SN.el("connection");
  let pending = false;
  async function check() {
    if (pending) return;
    pending = true;
    try {
/* ШАГ 7.1 */
      throw new Error("Проверка ещё не подключена");
      badge.dataset.state = "ready";
      badge.textContent = "Сервер готов";
    } catch {
      badge.dataset.state = "error";
      badge.textContent = "Нет связи с сервером";
    } finally {
      pending = false;
    }
  }
/* ШАГ 7.2 */
  check();
/* ШАГ 7.3 */
})();
