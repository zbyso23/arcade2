ArcadeModules.define('views/MenuView', function (local, exports) {
  'use strict';
  const { View, Link, element } = ArcadeDOM;
  const { LINK_GAME, LINK_EDITOR } = local('../routesList');

  class MenuView extends View {
    render() {
      return element('div', {
        className: 'game-menu',
        children: [
          element('h2', { children: 'Arcade II' }),
          element(Link, {
            to: LINK_GAME,
            children: element('span', { className: 'game-menu-new', children: 'New Game' })
          }),
          element(Link, {
            to: LINK_EDITOR,
            children: element('span', { className: 'game-menu-editor', children: 'Editor' })
          })
        ]
      });
    }
  }

  exports.default = MenuView;
});
