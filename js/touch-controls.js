'use strict';
(() => {
  const codes = {
    ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40,
    Tab: 9, Control: 17, ' ': 32, e: 69, g: 71, i: 73, '+': 187, '-': 189
  };
  const repeatable = new Set(['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown', ' ', 'Control', 'e']);
  const pressed = new Map();

  function dispatch(type, key) {
    window.dispatchEvent(new KeyboardEvent(type, {
      key, keyCode: codes[key] ?? key.charCodeAt(0), bubbles: true, cancelable: true
    }));
  }

  function release(input) {
    clearTimeout(input.timer);
    pressed.delete(input.button);
    input.button.classList.remove('pressed');
    dispatch('keyup', input.key);
  }

  function releaseAll() {
    for (const input of pressed.values()) release(input);
  }

  window.ArcadeTouch = { releaseAll };
  window.addEventListener('blur', releaseAll);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) releaseAll();
  });

  for (const button of document.querySelectorAll('.touch-controls [data-key]')) {
    const key = button.dataset.key;
    button.addEventListener('pointerdown', event => {
      if (event.button !== 0 || pressed.has(button)) return;
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      pressed.set(button, {button, key, id: event.pointerId, start: performance.now()});
      button.classList.add('pressed');
      dispatch('keydown', key);
    });
    button.addEventListener('pointerup', event => {
      const input = pressed.get(button);
      if (!input || input.id !== event.pointerId) return;
      // A quick tap still needs to span a game tick.
      const delay = repeatable.has(key) ? Math.max(0, 80 - (performance.now() - input.start)) : 0;
      if (delay) input.timer = setTimeout(() => release(input), delay);
      else release(input);
    });
    for (const type of ['pointercancel', 'lostpointercapture']) {
      button.addEventListener(type, event => {
        const input = pressed.get(button);
        if (!input || input.id !== event.pointerId) return;
        if (type === 'pointercancel' || !input.timer) release(input);
      });
    }
    button.addEventListener('click', event => {
      if (event.detail !== 0 || pressed.has(button)) return;
      const input = {button, key};
      pressed.set(button, input);
      dispatch('keydown', key);
      input.timer = setTimeout(() => release(input), repeatable.has(key) ? 80 : 0);
    });
  }
})();
