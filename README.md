# King of the Hill

A fresh browser prototype of a side-view parkour combat game. Climb floating ruins, loot weapons, survive traps, knock opponents away and claim the crown.

## Run

Requires Node.js 20+; no packages or build step needed.

```sh
npm start
```

Open http://localhost:5173. Use a desktop keyboard and mouse. `npm test` runs the physics and combat regression tests. Any static web server can host this directory; keep the file structure intact. This repository update does not automatically publish a website.

## Controls

| Key | Action |
| --- | --- |
| W | Jump (release before the next jump) |
| A / D | Move left / right |
| S | Crouch; release to stand when there is room |
| E | Open a nearby chest |
| J / Left mouse | Attack in the direction you face |
| 1 | Fists / sword when acquired |
| 2 | Bow when acquired |
| Escape | Pause / resume |

## Included

- Main menu, controls panel, persistent volume / camera shake / particle settings, pause and victory screens.
- Three selectable visual themes with slightly different platform placement: Emerald Ruins, Frostbound Heights, Ashen Citadel.
- Fixed-step physics, animated character, coyote time, jump buffering, moving platforms and low passages.
- Health, spike traps, moving saws, bottom-of-world respawn at the initial spawn, and crown victory condition.
- Sword, bow, projectiles, attack cooldowns, knockback, temporary damage immunity and four local sparring bots.
- Chest reset and loss of collected weapons on death. Infinite arrows in this prototype.
- Procedural Canvas artwork and synthesized sound effects. No external fonts, images, audio assets, services, or dependencies.

## Scope

This is an offline frontend / gameplay prototype, not networked PvP. Bots patrol their platforms and attack nearby; they are not human players and do not race to the summit. No accounts, matchmaking, backend, database or mobile touch controls yet. The three arenas share the same climb structure and differ in appearance and small layout offsets.

## Code

- `src/engine.js`: level data, physics, damage, loot and win/respawn logic, independent of the DOM.
- `src/render.js`: procedural scene and character rendering.
- `src/main.js`: input, menus, audio, persistence and animation loop.
- `style.css`: interface design.

The previous Python/Kivy code, Buildozer config, images, font and soundtrack have been removed from the current tree. Earlier versions remain in Git history.
