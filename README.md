# Pomodoro Timer

A Pomodoro timer in plain HTML, CSS and JavaScript. No build step, no dependencies: open `index.html` in a browser and start working.

## Features

- Focus / short break / long break modes with a circular progress ring
- Automatic cycle: a long break every N pomodoros (4 by default)
- Pause, resume, reset and skip
- Daily counter of completed pomodoros
- Configurable durations, auto-start and end-of-session sound (Web Audio API, no audio file)
- Settings and counter saved in `localStorage`
- Keyboard shortcuts: `Space` start/pause, `R` reset
- Remaining time shown in the tab title

The countdown is computed from a target timestamp rather than by decrementing a counter, so it stays accurate even when the tab is throttled in the background.

## Run

```bash
# any static server works, or just open index.html
npx serve .
```

## Files

```
index.html  markup
style.css   styles (mode colours, progress ring)
app.js      timer logic, settings, persistence
```

## License

MIT
