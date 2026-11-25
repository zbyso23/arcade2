/* Keep game coordinates independent of the space available in the browser. */
'use strict';
window.ArcadeViewport = {
  width: 1280,
  height: 1080,
  cameraOffset(map, x, width) {
    const maxOffset = Math.max(0, map.length * map.tileX - width);
    return Math.min(maxOffset, Math.max(0, Math.ceil(x - width / 2)));
  }
};

(() => {
  const area = document.getElementById('workspace-content');
  const stage = document.getElementById('app');

  function measure() {
    if (!document.body.classList.contains('has-stage')) return;

    const { clientWidth, clientHeight } = area;
    if (!clientWidth || !clientHeight) return;
    const { height } = ArcadeViewport;
    const width = Math.max(1280, Math.min(1920, Math.floor(clientWidth * height / clientHeight)));
    const scale = Math.min(clientWidth / width, clientHeight / height);

    ArcadeViewport.width = width;
    stage.style.setProperty('--stage-width', width + 'px');
    stage.style.setProperty('--stage-height', height + 'px');
    stage.style.setProperty('--stage-scale', scale);
    stage.style.setProperty('--stage-screen-height', height * scale + 'px');
    stage.style.setProperty('--stage-screen-width', width * scale + 'px');
    stage.style.setProperty('--stage-ui-zoom', 1 / scale);
    stage.style.setProperty('--stage-left', (clientWidth - width * scale) / 2 + 'px');
    stage.style.setProperty('--stage-top', (clientHeight - height * scale) / 2 + 'px');
  }

  ArcadeViewport.measure = measure;
  window.addEventListener('resize', measure);
  new ResizeObserver(() => {
    const previousWidth = ArcadeViewport.width;
    measure();
    if (ArcadeViewport.width !== previousWidth) window.dispatchEvent(new Event('resize'));
  }).observe(area);
})();
