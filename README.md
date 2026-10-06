# King of the Hill — V.07: сетевая арена

## Запуск с друзьями по Wi-Fi

1. Установи Node.js 22 или новее на компьютер, который будет сервером.
2. Скачай свежий ZIP репозитория и распакуй. Открой папку с `package.json` в VS Code.
3. В терминале этой папки выполни `npm start`. Установка npm-пакетов не нужна.
4. На компьютере сервера открой `http://localhost:5173`, нажми **ОНЛАЙН** и создай комнату.
5. Терминал также выводит адрес вида `http://192.168.1.10:5173`. Друзья в той же сети открывают **этот адрес** и вводят код комнаты. `localhost` на их компьютерах не указывает на твой сервер.
6. Все нажимают **Готов**. После трёхсекундного отсчёта начинается матч.

Для проверки можно открыть две вкладки и войти в одну комнату под разными именами. Для реальной игры нужны клавиатура и мышь. Если сетевой адрес не открывается, разреши Node.js входящие подключения в системном брандмауэре; гостевой Wi-Fi иногда запрещает связь между устройствами.

Python `http.server` по-прежнему подходит для одиночных карт, но **не запускает сетевую игру**. Сервер должен оставаться включённым. Сохранения аккаунтов и база данных не нужны: комнаты живут в памяти и исчезают после остановки сервера. Публичного адреса в интернете пока нет.

## Правила сетевой арены

- Отдельная Изумрудная арена, 2–10 участников, без ботов. Все начинают с кулаками и 100 HP.
- Шесть маршрутов наверх. Первые шесть сундуков с оружием — после двух прыжков; выше случайные мечи, луки с 8 стрелами и аптечки (+35 HP). Новые сундуки периодически возникают на незатопленных островках.
- Движение и взаимодействие используют настройки W/A/S/D или стрелок и E/H из одиночного меню. Оружие: 1 — кулаки, 2 — меч, 3 — лук.
- J / ЛКМ — удар. С луком удерживай до 1,2 секунды и отпускай для выстрела, мышь задаёт направление. Без мыши выстрел направлен в сторону взгляда. Есть индикатор натяжения и линия прицела.
- Лава начинает подниматься через 12 секунд. Возле вершины она останавливается, блоки вершины случайно трескаются, предупреждают 1,15 секунды и проваливаются в лаву.
- Последний живой побеждает на любой высоте. Одновременная гибель всех в одном серверном шаге — ничья. Возрождения в раунде нет.
- Умершие и вошедшие во время игры наблюдают, переключая камеру стрелками на экране. Выход — поражение; потеря связи более 15 секунд тоже исключает участника.
- После матча все снова нажимают «Готов». Новый состав комнаты сбрасывает готовность. Esc не приостанавливает общий матч.
- При смерти на сухой платформе меч и лук остаются как доступная добыча. При падении в лаву снаряжение теряется. Авторегенерации нет.

## Реализация и проверка

`server.mjs` запускает HTTP-сервер и общую симуляцию 60 Гц. Клиенты передают только ввод; позиции, здоровье, сундуки, стрелы, лава и итог рассчитываются сервером. Снимки мира приходят через SSE примерно 20 раз в секунду, ввод отправляется последовательными POST-запросами 20 раз в секунду. Клиент сглаживает отображение игроков. Это первая LAN-версия: задержки дальнего интернета и реальные матчи на десяти устройствах ещё требуют игрового тестирования.

`npm test` проверяет одиночные карты и сетевые правила, а также HTTP-подключение двух клиентов и получение общего снимка мира. Можно изменить порт: `PORT=8000 npm start` на macOS/Linux.

---

## История одиночного режима

# King of the Hill

A fresh browser prototype of a side-view parkour combat game. Climb floating ruins, loot weapons, survive traps, knock opponents away and claim the crown.

## Run

Requires Node.js 20+; no packages or build step needed.

```sh
npm start
```

Open http://localhost:5173. Alternatively, run `python3 -m http.server 8000` from the folder containing `index.html` and open http://localhost:8000. Use a desktop keyboard and mouse. `npm test` runs the physics and combat regression tests. Any static web server can host this directory; keep the file structure intact. This repository update does not automatically publish a website.

## Controls

| Key | Action |
| --- | --- |
| W | Jump (release before the next jump) |
| A / D | Move left / right |
| S | Crouch; release to stand when there is room |
| E | Open a nearby chest |
| J / Left mouse | Attack in the direction you face |
| 1 | Fists (always available) |
| 2 | Sword when acquired |
| 3 | Bow when acquired |
| 4 | Pickaxe when acquired |
| Escape | Pause / resume |

## Included

- Main menu, controls panel, persistent volume / camera shake / particle settings, pause and victory screens.
- Three separately authored maps: Emerald Ruins (saws and spikes), Frostbound Heights (slippery ice, crosswinds, falling icicles and archers), Ashen Citadel (timed fire jets, lava, heavy masonry and sword guards).
- Fixed-step physics, animated character, coyote time, jump buffering, moving platforms and low passages.
- Health, spike traps, moving saws, bottom-of-world respawn at the initial spawn, and crown victory condition.
- Sword, bow, projectiles, attack cooldowns, knockback, temporary damage immunity and biome-specific local sparring bots.
- Chest reset and loss of collected weapons on death. Infinite arrows in this prototype.
- Procedural Canvas artwork and synthesized sound effects. No external fonts, images, audio assets, services, or dependencies.

