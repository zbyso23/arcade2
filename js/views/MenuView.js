// Editable vanilla JavaScript — loaded directly by index.html.
ArcadeModules.define("views/MenuView", function (local, exports) {
  const {
    View,
    Link
  } = ArcadeDOM;
  "use strict";
  exports.default = void 0;
  var _routesList = local("../routesList");
  var dom = local("native/dom");
  function mapStateFromStore(store, state) {
    let newState = Object.assign({}, state);
    newState.sound = store.sound;
    return newState;
  }
  class MenuView extends View {
    constructor(props) {
      super(props);
      this.unsubscribe = void 0;
      this.state = {
        loaded: false,
        width: 0,
        height: 0,
        sound: null
      };
      this.procedNewGame = this.procedNewGame.bind(this);
      this.procedEditor = this.procedEditor.bind(this);
    }
    componentDidMount() {
      let storeState = this.context.store.getState();
      this.setStateFromStore();
      storeState.sound.sound.loadList(['music-menu']);
      this.unsubscribe = this.context.store.subscribe(this.setStateFromStore.bind(this));
      let width = ArcadeViewport.width;
      let height = 150;
      window.onresize = function (e) {
        this.resize();
      }.bind(this);
      let newState = Object.assign({}, this.state);
      newState.width = width;
      newState.height = height;
      this.setState(mapStateFromStore(this.context.store.getState(), newState));
      let music = 'music-menu';
      storeState.sound.sound.loadList([music]).then(() => {
        let newState = Object.assign({}, this.state);
        newState.loaded = true;
        this.setState(mapStateFromStore(this.context.store.getState(), newState));
      }).catch(() => {});
    }
    componentWillUnmount() {
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
    procedNewGame(e) {
      e.preventDefault();
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
      }
      this.later(function () {
        this.props.history.push(_routesList.LINK_GAME);
      }.bind(this), 500);
    }
    procedEditor(e) {
      e.preventDefault();
    }
    render() {
      let width = this.state.loaded ? this.state.width : 0;
      let height = this.state.loaded ? this.state.height : 0;
      let divStyle = {};
      let divTitle = null;
      let divNewGame = null;
      let divEditor = null;
      if (this.state.loaded) {
        divTitle = (0, dom.element)("h2", {
          children: "ARCADE II"
        });
        divNewGame = (0, dom.element)("div", {
          onClick: e => this.procedNewGame(e),
          className: "game-menu-new",
          children: "New Game"
        });
        divEditor = (0, dom.element)(Link, {
          to: _routesList.LINK_EDITOR,
          children: (0, dom.element)("div", {
            className: "game-menu-editor",
            children: "Editor"
          })
        });
      }
      return (0, dom.element)("div", {
        className: "game-menu",
        style: divStyle,
        children: [divTitle, divNewGame, divEditor]
      });
    }
  }
  exports.default = MenuView;
});

