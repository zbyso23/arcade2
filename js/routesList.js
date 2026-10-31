// Editable vanilla JavaScript — loaded directly by index.html.
ArcadeModules.define("routesList", function (local, exports) {
  const {
    View,
    Link
  } = ArcadeDOM;
  "use strict";
  exports.LINK_MENU = exports.LINK_GAME = exports.LINK_EDITOR_SPRITES = exports.LINK_EDITOR_MAP = exports.LINK_EDITOR_ENVIRONMENT = exports.LINK_EDITOR = void 0;
  const LINK_MENU = exports.LINK_MENU = '/';
  const LINK_GAME = exports.LINK_GAME = '/game';
  const LINK_EDITOR = exports.LINK_EDITOR = '/editor';
  const LINK_EDITOR_MAP = exports.LINK_EDITOR_MAP = '/editor-map';
  const LINK_EDITOR_SPRITES = exports.LINK_EDITOR_SPRITES = '/editor/sprites';
  const LINK_EDITOR_ENVIRONMENT = exports.LINK_EDITOR_ENVIRONMENT = '/editor/environment';
});

