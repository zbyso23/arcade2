// Editable vanilla JavaScript — loaded directly by index.html.
ArcadeModules.define("reducers/soundReducer", function (local, exports) {
  const {
    View,
    Link
  } = ArcadeDOM;
  "use strict";
  exports.default = reducer;
  var _Sound = local("../Sound/Sound");
  var _SoundPlaceholder = local("../Sound/SoundPlaceholder");
  let sound = typeof window === "undefined" ? new _SoundPlaceholder.default() : new _Sound.default();
  function getDefaultState() {
    return {
      sound: sound
    };
  }
  function reducer(state = getDefaultState(), action) {
    switch (action.type) {}
    return state;
  }
});

