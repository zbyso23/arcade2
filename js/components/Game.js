// Editable vanilla JavaScript — loaded directly by index.html.
ArcadeModules.define("components/Game", function (local, exports) {
  const {
    View,
    Link
  } = ArcadeDOM;
  "use strict";
  exports.default = void 0;
  var _Sprites = local("../libs/Sprites");
  var _Environment = local("../libs/Environment");
  var _GameLoader = local("../components/GameLoader");
  var _StatusBar = local("../components/StatusBar");
  var _GameAnimations = local("../components/GameAnimations");
  var _GameRender = local("../components/GameRender");
  var _GameLoop = local("../components/GameLoop");
  var _gameWorldActions = local("../actions/gameWorldActions");
  var dom = local("native/dom");
  function mapStateFromStore(store, state) {
    if (!store.world.loaded) return state;
    let newState = Object.assign({}, state, {
      sound: store.sound
    });
    return newState;
  }
  class Game extends View {
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
        sound: null
      };
      this.handlerKeyUp = this.processKeyUp.bind(this);
      this.handlerKeyDown = this.processKeyDown.bind(this);
      this.handleGamepadConnected = this.handleGamepadConnected.bind(this);
      this.handleGamepadDisconnected = this.handleGamepadDisconnected.bind(this);
      this.processStats = this.processStats.bind(this);
      this.processMenu = this.processMenu.bind(this);
      this.processMapChange = this.processMapChange.bind(this);
      this.animate = this.animate.bind(this);
      this.toggleFullScreen = this.toggleFullScreen.bind(this);
      this.run = this.run.bind(this);
      this.resize = this.resize.bind(this);
    }
    soundOn(id) {
      this.state.sound.sound.play(id, false, false);
    }
    soundLoop(id) {
      this.state.sound.sound.play(id, true, false);
    }
    soundOff(id) {
      this.state.sound.sound.stop(id, false);
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
      storeState.sound.sound.loadList(['music-gameover', 'music-win', 'music-map-hills', 'music-map-house', 'music-map-house-white', 'music-map-cave', 'music-quest', 'sfx-enemy-death', 'sfx-star-collected', 'sfx-exit-cave-blocked', 'sfx-player-walk', 'sfx-player-jump', 'sfx-player-death', 'sfx-exit-detected', 'sfx-quest-detected', 'sfx-button']).then(() => {
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
      this.context.store.dispatch({
        type: _gameWorldActions.GAME_WORLD_MAP_UPDATE,
        response: stateMap,
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
    }
    processDeath() {
      let storeState = this.context.store.getState();
      let statePlayer = storeState.world.player;
      let stateMap = storeState.world.maps[storeState.world.activeMap];
      if (statePlayer.lives <= 0) {
        statePlayer.lives = 0;
        statePlayer.started = false;
        stateMap.offset = 0;
        this.context.store.dispatch({
          type: _gameWorldActions.GAME_WORLD_PLAYER_UPDATE,
          response: statePlayer
        });
        this.context.store.dispatch({
          type: _gameWorldActions.GAME_WORLD_MAP_UPDATE,
          response: stateMap,
          name: storeState.world.activeMap
        });
        this.isRunning = false;
        this.soundOff('sfx-player-walk');
        this.props.onPlayerDeath();
        return;
      }
      statePlayer.lives = statePlayer.lives - 1;
      statePlayer.x = 50;
      statePlayer.y = (stateMap.height - 1) * stateMap.tileY;
      statePlayer.jump = (stateMap.height - 1) * stateMap.tileY;
      statePlayer.surface = (stateMap.height - 1) * stateMap.tileY;
      statePlayer.falling = false;
      statePlayer.fall = 0;
      statePlayer.death = false;
      statePlayer.started = false;
      statePlayer.right = true;
      statePlayer.speed = 0;
      statePlayer.frame = 1;
      stateMap.offset = 0;
      this.context.store.dispatch({
        type: _gameWorldActions.GAME_WORLD_PLAYER_UPDATE,
        response: statePlayer
      });
      this.context.store.dispatch({
        type: _gameWorldActions.GAME_WORLD_MAP_UPDATE,
        response: stateMap,
        name: storeState.world.activeMap
      });
      this.setState({
        controls: {
          up: false,
          down: false,
          left: false,
          right: false
        }
      });
    }
    processWin() {
      let storeState = this.context.store.getState();
      let statePlayer = storeState.world.player;
      statePlayer.started = false;
      statePlayer.character.experience += Math.floor(statePlayer.character.stars / 10) * 10 + statePlayer.lives * 100;
      this.context.store.dispatch({
        type: _gameWorldActions.GAME_WORLD_PLAYER_UPDATE,
        response: statePlayer
      });
      this.isRunning = false;
      this.soundOff('sfx-player-walk');
      this.props.onPlayerWin();
    }
    processMapChange(map) {
      this.props.onPlayerMapChange(map);
    }
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
      if (e.repeat) {
        let assignKeys = [9, 113];
        if (assignKeys.indexOf(e.keyCode) > -1) e.preventDefault();
        return;
      }
      this.toggleKey(e);
    }
    processKeyUp(e) {
      this.toggleKey(e);
    }
    toggleKey(e) {
      let assignKeys = [32, 37, 39, 9, 113];
      if (assignKeys.indexOf(e.keyCode) === -1) return;
      e.preventDefault();
      if (e.type === "keydown" && [9, 113].indexOf(e.keyCode) > -1) {
        if (e.keyCode === 9) this.processStats();
        if (e.keyCode === 113) this.processMenu();
        return;
      }
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
    render() {
      if (!this.sprites) return (0, dom.element)("div", {
        children: "Preparing engine…"
      });
      let state = this.state;
      let width = state.loaded ? state.width : 0;
      let height = state.loaded ? state.height : 0;
      let loader = null;
      let gameAnimations = null;
      let gameRender = null;
      let gameLoop = null;
      let statusBar = state.loaded ? (0, dom.element)("div", {
        children: (0, dom.element)(_StatusBar.default, {})
      }) : null;
      let loaderStyle = {
        opacity: '0'
      };
      let drawPosition = false;
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
      gameLoop = (0, dom.element)(_GameLoop.default, {
        width: width,
        height: height,
        onProcessWin: () => this.processWin(),
        onProcessMapChange: map => this.processMapChange(map)
      });
      return (0, dom.element)("div", {
        ref: "myRef",
        children: [(0, dom.element)("div", {
          className: "game-screen",
          onClick: e => this.toggleFullScreen(e)
        }), statusBar, loader, gameAnimations, gameLoop, gameRender]
      });
    }
  }
  exports.default = Game;
});

