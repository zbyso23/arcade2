// Editable vanilla JavaScript — loaded directly by index.html.
ArcadeModules.define("actions/soundActions", function (local, exports) {
  const {
    View,
    Link
  } = ArcadeDOM;
  "use strict";
  exports.SOUND_STOP = exports.SOUND_PLAY = exports.SOUND_LOAD = void 0;
  exports.loadSound = loadSound;
  exports.playSound = playSound;
  exports.stopSound = stopSound;
  const SOUND_LOAD = exports.SOUND_LOAD = 'sound-load';
  const SOUND_PLAY = exports.SOUND_PLAY = 'sound-play';
  const SOUND_STOP = exports.SOUND_STOP = 'sound-stop';
  function loadSound(message) {
    return {
      type: SOUND_LOAD,
      message
    };
  }
  function playSound(message) {
    return {
      type: SOUND_PLAY,
      message
    };
  }
  function stopSound(message) {
    return {
      type: SOUND_STOP,
      message
    };
  }
});

