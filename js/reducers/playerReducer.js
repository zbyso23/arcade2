// Editable vanilla JavaScript — loaded directly by index.html.
ArcadeModules.define("reducers/playerReducer", function (local, exports) {
  const {
    View,
    Link
  } = ArcadeDOM;
  "use strict";
  exports.default = reducer;
  exports.getDefaultState = getDefaultState;
  var _playerActions = local("../actions/playerActions");
  function getDefaultState() {
    return {
      lives: 3,
      character: {
        level: 1,
        experience: 0,
        stars: 0,
        points: 6,
        attributes: {
          speed: 33,
          brake: 8,
          jump: 15
        },
        items: []
      },
      death: false,
      x: 92,
      y: 220,
      jump: 220,
      surface: 220,
      speed: 0,
      right: true,
      frame: 1,
      falling: false,
      fall: 0,
      started: false,
      attack: false
    };
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
  function reducer(state = getDefaultState(), action) {
    switch (action.type) {
      case _playerActions.PLAYER_UPDATE:
        {
          return Object.assign({}, state, action.response);
        }
      case _playerActions.PLAYER_ADD_EXPERIENCE:
        {
          let newState = Object.assign({}, state);
          newState.character.experience += action.response;
          let level = getLevel(newState.character.experience);
          if (newState.character.level < level) {
            newState.character.points += (level - newState.character.level) * 3;
          }
          newState.character.level = level;
          return newState;
        }
      case _playerActions.PLAYER_ADD_STAR:
        {
          let newState = Object.assign({}, state);
          newState.character.stars += action.response;
          return newState;
        }
      case _playerActions.PLAYER_ADD_ATTRIBUTES:
        {
          let newState = Object.assign({}, state);
          let newAttributes = action.response;
          let pointsLeft = newState.character.points;
          if (pointsLeft === 0) {
            return newState;
          }
          pointsLeft -= newAttributes.speed - state.character.attributes.speed;
          pointsLeft -= newAttributes.brake - state.character.attributes.brake;
          pointsLeft -= newAttributes.jump - state.character.attributes.jump;
          if (pointsLeft < 0) {
            return newState;
          }
          newState.character.attributes = Object.assign(newState.character.attributes, newAttributes);
          newState.character.points = pointsLeft;
          return newState;
        }
      case _playerActions.PLAYER_CLEAR:
        {
          return Object.assign({}, getDefaultState());
        }
    }
    return state;
  }
});

