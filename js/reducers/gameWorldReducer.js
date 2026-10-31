// Editable vanilla JavaScript — loaded directly by index.html.
ArcadeModules.define("reducers/gameWorldReducer", function (local, exports) {
  const {
    View,
    Link
  } = ArcadeDOM;
  "use strict";
  exports.default = reducer;
  exports.getDefaultQuestState = getDefaultQuestState;
  exports.getDefaultQuestTriggerState = getDefaultQuestTriggerState;
  exports.getDefaultState = getDefaultState;
  var _gameWorldActions = local("../actions/gameWorldActions");
  var _gameMapReducer = local("./gameMapReducer");
  var _playerReducer = local("./playerReducer");
  function getEmptyMapFall(length) {
    let mapFall = [];
    for (let i = 0; i < length; i++) {
      mapFall.push(false);
    }
    return mapFall;
  }
  function getEmptyMapFloorHeight(length) {
    let mapFloorHeight = [];
    for (let i = 0; i < length; i++) {
      mapFloorHeight.push(null);
    }
    return mapFloorHeight;
  }
  let levels = [0, 500, 1500, 3000, 6000, 12000, 15000, 30000];
  function getLevel(experience) {
    let level = 1;
    for (let i = 0, len = levels.length; i < len; i++) {
      if (experience < levels[i]) {
        break;
      }
      level = i + 1;
    }
    return level;
  }
  function getDefaultState() {
    return {
      maps: {},
      items: {},
      environment: {},
      quests: {},
      enemies: {},
      player: (0, _playerReducer.getDefaultState)(),
      activeMap: '',
      startMap: '',
      text: {
        wellcome: {
          title: 'Arcade II',
          text: 'Controls - Arrows for dirrection left and right, Space for jump and E for action.'
        }
      },
      reload: true,
      activeQuest: null,
      loaded: false
    };
  }
  function getDefaultQuestTriggerState() {
    return {
      experience: 0,
      items: [],
      exit: [],
      quest: [],
      enemy: [],
      environment: []
    };
  }
  function getDefaultQuestState() {
    return {
      name: 'fisherman',
      completed: false,
      accepted: false,
      rejected: false,
      text: {
        introduction: 'placeholder introducion',
        accepted: 'placeholder accepted',
        rejected: 'placeholder rejected',
        progress: 'placeholder progress',
        finished: 'placeholder finished'
      },
      title: 'placeholder title',
      accept: {
        items: [],
        enemy: []
      },
      trigger: {
        accepted: getDefaultQuestTriggerState(),
        rejected: getDefaultQuestTriggerState(),
        finished: getDefaultQuestTriggerState()
      }
    };
  }
  function reducer(state = getDefaultState(), action) {
    switch (action.type) {
      case _gameWorldActions.GAME_WORLD_UPDATE:
        {
          let newState = Object.assign({}, state, action.response);
          newState.loaded = true;
          return newState;
        }
      case _gameWorldActions.GAME_WORLD_PLAYER_UPDATE:
        {
          return Object.assign({}, state, {
            player: action.response
          });
        }
      case _gameWorldActions.GAME_WORLD_MAP_ADD:
        {
          let newState = Object.assign({}, state);
          newState.maps[action.name] = action.response;
          return newState;
        }
      case _gameWorldActions.GAME_WORLD_MAP_UPDATE:
        {
          let newState = Object.assign({}, state);
          newState.maps[action.name] = action.response;
          return newState;
        }
      case _gameWorldActions.GAME_WORLD_MAP_CHANGE_LENGTH:
        {
          let newState = Object.assign({}, state);
          let newStateMap = Object.assign({}, newState.maps[state.activeMap]);
          let newLength = action.response;
          let groundFall = getEmptyMapFall(newLength);
          let stars = getEmptyMapFloorHeight(newLength);
          let spikes = getEmptyMapFloorHeight(newLength);
          newStateMap['length'] = action.response;
          newStateMap['size'] = action.response;
          newStateMap['groundFall'] = groundFall;
          newStateMap['stars'] = stars;
          newStateMap['spikes'] = spikes;
          newState.maps[newState.activeMap] = newStateMap;
          return newState;
        }
      case _gameWorldActions.GAME_WORLD_MAP_REMOVE:
        {
          let newState = Object.assign({}, state);
          delete newState.maps[action.name];
          return newState;
        }
      case _gameWorldActions.GAME_WORLD_MAP_SWITCH:
        {
          let newState = Object.assign({}, state);
          let lastMap = newState.activeMap;
          let isPresent = action.response in newState.maps;
          if (!isPresent) {
            newState.maps[action.response] = (0, _gameMapReducer.getDefaultState)();
          }
          newState.reload = true;
          newState.activeMap = action.response;
          if (!action.editor) {
            newState.player.started = false;
            newState.player.x = 92;
            newState.player.y = 220;
            newState.player.jump = 220;
            newState.player.surface = 220;
            if (lastMap !== '') {
              let exits = newState.maps[newState.activeMap].exit;
              for (let i = 0, len = exits.length; i < len; i++) {
                let exit = exits[i];
                if (!exit.visible || exit.map !== lastMap) {
                  continue;
                }
                newState.player.x = exit.x;
                newState.player.y = exit.y;
                newState.player.jump = exit.y;
                newState.player.surface = exit.y;
                break;
              }
            }
          } else {
            newState.player.x = 0;
            newState.player.y = 0;
          }
          return newState;
        }
      case _gameWorldActions.GAME_WORLD_MAP_RELOADED:
        {
          let newState = Object.assign({}, state);
          newState.reload = false;
          return newState;
        }
      case _gameWorldActions.GAME_WORLD_QUEST_ACTIVE_UPDATE:
        {
          let newState = Object.assign({}, state);
          newState.activeQuest = action.response;
          return newState;
        }
      case _gameWorldActions.GAME_WORLD_MAP_START_SET:
        {
          let newState = Object.assign({}, state);
          newState.startMap = action.response;
          return newState;
        }
      case _gameWorldActions.GAME_WORLD_ITEM_ADD:
      case _gameWorldActions.GAME_WORLD_ITEM_UPDATE:
        {
          let newState = Object.assign({}, state);
          newState.items[action.name] = action.response;
          return newState;
        }
      case _gameWorldActions.GAME_WORLD_ENVIRONMENT_ADD:
      case _gameWorldActions.GAME_WORLD_ENVIRONMENT_UPDATE:
        {
          let newState = Object.assign({}, state);
          newState.environment[action.name] = action.response;
          return newState;
        }
      case _gameWorldActions.GAME_WORLD_ENEMY_ADD:
      case _gameWorldActions.GAME_WORLD_ENEMY_UPDATE:
        {
          let newState = Object.assign({}, state);
          newState.enemies[action.name] = action.response;
          return newState;
        }
      case _gameWorldActions.GAME_WORLD_QUEST_ADD:
      case _gameWorldActions.GAME_WORLD_QUEST_UPDATE:
        {
          let newState = Object.assign({}, state);
          newState.quests[action.name] = action.response;
          return newState;
        }
      case _gameWorldActions.GAME_WORLD_PLAYER_UPDATE:
        {
          let newState = Object.assign({}, state);
          newState.player = action.response;
          return newState;
        }
      case _gameWorldActions.GAME_WORLD_PLAYER_ADD_EXPERIENCE:
        {
          let newState = Object.assign({}, state);
          let newStatePlayer = newState.player;
          newStatePlayer.character.experience += action.response;
          let level = getLevel(newStatePlayer.character.experience);
          if (newStatePlayer.character.level < level) {
            newStatePlayer.character.points += (level - newStatePlayer.character.level) * 3;
          }
          newStatePlayer.character.level = level;
          newState.player = newStatePlayer;
          return newState;
        }
      case _gameWorldActions.GAME_WORLD_PLAYER_ADD_STAR:
        {
          let newState = Object.assign({}, state);
          newState.player.character.stars += action.response;
          return newState;
        }
      case _gameWorldActions.GAME_WORLD_PLAYER_ADD_ATTRIBUTES:
        {
          let newState = Object.assign({}, state);
          let newStatePlayer = newState.player;
          let newAttributes = action.response;
          let pointsLeft = newStatePlayer.character.points;
          if (pointsLeft === 0) {
            return newState;
          }
          pointsLeft -= newAttributes.speed - newStatePlayer.character.attributes.speed;
          pointsLeft -= newAttributes.brake - newStatePlayer.character.attributes.brake;
          pointsLeft -= newAttributes.jump - newStatePlayer.character.attributes.jump;
          if (pointsLeft < 0) {
            return newState;
          }
          newStatePlayer.character.attributes = Object.assign(newStatePlayer.character.attributes, newAttributes);
          newStatePlayer.character.points = pointsLeft;
          newState.player = newStatePlayer;
          return newState;
        }
      case _gameWorldActions.GAME_WORLD_PLAYER_CLEAR:
        {
          let newState = Object.assign({}, state);
          newState.player = (0, _playerReducer.getDefaultState)();
          return newState;
        }
    }
    return state;
  }
});

