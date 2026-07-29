(function (U) {
  let ctx = null;
  const prefs = { muted: false, volume: 0.65 };
  function ac() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  U.audio = {
    get muted() {
      return prefs.muted;
    },
    get volume() {
      return prefs.volume;
    },
    mute(value = true) {
      prefs.muted = !!value;
    },
    setVolume(value) {
      prefs.volume = Math.max(0, Math.min(1, Number(value) || 0));
    },
    toggle() {
      prefs.muted = !prefs.muted;
      return prefs.muted;
    },
  };
  U.sound = function (name) {
    try {
      if (prefs.muted || prefs.volume <= 0) return;
      const c = ac(),
        o = c.createOscillator(),
        g = c.createGain(),
        n = c.createBiquadFilter();
      o.connect(n);
      n.connect(g);
      g.connect(c.destination);
      const map = {
        sword: [180, 85, 0.09, 'sawtooth'],
        hit: [95, 50, 0.08, 'square'],
        shield: [260, 160, 0.08, 'triangle'],
        magic: [420, 720, 0.18, 'sine'],
        heal: [360, 520, 0.22, 'sine'],
        step: [90, 70, 0.035, 'triangle'],
        mine: [150, 80, 0.09, 'square'],
        wood: [110, 65, 0.08, 'triangle'],
        fish: [500, 330, 0.12, 'sine'],
        ui: [300, 360, 0.04, 'sine'],
        wolf: [140, 90, 0.12, 'sawtooth'],
        troll: [75, 45, 0.18, 'square'],
        death: [120, 40, 0.3, 'sawtooth'],
        cast: [260, 510, 0.2, 'sine'],
        fireball: [240, 90, 0.2, 'sawtooth'],
        ice: [820, 360, 0.16, 'triangle'],
        lightning: [1200, 120, 0.12, 'square'],
        curse: [210, 105, 0.24, 'sawtooth'],
        portal: [180, 680, 0.34, 'sine'],
        potion: [650, 240, 0.16, 'sine'],
        bandage: [210, 165, 0.13, 'triangle'],
        equip: [420, 260, 0.09, 'triangle'],
        unequip: [260, 420, 0.08, 'triangle'],
        loot: [520, 760, 0.1, 'sine'],
        coin: [980, 660, 0.1, 'triangle'],
        craft: [190, 430, 0.16, 'square'],
        buy: [880, 620, 0.12, 'triangle'],
        sell: [620, 880, 0.12, 'triangle'],
        bank: [230, 170, 0.12, 'square'],
        save: [440, 660, 0.14, 'sine'],
        load: [660, 440, 0.14, 'sine'],
        respawn: [180, 520, 0.3, 'sine'],
        error: [145, 110, 0.12, 'square'],
        select: [390, 460, 0.06, 'sine'],
      };
      const [a, b, d, t] = map[name] || map.ui;
      o.type = t;
      o.frequency.setValueAtTime(a, c.currentTime);
      o.frequency.exponentialRampToValueAtTime(Math.max(30, b), c.currentTime + d);
      g.gain.setValueAtTime(0.07 * prefs.volume, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + d);
      o.start();
      o.stop(c.currentTime + d);
    } catch (e) {}
  };
})((window.Ultra = window.Ultra || {}));
