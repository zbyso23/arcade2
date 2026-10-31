// Editable vanilla JavaScript — loaded directly by index.html.
ArcadeModules.define("components/EditorMap", function (local, exports) {
  const {
    View,
    Link
  } = ArcadeDOM;
  "use strict";
  exports.default = void 0;
  var _Sprites = local("../libs/Sprites");
  var _Environment = local("../libs/Environment");
  var _GameLoader = local("../components/GameLoader");
  var _EditorMapBar = local("../components/EditorMapBar");
  var _EditorMapQuestAdd = local("./EditorMapQuestAdd");
  var _EditorMapEnemyAdd = local("./EditorMapEnemyAdd");
  var _EditorMapItemAdd = local("./EditorMapItemAdd");
  var _GameAnimations = local("../components/GameAnimations");
  var _GameRender = local("../components/GameRender");
  var _gameWorldActions = local("../actions/gameWorldActions");
  var dom = local("native/dom");
  function mapStateFromStore(store, state) {
    let newState = Object.assign({}, state);
    return newState;
  }
  class EditorMap extends View {
    constructor(props) {
      super(props);
      this.cached = {};
      this.unsubscribe = void 0;
      this.animationTime = 30;
      this.timer = void 0;
      this.isRunning = false;
      this.handlerKeyUp = void 0;
      this.handlerKeyDown = void 0;
      this.sprites = void 0;
      this.environment = void 0;
      this.counter = 0;
      this.mapSize = 0;
      this.gamepad = null;
      this.gamepadJumpReleased = true;
      this.state = {
        loaded: false,
        width: 0,
        height: 0,
        controls: {
          up: false,
          down: false,
          left: false,
          right: false
        },
        loader: {
          opacity: 1
        },
        selected: {
          name: '',
          value: '',
          x: -1,
          data: null
        },
        popup: {
          visible: false,
          type: null,
          x: 0,
          y: 0,
          parameters: null
        }
      };
      this.handlerKeyUp = this.processKeyUp.bind(this);
      this.handlerKeyDown = this.processKeyDown.bind(this);
      this.handleGamepadConnected = this.handleGamepadConnected.bind(this);
      this.handleGamepadDisconnected = this.handleGamepadDisconnected.bind(this);
      this.processStats = this.processStats.bind(this);
      this.processMenu = this.processMenu.bind(this);
      this.animate = this.animate.bind(this);
      this.toggleFullScreen = this.toggleFullScreen.bind(this);
      this.run = this.run.bind(this);
      this.resize = this.resize.bind(this);
      this.checkFloorPlace = this.checkFloorPlace.bind(this);
      this.procedExitPlace = this.procedExitPlace.bind(this);
      this.procedItemPlace = this.procedItemPlace.bind(this);
      this.procedQuestPlace = this.procedQuestPlace.bind(this);
      this.procedEnemyPlace = this.procedEnemyPlace.bind(this);
      this.procedEnvironmentPlace = this.procedEnvironmentPlace.bind(this);
      this.procedMapSwitch = this.procedMapSwitch.bind(this);
      this.procedExitChangeBlocked = this.procedExitChangeBlocked.bind(this);
      this.procedExitChangeType = this.procedExitChangeType.bind(this);
      this.procedItemChangeVisible = this.procedItemChangeVisible.bind(this);
      this.procedEnemyChangeFollowing = this.procedEnemyChangeFollowing.bind(this);
      this.procedEnemyChangeSpeed = this.procedEnemyChangeSpeed.bind(this);
      this.procedPopupClose = this.procedPopupClose.bind(this);
    }
    soundOn(id) {
      let storeState = this.context.store.getState();
      storeState.sound.sound.play(id, false, false);
    }
    soundLoop(id) {
      let storeState = this.context.store.getState();
      storeState.sound.sound.play(id, true, false);
    }
    soundOff(id) {
      let storeState = this.context.store.getState();
      storeState.sound.sound.stop(id, false);
    }
    componentDidMount() {
      let storeState = this.context.store.getState();
      this.unsubscribe = this.context.store.subscribe(this.setStateFromStore.bind(this));
      let width = ArcadeViewport.width;
      let height = ArcadeViewport.height;
      let newState = Object.assign({}, this.state);
      newState.loaded = true;
      newState.width = width;
      newState.height = height;
      let stateMap = storeState.world.maps[storeState.world.activeMap];
      this.sprites = new _Sprites.Sprites(stateMap.tileX, stateMap.tileY);
      this.environment = new _Environment.Environment(stateMap.tileX, stateMap.tileY);
      this.setState(mapStateFromStore(this.context.store.getState(), newState));
      storeState.sound.sound.loadList(['music-gameover', 'music-win', 'music-map-cave', 'sfx-enemy-death', 'sfx-star-collected', 'sfx-player-walk', 'sfx-player-jump', 'sfx-player-death']).then(() => {
        let music = 'music-map-cave';
        this.run();
      });
    }
    handleGamepadConnected(e) {
      this.gamepad = e.gamepad;
    }
    handleGamepadDisconnected(e) {
      this.gamepad = null;
    }
    run() {
      if (this._destroyed) return;
      let storeState = this.context.store.getState();
      let stateMap = storeState.world.maps[storeState.world.activeMap];
      this.mapSize = (stateMap.length - 2) * stateMap.tileX;
      window.addEventListener('keydown', this.handlerKeyDown);
      window.addEventListener('keyup', this.handlerKeyUp);
      window.addEventListener('resize', this.resize);
      window.addEventListener("gamepadconnected", this.handleGamepadConnected);
      window.addEventListener("gamepaddisconnected", this.handleGamepadDisconnected);
      this.resize();
      let mapState = Object.assign({}, stateMap);
      this.context.store.dispatch({
        type: _gameWorldActions.GAME_WORLD_MAP_UPDATE,
        response: mapState,
        name: storeState.world.activeMap
      });
      this.isRunning = true;
    }
    getClouds(length, height) {
      let fromX = Math.ceil(Math.random() * 90) * -1;
      let clouds = [];
      while (fromX < length) {
        let cloudHeight = height + height * (Math.random() * 2);
        let cloudSpeed = Math.random() * 0.25 + 1.1;
        let cloud = {
          x: fromX,
          y: cloudHeight,
          type: Math.ceil(Math.random() * 5),
          speed: cloudSpeed
        };
        clouds.push(cloud);
        fromX += Math.ceil(Math.random() * 100) + 100;
      }
      return clouds;
    }
    componentWillUnmount() {
      clearTimeout(this.timer);
      window.removeEventListener('keydown', this.handlerKeyDown);
      window.removeEventListener('keyup', this.handlerKeyUp);
      window.removeEventListener('resize', this.resize);
      window.removeEventListener("gamepadconnected", this.handleGamepadConnected);
      window.removeEventListener("gamepaddisconnected", this.handleGamepadDisconnected);
      if (this.unsubscribe) {
        this.unsubscribe();
      }
    }
    setStateFromStore() {
      let storeState = this.context.store.getState();
      this.setState(mapStateFromStore(this.context.store.getState(), this.state));
    }
    resize() {
      let width = ArcadeViewport.width;
      let height = ArcadeViewport.height;
      this.setState({
        width: width,
        height: height
      });
    }
    animate() {
      if (!this.isRunning) return;
      this.counter++;
      if (this.counter === 1000) this.counter = 0;
      if (this.state.loader.opacity > 0) {
        let newState = Object.assign({}, this.state);
        newState.loader.opacity -= newState.loader.opacity <= 0.4 ? 0.035 : 0.05;
        if (newState.loader.opacity <= 0.05) newState.loader.opacity = 0;
        this.setState(newState);
      }
      if (this.counter % 2 === 0) this.checkGamepad();
      this.timer = this.later(this.animate, this.animationTime);
    }
    checkGamepad() {
      if (this.gamepad === null) return;
      let storeState = this.context.store.getState();
      let statePlayer = storeState.world.player;
      let y = 0;
      let x = 0;
      let button = false;
      let isControls = false;
      let isWebkit = navigator.webkitGetGamepads ? true : false;
      if (this.gamepad.axes[0] != 0) {
        x += this.gamepad.axes[0];
      } else if (this.gamepad.axes[1] != 0) {
        y -= this.gamepad.axes[1];
      } else if (this.gamepad.axes[2] != 0) {
        x -= this.gamepad.axes[2];
      } else if (this.gamepad.axes[3] != 0) {
        y += this.gamepad.axes[3];
      }
      if (!isWebkit && (this.gamepad.buttons[0].value > 0 || this.gamepad.buttons[0].pressed == true) || isWebkit && this.gamepad.buttons[0] === 1) {
        if (this.gamepadJumpReleased && statePlayer.jump === statePlayer.y) {
          button = true;
          this.gamepadJumpReleased = false;
        }
      } else {
        this.gamepadJumpReleased = true;
      }
      let newControls = Object.assign({}, this.state.controls);
      if (button) newControls.up = true;
      switch (x) {
        case -1:
          newControls.right = false;
          newControls.left = true;
          isControls = true;
          break;
        case 1:
          newControls.right = true;
          newControls.left = false;
          isControls = true;
          break;
        default:
          newControls.right = false;
          newControls.left = false;
          break;
      }
      if (!statePlayer.started && isControls) {
        statePlayer.started = true;
        this.context.store.dispatch({
          type: _gameWorldActions.GAME_WORLD_PLAYER_UPDATE,
          response: statePlayer
        });
      }
      if (newControls.right && !this.state.controls.right || newControls.left && !this.state.controls.left) {
        statePlayer.right = newControls.right && !this.state.controls.right ? true : false;
        this.context.store.dispatch({
          type: _gameWorldActions.GAME_WORLD_PLAYER_UPDATE,
          response: statePlayer
        });
      }
      this.setState({
        controls: newControls
      });
    }
    processDeath() {}
    processWin() {}
    processMenu() {
      this.isRunning = false;
      this.props.onMenu();
    }
    processStats() {
      this.isRunning = false;
      this.soundOff('sfx-player-walk');
      this.props.onPlayerStats();
    }
    processKeyDown(e) {
      if (this.state.popup.visible && ['quest', 'enemy'].indexOf(this.state.popup.type) >= 0) return;
      this.toggleKey(e);
    }
    processKeyUp(e) {
      if (this.state.popup.visible && ['quest', 'enemy'].indexOf(this.state.popup.type) >= 0) return;
      this.toggleKey(e);
    }
    checkGroundPlace(newGround, ignoreIndex) {
      let storeState = this.context.store.getState();
      let stateMap = storeState.world.maps[storeState.world.activeMap];
      for (let i = 0, len = stateMap.ground.length; i < len; i++) {
        if (i === ignoreIndex) continue;
        if (stateMap.ground[i].from < newGround.from && stateMap.ground[i].to > newGround.from || stateMap.ground[i].from < newGround.to && stateMap.ground[i].to > newGround.to) {
          return false;
        }
      }
      return true;
    }
    checkFloorPlace(newFloor, ignoreIndex) {
      let storeState = this.context.store.getState();
      let stateMap = storeState.world.maps[storeState.world.activeMap];
      for (let i = 0, len = stateMap.floor.length; i < len; i++) {
        if (i === ignoreIndex) continue;
        let floor = stateMap.floor[i];
        if (floor.from < newFloor.from && floor.to > newFloor.from || floor.from < newFloor.to && floor.to > newFloor.to) {
          return false;
        }
      }
      return true;
    }
    toggleKey(e) {
      if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      let assignKeys = [27, 32, 37, 39, 9, 113, 38, 40];
      let assignKeysNames = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '-', '=', '_', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', 'g', 'G', 'i', 'I'];
      if (assignKeys.indexOf(e.keyCode) === -1 && assignKeysNames.indexOf(e.key) === -1) return;
      let newPopup = Object.assign({}, this.state.popup);
      if (e.type === "keydown" && [113, 9].indexOf(e.keyCode) > -1) {
        if (e.keyCode === 9) {
          if (newPopup.visible) {
            newPopup.visible = false;
            this.setState({
              popup: newPopup
            });
          }
        }
        if (e.keyCode === 113) this.processMenu();
        return;
      }
      if (newPopup.visible) return;
      e.preventDefault();
      if (e.type === "keyup") {
        this.detectObjects();
        return;
      }
      let heightVariants = [9, 7, 6, 5];
      let groundVariants = [25, 32, 42];
      let floorVariants = [3, 5, 7, 9, 12];
      let floorGapVariants = [2, 3, 4, 5];
      let starValues = [10, 25, 50, 100];
      let enemyValues = [100, 150];
      let storeState = this.context.store.getState();
      let statePlayer = Object.assign({}, storeState.world.player);
      if (!statePlayer.started) statePlayer.started = true;
      let stateMap = storeState.world.maps[storeState.world.activeMap];
      let isPos = false;
      if (!e.shiftKey) {
        switch (e.keyCode) {
          case 32:
            if (!e.ctrlKey) ArcadeFiles.open();
            if (e.ctrlKey) this.context.store.dispatch({
              type: _gameWorldActions.GAME_WORLD_EXPORT
            });
            break;
          case 38:
            isPos = statePlayer.y > 0;
            if (isPos) statePlayer.y -= stateMap.tileY / 2;
            break;
          case 40:
            isPos = statePlayer.y < stateMap.tileY * 9;
            if (isPos) statePlayer.y += stateMap.tileY / 2;
            break;
          case 37:
            isPos = statePlayer.x > 0;
            if (isPos) statePlayer.x -= stateMap.tileX;
            break;
          case 39:
            isPos = statePlayer.x <= stateMap.length * stateMap.tileX;
            if (isPos) statePlayer.x += stateMap.tileX;
            break;
        }
      }
      if (isPos) {
        if (statePlayer.x >= this.state.width / 2 && statePlayer.x < stateMap.length * stateMap.tileX - this.state.width / 2) {
          stateMap.offset = Math.max(0, Math.ceil(statePlayer.x - this.state.width / 2));
        }
        this.context.store.dispatch({
          type: _gameWorldActions.GAME_WORLD_PLAYER_UPDATE,
          response: statePlayer
        });
        this.detectObjects();
      }
      let isSelected = this.state.selected.name !== '';
      let isSelectedEnv = this.state.selected.name === 'environment';
      let isShift = e.shiftKey === true;
      let isCtrl = e.ctrlKey === true;
      let isAlt = e.altKey === true;
      if (!isPos) {
        let newPopup = Object.assign({}, this.state.popup);
        switch (e.key) {
          case '0':
            if (isSelected) {
              let allowedRemove = ['ground', 'star', 'spike', 'enemy', 'floor', 'exit', 'item', 'environment', 'quest'];
              let x = this.state.selected.x;
              if (allowedRemove.indexOf(this.state.selected.name) > -1) {
                switch (this.state.selected.name) {
                  case 'ground':
                    let ground = [];
                    for (let i = 0, len = stateMap.ground.length; i < len; i++) {
                      if (this.state.selected.data.index === i) {
                        continue;
                      }
                      ground.push(stateMap.ground[i]);
                    }
                    stateMap.ground = ground;
                    break;
                  case 'star':
                    stateMap.stars[x] = null;
                    break;
                  case 'spike':
                    stateMap.spikes[x] = null;
                    break;
                  case 'enemy':
                    let enemies = [];
                    for (let i = 0, len = stateMap.enemies.length; i < len; i++) {
                      if (this.state.selected.data.index === i) {
                        continue;
                      }
                      enemies.push(stateMap.enemies[i]);
                    }
                    stateMap.enemies = enemies;
                    break;
                  case 'quest':
                    let quests = [];
                    for (let i = 0, len = stateMap.quests.length; i < len; i++) {
                      if (this.state.selected.data.index === i) {
                        continue;
                      }
                      quests.push(stateMap.quests[i]);
                    }
                    stateMap.quests = quests;
                    break;
                  case 'floor':
                    let newFloor = [];
                    for (let i = 0, len = stateMap.floor.length; i < len; i++) {
                      if (this.state.selected.data.index === i) {
                        let floorItem = stateMap.floor[this.state.selected.data.index];
                        for (let j = floorItem.from, lenFloor = floorItem.to; j <= lenFloor; j += stateMap.tileX) {
                          let k = Math.ceil(j / stateMap.tileX);
                        }
                        continue;
                      }
                      newFloor.push(stateMap.floor[i]);
                    }
                    stateMap.floor = newFloor;
                    break;
                  case 'exit':
                    let exit = [];
                    for (let i = 0, len = stateMap.exit.length; i < len; i++) {
                      if (this.state.selected.data.index === i) {
                        continue;
                      }
                      exit.push(stateMap.exit[i]);
                    }
                    stateMap.exit = exit;
                    break;
                  case 'environment':
                    let environment = [];
                    for (let i = 0, len = stateMap.environment.length; i < len; i++) {
                      if (this.state.selected.data.index === i) {
                        continue;
                      }
                      environment.push(stateMap.environment[i]);
                    }
                    stateMap.environment = environment;
                    break;
                  case 'item':
                    let items = [];
                    for (let i = 0, len = stateMap.items.length; i < len; i++) {
                      if (this.state.selected.data.index === i) {
                        continue;
                      }
                      items.push(stateMap.items[i]);
                    }
                    stateMap.items = items;
                    break;
                }
              }
            }
            break;
          case '1':
            if (!isSelected || isSelectedEnv) {
              let x = this.state.selected.x;
              let star = {
                x: x,
                y: statePlayer.y / stateMap.tileY,
                frame: 1,
                value: starValues[0],
                collected: false
              };
              stateMap.stars[x] = star;
            }
            break;
          case '2':
            if (!isSelected || isSelectedEnv) {
              let x = this.state.selected.x;
              let spike = {
                x: x,
                y: statePlayer.y / stateMap.tileY
              };
              stateMap.spikes[x] = spike;
            }
            break;
          case '3':
          case '#':
            if (!isSelected || this.state.selected.name === 'enemy') {
              if (!newPopup.visible || newPopup.type !== 'enemy') {
                let exit = [];
                let itemsAll = [];
                let items = [];
                let environment = [];
                let enemies = [];
                for (let i in storeState.world.maps) {
                  let mapName = i;
                  let map = storeState.world.maps[i];
                  for (let i = 0, len = map.exit.length; i < len; i++) {
                    if (map.exit[i].visible) continue;
                    exit.push({
                      map: mapName,
                      x: map.exit[i].x,
                      y: map.exit[i].y,
                      name: map.exit[i].type.name
                    });
                  }
                  for (let i = 0, len = map.items.length; i < len; i++) {
                    itemsAll.push({
                      map: mapName,
                      x: map.items[i].x,
                      y: map.items[i].y,
                      name: map.items[i].name
                    });
                    if (map.items[i].visible) continue;
                    items.push({
                      map: mapName,
                      x: map.items[i].x,
                      y: map.items[i].y,
                      name: map.items[i].name
                    });
                  }
                  for (let i = 0, len = map.environment.length; i < len; i++) {
                    if (map.environment[i].visible) continue;
                    environment.push({
                      map: mapName,
                      x: map.environment[i].x,
                      y: map.environment[i].y,
                      name: map.environment[i].name
                    });
                  }
                  for (let i = 0, len = map.enemies.length; i < len; i++) {
                    if (map.enemies[i].visible) continue;
                    enemies.push({
                      map: mapName,
                      x: map.enemies[i].x,
                      y: map.enemies[i].height,
                      name: map.enemies[i].type
                    });
                  }
                }
                newPopup = {
                  visible: true,
                  type: 'enemy',
                  x: this.state.selected.x * stateMap.tileX,
                  y: statePlayer.y,
                  parameters: {
                    exit: exit,
                    items: items,
                    itemsAll: itemsAll,
                    environment: environment,
                    enemies: enemies,
                    visible: true,
                    text: {
                      title: 'placeholder-title',
                      finished: 'placeholder finished'
                    },
                    trigger: {
                      exit: [],
                      items: [],
                      environment: [],
                      enemies: []
                    }
                  }
                };
              } else {
                newPopup.visible = false;
              }
              this.setState({
                popup: newPopup
              });
              break;
            }
          case '4':
          case '$':
            {
              let x = this.state.selected.x;
              let length = e.shiftKey ? floorVariants[floorVariants.length - 1] : floorVariants[0];
              let type = e.ctrlKey ? 1 : 2;
              let newFloor = {
                from: x * stateMap.tileX,
                to: (x + length) * stateMap.tileX,
                height: statePlayer.y,
                bothSide: e.ctrlKey,
                type: type
              };
              if (!this.checkFloorPlace(newFloor, -1)) break;
              stateMap.floor.push(newFloor);
              break;
            }
          case '5':
          case '%':
            if (!isSelected || isSelectedEnv) {
              if (!newPopup.visible || newPopup.type !== 'exit') {
                newPopup = {
                  visible: true,
                  type: 'exit',
                  x: this.state.selected.x * stateMap.tileX,
                  y: statePlayer.y,
                  parameters: {
                    blocked: e.shiftKey,
                    type: 'cave'
                  }
                };
              } else {
                newPopup.visible = false;
              }
              this.setState({
                popup: newPopup
              });
            }
            break;
          case '6':
          case '^':
            {
              if (!isSelected || this.state.selected.name === 'item') {
                if (!newPopup.visible || newPopup.type !== 'item') {
                  let exit = [];
                  let itemsAll = [];
                  let items = [];
                  let environment = [];
                  let enemies = [];
                  for (let i in storeState.world.maps) {
                    let mapName = i;
                    let map = storeState.world.maps[i];
                    for (let i = 0, len = map.exit.length; i < len; i++) {
                      if (map.exit[i].visible) continue;
                      exit.push({
                        map: mapName,
                        x: map.exit[i].x,
                        y: map.exit[i].y,
                        name: map.exit[i].type.name
                      });
                    }
                    for (let i = 0, len = map.items.length; i < len; i++) {
                      itemsAll.push({
                        map: mapName,
                        x: map.items[i].x,
                        y: map.items[i].y,
                        name: map.items[i].name
                      });
                      if (map.items[i].visible) continue;
                      items.push({
                        map: mapName,
                        x: map.items[i].x,
                        y: map.items[i].y,
                        name: map.items[i].name
                      });
                    }
                    for (let i = 0, len = map.environment.length; i < len; i++) {
                      if (map.environment[i].visible) continue;
                      environment.push({
                        map: mapName,
                        x: map.environment[i].x,
                        y: map.environment[i].y,
                        name: map.environment[i].name
                      });
                    }
                    for (let i = 0, len = map.enemies.length; i < len; i++) {
                      if (map.enemies[i].visible) continue;
                      enemies.push({
                        map: mapName,
                        x: map.enemies[i].x,
                        y: map.enemies[i].height,
                        name: map.enemies[i].type
                      });
                    }
                  }
                  newPopup = {
                    visible: true,
                    type: 'item',
                    x: this.state.selected.x * stateMap.tileX,
                    y: statePlayer.y,
                    parameters: {
                      exit: exit,
                      items: items,
                      itemsAll: itemsAll,
                      environment: environment,
                      enemies: enemies,
                      visible: true,
                      text: {
                        title: 'placeholder-title',
                        finished: 'placeholder finished'
                      },
                      trigger: {
                        exit: [],
                        items: [],
                        environment: [],
                        enemies: []
                      }
                    }
                  };
                } else {
                  newPopup.visible = false;
                }
                this.setState({
                  popup: newPopup
                });
              }
              break;
            }
          case '7':
          case '&':
            if (!isSelected) {
              if (!newPopup.visible || newPopup.type !== 'environment') {
                newPopup = {
                  visible: true,
                  type: 'environment',
                  x: this.state.selected.x * stateMap.tileX,
                  y: statePlayer.y,
                  parameters: {
                    visible: true
                  }
                };
              } else {
                newPopup.visible = false;
              }
              this.setState({
                popup: newPopup
              });
            }
            break;
          case '8':
          case '*':
            if (!isSelected || this.state.selected.name === 'quest') {
              if (!newPopup.visible || newPopup.type !== 'quest') {
                let exit = [];
                let itemsAll = [];
                let items = [];
                let environment = [];
                let enemies = [];
                for (let i in storeState.world.maps) {
                  let mapName = i;
                  let map = storeState.world.maps[i];
                  for (let i = 0, len = map.exit.length; i < len; i++) {
                    if (map.exit[i].visible) continue;
                    exit.push({
                      map: mapName,
                      x: map.exit[i].x,
                      y: map.exit[i].y,
                      name: map.exit[i].type.name
                    });
                  }
                  for (let i = 0, len = map.items.length; i < len; i++) {
                    itemsAll.push({
                      map: mapName,
                      x: map.items[i].x,
                      y: map.items[i].y,
                      name: map.items[i].name
                    });
                    if (map.items[i].visible) continue;
                    items.push({
                      map: mapName,
                      x: map.items[i].x,
                      y: map.items[i].y,
                      name: map.items[i].name
                    });
                  }
                  for (let i = 0, len = map.environment.length; i < len; i++) {
                    if (map.environment[i].visible) continue;
                    environment.push({
                      map: mapName,
                      x: map.environment[i].x,
                      y: map.environment[i].y,
                      name: map.environment[i].name
                    });
                  }
                  for (let i = 0, len = map.enemies.length; i < len; i++) {
                    if (map.enemies[i].visible) continue;
                    enemies.push({
                      map: mapName,
                      x: map.enemies[i].x,
                      y: map.enemies[i].height,
                      name: map.enemies[i].type
                    });
                  }
                }
                newPopup = {
                  visible: true,
                  type: 'quest',
                  x: this.state.selected.x * stateMap.tileX,
                  y: statePlayer.y,
                  parameters: {
                    exit: exit,
                    items: items,
                    itemsAll: itemsAll,
                    environment: environment,
                    enemies: enemies,
                    visible: true,
                    name: 'placeholder-name',
                    text: {
                      introducion: "placeholder introducion",
                      accepted: "placeholder accepted",
                      rejected: "placeholder rejected",
                      progress: "placeholder progress",
                      finished: "placeholder finished"
                    },
                    accept: null,
                    trigger: {
                      accepted: {
                        exit: [],
                        items: [],
                        environment: [],
                        enemies: []
                      },
                      rejected: {
                        exit: [],
                        items: [],
                        environment: [],
                        enemies: []
                      },
                      finished: {
                        exit: [],
                        items: [],
                        environment: [],
                        enemies: []
                      }
                    }
                  }
                };
              } else {
                newPopup.visible = false;
              }
              this.setState({
                popup: newPopup
              });
              break;
            }
          case '9':
          case '(':
            if (!isSelected) {
              let newPopup = Object.assign({}, this.state.popup);
              if (!newPopup.visible || newPopup.type !== 'map-switch') {
                newPopup = {
                  visible: true,
                  type: 'map-switch',
                  x: this.state.selected.x * stateMap.tileX,
                  y: statePlayer.y,
                  parameters: {}
                };
              } else {
                newPopup.visible = false;
              }
              this.setState({
                popup: newPopup
              });
            }
            break;
          case 'g':
          case 'G':
            let x = this.state.selected.x;
            let length = e.shiftKey ? floorVariants[floorVariants.length - 1] : floorVariants[0];
            let type = e.ctrlKey ? 3 : 5;
            let newFloor = {
              from: x * stateMap.tileX,
              to: (x + length) * stateMap.tileX,
              height: statePlayer.y,
              bothSide: e.ctrlKey,
              type: type
            };
            if (!this.checkFloorPlace(newFloor, -1)) break;
            stateMap.floor.push(newFloor);
            break;
          case '+':
          case '-':
          case '=':
          case '_':
            let isAdd = e.key === '+' || e.key === '=';
            if (isSelected) {
              let allowedModify = ['ground', 'star', 'enemy', 'floor', 'quest'];
              let x = this.state.selected.x;
              if (allowedModify.indexOf(this.state.selected.name) > -1) {
                switch (this.state.selected.name) {
                  case 'ground':
                    {
                      if (!isShift) {
                        let newGround = Object.assign({}, {
                          from: stateMap.ground[this.state.selected.data.index].from,
                          to: stateMap.ground[this.state.selected.data.index].to
                        });
                        let length = newGround.to - newGround.from;
                        if (!isCtrl && !isAdd && length <= stateMap.tileX * 3) {
                          break;
                        }
                        let currentLengthIndex = isAdd ? 1 : -1;
                        newGround.to = newGround.to + stateMap.tileX * currentLengthIndex;
                        if (isCtrl) newGround.from = newGround.from + stateMap.tileX * currentLengthIndex;
                        if (!this.checkGroundPlace(newGround, this.state.selected.data.index)) break;
                        stateMap.ground[this.state.selected.data.index].to = newGround.to;
                        if (isCtrl) {
                          stateMap.ground[this.state.selected.data.index].from = newGround.from;
                          statePlayer.x += stateMap.tileX * currentLengthIndex;
                          this.context.store.dispatch({
                            type: _gameWorldActions.GAME_WORLD_PLAYER_UPDATE,
                            response: statePlayer
                          });
                          this.detectObjects();
                        }
                      } else {
                        let type = stateMap.ground[this.state.selected.data.index].type;
                        if (isAdd) {
                          if (type === 3) {
                            type = 1;
                          } else {
                            type++;
                          }
                        } else {
                          if (type === 1) {
                            type = 3;
                          } else {
                            type--;
                          }
                        }
                        stateMap.ground[this.state.selected.data.index].type = type;
                      }
                      break;
                    }
                  case 'star':
                    let star = stateMap.stars[x];
                    let valueIndex = starValues.indexOf(star.value) + 1;
                    if (isAdd && valueIndex < starValues.length) {
                      stateMap.stars[x].value = starValues[valueIndex];
                    } else if (!isAdd && valueIndex > 1) {
                      stateMap.stars[x].value = starValues[valueIndex - 2];
                    }
                    break;
                  case 'enemy':
                    let enemy = stateMap.enemies[this.state.selected.data.index];
                    if (!isShift) {
                      if (isAdd) {
                        stateMap.enemies[this.state.selected.data.index].to += 1;
                        if (e.shiftKey === true) {}
                      } else if (!isAdd && enemy.from < enemy.to - 1) {
                        stateMap.enemies[this.state.selected.data.index].to -= 1;
                        if (e.shiftKey === true) {}
                      }
                    }
                    break;
                  case 'floor':
                    {
                      if (!isShift) {
                        if (!isAlt) {
                          let newFloor = Object.assign({}, {
                            from: stateMap.floor[this.state.selected.data.index].from,
                            to: stateMap.floor[this.state.selected.data.index].to
                          });
                          let length = Math.ceil((newFloor.to - newFloor.from) / stateMap.tileX);
                          let currentLengthIndex = floorVariants.indexOf(length);
                          if (!isCtrl) {
                            if (currentLengthIndex === -1) break;
                            if (isAdd && floorVariants[floorVariants.length - 1] === length) {
                              break;
                            } else if (!isAdd && floorVariants[0] === length) {
                              break;
                            }
                            currentLengthIndex += isAdd ? 1 : -1;
                            let newLength = floorVariants[currentLengthIndex] * stateMap.tileX;
                            newFloor.to = newFloor.from + newLength;
                          } else {
                            currentLengthIndex = isAdd ? 1 : -1;
                            newFloor.to = newFloor.to + stateMap.tileX * currentLengthIndex;
                            newFloor.from = newFloor.from + stateMap.tileX * currentLengthIndex;
                          }
                          if (!this.checkFloorPlace(newFloor, this.state.selected.data.index)) break;
                          stateMap.floor[this.state.selected.data.index].to = newFloor.to;
                          if (isCtrl) {
                            stateMap.floor[this.state.selected.data.index].from = newFloor.from;
                            statePlayer.x += stateMap.tileX * currentLengthIndex;
                            this.context.store.dispatch({
                              type: _gameWorldActions.GAME_WORLD_PLAYER_UPDATE,
                              response: statePlayer
                            });
                            this.detectObjects();
                          }
                        } else {
                          let currentHeightIndex = isAdd ? -1 : 1;
                          let currentHeightStep = Math.floor(stateMap.tileY / 2) * currentHeightIndex;
                          if (isAdd && stateMap.floor[this.state.selected.data.index].height <= stateMap.tileY) break;
                          if (!isAdd && stateMap.floor[this.state.selected.data.index].height >= (stateMap.height - 1.5) * stateMap.tileY) break;
                          stateMap.floor[this.state.selected.data.index].height += currentHeightStep;
                          statePlayer.y += currentHeightStep;
                          this.context.store.dispatch({
                            type: _gameWorldActions.GAME_WORLD_PLAYER_UPDATE,
                            response: statePlayer
                          });
                          this.detectObjects();
                        }
                      } else {
                        if (isCtrl) {
                          stateMap.floor[this.state.selected.data.index].type += stateMap.floor[this.state.selected.data.index].bothSide ? 1 : -1;
                          stateMap.floor[this.state.selected.data.index].bothSide = !stateMap.floor[this.state.selected.data.index].bothSide;
                        } else {
                          let type = stateMap.floor[this.state.selected.data.index].type;
                          type += true === stateMap.floor[this.state.selected.data.index].bothSide ? 1 : 0;
                          type /= 2;
                          if (isAdd) {
                            if (type === 3) {
                              type = 1;
                            } else {
                              type++;
                            }
                          } else {
                            if (type === 1) {
                              type = 3;
                            } else {
                              type--;
                            }
                          }
                          type *= 2;
                          type -= true === stateMap.floor[this.state.selected.data.index].bothSide ? 1 : 0;
                          stateMap.floor[this.state.selected.data.index].type = type;
                        }
                      }
                      break;
                    }
                  case 'quest':
                    let quest = stateMap.quests[this.state.selected.data.index];
                    if (!isShift) {
                      if (isAdd) {
                        stateMap.quests[this.state.selected.data.index].to += stateMap.tileX;
                      } else if (!isAdd && quest.from < quest.to - stateMap.tileX) {
                        stateMap.quests[this.state.selected.data.index].to -= stateMap.tileX;
                      }
                    }
                    break;
                }
              }
            }
            break;
          case 'i':
          case 'I':
            if (isSelected) {
              switch (this.state.selected.name) {
                case 'enemy':
                  stateMap.enemies[this.state.selected.data.index].visible = !stateMap.enemies[this.state.selected.data.index].visible;
                  break;
                case 'quest':
                  stateMap.quests[this.state.selected.data.index].visible = !stateMap.quests[this.state.selected.data.index].visible;
                  break;
                case 'exit':
                  stateMap.exit[this.state.selected.data.index].visible = !stateMap.exit[this.state.selected.data.index].visible;
                  break;
                case 'environment':
                  stateMap.environment[this.state.selected.data.index].visible = !stateMap.environment[this.state.selected.data.index].visible;
                  break;
                case 'item':
                  stateMap.items[this.state.selected.data.index].visible = !stateMap.items[this.state.selected.data.index].visible;
                  break;
              }
            }
            break;
        }
      }
      this.context.store.dispatch({
        type: _gameWorldActions.GAME_WORLD_MAP_UPDATE,
        name: storeState.world.activeMap,
        response: stateMap
      });
      this.detectObjects();
    }
    detectObjects() {
      let storeState = this.context.store.getState();
      let stateMap = storeState.world.maps[storeState.world.activeMap];
      let statePlayer = Object.assign({}, storeState.world.player);
      let newStateSelected = Object.assign({}, this.state.selected);
      let ground = stateMap.ground;
      let stars = stateMap.stars;
      let spikes = stateMap.spikes;
      let enemies = stateMap.enemies;
      let quests = stateMap.quests;
      let items = stateMap.items;
      let x = Math.max(0, Math.floor((statePlayer.x + stateMap.tileX * 0.5) / stateMap.tileX));
      newStateSelected.name = '';
      newStateSelected.value = '';
      newStateSelected.data = null;
      newStateSelected.x = x;
      if (stateMap.height * stateMap.tileY === statePlayer.y) {}
      if (stateMap.height * stateMap.tileY === statePlayer.y) for (let i = 0, len = ground.length; i < len; i++) {
        let from = ground[i].from;
        let to = ground[i].to;
        if (statePlayer.x < from || statePlayer.x >= to) {
          continue;
        }
        newStateSelected.name = 'ground';
        newStateSelected.value = JSON.stringify(ground[i]);
        newStateSelected.data = ground[i];
        newStateSelected.data.index = i;
        break;
      }
      if (stars[x] !== null) {
        let starHeight = stars[x].y * stateMap.tileY;
        if (starHeight === statePlayer.y) {
          newStateSelected.name = 'star';
          newStateSelected.value = JSON.stringify(stars[x]);
          newStateSelected.data = stars[x];
        }
      }
      if (spikes[x] !== null) {
        let spikeHeight = spikes[x].y * stateMap.tileY;
        if (spikeHeight === statePlayer.y) {
          newStateSelected.name = 'spike';
          newStateSelected.value = JSON.stringify(spikes[x]);
          newStateSelected.data = spikes[x];
        }
      }
      for (let i = 0, len = stateMap.exit.length; i < len; i++) {
        let x = stateMap.exit[i].x;
        if ([x, x + stateMap.tileX].indexOf(statePlayer.x) === -1 || stateMap.exit[i].y !== statePlayer.y) {
          continue;
        }
        newStateSelected.name = 'exit';
        newStateSelected.value = JSON.stringify(stateMap.exit[i]);
        newStateSelected.data = stateMap.exit[i];
        newStateSelected.data.index = i;
      }
      for (let i = 0, len = stateMap.environment.length; i < len; i++) {
        let x = stateMap.environment[i].x;
        if (x !== statePlayer.x || stateMap.environment[i].y !== statePlayer.y) {
          continue;
        }
        newStateSelected.name = 'environment';
        newStateSelected.value = JSON.stringify(stateMap.environment[i]);
        newStateSelected.data = stateMap.environment[i];
        newStateSelected.data.index = i;
      }
      for (let i = 0, len = enemies.length; i < len; i++) {
        let enemy = enemies[i];
        if (Math.abs(enemy.x - statePlayer.x) >= this.state.width) continue;
        let enemyNear = enemy.x !== statePlayer.x ? false : true;
        if (enemyNear) {
          let enemyHeight = enemy.y;
          if (enemyHeight === statePlayer.y) {
            newStateSelected.name = 'enemy';
            newStateSelected.value = JSON.stringify(enemy);
            newStateSelected.data = enemy;
            newStateSelected.data.index = i;
            break;
          }
        }
      }
      for (let i = 0, len = quests.length; i < len; i++) {
        let quest = quests[i];
        if (Math.abs(quest.x - statePlayer.x) >= this.state.width) continue;
        let questNear = quest.x !== statePlayer.x ? false : true;
        if (questNear) {
          let questHeight = quest.y;
          if (questHeight === statePlayer.y) {
            newStateSelected.name = 'quest';
            newStateSelected.value = JSON.stringify(quest);
            newStateSelected.data = quest;
            newStateSelected.data.index = i;
            break;
          }
        }
      }
      for (let i = 0, len = items.length; i < len; i++) {
        let item = items[i];
        if (Math.abs(item.x - statePlayer.x) >= this.state.width) continue;
        let itemNear = item.x !== statePlayer.x ? false : true;
        if (itemNear && item.y === statePlayer.y) {
          newStateSelected.name = 'item';
          newStateSelected.value = JSON.stringify(item);
          newStateSelected.data = item;
          newStateSelected.data.index = i;
          break;
        }
      }
      for (let i = 0, len = stateMap.floor.length; i < len; i++) {
        let floorItem = stateMap.floor[i];
        for (let j = floorItem.from, length = floorItem.to; j < length; j += stateMap.tileX) {
          if (j !== statePlayer.x) continue;
          if (floorItem.height === statePlayer.y) {
            newStateSelected.name = 'floor';
            newStateSelected.value = JSON.stringify(floorItem);
            newStateSelected.data = floorItem;
            newStateSelected.data.index = i;
            break;
          }
        }
      }
      this.setState({
        selected: newStateSelected
      });
    }
    toggleFullScreen(e) {
      if (!document.fullscreenElement) {
        let el = document.documentElement;
        if (el.requestFullscreen) {
          el.requestFullscreen().catch(() => {});
        } else if (el.webkitRequestFullscreen) {
          el.webkitRequestFullscreen();
        } else if (el.mozRequestFullScreen) {
          el.mozRequestFullScreen();
        } else if (el.msRequestFullscreen) {
          el.msRequestFullscreen();
        }
      } else {
        let el = document;
        if (el.webkitCancelFullScreen) {
          el.webkitCancelFullScreen();
        } else if (el.mozCancelFullScreen) {
          el.mozCancelFullScreen();
        } else if (el.msExitFullscreen) {
          el.msExitFullscreen();
        }
      }
    }
    procedExitPlace(e, mapName) {
      e.preventDefault();
      let storeState = this.context.store.getState();
      let stateMap = storeState.world.maps[storeState.world.activeMap];
      let statePopup = this.state.popup;
      let isWin = false;
      let map = mapName;
      if (mapName === 'win') {
        isWin = true;
        map = '';
      }
      let blocker = statePopup.parameters.blocked ? {
        frame: 1,
        destroyed: false
      } : null;
      let newExit = {
        x: statePopup.x,
        y: statePopup.y,
        map: map,
        win: isWin,
        type: {
          name: statePopup.parameters.type,
          frame: 1
        },
        blocker,
        visible: true
      };
      stateMap.exit.push(newExit);
      this.context.store.dispatch({
        type: _gameWorldActions.GAME_WORLD_MAP_UPDATE,
        name: storeState.world.activeMap,
        response: stateMap,
        editor: true
      });
      let newPopup = Object.assign({}, this.state.popup);
      newPopup.visible = false;
      this.setState({
        popup: newPopup
      });
      this.detectObjects();
    }
    procedExitChangeBlocked(e) {
      e.preventDefault();
      let newPopup = Object.assign({}, this.state.popup);
      newPopup.parameters.blocked = !newPopup.parameters.blocked;
      this.setState({
        popup: newPopup
      });
    }
    procedExitChangeType(e, typeName) {
      e.preventDefault();
      let newPopup = Object.assign({}, this.state.popup);
      newPopup.parameters.type = typeName;
      this.setState({
        popup: newPopup
      });
    }
    procedItemChangeVisible(e) {
      e.preventDefault();
      let newPopup = Object.assign({}, this.state.popup);
      newPopup.parameters.visible = !newPopup.parameters.visible;
      this.setState({
        popup: newPopup
      });
    }
    procedEnemyPlace(enemy) {
      let newEnemy = Object.assign({}, enemy);
      let storeState = this.context.store.getState();
      let statePopup = this.state.popup;
      let stateMap = storeState.world.maps[storeState.world.activeMap];
      if (this.state.selected.name !== 'enemy') {
        newEnemy.x = statePopup.x;
        newEnemy.y = statePopup.y;
        newEnemy.from = Math.floor(statePopup.x / stateMap.tileX);
        newEnemy.to = newEnemy.from + Math.floor(1 + Math.random() * 3);
        newEnemy.speed = 2 + Math.floor(Math.random() * 1);
        newEnemy.live = {
          lives: 1,
          timer: 0,
          defeated: false
        };
        newEnemy.xGrid = Math.floor(statePopup.x / stateMap.tileX);
        stateMap.enemies.push(newEnemy);
      } else {
        stateMap.enemies[this.state.selected.data.index] = newEnemy;
      }
      this.context.store.dispatch({
        type: _gameWorldActions.GAME_WORLD_MAP_UPDATE,
        name: storeState.world.activeMap,
        response: stateMap
      });
      this.procedPopupClose();
      this.detectObjects();
    }
    procedItemPlace(item) {
      let newItem = Object.assign({}, item);
      let storeState = this.context.store.getState();
      let statePopup = this.state.popup;
      let stateMap = storeState.world.maps[storeState.world.activeMap];
      if (this.state.selected.name !== 'item') {
        newItem.x = statePopup.x;
        newItem.y = statePopup.y;
        stateMap.items.push(newItem);
      } else {
        stateMap.items[this.state.selected.data.index] = newItem;
      }
      this.context.store.dispatch({
        type: _gameWorldActions.GAME_WORLD_MAP_UPDATE,
        name: storeState.world.activeMap,
        response: stateMap
      });
      this.procedPopupClose();
      this.detectObjects();
    }
    procedEnemyChangeFollowing(e) {
      e.preventDefault();
      let newPopup = Object.assign({}, this.state.popup);
      newPopup.parameters.following = !newPopup.parameters.following;
      this.setState({
        popup: newPopup
      });
    }
    procedEnemyChangeSpeed(e) {
      e.preventDefault();
      let newPopup = Object.assign({}, this.state.popup);
      let newSpeed = parseInt(e.target.value);
      if (newSpeed > 0 && newSpeed <= 10) {
        newPopup.parameters.speed = newSpeed;
        this.setState({
          popup: newPopup
        });
      }
    }
    procedEnvironmentPlace(e, environmentName) {
      e.preventDefault();
      let storeState = this.context.store.getState();
      let statePopup = this.state.popup;
      let stateMap = storeState.world.maps[storeState.world.activeMap];
      let newEnvironment = Object.assign({
        x: statePopup.x,
        y: statePopup.y,
        frame: 1,
        visible: statePopup.parameters.visible
      }, storeState.world.environment[environmentName]);
      stateMap.environment.push(newEnvironment);
      this.context.store.dispatch({
        type: _gameWorldActions.GAME_WORLD_MAP_UPDATE,
        name: storeState.world.activeMap,
        response: stateMap
      });
      let newPopup = Object.assign({}, this.state.popup);
      newPopup.visible = false;
      this.setState({
        popup: newPopup
      });
      this.detectObjects();
    }
    procedPopupClose() {
      let newPopup = Object.assign({}, this.state.popup);
      newPopup.visible = false;
      this.setState({
        popup: newPopup
      });
    }
    procedQuestPlace(quest) {
      let newQuest = Object.assign({}, quest);
      let storeState = this.context.store.getState();
      let statePopup = this.state.popup;
      let stateMap = storeState.world.maps[storeState.world.activeMap];
      if (this.state.selected.name !== 'quest') {
        newQuest.x = statePopup.x;
        newQuest.y = statePopup.y;
        newQuest.from = statePopup.x;
        newQuest.to = statePopup.x + Math.floor(1 + Math.random() * 3) * stateMap.tileX;
        newQuest.speed = 2 + Math.floor(Math.random() * 2);
        newQuest.xGrid = Math.floor(statePopup.x / stateMap.tileX);
        stateMap.quests.push(newQuest);
      } else {
        stateMap.quests[this.state.selected.data.index] = newQuest;
      }
      this.context.store.dispatch({
        type: _gameWorldActions.GAME_WORLD_MAP_UPDATE,
        name: storeState.world.activeMap,
        response: stateMap
      });
      this.procedPopupClose();
      this.detectObjects();
    }
    procedMapSwitch(e, mapName) {
      this.context.store.dispatch({
        type: _gameWorldActions.GAME_WORLD_MAP_SWITCH,
        response: mapName
      });
      let storeState = this.context.store.getState();
      let stateMap = storeState.world.maps[storeState.world.activeMap];
      let statePlayer = storeState.world.player;
      statePlayer.x = 0;
      statePlayer.y = 0;
      stateMap.offset = 0;
      this.context.store.dispatch({
        type: _gameWorldActions.GAME_WORLD_MAP_UPDATE,
        name: storeState.world.activeMap,
        response: stateMap
      });
      this.context.store.dispatch({
        type: _gameWorldActions.GAME_WORLD_PLAYER_UPDATE,
        response: statePlayer
      });
      let newPopup = Object.assign({}, this.state.popup);
      newPopup.visible = false;
      this.setState({
        popup: newPopup
      });
      this.detectObjects();
    }
    render() {
      if (!this.sprites) return (0, dom.element)("div", {
        children: "Preparing engine…"
      });
      let storeState = this.context.store.getState();
      let stateMap = storeState.world.maps[storeState.world.activeMap];
      let state = this.state;
      let width = state.loaded ? state.width : 0;
      let height = state.loaded ? state.height : 0;
      let loader = null;
      let gameAnimations = null;
      let gameRender = null;
      let gameLoop = null;
      let editorMapBar = state.loaded ? (0, dom.element)("div", {
        children: (0, dom.element)(_EditorMapBar.default, {
          name: this.state.selected.name,
          value: this.state.selected.value
        })
      }) : null;
      let loaderStyle = {
        opacity: '0'
      };
      let drawPosition = true;
      let popup = null;
      if (state.popup.visible) {
        let popupStyle = {
          position: 'absolute',
          marginLeft: '44vw',
          width: '12vw',
          marginTop: '45vh',
          minHeight: '10vh',
          backgroundColor: '#603abb',
          border: '1px solid black',
          padding: '1vh',
          borderRadius: '2vh'
        };
        let popupItemStyle = {
          display: 'block',
          float: 'left',
          width: '100%',
          backgroundColor: '#afb138',
          borderTop: '1px solid black',
          padding: '0.5vh'
        };
        let popupTypeStyle = {
          display: 'block',
          float: 'left',
          width: '100%',
          backgroundColor: '#b15538',
          borderTop: '1px solid black',
          padding: '0.5vh'
        };
        let popupTypeSelectedStyle = {
          display: 'block',
          float: 'left',
          width: '100%',
          backgroundColor: '#b15579',
          borderTop: '1px solid black',
          padding: '0.5vh'
        };
        let popupVisibleStyle = {
          display: 'block',
          float: 'left',
          width: '100%',
          backgroundColor: '#9c8383',
          borderTop: '1px solid black',
          padding: '0.5vh'
        };
        let rows = [];
        switch (state.popup.type) {
          case 'exit':
            {
              let blockedName = state.popup.parameters.blocked ? 'blocked' : 'non-blocked';
              let popupBlockedStyle = {
                display: 'block',
                float: 'left',
                width: '100%',
                backgroundColor: '#9c8383',
                borderTop: '1px solid black',
                padding: '0.5vh'
              };
              for (let i in storeState.world.maps) {
                if (i === storeState.world.activeMap) continue;
                let name = i;
                let key = ['exit-map', name];
                let row = (0, dom.element)("div", {
                  style: popupItemStyle,
                  onClick: e => this.procedExitPlace(e, name),
                  children: name
                }, key);
                rows.push(row);
              }
              let key = 'exit-map-win';
              let name = 'win';
              let rowExitPlace = (0, dom.element)("div", {
                style: popupBlockedStyle,
                onClick: e => this.procedExitPlace(e, name),
                children: name
              }, key);
              rows.push(rowExitPlace);
              let sprites = this.sprites.getSprites();
              for (let i in sprites) {
                let index = sprites[i].id.indexOf("exit-");
                if (index === -1) continue;
                let name = sprites[i].id.substring(5);
                let style = this.state.popup.parameters.type === name ? popupTypeSelectedStyle : popupTypeStyle;
                let key = ['environment', name];
                let row = (0, dom.element)("div", {
                  style: style,
                  onClick: e => this.procedExitChangeType(e, name),
                  children: name
                }, key);
                rows.push(row);
              }
              popup = (0, dom.element)("div", {
                style: popupStyle,
                children: ["EXIT", (0, dom.element)("div", {
                  children: [rows, (0, dom.element)("div", {
                    style: popupItemStyle,
                    onClick: e => this.procedExitChangeBlocked(e),
                    children: blockedName
                  })]
                })]
              });
              break;
            }
          case 'item':
            {
              let id = this.state.selected.name === 'item' ? this.state.selected.data.index : null;
              popup = (0, dom.element)(_EditorMapItemAdd.default, {
                onCancel: () => this.procedPopupClose(),
                onProced: quest => this.procedItemPlace(quest),
                id: id
              });
              break;
            }
          case 'enemy':
            {
              let id = this.state.selected.name === 'enemy' ? this.state.selected.data.index : null;
              popup = (0, dom.element)(_EditorMapEnemyAdd.default, {
                onCancel: () => this.procedPopupClose(),
                onProced: quest => this.procedEnemyPlace(quest),
                id: id
              });
              break;
            }
          case 'quest':
            {
              let id = this.state.selected.name === 'quest' ? this.state.selected.data.index : null;
              popup = (0, dom.element)(_EditorMapQuestAdd.default, {
                onCancel: () => this.procedPopupClose(),
                onProced: quest => this.procedQuestPlace(quest),
                id: id
              });
              break;
            }
          case 'environment':
            {
              for (let i in storeState.world.environment) {
                let name = i;
                let key = ['item-environment', name];
                let row = (0, dom.element)("div", {
                  style: popupItemStyle,
                  onClick: e => this.procedEnvironmentPlace(e, name),
                  children: name
                }, key);
                rows.push(row);
              }
              let environmentVisibleName = state.popup.parameters.visible ? 'visible' : 'invisible';
              let rowEnvironmentVisible = (0, dom.element)("div", {
                style: popupVisibleStyle,
                onClick: e => this.procedItemChangeVisible(e),
                children: environmentVisibleName
              });
              rows.push(rowEnvironmentVisible);
              popup = (0, dom.element)("div", {
                style: popupStyle,
                children: ["ENVIRONMENT", (0, dom.element)("div", {
                  children: rows
                })]
              });
              break;
            }
          case 'map-switch':
            {
              for (let i in storeState.world.maps) {
                if (i === storeState.world.activeMap) continue;
                let name = i;
                let key = ['switch-map', name];
                let row = (0, dom.element)("div", {
                  style: popupItemStyle,
                  onClick: e => this.procedMapSwitch(e, name),
                  children: name
                }, key);
                rows.push(row);
              }
              popup = (0, dom.element)("div", {
                style: popupStyle,
                children: ["MAP SWITCH", (0, dom.element)("div", {
                  children: rows
                })]
              });
              break;
            }
        }
      }
      loader = (0, dom.element)("div", {
        style: loaderStyle,
        onClick: e => this.toggleFullScreen(e),
        children: (0, dom.element)(_GameLoader.default, {})
      });
      gameAnimations = (0, dom.element)(_GameAnimations.default, {
        onProcessDeath: () => this.processDeath(),
        sprites: this.sprites,
        width: width,
        height: height
      });
      gameRender = (0, dom.element)(_GameRender.default, {
        sprites: this.sprites,
        environment: this.environment,
        width: width,
        height: height,
        drawPosition: drawPosition
      });
      return (0, dom.element)("div", {
        children: [editorMapBar, loader, popup, gameAnimations, gameLoop, gameRender]
      });
    }
  }
  exports.default = EditorMap;
});

