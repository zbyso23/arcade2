// Editable vanilla JavaScript — loaded directly by index.html.
ArcadeModules.define("views/GameView", function (local, exports) {
  const {
    View,
    Link
  } = ArcadeDOM;
  "use strict";
  exports.default = void 0;
  var _Game = local("../components/Game");
  var _GameMapNext = local("../components/GameMapNext");
  var _GameOver = local("../components/GameOver");
  var _GameWin = local("../components/GameWin");
  var _GameLoader = local("../components/GameLoader");
  var _PlayerMenu = local("../components/PlayerMenu");
  var _playerActions = local("../actions/playerActions");
  var _gameMapActions = local("../actions/gameMapActions");
  var _gameWorldActions = local("../actions/gameWorldActions");
  var _routesList = local("../routesList");
  var dom = local("native/dom");
  function mapStateFromStore(store, state) {
    if (!store.world.loaded) return state;
    return Object.assign({}, state);
  }
  class GameView extends View {
    constructor(props) {
      super(props);
      this.unsubscribe = void 0;
      this.state = {
        loaded: false,
        gameOver: false,
        gameWin: false,
        showStats: false,
        showMapNext: false
      };
      this.onMenu = this.onMenu.bind(this);
      this.onPlayerDeath = this.onPlayerDeath.bind(this);
      this.onPlayerWin = this.onPlayerWin.bind(this);
      this.onPlayAgain = this.onPlayAgain.bind(this);
      this.onPlayerStats = this.onPlayerStats.bind(this);
      this.onPlayerStatsClose = this.onPlayerStatsClose.bind(this);
      this.onPlayerMapChange = this.onPlayerMapChange.bind(this);
      this.onShowMapClose = this.onShowMapClose.bind(this);
    }
    componentDidMount() {
      let storeState = this.context.store.getState();
      this.setStateFromStore();
      this.unsubscribe = this.context.store.subscribe(this.setStateFromStore.bind(this));
      this.later(() => {
        let storeState = this.context.store.getState();
        this.context.store.dispatch({
          type: _gameWorldActions.GAME_WORLD_MAP_SWITCH,
          response: storeState.world.startMap,
          editor: false
        });
        this.setState({
          loaded: true
        });
      }, 1000);
    }
    generateRandomMap() {
      let storeState = this.context.store.getState();
      let stateMap = storeState.map;
      let statePlayer = storeState.player;
      let mapTileX = 92;
      let mapTileY = 104;
      let mapLength = 300;
      this.context.store.dispatch({
        type: _gameMapActions.GAME_MAP_CHANGE_LENGTH,
        response: mapLength
      });
      let fromX = 0;
      let heightVariants = [7, 5.5, 4.5, 3.5];
      let mapGroundPart = heightVariants[0];
      let groundVariants = [25, 32, 42];
      let floorVariants = [3, 5, 7, 9, 12];
      let floorGapVariants = [2, 3, 4, 5];
      let starValues = [10, 25, 50, 100];
      let enemyValues = [100, 150];
      let lastX = groundVariants[Math.floor(Math.random() * groundVariants.length)];
      let ground = [];
      let floor = [];
      let stars = [];
      let spikes = [];
      let enemies = [];
      let items = [];
      let exits = [];
      for (let i = 0; i < mapLength; i++) {
        stars.push(null);
        spikes.push(null);
      }
      while (lastX < mapLength) {
        ground.push({
          from: fromX,
          to: lastX
        });
        for (let i = fromX; i < lastX; i++) stateMap.groundFall[i] = true;
        fromX = lastX + 0;
        lastX = groundVariants[Math.floor(Math.random() * groundVariants.length)] + fromX;
        if (mapLength - lastX > mapGroundPart) {
          continue;
        }
        lastX = mapLength;
        ground.push({
          from: fromX,
          to: lastX
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
      let exitX = Math.round(Math.random() * (mapLength / 50));
      let exitStart = {
        x: 10 * mapTileX,
        y: (height - 1) * mapTileY,
        map: '',
        win: true,
        type: {
          name: 'exit-cave',
          frame: 1
        },
        blocker: {
          name: 'blocker-cave',
          frame: 1,
          destroyed: false
        }
      };
      exits.push(exitStart);
      let itemStart = {
        x: 8 * mapTileX,
        y: (height - 1) * mapTileY,
        frame: 1,
        name: 'pickaxe',
        collected: false,
        visible: true,
        properties: {
          canDestruct: true
        }
      };
      items.push(itemStart);
      let itemWorld = {
        name: itemStart.name,
        properties: itemStart.properties
      };
      this.context.store.dispatch({
        type: _gameWorldActions.GAME_WORLD_ITEM_ADD,
        name: itemWorld.name,
        response: itemWorld
      });
      while (lastX - 3 < mapLength) {
        let isBothSide = Math.random() > 0.6 ? true : false;
        isBothSide = true;
        floor.push({
          from: fromX * mapTileX,
          to: (lastX + 1) * mapTileX,
          height: height * mapTileY,
          bothSide: isBothSide
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
            if (Math.random() > 0.3) {
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
              spikes[starX] = spike;
            }
          }
        }
        if (Math.random() > 0.65) {
          let isFollowing = Math.random() > 0.3 ? true : false;
          let followRange = Math.ceil(Math.random() * 2) + 3;
          let enemy = {
            from: fromX,
            to: lastX,
            xGrid: fromX,
            x: fromX * mapTileX,
            right: true,
            frame: 1,
            die: false,
            death: false,
            height: (height - 1) * mapTileY,
            speed: 2 + Math.ceil(Math.random() * 3),
            experience: enemyValues[Math.floor(Math.random() * enemyValues.length)],
            respawn: {
              time: 0,
              timer: 300
            },
            following: {
              enabled: isFollowing,
              range: followRange
            }
          };
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
            spikes[x] = spike;
          } else if (Math.random() > 0.75) {
            let isFollowing = Math.random() > 0.6 ? true : false;
            let followRange = Math.ceil(Math.random() * 2) + 3;
            let enemy = {
              from: lastX,
              to: lastX + floorGapLength,
              xGrid: lastX,
              x: lastX * mapTileX,
              right: true,
              frame: 1,
              die: false,
              death: false,
              height: (heightVariants[0] - 1) * mapTileY,
              speed: 2 + Math.ceil(Math.random() * 3),
              experience: enemyValues[Math.floor(Math.random() * enemyValues.length)],
              respawn: {
                time: 0,
                timer: 600
              },
              following: {
                enabled: isFollowing,
                range: followRange
              }
            };
            enemies.push(enemy);
          }
        }
        enemies = [];
        if (Math.random() > 0.01) {
          let starItems = floorRandom(floorGapLength - 1, 2.5, 1);
          let starHeight = height;
          if (lastHeight !== height) {
            starHeight = lastHeight > height ? starHeight - 1.75 : starHeight - 2.75;
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
        floor.push({
          from: fromX * mapTileX,
          to: (lastX + 1) * mapTileX,
          height: height * mapTileX,
          bothSide: isBothSide
        });
        index++;
        break;
      }
      let x = 0;
      let y = 0;
      if (floor.length > 3) {
        let lastFloor = floor[floor.length - 1];
        x = lastFloor.from + 1;
        y = height - 1;
      } else {
        x = Math.ceil(mapLength * 0.92);
        y = heightVariants[0] - 1;
      }
      let exit = {
        x: x * mapTileX,
        y: y * mapTileY,
        map: '',
        win: true,
        type: {
          name: 'exit-cave',
          frame: 1
        },
        blocker: {
          name: 'blocker-cave',
          frame: 1,
          destroyed: false
        }
      };
      exits.push(exit);
      stateMap.height = heightVariants[0];
      statePlayer.y = (heightVariants[0] - 1) * mapTileY;
      statePlayer.jump = (heightVariants[0] - 1) * mapTileY;
      stateMap.ground = ground;
      stateMap.floor = floor;
      stateMap.stars = stars;
      stateMap.spikes = spikes;
      stateMap.enemies = enemies;
      stateMap.items = items;
      stateMap.exit = exits;
      stateMap.tileX = mapTileX;
      stateMap.tileY = mapTileY;
      stateMap.background = {
        image: 'map-cave1.png',
        factor: -.065
      };
      this.context.store.dispatch({
        type: _gameMapActions.GAME_MAP_UPDATE,
        response: stateMap
      });
      this.context.store.dispatch({
        type: _playerActions.PLAYER_UPDATE,
        response: statePlayer
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
      this.setState({
        showStats: true
      });
      let storeState = this.context.store.getState();
      let statePlayer = storeState.world.player;
      statePlayer.started = false;
      this.context.store.dispatch({
        type: _gameWorldActions.GAME_WORLD_PLAYER_UPDATE,
        response: statePlayer
      });
    }
    onPlayerStatsClose() {
      this.setState({
        showStats: false
      });
    }
    onPlayerDeath() {
      this.setState({
        gameOver: true
      });
    }
    onPlayerWin() {
      this.setState({
        gameWin: true
      });
    }
    onPlayAgain() {
      this.context.store.dispatch({
        type: _gameWorldActions.GAME_WORLD_PLAYER_CLEAR
      });
      let storeState = this.context.store.getState();
      let mapState = storeState.world.maps[storeState.world.activeMap];
      mapState.offset = 0;
      this.context.store.dispatch({
        type: _gameWorldActions.GAME_WORLD_MAP_UPDATE,
        response: mapState
      });
      this.setState({
        gameOver: false,
        gameWin: false
      });
    }
    onPlayerMapChange(map) {
      let storeState = this.context.store.getState();
      this.setState({
        showMapNext: true
      });
    }
    onShowMapClose() {
      let storeState = this.context.store.getState();
      let statePlayer = storeState.world.player;
      statePlayer.x = 50;
      statePlayer.y = 50;
      statePlayer.jump = 50;
      statePlayer.started = false;
      this.context.store.dispatch({
        type: _gameWorldActions.GAME_WORLD_PLAYER_UPDATE,
        response: statePlayer
      });
      this.setState({
        showMapNext: false
      });
    }
    render() {
      let gameStatusBar = null;
      let loader = null;
      let game = null;
      if (this.state.loaded) {
        if (this.state.gameOver) {
          game = (0, dom.element)(_GameOver.default, {
            onPlayAgain: this.onPlayAgain
          });
        } else if (this.state.gameWin) {
          game = (0, dom.element)(_GameWin.default, {
            onPlayAgain: this.onPlayAgain
          });
        } else if (this.state.showStats) {
          game = (0, dom.element)(_PlayerMenu.default, {
            onBackToGame: this.onPlayerStatsClose
          });
        } else if (this.state.showMapNext) {
          game = (0, dom.element)(_GameMapNext.default, {
            onNextMap: this.onShowMapClose
          });
        } else {
          game = (0, dom.element)(_Game.default, {
            name: "world",
            onPlayerDeath: this.onPlayerDeath,
            onPlayerWin: this.onPlayerWin,
            onPlayerStats: this.onPlayerStats,
            onPlayerMapChange: this.onPlayerMapChange,
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
  exports.default = GameView;
});

