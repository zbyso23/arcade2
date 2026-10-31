// Editable vanilla JavaScript — loaded directly by index.html.
ArcadeModules.define("actions/playerActions", function (local, exports) {
  const {
    View,
    Link
  } = ArcadeDOM;
  "use strict";
  exports.PLAYER_UPDATE = exports.PLAYER_CLEAR = exports.PLAYER_ADD_STAR = exports.PLAYER_ADD_EXPERIENCE = exports.PLAYER_ADD_ATTRIBUTES = void 0;
  const PLAYER_UPDATE = exports.PLAYER_UPDATE = 'player-update';
  const PLAYER_CLEAR = exports.PLAYER_CLEAR = 'player-clear';
  const PLAYER_ADD_EXPERIENCE = exports.PLAYER_ADD_EXPERIENCE = 'player-add-experience';
  const PLAYER_ADD_STAR = exports.PLAYER_ADD_STAR = 'player-add-star';
  const PLAYER_ADD_ATTRIBUTES = exports.PLAYER_ADD_ATTRIBUTES = 'player-add-attributes';
});

