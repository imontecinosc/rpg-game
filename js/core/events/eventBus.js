(function (U) {
  const listeners = new Map();

  U.events = U.events || {
    on(type, handler) {
      if (typeof handler !== 'function') return () => {};
      const bucket = listeners.get(type) || new Set();
      bucket.add(handler);
      listeners.set(type, bucket);
      return () => bucket.delete(handler);
    },
    once(type, handler) {
      const off = this.on(type, payload => {
        off();
        handler(payload);
      });
      return off;
    },
    emit(type, payload = {}) {
      const bucket = listeners.get(type);
      if (!bucket) return;
      [...bucket].forEach(handler => {
        try { handler(payload); }
        catch (error) { console.error(`[Ultra.events] ${type}`, error); }
      });
    },
    clear(type) {
      if (type) listeners.delete(type);
      else listeners.clear();
    },
  };
})(window.Ultra = window.Ultra || {});
