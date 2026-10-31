// Editable vanilla JavaScript — loaded directly by index.html.
ArcadeModules.define("reducers/gameMapReducer", function (local, exports) {
  const {
    View,
    Link
  } = ArcadeDOM;
  "use strict";
  exports.default = reducer;
  exports.getDefaultEnemyState = getDefaultEnemyState;
  exports.getDefaultItemState = getDefaultItemState;
  exports.getDefaultQuestState = getDefaultQuestState;
  exports.getDefaultState = getDefaultState;
  var _gameMapActions = local("../actions/gameMapActions");
  var _gameWorldReducer = local("./gameWorldReducer");
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
  function getDefaultState() {
    return {
      length: 0,
      size: 0,
      offset: 0,
      tileX: 0,
      tileY: 0,
      ground: [],
      floor: [],
      stars: [],
      spikes: [],
      enemies: [],
      items: [],
      environment: [],
      quests: [],
      clouds: [],
      exit: [],
      height: 0,
      groundFall: [],
      background: {
        image: null,
        factor: 0
      }
    };
  }
  function getDefaultQuestState() {
    return {
      x: 0,
      y: 0,
      from: 0,
      to: 0,
      xGrid: 0,
      right: true,
      speed: 0,
      frame: 1,
      name: 'charles',
      visible: false,
      quest: (0, _gameWorldReducer.getDefaultQuestState)()
    };
  }
  function getDefaultEnemyState() {
    return {
      visible: false,
      type: 'bandit',
      from: 0,
      to: 0,
      xGrid: 0,
      x: 0,
      right: true,
      frame: 1,
      die: false,
      death: false,
      y: 0,
      speed: 1,
      resistent: {
        jump: false
      },
      respawn: {
        time: 0,
        timer: 0,
        enabled: false
      },
      following: {
        enabled: false,
        range: 2
      },
      live: {
        lives: 0,
        timer: 0,
        defeated: false
      },
      text: {
        title: 'title',
        finished: 'finished'
      },
      trigger: (0, _gameWorldReducer.getDefaultQuestTriggerState)()
    };
  }
  function getDefaultItemState() {
    return {
      visible: false,
      name: 'pickaxe',
      x: 0,
      y: 0,
      frame: 1,
      collected: false,
      properties: {
        canDestruct: true
      },
      text: {
        title: 'title',
        finished: 'finished'
      },
      trigger: (0, _gameWorldReducer.getDefaultQuestTriggerState)()
    };
  }
  function reducer(state = getDefaultState(), action) {
    switch (action.type) {
      case _gameMapActions.GAME_MAP_UPDATE:
        {
          return Object.assign({}, state, action.response);
        }
      case _gameMapActions.GAME_MAP_CHANGE_LENGTH:
        {
          let newLength = action.response;
          let groundFall = getEmptyMapFall(newLength);
          let stars = getEmptyMapFloorHeight(newLength);
          let spikes = getEmptyMapFloorHeight(newLength);
          let newState = state;
          newState['length'] = action.response;
          newState['size'] = action.response;
          newState['groundFall'] = groundFall;
          newState['stars'] = stars;
          newState['spikes'] = spikes;
          return Object.assign({}, newState);
        }
    }
    return state;
  }
});

