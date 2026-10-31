// Editable vanilla JavaScript — loaded directly by index.html.
ArcadeModules.define("components/GameWin", function (local, exports) {
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
  class GameWin extends View {
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
      this.procedPlayAgain = this.procedPlayAgain.bind(this);
    }
    componentDidMount() {
      let storeState = this.context.store.getState();
      this.setStateFromStore();
      this.unsubscribe = this.context.store.subscribe(this.setStateFromStore.bind(this));
      let width = ArcadeViewport.width;
      let height = 150;
      window.onresize = function (e) {
        this.resize();
      }.bind(this);
      let newState = Object.assign({}, this.state);
      newState.loaded = true;
      newState.width = width;
      newState.height = height;
      this.setState(mapStateFromStore(this.context.store.getState(), newState));
      storeState.sound.sound.loadList(['music-win']).then(() => {
        let music = 'music-win';
        storeState.sound.sound.playBackground(music);
      });
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
      let height = 150;
      this.setState({
        width: width,
        height: height
      });
    }
    procedPlayAgain(e) {
      e.preventDefault();
      this.props.onPlayAgain();
    }
    render() {
      let width = this.state.loaded ? this.state.width : 0;
      let height = this.state.loaded ? this.state.height : 0;
      let divStyle = {};
      let divNewGame = null;
      let divTitle = null;
      let divScore = null;
      let divStars = null;
      let divLives = null;
      if (this.state.loaded) {
        divTitle = (0, dom.element)("h2", {
          children: "You Win!"
        });
        divScore = (0, dom.element)("div", {
          className: "game-win-score",
          children: ["Level: ", this.state.player.character.level, " (", this.state.player.character.experience, ")"]
        });
        divStars = (0, dom.element)("div", {
          className: "game-win-stars",
          children: ["x ", this.state.player.character.stars]
        });
        divLives = (0, dom.element)("div", {
          className: "game-win-lives",
          children: ["Lives: ", this.state.player.lives]
        });
        divNewGame = (0, dom.element)("div", {
          className: "game-win-new",
          onClick: e => this.procedPlayAgain(e),
          children: "Play Again"
        });
      }
      return (0, dom.element)("div", {
        className: "game-win",
        style: divStyle,
        children: [divTitle, divScore, divStars, divLives, divNewGame]
      });
    }
  }
  exports.default = GameWin;
});

