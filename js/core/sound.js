(function (U) {
  let ctx = null;
  function ac() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  U.sound = function (name) {
    try {
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
      };
      const [a, b, d, t] = map[name] || map.ui;
      o.type = t;
      o.frequency.setValueAtTime(a, c.currentTime);
      o.frequency.exponentialRampToValueAtTime(Math.max(30, b), c.currentTime + d);
      g.gain.setValueAtTime(0.045, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + d);
      o.start();
      o.stop(c.currentTime + d);
    } catch (e) {}
  };
})((window.Ultra = window.Ultra || {}));
