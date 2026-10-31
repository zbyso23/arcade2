// Editable vanilla JavaScript — loaded directly by index.html.
ArcadeModules.define("views/EditorView", function (local, exports) {
  const {
    View,
    Link
  } = ArcadeDOM;
  "use strict";
  exports.default = void 0;
  var _routesList = local("../routesList");
  var dom = local("native/dom");
  function mapStateFromStore(store, state) {
    return state;
  }
  class EditorView extends View {
    constructor(props) {
      super(props);
      this.unsubscribe = void 0;
      this.state = {
        loaded: false,
        width: 0,
        height: 0
      };
      this.procedNewGame = this.procedNewGame.bind(this);
      this.procedEditor = this.procedEditor.bind(this);
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
      let height = ArcadeViewport.height;
      this.setState({
        width: width,
        height: height
      });
    }
    procedNewGame(e) {
      e.preventDefault();
    }
    procedEditor(e) {
      e.preventDefault();
    }
    render() {
      let width = this.state.loaded ? this.state.width : 0;
      let height = this.state.loaded ? this.state.height : 0;
      let divStyle = {};
      let divTitle = null;
      let divSprites = null;
      let divEnvironment = null;
      let divMap = null;
      let divMenu = null;
      if (this.state.loaded) {
        divTitle = (0, dom.element)("h2", {
          children: "ARCADE II Editor"
        });
        divSprites = (0, dom.element)(Link, {
          to: _routesList.LINK_EDITOR_SPRITES,
          children: (0, dom.element)("div", {
            className: "game-menu-new",
            children: "Sprites"
          })
        });
        divEnvironment = (0, dom.element)(Link, {
          to: _routesList.LINK_EDITOR_ENVIRONMENT,
          children: (0, dom.element)("div", {
            className: "game-menu-new",
            children: "Environment"
          })
        });
        divMap = (0, dom.element)(Link, {
          to: _routesList.LINK_EDITOR_MAP,
          children: (0, dom.element)("div", {
            className: "game-menu-new",
            children: "Map"
          })
        });
        divMenu = (0, dom.element)(Link, {
          to: _routesList.LINK_MENU,
          children: (0, dom.element)("div", {
            className: "game-menu-editor",
            children: "Back to Menu"
          })
        });
      }
      return (0, dom.element)("div", {
        className: "game-menu",
        style: divStyle,
        children: [divTitle, divSprites, divEnvironment, divMap, divMenu]
      });
    }
  }
  exports.default = EditorView;
});