## Scope

This is an offline frontend / gameplay prototype, not networked PvP. Bots patrol their platforms and attack nearby; they are not human players and do not race to the summit. No accounts, matchmaking, backend, database or mobile touch controls yet. All three arenas share the initial crouch tutorial, but have independent routes, platform spacing, summit heights, enemies and environmental mechanics. Fire jets telegraph before activating. Player health follows the character; keyboard and inventory buttons use the same weapon selection logic.

## Code

- `src/engine.js`: level data, physics, damage, loot and win/respawn logic, independent of the DOM.
- `src/render.js`: procedural scene and character rendering.
- `src/main.js`: input, menus, audio, persistence and animation loop.
- `style.css`: interface design.

The previous Python/Kivy code, Buildozer config, images, font and soundtrack have been removed from the current tree. Earlier versions remain in Git history.

## Version 0.3

- Click each movement key in the Controls dialog to toggle its WASD default to its matching arrow. Each binding is independent, stored locally, and used by both input handling and on-screen / in-world hints.
- Lobby scenery travels horizontally toward the selected biome with a blurred transition. Rapid selections capture the current frame; reduced-motion preferences skip the travel animation.
- Underside ice spikes now deal 15 damage (with the normal immunity interval), including on moving platforms.
- Frost: collect the pickaxe at the former summit, equip slot 4, then jump from alternating walls. Holding toward a wall slows descent. Release and press the configured jump key for each jump. Six more ledges follow the shaft.
- Ash: stepping onto the sand beyond the former summit collapses it into a sealed three-guard arena. Guards have 60 HP and never respawn until a new run. Defeated guards stay dead if the player dies; the player respawns in the active arena with collected equipment. Killing all three opens the exit staircase and enables the crown.
- Emerald: two non-solid decorative trees shelter two 30-HP snakes. Snakes telegraph bites for 0.6 seconds and deal 8 damage. Two ordinary bots replace the former four to keep the tutorial forgiving.

Run `npm test` for controls, physics, hazards, complete pickaxe ascent and arena lifecycle checks. Browser visual QA has not been performed in the current execution environment.

## Version 0.4

- The right-hand guard island at y=460 before the pickaxe shaft no longer has underside icicles. Other platforms keep their ice hazards.
- Two tall, twisted hollow trees replace the small ruin trees. Their snakes remain hidden until the player lands on the same island, emerge for one second, then pursue the player without walking off the platform.
- Snakes now have 75 HP (three sword hits), a telegraphed 8-damage bite, and a non-stacking four-second poison that deals 2 damage per second. Repeated bites refresh the duration. The overhead health display shows the remaining poison time; healing chests and respawn remove it.
- The Controls dialog now also toggles E/H. The saved binding drives chest interaction, HUD hints and the nearby chest prompt.

28 automated tests pass, including emergence, pursuit, multi-hit snake combat, poison expiry/cure and E/H chest interaction. Visual browser verification remains unavailable in this environment.

## Version 0.5

- Lobby travel now animates for 1.6 seconds and is controlled by the in-game travel checkbox (on by default), rather than being silently skipped by an OS reduced-motion preference.
- The sand arena has three total lives. The third death ends the run; restart explicitly from the defeat screen. A new run restores all three guards and lives.
- An unlabelled crawl passage midway up Frost has overhead icicles: crouching is safe, standing takes damage.
- Snake poison now deals 10 HP each second for four seconds; healing still cures it.
- Pick up a reusable vine near the first snake tree with the configured E/H key. Equip slot 5, aim at the ring above the final Emerald gap and throw with mouse/J. With no mouse aim, J aims toward the visible ring in the facing direction. Move right off the ledge after attaching, pump with movement keys, and press jump to release if desired. The tower vine catches you automatically after the swing. Hold your jump key (W/up) to climb; crouch (S/down) descends. Defeat the roof guard to open the onward ledges. Death resets the carried vine and makes the pickup available again.
- The stone tower is solid; the gap exceeds the maximum ordinary jump distance. Vine simulation uses pendulum motion and gradual climbing rather than teleportation.

35 regression tests cover the full crossing, aiming, guard gate, crawl damage, three-life defeat and directional lobby travel logic. Actual browser visual QA is still not available here.

## Version 0.6

The final seven Emerald terraces are 350px wide and progressively turn left. The launch terrace ends at x=390; the far-right tower starts at x=1320, leaving a 930px ravine. The overhead anchor and vine range are adjusted for the longer swing. No lower island within ordinary jump range can reach the tower vine. The full crossing and climb pass simulation tests.

Lobby travel defaults to off. On first loading v0.6, the old saved default is reset once; subsequent explicit choices persist. 36 regression tests pass.
