// Editable vanilla JavaScript — loaded directly by index.html.
ArcadeModules.define("components/PlayerMenu", function (local, exports) {
  const {
    View,
    Link
  } = ArcadeDOM;
  "use strict";
  exports.default = void 0;
  var _StatusBar = local("../components/StatusBar");
  var _gameWorldActions = local("../actions/gameWorldActions");
  var dom = local("native/dom");
  function mapStateFromStore(store, state) {
    let attributes = Object.assign({}, store.world.player.character.attributes);
    let points = store.world.player.character.points;
    let newState = Object.assign({}, state, {
      player: store.world.player,
      map: store.world.maps[store.world.activeMap],
      attributes: attributes,
      points: points
    });
    return newState;
  }
  class PlayerMenu extends View {
    constructor(props) {
      super(props);
      this.unsubscribe = void 0;
      this.handlerKeyUp = void 0;
      this.handlerKeyDown = void 0;
      let attributes = {
        speed: 0,
        brake: 0,
        jump: 0
      };
      this.state = {
        loaded: false,
        width: 0,
        height: 0,
        tab: 'stats',
        player: null,
        attributes: attributes,
        points: 0,
        map: null
      };
      this.handlerKeyDown = this.processKeyDown.bind(this);
      this.procedBackToGame = this.procedBackToGame.bind(this);
      this.changeAttribute = this.changeAttribute.bind(this);
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
      newState.attributes = Object.assign({}, storeState.world.player.character.attributes);
      newState.points = storeState.world.player.character.points;
      this.setState(newState);
      window.addEventListener('keyup', this.handlerKeyUp);
      window.addEventListener('keydown', this.handlerKeyDown);
      this.setState(mapStateFromStore(this.context.store.getState(), newState));
    }
    componentWillUnmount() {
      if (this.unsubscribe) {
        this.unsubscribe();
      }
      window.removeEventListener('keyup', this.handlerKeyUp);
      window.removeEventListener('keydown', this.handlerKeyDown);
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
    processKeyDown(e) {
      if (e.key !== 'Tab' || e.repeat) return;
      this.procedBackToGame(e);
    }
    processKeyUp(e) {
      e.preventDefault();
    }
    procedBackToGame(e) {
      e.preventDefault();
      this.props.onBackToGame();
    }
    procedAttributeUpdate(e) {
      e.preventDefault();
      this.context.store.dispatch({
        type: _gameWorldActions.GAME_WORLD_PLAYER_ADD_ATTRIBUTES,
        response: this.state.attributes
      });
    }
    changeAttribute(e, type, add) {
      e.preventDefault();
      if (['speed', 'brake', 'jump'].indexOf(type) === -1) return;
      if (add && this.state.points === 0) return;
      let newState = this.state;
      let value = add ? 1 : -1;
      switch (type) {
        case 'speed':
          if (!add && newState.attributes.speed === newState.player.character.attributes.speed) return;
          newState.attributes.speed += value;
          break;
        case 'brake':
          if (!add && newState.attributes.brake === newState.player.character.attributes.brake) return;
          newState.attributes.brake += value;
          break;
        case 'jump':
          if (!add && newState.attributes.jump === newState.player.character.attributes.jump) return;
          newState.attributes.jump += value;
          break;
      }
      newState.points = add ? newState.points - 1 : newState.points + 1;
      this.setState(newState);
    }
    getAttributeItem(type) {
      let valueCurrent = 0;
      let valueCharacter = 0;
      let key = 'game-player-menu-stats-item-' + type;
      switch (type) {
        case 'speed':
          valueCurrent = this.state.attributes.speed;
          valueCharacter = this.state.player.character.attributes.speed;
          name = 'Speed';
          break;
        case 'brake':
          valueCurrent = this.state.attributes.brake;
          valueCharacter = this.state.player.character.attributes.brake;
          name = 'Brake';
          break;
        case 'jump':
          valueCurrent = this.state.attributes.jump;
          valueCharacter = this.state.player.character.attributes.jump;
          name = 'Jump';
          break;
        default:
          return null;
      }
      let classPlus = this.state.points === 0 ? "game-player-menu-stats-item-plus" : "game-player-menu-stats-item-plus active";
      let classMinus = valueCurrent === valueCharacter ? "game-player-menu-stats-item-minus" : "game-player-menu-stats-item-minus active";
      return (0, dom.element)("div", {
        className: "game-player-menu-stats-item",
        children: [(0, dom.element)("div", {
          className: "game-player-menu-stats-item-name",
          children: name
        }), (0, dom.element)("div", {
          className: "game-player-menu-stats-item-value",
          children: valueCurrent
        }), (0, dom.element)("div", {
          className: classMinus,
          "data-id": "minus-speed",
          onClick: e => this.changeAttribute(e, type, false),
          children: "-"
        }), (0, dom.element)("div", {
          className: classPlus,
          "data-id": "plus-speed",
          onClick: e => this.changeAttribute(e, type, true),
          children: "+"
        })]
      }, key);
    }
    render() {
      let width = this.state.loaded ? this.state.width : 0;
      let height = this.state.loaded ? this.state.height : 0;
      let divStyle = {};
      let tabs = [];
      let divWindow = null;
      if (this.state.loaded) {
        tabs.push((0, dom.element)("div", {
          className: "player-menu-tab active",
          "data-id": "stats",
          children: "Stats"
        }, "player-menu-tab-stats"));
        switch (this.state.tab) {
          case 'stats':
            let attributes = [];
            attributes.push(this.getAttributeItem('speed'));
            attributes.push(this.getAttributeItem('brake'));
            attributes.push(this.getAttributeItem('jump'));
            let updateButton = null;
            let pointsLeft = this.state.points > 0 ? (0, dom.element)("span", {
              children: ["... ", this.state.points.toString(), " points"]
            }) : (0, dom.element)("span", {});
            if (this.state.player.character.points === this.state.points) {
              updateButton = (0, dom.element)("div", {
                className: "game-player-menu-stats-update",
                children: "Update"
              }, "game-player-menu-stats-update");
            } else {
              updateButton = (0, dom.element)("div", {
                className: "game-player-menu-stats-update active",
                onClick: e => this.procedAttributeUpdate(e),
                children: "Update"
              }, "game-player-menu-stats-update");
            }
            let classPlus = this.state.points <= 0 ? "game-player-menu-stats-item-plus" : "game-player-menu-stats-item-plus active";
            let classMinus = this.state.player.character.points === this.state.points ? "game-player-menu-stats-item-minus" : "game-player-menu-stats-item-minus active";
            let classUpdate = this.state.player.character.points === this.state.points ? "game-player-menu-stats-update" : "game-player-menu-stats-update active";
            divWindow = (0, dom.element)("div", {
              className: "game-player-menu-stats",
              children: [(0, dom.element)("h2", {
                children: ["Attributes ", pointsLeft]
              }), attributes, updateButton]
            }, "game-player-menu-stats");
            break;
        }
      }
      return (0, dom.element)("div", {
        className: "game-player-menu",
        style: divStyle,
        children: [(0, dom.element)(_StatusBar.default, {}), (0, dom.element)("div", {
          className: "game-player-menu-stats-tabs",
          children: tabs
        }, "game-player-menu-stats-tabs"), divWindow]
      });
    }
  }
  exports.default = PlayerMenu;
});

