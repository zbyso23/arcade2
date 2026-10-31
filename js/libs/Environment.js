// Editable vanilla JavaScript — loaded directly by index.html.
ArcadeModules.define("libs/Environment", function (local, exports) {
  const {
    View,
    Link
  } = ArcadeDOM;
  "use strict";
  exports.Environment = void 0;
  class Environment {
    constructor(tileX, tileY) {
      this.tileX = void 0;
      this.tileY = void 0;
      this.environment = {};
      this.environmentList = [];
      this.tileX = tileX;
      this.tileY = tileY;
      this.generate();
    }
    generate() {
      let environment = [];
      let environmentCount = 0;
      environment.push({
        id: 'environment-house',
        animated: false,
        frames: 1,
        width: 3,
        height: 2
      });
      environment.push({
        id: 'environment-house-white',
        animated: false,
        frames: 1,
        width: 3,
        height: 3
      });
      environment.push({
        id: 'environment-cave',
        animated: false,
        frames: 1,
        width: 3,
        height: 2
      });
      this.environmentList = environment;
      for (let i in environment) {
        let environmentItem = environment[i];
        this.environment[environmentItem.id] = {
          animated: environmentItem.animated,
          frames: environmentItem.frames,
          offset: environmentCount,
          width: environmentItem.width,
          height: environmentItem.height
        };
        let factor = environmentItem.width;
        environmentCount += environmentItem.frames * factor;
      }
    }
    getFrames(id) {
      if (!this.environment.hasOwnProperty(id)) return -1;
      return this.environment[id].frames;
    }
    getFrame(id, frame) {
      if (!this.environment.hasOwnProperty(id)) return -1;
      let environmentItem = this.environment[id];
      let offset = environmentItem.offset * this.tileX;
      if (frame === 1 || frame > environmentItem.frames) return offset;
      let factor = environmentItem.width;
      offset += (frame - 1) * this.tileX * factor;
      return offset;
    }
    setFrame(id, frame, sourceCanvas, targetContext, xTo, yTo) {
      let offset = this.getFrame(id, frame);
      if (offset === -1) return;
      let environmentItem = this.environment[id];
      let factor = environmentItem.width;
      let factorY = environmentItem.height;
      targetContext.drawImage(sourceCanvas, offset, 0, this.tileX * factor, this.tileY * factorY, xTo, yTo, this.tileX * factor, this.tileY * factorY);
    }
    getEnvironment() {
      return this.environmentList;
    }
  }
  exports.Environment = Environment;
});

