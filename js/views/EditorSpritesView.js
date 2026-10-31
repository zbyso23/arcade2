// Editable vanilla JavaScript — loaded directly by index.html.
ArcadeModules.define("views/EditorSpritesView", function (local, exports) {
  const {
    View,
    Link
  } = ArcadeDOM;
  "use strict";
  exports.default = void 0;
  var _GameLoader = local("../components/GameLoader");
  var _Sprites = local("../libs/Sprites");
  var _gameWorldActions = local("../actions/gameWorldActions");
  var dom = local("native/dom");
  function mapStateFromStore(store, state) {
    return state;
  }
  class EditorSpritesView extends View {
    constructor(props) {
      super(props);
      this.unsubscribe = void 0;
      this.ctx = void 0;
      this.canvas = void 0;
      this.sprites = [];
      this.spritesCount = 0;
      this.spritesBlocks = 0;
      this.spritesImg = {};
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
      newState.loader.imagesLeft = this.spritesCount;
      this.setState(newState);
      let count = 0;
      for (let i in this.sprites) {
        let sprite = this.sprites[i];
        for (let i = 1, len = sprite.frames; i <= len; i++) {
          let dir = 'images/';
          let id = sprite.id + i.toString();
          let src = dir + id + '.png';
          let img = new Image();
          img.onload = this.loaderImage;
          img.src = src;
          this.spritesImg[id] = img;
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
      let w = 92;
      for (let index in this.sprites) {
        let sprite = this.sprites[index];
        for (let i = 1, len = sprite.frames; i <= len; i++) {
          let id = sprite.id + i.toString();
          this.ctx.drawImage(this.spritesImg[id], x, 0);
          let factor = sprite.double ? 2 : 1;
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
    generateSprites() {
      let storeState = this.context.store.getState();
      let stateMap = storeState.world.maps[storeState.world.activeMap];
      let sprites = new _Sprites.Sprites(stateMap.tileX, stateMap.tileY);
      ;
      let spriteList = sprites.getSprites();
      let spritesCount = 0;
      for (let i in spriteList) {
        spritesCount += spriteList[i].frames;
        this.spritesBlocks += spriteList[i].double ? spriteList[i].frames * 2 : spriteList[i].frames;
      }
      this.sprites = spriteList;
      this.spritesCount = spritesCount;
    }
    processLoad(e) {
      if (!e || this.ctx) return;
      this.ctx = e.getContext('2d');
      this.generateSprites();
      this.loaderImagePrepare();
    }
    render() {
      let loader = null;
      let canvas = null;
      let canvasStyle = {};
      let width = 0;
      let height = 0;
      if (this.state.loaded) {
        width = 92 * this.spritesBlocks;
        height = 104;
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
        }, "canvas-sprite");
      }
      return (0, dom.element)("div", {
        children: [loader, canvas]
      });
    }
  }
  exports.default = EditorSpritesView;
});

