// Editable vanilla JavaScript — loaded directly by index.html.
ArcadeModules.define("libs/Sprites", function (local, exports) {
  const {
    View,
    Link
  } = ArcadeDOM;
  "use strict";
  exports.Sprites = void 0;
  class Sprites {
    constructor(tileX, tileY) {
      this.tileX = void 0;
      this.tileY = void 0;
      this.sprites = {};
      this.spriteList = [];
      this.tileX = tileX;
      this.tileY = tileY;
      this.generate();
    }
    generate() {
      let sprites = [];
      let spritesCount = 0;
      sprites.push({
        id: 'ninja-right',
        animated: true,
        frames: 21,
        double: false
      });
      sprites.push({
        id: 'ninja-left',
        animated: true,
        frames: 21,
        double: false
      });
      sprites.push({
        id: 'ninja-jump-left',
        animated: true,
        frames: 18,
        double: false
      });
      sprites.push({
        id: 'ninja-jump-right',
        animated: true,
        frames: 18,
        double: false
      });
      sprites.push({
        id: 'ninja-sword-right',
        animated: true,
        frames: 21,
        double: false
      });
      sprites.push({
        id: 'ninja-sword-left',
        animated: true,
        frames: 21,
        double: false
      });
      sprites.push({
        id: 'ninja-explode',
        animated: true,
        frames: 11,
        double: false
      });
      sprites.push({
        id: 'enemy-bandit-right',
        animated: true,
        frames: 11,
        double: false
      });
      sprites.push({
        id: 'enemy-bandit-left',
        animated: true,
        frames: 11,
        double: false
      });
      sprites.push({
        id: 'enemy-orc-right',
        animated: true,
        frames: 11,
        double: false
      });
      sprites.push({
        id: 'enemy-orc-left',
        animated: true,
        frames: 11,
        double: false
      });
      sprites.push({
        id: 'enemy-scorpion-right',
        animated: true,
        frames: 11,
        double: false
      });
      sprites.push({
        id: 'enemy-scorpion-left',
        animated: true,
        frames: 11,
        double: false
      });
      sprites.push({
        id: 'enemy-explode',
        animated: true,
        frames: 11,
        double: false
      });
      sprites.push({
        id: 'quest-fisher-right',
        animated: true,
        frames: 11,
        double: false
      });
      sprites.push({
        id: 'quest-fisher-left',
        animated: true,
        frames: 11,
        double: false
      });
      sprites.push({
        id: 'quest-charles-right',
        animated: true,
        frames: 8,
        double: true
      });
      sprites.push({
        id: 'quest-charles-left',
        animated: true,
        frames: 8,
        double: true
      });
      sprites.push({
        id: 'star',
        animated: true,
        frames: 7,
        double: false
      });
      sprites.push({
        id: 'star-explode',
        animated: true,
        frames: 11,
        double: false
      });
      sprites.push({
        id: 'spike',
        animated: false,
        frames: 1,
        double: false
      });
      sprites.push({
        id: 'item-pickaxe',
        animated: false,
        frames: 1,
        double: false
      });
      sprites.push({
        id: 'item-sword',
        animated: false,
        frames: 1,
        double: false
      });
      sprites.push({
        id: 'blocker-cave',
        animated: true,
        frames: 7,
        double: true
      });
      sprites.push({
        id: 'exit-cave',
        animated: false,
        frames: 1,
        double: true
      });
      sprites.push({
        id: 'exit-house',
        animated: false,
        frames: 1,
        double: true
      });
      sprites.push({
        id: 'exit-house-white',
        animated: false,
        frames: 1,
        double: true
      });
      sprites.push({
        id: 'exit-portal-blue',
        animated: true,
        frames: 7,
        double: false
      });
      sprites.push({
        id: 'ground-left',
        animated: false,
        frames: 3,
        double: false
      });
      sprites.push({
        id: 'ground-center',
        animated: false,
        frames: 3,
        double: false
      });
      sprites.push({
        id: 'ground-right',
        animated: false,
        frames: 3,
        double: false
      });
      sprites.push({
        id: 'platform-left',
        animated: false,
        frames: 6,
        double: false
      });
      sprites.push({
        id: 'platform-center',
        animated: false,
        frames: 6,
        double: false
      });
      sprites.push({
        id: 'platform-right',
        animated: false,
        frames: 6,
        double: false
      });
      sprites.push({
        id: 'cloud',
        animated: true,
        frames: 5,
        double: true
      });
      this.spriteList = sprites;
      for (let i in sprites) {
        let sprite = sprites[i];
        this.sprites[sprite.id] = {
          animated: sprite.animated,
          frames: sprite.frames,
          offset: spritesCount,
          double: sprite.double
        };
        let factor = sprite.double ? 2 : 1;
        spritesCount += sprite.frames * factor;
      }
    }
    getFrames(id) {
      if (!this.sprites.hasOwnProperty(id)) return -1;
      return this.sprites[id].frames;
    }
    getFrame(id, frame) {
      if (!this.sprites.hasOwnProperty(id)) return -1;
      let sprite = this.sprites[id];
      let offset = sprite.offset * this.tileX;
      if (frame === 1 || frame > sprite.frames) return offset;
      let factor = sprite.double ? 2 : 1;
      offset += (frame - 1) * this.tileX * factor;
      return offset;
    }
    setFrame(id, frame, sourceCanvas, targetContext, xTo, yTo) {
      let offset = this.getFrame(id, frame);
      if (offset === -1) return;
      let sprite = this.sprites[id];
      let factor = sprite.double ? 2 : 1;
      targetContext.drawImage(sourceCanvas, offset, 0, this.tileX * factor, this.tileY, xTo, yTo, this.tileX * factor, this.tileY);
    }
    getSprites() {
      return this.spriteList;
    }
  }
  exports.Sprites = Sprites;
});

