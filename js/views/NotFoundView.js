// Editable vanilla JavaScript — loaded directly by index.html.
ArcadeModules.define("views/NotFoundView", function (local, exports) {
  const {
    View,
    Link
  } = ArcadeDOM;
  "use strict";
  exports.default = void 0;
  var dom = local("native/dom");
  class NotFoundView extends View {
    render() {
      return (0, dom.element)("div", {
        children: [(0, dom.element)("h2", {
          children: "404"
        }), (0, dom.element)("h3", {
          children: "Page not found"
        })]
      });
    }
  }
  exports.default = NotFoundView;
});

