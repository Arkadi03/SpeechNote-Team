# Участник 2. Оформление

1. Выполните разделы «Подключение» и «Своя ветка» в [инструкции PyCharm](00-PyCharm.md). Имя вашей ветки — `feature/theme`.
2. В левой панели Project откройте `whisperlivekit/web/speechnote.css`. Все три коммита касаются этого файла.
3. Запустите командную копию по README на порту 8001. После каждого изменения сохраните файл (Ctrl+S) и обновите страницу (Ctrl+F5).

## 1. Задать палитру и шрифт

Нажмите Ctrl+F, найдите `/* ШАГ 2.1 */`, затем Esc. Замените следующий блок целиком, включая строку метки.

```
/* ШАГ 2.1 */
```

Вставьте на его место следующий код.

```css
:root {
  color-scheme:dark;
  --bg:#101718;
  --card:#1c2628;
  --edge:#3a4849;
  --text:#f2f5ef;
  --muted:#adbfbb;
  --accent:#a4edd3;
  --ink:#112e25;
  font:16px/1.55 "Segoe UI",Arial,sans-serif;
}
```

Проверка. Фон стал тёмным, основной текст светлым, кнопка записи мятной.

Откройте Commit (Ctrl+K), отметьте только `whisperlivekit/web/speechnote.css`, изучите разницу и нажмите Commit с сообщением **Задать палитру и шрифт**.

## 2. Оформить рабочие панели

Нажмите Ctrl+F, найдите `/* ШАГ 2.2 */`, затем Esc. Замените следующий блок целиком, включая строку метки.

```
/* ШАГ 2.2 */
```

Вставьте на его место следующий код.

```css
.workspace {
  display:grid;
  grid-template-columns:minmax(260px,.82fr) minmax(0,1.48fr);
  gap:18px;
  align-items:stretch;
}

.card {
  min-width:0;
  padding:24px;
  background:var(--card);
  border:1px solid var(--edge);
  border-radius:18px;
}

h2 {
  font-size:22px;
  line-height:1.25;
  letter-spacing:-.03em;
  margin:0;
}
```

Проверка. На широком экране появились две карточки в одном ряду.

Откройте Commit (Ctrl+K), отметьте только `whisperlivekit/web/speechnote.css`, изучите разницу и нажмите Commit с сообщением **Оформить рабочие панели**.

## 3. Адаптировать панели к телефону

Нажмите Ctrl+F, найдите `/* ШАГ 2.3 */`, затем Esc. Замените следующий блок целиком, включая строку метки.

```
/* ШАГ 2.3 */
```

Вставьте на его место следующий код.

```css
@media(max-width:760px) {
  .frame {
    width:calc(100% - 32px);
  }
  .workspace {
    grid-template-columns:1fr;
  }
  .card {
    padding:18px;
  }
  .intro {
    padding:32px 0 22px;
  }
  .bar {
    min-height:64px;
  }
  .paper {
    min-height:135px;
  }
  .tools .quiet {
    margin-left:0;
  }
}

@media(prefers-reduced-motion:reduce) {
  .signal i {
    animation:none!important;
  }
}
```

Проверка. Сузьте окно до 375 пикселей. Карточки выстроятся одна под другой.

Откройте Commit (Ctrl+K), отметьте только `whisperlivekit/web/speechnote.css`, изучите разницу и нажмите Commit с сообщением **Адаптировать панели к телефону**.

После трёх проверок выполните Push и откройте PR по [инструкции PyCharm](00-PyCharm.md). Опишите своими словами результат каждой проверки и укажите использование выданных заготовок.
