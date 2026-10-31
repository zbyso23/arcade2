// Editable vanilla JavaScript — loaded directly by index.html.
ArcadeModules.define("components/EditorMapBar", function (local, exports) {
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
  class EditorMapBar extends View {
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
      let widthPx = [this.state.width.toString(), "px"].join('');
      let heightPx = [this.state.height.toString(), "px"].join('');
      let divStyle = {
        opacity: 0.5,
        width: widthPx,
        height: heightPx
      };
      let divValues = null;
      let divName = null;
      let spanPoints = null;
      if (this.state.loaded) {
        divName = (0, dom.element)("div", {
          className: "editor-map-status-name",
          children: this.props.name
        });
        divValues = (0, dom.element)("div", {
          className: "editor-map-status-values",
          children: ["Data: ", this.props.value]
        });
      }
      return (0, dom.element)("div", {
        className: "editor-map-status",
        style: divStyle,
        children: [divValues, divName]
      });
    }
  }
  exports.default = EditorMapBar;
});

