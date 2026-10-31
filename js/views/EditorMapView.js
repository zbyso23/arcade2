// Editable vanilla JavaScript — loaded directly by index.html.
ArcadeModules.define("views/EditorMapView", function (local, exports) {
  const {
    View,
    Link
  } = ArcadeDOM;
  "use strict";
  exports.default = void 0;
  var _EditorMap = local("../components/EditorMap");
  var _GameLoader = local("../components/GameLoader");
  var _PlayerMenu = local("../components/PlayerMenu");
  var _gameMapReducer = local("../reducers/gameMapReducer");
  var _gameWorldReducer = local("../reducers/gameWorldReducer");
  var _playerActions = local("../actions/playerActions");
  var _gameMapActions = local("../actions/gameMapActions");
  var _gameWorldActions = local("../actions/gameWorldActions");
  var _routesList = local("../routesList");
  var dom = local("native/dom");
  function mapStateFromStore(store, state) {
    if (!store.world.loaded) return state;
    return Object.assign({}, state, {
      loaded: true
    });
  }
  class EditorMapView extends View {
    constructor(props) {
      super(props);
      this.unsubscribe = void 0;
      this.state = {
        loaded: false,
        generated: false
      };
      this.onMenu = this.onMenu.bind(this);
      this.onPlayerDeath = this.onPlayerDeath.bind(this);
      this.onPlayerWin = this.onPlayerWin.bind(this);
      this.onPlayAgain = this.onPlayAgain.bind(this);
      this.onPlayerStats = this.onPlayerStats.bind(this);
      this.onPlayerStatsClose = this.onPlayerStatsClose.bind(this);
    }
    componentDidMount() {
      let storeState = this.context.store.getState();
      this.setStateFromStore();
      this.unsubscribe = this.context.store.subscribe(this.setStateFromStore.bind(this));
      this.later(() => {
        this.context.store.dispatch({
          type: _gameWorldActions.GAME_WORLD_MAP_SWITCH,
          response: this.context.store.getState().world.startMap,
          editor: true
        });
        this.setState({
          generated: true
        });
      }, 1000);
    }
    generateRandomMap(mapName, size) {
      this.context.store.dispatch({
        type: _gameWorldActions.GAME_WORLD_MAP_SWITCH,
        response: mapName,
        editor: true
      });
      let mapTileX = 92;
      let mapTileY = 104;
      let mapLength = size;
      this.context.store.dispatch({
        type: _gameWorldActions.GAME_WORLD_MAP_CHANGE_LENGTH,
        response: mapLength
      });
      let storeState = this.context.store.getState();
      let stateMap = Object.assign({}, storeState.world.maps[storeState.world.activeMap]);
      let statePlayer = Object.assign({}, storeState.world.player);
      let mapGroundPart = 8;
      let fromX = 0;
      let heightVariants = [9, 7, 6, 5];
      let groundVariants = [25, 32, 42];
      let floorVariants = size <= 100 ? [3, 5, 7] : [5, 7, 9, 12];
      let floorGapVariants = size <= 100 ? [1, 2, 3, 4] : [2, 3, 4, 5];
      let starValues = [10, 25, 50, 100];
      let enemyValues = [100, 150];
      let lastX = groundVariants[Math.floor(Math.random() * groundVariants.length)];
      let ground = [];
      let floor = [];
      let stars = [];
      let spikes = [];
      let enemies = [];
      let items = [];
      let environment = [];
      let exits = [];
      for (let i = 0; i < mapLength; i++) {
        stars.push(null);
        spikes.push(null);
      }
      while (lastX < mapLength) {
        ground.push({
          from: fromX * mapTileX,
          to: lastX * mapTileX,
          type: 2
        });
        for (let i = fromX; i < lastX; i++) stateMap.groundFall[i] = true;
        fromX = lastX + 0;
        lastX = groundVariants[Math.floor(Math.random() * groundVariants.length)] + fromX;
        if (mapLength - lastX > mapGroundPart) {
          continue;
        }
        lastX = mapLength;
        ground.push({
          from: fromX * mapTileX,
          to: lastX * mapTileX,
          type: 2
        });
        for (let i = fromX; i < lastX; i++) stateMap.groundFall[i] = true;
        break;
      }
      fromX = floorGapVariants[Math.floor(Math.random() * floorGapVariants.length)];
      lastX = floorVariants[Math.floor(Math.random() * floorVariants.length)] + fromX;
      let index = -1;
      let maxHeight = heightVariants[1];
      let minHeight = heightVariants[heightVariants.length - 1];
      let height = maxHeight;
      let exitX = Math.round(Math.random() * (lastX - fromX)) + fromX;
      let exitStart = {
        x: exitX * mapTileX,
        y: (heightVariants[0] - 1) * mapTileY,
        visible: true,
        win: false,
        map: 'house',
        type: {
          name: 'house',
          frame: 1
        },
        blocker: null
      };
      exits.push(exitStart);
      let environmentHouse = {
        x: exitX * mapTileX,
        y: (heightVariants[0] - 1) * mapTileY,
        frame: 1,
        name: 'house',
        width: 3,
        height: 2,
        visible: true
      };
      let environmentHouseWhite = {
        x: exitX * mapTileX,
        y: (heightVariants[0] - 1) * mapTileY,
        frame: 1,
        name: 'house-white',
        width: 3,
        height: 3,
        visible: true
      };
      let environmentCave = {
        x: exitX * mapTileX,
        y: (heightVariants[0] - 1) * mapTileY,
        frame: 1,
        name: 'cave',
        width: 3,
        height: 2,
        visible: true
      };
      environment.push(environmentHouse);
      let exitStart2 = {
        x: (exitX + 2) * mapTileX,
        y: (heightVariants[0] - 1) * mapTileY,
        visible: true,
        win: false,
        map: 'house',
        type: {
          name: 'house',
          frame: 1
        },
        blocker: null
      };
      let itemPickaxe = {
        x: 8 * mapTileX,
        y: (height - 1) * mapTileY,
        frame: 1,
        name: 'pickaxe',
        collected: false,
        visible: true,
        properties: {
          canDestruct: true,
          canAttack: false
        },
        text: {
          title: 'Item Pickaxe',
          finished: 'Great! You find Pickaxe! Now you can unblock all exit in world!'
        },
        trigger: (0, _gameWorldReducer.getDefaultQuestTriggerState)()
      };
      let itemSword = {
        x: 9 * mapTileX,
        y: (height - 1) * mapTileY,
        frame: 1,
        name: 'sword',
        collected: false,
        visible: true,
        properties: {
          canDestruct: false,
          canAttack: true
        },
        text: {
          title: 'Item Sword',
          finished: 'Great! You find Sword! Now you can fight with orcs!'
        },
        trigger: (0, _gameWorldReducer.getDefaultQuestTriggerState)()
      };
      items.push(itemPickaxe);
      items.push(itemSword);
      while (lastX - 3 < mapLength) {
        let isBothSide = Math.random() > 0.6 ? true : false;
        let type = isBothSide ? 1 : 2;
        floor.push({
          from: fromX * mapTileX,
          to: lastX * mapTileX,
          height: height * mapTileY,
          bothSide: isBothSide,
          type: type
        });
        index++;
        let starFrame = 1;
        let floorRandom = function (length, factor, factorOffset) {
          let numbers = [];
          let count = Math.round(length / (Math.random() * factor + factorOffset));
          let part = length / count;
          let offset = 0;
          for (let i = 0, len = count; i < count; i++) {
            let starX = Math.ceil(Math.random() * (part * 0.9) + offset);
            numbers.push(starX);
            offset += part;
          }
          return numbers;
        };
        if (Math.random() > 0.25) {
          let starItems = floorRandom(lastX - fromX, 2.5, 2);
          for (let i in starItems) {
            let starX = starItems[i] + fromX;
            if (Math.random() > 0.0003) {
              let star = {
                x: starX,
                y: height - 1,
                frame: starFrame,
                value: starValues[Math.floor(Math.random() * starValues.length)],
                collected: false
              };
              starFrame = starFrame === 7 ? 1 : starFrame + 1;
              stars[starX] = star;
            } else {
              let spike = {
                x: starX,
                y: height - 1
              };
            }
          }
        }
        if (Math.random() > 0.85) {
          let isFollowing = Math.random() > 0.3 ? true : false;
          let followRange = Math.ceil(Math.random() * 2) + 3;
          let enemy = {
            type: 'bandit',
            from: fromX,
            to: lastX - 1,
            xGrid: fromX,
            x: fromX * mapTileX,
            right: true,
            frame: 1,
            die: false,
            death: false,
            y: (height - 1) * mapTileY,
            speed: 2 + Math.ceil(Math.random() * 2),
            resistent: {
              jump: false
            },
            respawn: {
              time: 0,
              timer: 600,
              enabled: false
            },
            following: {
              enabled: isFollowing,
              range: followRange
            },
            live: {
              lives: 3,
              timer: 0,
              defeated: false
            },
            text: {
              title: '',
              finished: ''
            },
            visible: true
          };
          enemy = Object.assign((0, _gameMapReducer.getDefaultEnemyState)(), enemy);
          enemies.push(enemy);
        }
        let floorGapLength = floorGapVariants[Math.floor(Math.random() * floorGapVariants.length)];
        let lastHeight = height;
        if (Math.random() < 0.65) {
          height = height === minHeight || height < maxHeight && Math.random() >= 0.2 ? height + 0.5 : height - 0.5;
        }
        if (floorGapLength > 3) {
          if (Math.random() > 0.8) {
            let x = Math.ceil(floorGapLength / 2) + lastX;
            let spike = {
              x: x,
              y: heightVariants[0] - 1
            };
          } else if (Math.random() > 0.8) {
            let isFollowing = Math.random() > 0.6 ? true : false;
            let followRange = Math.ceil(Math.random() * 2) + 3;
            let enemy = {
              type: 'bandit',
              from: lastX,
              to: lastX + floorGapLength,
              xGrid: lastX,
              x: lastX * mapTileX,
              right: true,
              frame: 1,
              die: false,
              death: false,
              y: (heightVariants[0] - 1) * mapTileY,
              speed: 2 + Math.ceil(Math.random() * 2),
              resistent: {
                jump: false
              },
              respawn: {
                time: 0,
                timer: 600,
                enabled: true
              },
              following: {
                enabled: isFollowing,
                range: followRange
              },
              live: {
                lives: 3,
                timer: 0,
                defeated: false
              },
              text: {
                title: '',
                finished: ''
              },
              visible: true
            };
            enemy = Object.assign((0, _gameMapReducer.getDefaultEnemyState)(), enemy);
            enemies.push(enemy);
          }
        }
        if (Math.random() > 0.01) {
          let starItems = floorRandom(floorGapLength - 1, 2.5, 1);
          let starHeight = height;
          if (lastHeight !== height) {
            starHeight = lastHeight > height ? starHeight - 1.5 : starHeight - 2.5;
          } else {
            starHeight -= 1.5;
          }
          for (let i in starItems) {
            let starX = starItems[i] + lastX;
            let star = {
              x: starX,
              y: starHeight,
              frame: starFrame,
              value: starValues[Math.floor(Math.random() * starValues.length)],
              collected: false
            };
            starFrame = starFrame === 7 ? 1 : starFrame + 1;
            stars[starX] = star;
          }
        }
        fromX = lastX + floorGapLength;
        lastX = floorVariants[Math.floor(Math.random() * floorVariants.length)] + fromX;
        if (mapLength - lastX > 10) continue;
        lastX = mapLength;
        if (Math.random() < 0.75) {
          height = height === minHeight || height < maxHeight && Math.random() >= 0.5 ? height + 1 : height - 1;
        }
        isBothSide = Math.random() > 0.8 ? true : false;
        type = isBothSide ? 1 : 2;
        floor.push({
          from: fromX * mapTileX,
          to: lastX * mapTileX,
          height: height * mapTileY,
          bothSide: isBothSide,
          type: type
        });
        index++;
        break;
      }
      let x = 0;
      let y = 0;
      if (1 == 2 || floor.length > 3) {
        let lastFloor = floor[floor.length - 1];
        x = lastFloor.from + 1;
        y = height - 1;
      } else {
        x = Math.ceil(mapLength * 0.92);
        y = heightVariants[0] - 1;
      }
      let backgroundFactor = size <= 100 ? -.05 : -.065;
      stateMap.height = heightVariants[0];
      statePlayer.y = heightVariants[0] * mapTileY;
      stateMap.ground = ground;
      stateMap.floor = floor;
      stateMap.stars = stars;
      stateMap.spikes = spikes;
      stateMap.enemies = enemies;
      stateMap.items = items;
      stateMap.environment = environment;
      stateMap.exit = exits;
      stateMap.tileX = mapTileX;
      stateMap.tileY = mapTileY;
      stateMap.background = {
        image: 'map-' + mapName + '1.png',
        factor: backgroundFactor
      };
      let itemWorldPickaxe = {
        name: itemPickaxe.name,
        properties: itemPickaxe.properties
      };
      let itemWorldSword = {
        name: itemSword.name,
        properties: itemSword.properties
      };
      this.context.store.dispatch({
        type: _gameWorldActions.GAME_WORLD_ITEM_ADD,
        name: itemWorldPickaxe.name,
        response: itemWorldPickaxe
      });
      this.context.store.dispatch({
        type: _gameWorldActions.GAME_WORLD_ITEM_ADD,
        name: itemWorldSword.name,
        response: itemWorldSword
      });
      let enemyBanditWorld = {
        type: 'bandit',
        resistent: {
          jump: false
        }
      };
      let enemyOrcWorld = {
        type: 'orc',
        resistent: {
          jump: true
        }
      };
      let enemyScorpionWorld = {
        type: 'scorpion',
        resistent: {
          jump: true
        }
      };
      this.context.store.dispatch({
        type: _gameWorldActions.GAME_WORLD_ENEMY_ADD,
        name: enemyBanditWorld.type,
        response: enemyBanditWorld
      });
      this.context.store.dispatch({
        type: _gameWorldActions.GAME_WORLD_ENEMY_ADD,
        name: enemyOrcWorld.type,
        response: enemyOrcWorld
      });
      this.context.store.dispatch({
        type: _gameWorldActions.GAME_WORLD_ENEMY_ADD,
        name: enemyScorpionWorld.type,
        response: enemyScorpionWorld
      });
      let questFisherWorld = Object.assign((0, _gameWorldReducer.getDefaultQuestState)(), {
        name: 'fisher'
      });
      let questCharlesWorld = Object.assign((0, _gameWorldReducer.getDefaultQuestState)(), {
        name: 'charles'
      });
      this.context.store.dispatch({
        type: _gameWorldActions.GAME_WORLD_QUEST_ADD,
        name: questFisherWorld.name,
        response: questFisherWorld
      });
      this.context.store.dispatch({
        type: _gameWorldActions.GAME_WORLD_QUEST_ADD,
        name: questCharlesWorld.name,
        response: questCharlesWorld
      });
      let environmentHouseWorld = {
        name: environmentHouse.name,
        width: environmentHouse.width,
        height: environmentHouse.height
      };
      let environmentHouseWhiteWorld = {
        name: environmentHouseWhite.name,
        width: environmentHouseWhite.width,
        height: environmentHouseWhite.height
      };
      let environmentCaveWorld = {
        name: environmentCave.name,
        width: environmentCave.width,
        height: environmentCave.height
      };
      this.context.store.dispatch({
        type: _gameWorldActions.GAME_WORLD_ENVIRONMENT_ADD,
        name: environmentHouseWorld.name,
        response: environmentHouseWorld
      });
      this.context.store.dispatch({
        type: _gameWorldActions.GAME_WORLD_ENVIRONMENT_ADD,
        name: environmentHouseWhiteWorld.name,
        response: environmentHouseWhiteWorld
      });
      this.context.store.dispatch({
        type: _gameWorldActions.GAME_WORLD_ENVIRONMENT_ADD,
        name: environmentCaveWorld.name,
        response: environmentCaveWorld
      });
      this.context.store.dispatch({
        type: _gameWorldActions.GAME_WORLD_PLAYER_UPDATE,
        response: statePlayer
      });
      this.context.store.dispatch({
        type: _gameWorldActions.GAME_WORLD_MAP_UPDATE,
        name: mapName,
        response: stateMap
      });
    }
    componentWillUnmount() {
      if (this.unsubscribe) {
        this.unsubscribe();
      }
    }
    setStateFromStore() {
      this.setState(mapStateFromStore(this.context.store.getState(), this.state));
    }
    onMenu() {
      this.props.history.push(_routesList.LINK_MENU);
    }
    onPlayerStats() {
      this.setState({});
    }
    onPlayerStatsClose() {
      this.setState({});
    }
    onPlayerDeath() {
      this.setState({});
    }
    onPlayerWin() {
      this.setState({});
    }
    onPlayAgain() {
      this.context.store.dispatch({
        type: _playerActions.PLAYER_CLEAR
      });
      let storeState = this.context.store.getState();
      this.generateRandomMap('hills', 300);
      let statePlayer = storeState.player;
      let mapState = storeState.map;
      statePlayer.lives = 1;
      statePlayer.score = 0;
      mapState.offset = 0;
      this.context.store.dispatch({
        type: _playerActions.PLAYER_UPDATE,
        response: statePlayer
      });
      this.context.store.dispatch({
        type: _gameMapActions.GAME_MAP_UPDATE,
        response: mapState
      });
      this.setState({});
    }
    render() {
      let gameStatusBar = null;
      let loader = null;
      let game = null;
      if (this.state.generated) {
        if (1 === 2) {
          game = (0, dom.element)(_PlayerMenu.default, {
            onBackToGame: this.onPlayerStatsClose
          });
        } else {
          game = (0, dom.element)(_EditorMap.default, {
            name: "world",
            onPlayerDeath: this.onPlayerDeath,
            onPlayerWin: this.onPlayerWin,
            onPlayerStats: this.onPlayerStats,
            onMenu: this.onMenu
          });
        }
      } else {
        loader = (0, dom.element)(_GameLoader.default, {});
      }
      return (0, dom.element)("div", {
        children: [loader, gameStatusBar, game]
      });
    }
  }
  exports.default = EditorMapView;
});

