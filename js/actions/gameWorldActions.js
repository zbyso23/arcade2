// Editable vanilla JavaScript — loaded directly by index.html.
ArcadeModules.define("actions/gameWorldActions", function (local, exports) {
  const {
    View,
    Link
  } = ArcadeDOM;
  "use strict";
  exports.GAME_WORLD_UPDATE = exports.GAME_WORLD_QUEST_UPDATE = exports.GAME_WORLD_QUEST_ADD = exports.GAME_WORLD_QUEST_ACTIVE_UPDATE = exports.GAME_WORLD_PLAYER_UPDATE = exports.GAME_WORLD_PLAYER_CLEAR = exports.GAME_WORLD_PLAYER_ADD_STAR = exports.GAME_WORLD_PLAYER_ADD_EXPERIENCE = exports.GAME_WORLD_PLAYER_ADD_ATTRIBUTES = exports.GAME_WORLD_MAP_UPDATE = exports.GAME_WORLD_MAP_SWITCH = exports.GAME_WORLD_MAP_START_SET = exports.GAME_WORLD_MAP_REMOVE = exports.GAME_WORLD_MAP_RELOADED = exports.GAME_WORLD_MAP_CHANGE_LENGTH = exports.GAME_WORLD_MAP_ADD = exports.GAME_WORLD_ITEM_UPDATE = exports.GAME_WORLD_ITEM_ADD = exports.GAME_WORLD_IMPORT = exports.GAME_WORLD_EXPORT = exports.GAME_WORLD_ENVIRONMENT_UPDATE = exports.GAME_WORLD_ENVIRONMENT_ADD = exports.GAME_WORLD_ENEMY_UPDATE = exports.GAME_WORLD_ENEMY_ADD = void 0;
  const GAME_WORLD_MAP_ADD = exports.GAME_WORLD_MAP_ADD = 'game-world-map-add';
  const GAME_WORLD_MAP_UPDATE = exports.GAME_WORLD_MAP_UPDATE = 'game-world-map-update';
  const GAME_WORLD_MAP_REMOVE = exports.GAME_WORLD_MAP_REMOVE = 'game-world-map-remove';
  const GAME_WORLD_MAP_CHANGE_LENGTH = exports.GAME_WORLD_MAP_CHANGE_LENGTH = 'game-world-map-change-length';
  const GAME_WORLD_MAP_SWITCH = exports.GAME_WORLD_MAP_SWITCH = 'game-world-map-switch';
  const GAME_WORLD_MAP_RELOADED = exports.GAME_WORLD_MAP_RELOADED = 'game-world-map-reloaded';
  const GAME_WORLD_MAP_START_SET = exports.GAME_WORLD_MAP_START_SET = 'game-world-map-start-set';
  const GAME_WORLD_PLAYER_UPDATE = exports.GAME_WORLD_PLAYER_UPDATE = 'game-world-player-update';
  const GAME_WORLD_PLAYER_ADD_EXPERIENCE = exports.GAME_WORLD_PLAYER_ADD_EXPERIENCE = 'game-world-player-add-experience';
  const GAME_WORLD_PLAYER_ADD_STAR = exports.GAME_WORLD_PLAYER_ADD_STAR = 'game-world-player-add-star';
  const GAME_WORLD_PLAYER_ADD_ATTRIBUTES = exports.GAME_WORLD_PLAYER_ADD_ATTRIBUTES = 'game-world-player-add-attributes';
  const GAME_WORLD_PLAYER_CLEAR = exports.GAME_WORLD_PLAYER_CLEAR = 'game-world-player-clear';
  const GAME_WORLD_ITEM_ADD = exports.GAME_WORLD_ITEM_ADD = 'game-world-item-add';
  const GAME_WORLD_ITEM_UPDATE = exports.GAME_WORLD_ITEM_UPDATE = 'game-world-item-update';
  const GAME_WORLD_ENEMY_ADD = exports.GAME_WORLD_ENEMY_ADD = 'game-world-enemy-add';
  const GAME_WORLD_ENEMY_UPDATE = exports.GAME_WORLD_ENEMY_UPDATE = 'game-world-enemy-update';
  const GAME_WORLD_ENVIRONMENT_ADD = exports.GAME_WORLD_ENVIRONMENT_ADD = 'game-world-environment-add';
  const GAME_WORLD_ENVIRONMENT_UPDATE = exports.GAME_WORLD_ENVIRONMENT_UPDATE = 'game-world-environment-update';
  const GAME_WORLD_QUEST_ADD = exports.GAME_WORLD_QUEST_ADD = 'game-world-quest-add';
  const GAME_WORLD_QUEST_UPDATE = exports.GAME_WORLD_QUEST_UPDATE = 'game-world-quest-update';
  const GAME_WORLD_QUEST_ACTIVE_UPDATE = exports.GAME_WORLD_QUEST_ACTIVE_UPDATE = 'game-world-quest-active-update';
  const GAME_WORLD_UPDATE = exports.GAME_WORLD_UPDATE = 'game-world-update';
  const GAME_WORLD_EXPORT = exports.GAME_WORLD_EXPORT = 'game-world-export';
  const GAME_WORLD_IMPORT = exports.GAME_WORLD_IMPORT = 'game-world-import';
});

