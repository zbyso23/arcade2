// Editable vanilla JavaScript — loaded directly by index.html.
ArcadeModules.define("views/EditorEnvironmentView", function (local, exports) {
  const {
    View,
    Link
  } = ArcadeDOM;
  "use strict";
  exports.default = void 0;
  var _GameLoader = local("../components/GameLoader");
  var _Environment = local("../libs/Environment");
  var _gameWorldActions = local("../actions/gameWorldActions");
  var dom = local("native/dom");
  function mapStateFromStore(store, state) {
    return state;
  }
  class EditorEnvironmentView extends View {
    constructor(props) {
      super(props);
      this.unsubscribe = void 0;
      this.ctx = void 0;
      this.canvas = void 0;
      this.environment = [];
      this.environmentCount = 0;
      this.environmentBlocks = 0;
      this.environmentHeight = 0;
      this.environmentImg = {};
      this.state = {
        loaded: false,
        width: 0,
        height: 0,
        loader: {
          imagesLeft: 0
        }
      };
      this.loaderImagePrepare = this.loaderImagePrepare.bind(this);
      this.loaderImage = this.loaderImage.bind(this);
      this.processLoad = this.processLoad.bind(this);
      this.resize = this.resize.bind(this);
      this.run = this.run.bind(this);
    }
    componentDidMount() {
      let storeState = this.context.store.getState();
      this.unsubscribe = this.context.store.subscribe(this.setStateFromStore.bind(this));
      let width = ArcadeViewport.width;
      let height = ArcadeViewport.height;
      this.resize = this.resize.bind(this);
      let newState = Object.assign({}, this.state);
      newState.width = width;
      newState.height = height;
      this.setState(mapStateFromStore(this.context.store.getState(), newState));
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
    loaderImagePrepare() {
      let newState = Object.assign({}, this.state);
      newState.loader.imagesLeft = this.environmentCount;
      this.setState(newState);
      let count = 0;
      for (let i in this.environment) {
        let environmentItem = this.environment[i];
        for (let i = 1, len = environmentItem.frames; i <= len; i++) {
          let dir = 'images/';
          let id = environmentItem.id + i.toString();
          let src = dir + id + '.png';
          let img = new Image();
          img.onload = this.loaderImage;
          img.src = src;
          this.environmentImg[id] = img;
          count++;
        }
      }
    }
    loaderImage() {
      let newState = Object.assign({}, this.state);
      newState.loader.imagesLeft -= 1;
      if (newState.loader.imagesLeft === 0) {
        newState.loaded = true;
      }
      this.setState(newState, () => {
        if (newState.loader.imagesLeft === 0) this.run();
      });
    }
    resize() {
      let width = ArcadeViewport.width;
      let height = ArcadeViewport.height;
      this.setState({
        width: width,
        height: height
      });
    }
    run() {
      if (this._destroyed) return;
      let x = 0;
      let y = 0;
      let w = 92;
      let h = 104;
      for (let index in this.environment) {
        let environment = this.environment[index];
        for (let i = 1, len = environment.frames; i <= len; i++) {
          let id = environment.id + i.toString();
          this.ctx.drawImage(this.environmentImg[id], x, 0);
          let factor = environment.width;
          x += w * factor;
        }
      }
    }
    componentWillUnmount() {
      if (this.unsubscribe) {
        this.unsubscribe();
      }
    }
    setStateFromStore() {
      this.setState(mapStateFromStore(this.context.store.getState(), this.state));
    }
    generateEnvironment() {
      let storeState = this.context.store.getState();
      let stateMap = storeState.world.maps[storeState.world.activeMap];
      let environment = new _Environment.Environment(stateMap.tileX, stateMap.tileY);
      ;
      let environmentList = environment.getEnvironment();
      let environmentCount = 0;
      for (let i in environmentList) {
        environmentCount += environmentList[i].frames;
        this.environmentBlocks += environmentList[i].frames * environmentList[i].width;
        this.environmentHeight = Math.max(this.environmentHeight, environmentList[i].height);
      }
      this.environment = environmentList;
      this.environmentCount = environmentCount;
    }
    processLoad(e) {
      if (!e || this.ctx) return;
      this.ctx = e.getContext('2d');
      this.generateEnvironment();
      this.loaderImagePrepare();
    }
    render() {
      let loader = null;
      let canvas = null;
      let canvasStyle = {};
      let width = 0;
      let height = 0;
      if (this.state.loaded) {
        width = 92 * this.environmentBlocks;
        height = 104 * this.environmentHeight;
      } else {
        loader = (0, dom.element)(_GameLoader.default, {});
      }
      if (this.state.loaded) {
        canvas = (0, dom.element)("canvas", {
          className: "game",
          style: canvasStyle,
          ref: e => this.processLoad(e),
          width: width,
          height: height
        }, "canvas-environment");
      }
      return (0, dom.element)("div", {
        children: [loader, canvas]
      });
    }
  }
  exports.default = EditorEnvironmentView;
});

