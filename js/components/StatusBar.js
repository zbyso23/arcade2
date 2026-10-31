// Editable vanilla JavaScript — loaded directly by index.html.
ArcadeModules.define("components/StatusBar", function (local, exports) {
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
  class StatusBar extends View {
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
    render() {
      let width = this.state.loaded ? this.state.width : 0;
      let height = this.state.loaded ? this.state.height : 0;
      let divStyle = {};
      let divLives = null;
      let divScore = null;
      let divStars = null;
      let divPoints = null;
      let divItems = null;
      let spanPoints = null;
      if (this.state.loaded) {
        if (this.state.player.character.points > 0) {
          spanPoints = (0, dom.element)("span", {
            className: "game-status-points-left",
            children: this.state.player.character.points
          });
        }
        divScore = (0, dom.element)("div", {
          className: "game-status-score",
          children: this.state.player.character.level
        });
        divPoints = (0, dom.element)("div", {
          className: "game-status-points",
          children: spanPoints
        });
        divLives = (0, dom.element)("div", {
          className: "game-status-lives",
          children: ["x ", this.state.player.lives]
        });
        divStars = (0, dom.element)("div", {
          className: "game-status-stars",
          children: ["x ", this.state.player.character.stars]
        });
        let itemsLen = this.state.player.character.items.length;
        let items = [];
        if (itemsLen > 0) {
          for (let i = 0, len = this.state.player.character.items.length; i < len; i++) {
            let item = this.state.player.character.items[i];
            let imgPrefix = ['item', item.name].join('-');
            let img = 'images/' + imgPrefix + '1.png';
            let key = ['status', imgPrefix, i.toString()].join('-');
            let itemElement = (0, dom.element)("img", {
              src: img,
              className: "game-status-item",
              title: item.name
            }, key);
            items.push(itemElement);
          }
        }
        divItems = (0, dom.element)("div", {
          className: "game-status-items",
          children: items
        });
      }
      return (0, dom.element)("div", {
        className: "game-status",
        style: divStyle,
        children: [divLives, divStars, divScore, divPoints, divItems]
      });
    }
  }
  exports.default = StatusBar;
});

