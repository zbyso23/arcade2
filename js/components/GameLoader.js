// Editable vanilla JavaScript — loaded directly by index.html.
ArcadeModules.define("components/GameLoader", function (local, exports) {
  const {
    View,
    Link
  } = ArcadeDOM;
  "use strict";
  exports.default = void 0;
  var dom = local("native/dom");
  function mapStateFromStore(store, state) {
    if (!store.world.loaded) return state;
    let newState = Object.assign({}, state, {
      player: store.world.player,
      map: store.world.maps[store.world.activeMap]
    });
    return newState;
  }
  class GameLoader extends View {
    constructor(props) {
      super(props);
      this.unsubscribe = void 0;
      this.state = {
        loaded: false,
        width: 0,
        height: 0,
        player: null,
        map: null
      };
      this.resize = this.resize.bind(this);
    }
    componentDidMount() {
      let storeState = this.context.store.getState();
      this.setStateFromStore();
      this.unsubscribe = this.context.store.subscribe(this.setStateFromStore.bind(this));
      let width = ArcadeViewport.width;
      let height = 150;
      window.addEventListener('resize', this.resize);
      let newState = Object.assign({}, this.state);
      newState.loaded = true;
      newState.width = width;
      newState.height = height;
      this.setState(mapStateFromStore(this.context.store.getState(), newState));
    }
    componentWillUnmount() {
      if (this.unsubscribe) {
        this.unsubscribe();
      }
      window.removeEventListener('resize', this.resize);
    }
    setStateFromStore() {
      let storeState = this.context.store.getState();
      this.setState(mapStateFromStore(this.context.store.getState(), this.state));
    }
    resize() {
      let width = ArcadeViewport.width;
      let height = 150;
      this.setState({
        width: width,
        height: height
      });
    }
    render() {
      let width = this.state.loaded ? this.state.width : 0;
      let height = this.state.loaded ? this.state.height : 0;
      let divStyle = {};
      let divTitle = null;
      let divScore = null;
      let divStars = null;
      let divLives = null;
      let divSpinner = (0, dom.element)("div", {
        className: "spinner",
        children: [(0, dom.element)("div", {
          className: "cube1"
        }, "spinner-cube1"), (0, dom.element)("div", {
          className: "cube2"
        }, "spinner-cube2"), (0, dom.element)("div", {
          className: "cube3"
        }, "spinner-cube3"), (0, dom.element)("div", {
          className: "cube4"
        }, "spinner-cube4")]
      }, "spinner");
      divTitle = (0, dom.element)("h2", {
        children: "Loading"
      });
      let loaderClass = "game-loader";
      return (0, dom.element)("div", {
        className: loaderClass,
        style: divStyle,
        children: [divTitle, divScore, divStars, divLives, divSpinner]
      });
    }
  }
  exports.default = GameLoader;
});

