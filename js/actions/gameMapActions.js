// Editable vanilla JavaScript — loaded directly by index.html.
ArcadeModules.define("actions/gameMapActions", function (local, exports) {
  const {
    View,
    Link
  } = ArcadeDOM;
  "use strict";
  exports.GAME_MAP_UPDATE = exports.GAME_MAP_IMPORT = exports.GAME_MAP_EXPORT = exports.GAME_MAP_CHANGE_LENGTH = void 0;
  const GAME_MAP_UPDATE = exports.GAME_MAP_UPDATE = 'game-map-update';
  const GAME_MAP_CHANGE_LENGTH = exports.GAME_MAP_CHANGE_LENGTH = 'game-map-change-length';
  const GAME_MAP_EXPORT = exports.GAME_MAP_EXPORT = 'game-map-export';
  const GAME_MAP_IMPORT = exports.GAME_MAP_IMPORT = 'game-map-import';
});

