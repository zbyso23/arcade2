// Editable vanilla JavaScript — loaded directly by index.html.
ArcadeModules.define("components/Hello", function (local, exports) {
  const {
    View,
    Link
  } = ArcadeDOM;
  "use strict";
  exports.default = void 0;
  var dom = local("native/dom");
  class Hello extends View {
    constructor(props) {
      super(props);
    }
    render() {
      return (0, dom.element)("p", {
        children: ["Hello, ", this.props.name, "!"]
      });
    }
  }
  exports.default = Hello;
});

