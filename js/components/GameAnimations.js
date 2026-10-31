// Editable vanilla JavaScript — loaded directly by index.html.
ArcadeModules.define("components/GameAnimations", function (local, exports) {
  const {
    View,
    Link
  } = ArcadeDOM;
  "use strict";
  exports.default = void 0;
  var _gameWorldActions = local("../actions/gameWorldActions");
  var dom = local("native/dom");
  function mapStateFromStore(store, state) {
    return state;
  }
  class GameAnimations extends View {
    constructor(props) {
      super(props);
      this.cached = {};
      this.unsubscribe = void 0;
      this.animationTime = 30;
      this.timer = void 0;
      this.counter = 0;
      this.state = {
        loaded: false
      };
      this.animate = this.animate.bind(this);
      this.run = this.run.bind(this);
    }
    componentDidMount() {
      let storeState = this.context.store.getState();
      this.unsubscribe = this.context.store.subscribe(this.setStateFromStore.bind(this));
      let newState = Object.assign({}, this.state);
      this.setState(mapStateFromStore(this.context.store.getState(), newState));
      this.run();
    }
    componentWillUnmount() {
      clearTimeout(this.timer);
      if (this.unsubscribe) {
        this.unsubscribe();
      }
    }
    setStateFromStore() {
      let storeState = this.context.store.getState();
      this.setState(mapStateFromStore(this.context.store.getState(), this.state));
    }
    run() {
      if (this._destroyed) return;
      this.timer = this.later(this.animate, this.animationTime);
    }
    animate() {
      let storeState = this.context.store.getState();
      let statePlayer = storeState.world.player;
      this.counter++;
      if (this.counter === 1000) this.counter = 0;
      if (storeState.world.activeQuest !== null) {
        this.timer = this.later(this.animate, this.animationTime);
        return;
      }
      if (statePlayer.started) {
        if (statePlayer.falling) {
          this.animateFalling();
        } else if (statePlayer.death) {
          this.animateDeath();
          this.animateEnemies();
        } else {
          this.animateEnemies();
          this.animateQuests();
          this.animatePlayer();
        }
      }
      this.animateEnvironment();
      this.timer = this.later(this.animate, this.animationTime);
    }
    animateFalling() {
      let storeState = this.context.store.getState();
      let statePlayer = Object.assign({}, storeState.world.player);
      if (statePlayer.fall < statePlayer.y) {
        this.props.onProcessDeath();
        return;
      }
      let fall = (statePlayer.fall - statePlayer.y) / 10;
      fall = fall < 5 ? 5 : fall;
      statePlayer.jump += fall;
      statePlayer.y += fall;
      this.context.store.dispatch({
        type: _gameWorldActions.GAME_WORLD_PLAYER_UPDATE,
        response: statePlayer
      });
    }
    animateDeath() {
      let storeState = this.context.store.getState();
      let statePlayer = Object.assign({}, storeState.world.player);
      if (statePlayer.frame === this.props.sprites.getFrames('ninja-explode')) {
        this.props.onProcessDeath();
        return;
      }
      statePlayer.frame += 1;
      this.context.store.dispatch({
        type: _gameWorldActions.GAME_WORLD_PLAYER_UPDATE,
        response: statePlayer
      });
    }
    animatePlayer() {
      let storeState = this.context.store.getState();
      let statePlayer = Object.assign({}, storeState.world.player);
      let isJump = statePlayer.y !== statePlayer.jump;
      if (statePlayer.speed === 0 && !isJump) {
        statePlayer.frame = statePlayer.frame === 1 || statePlayer.frame >= 10 ? 1 : statePlayer.frame + 1;
      } else {
        let maxFrame = isJump ? this.props.sprites.getFrames('ninja-jump-left') : this.props.sprites.getFrames('ninja-left');
        let minFrame = isJump ? 1 : 10;
        statePlayer.frame = statePlayer.frame >= maxFrame ? minFrame : statePlayer.frame + 1;
      }
      this.context.store.dispatch({
        type: _gameWorldActions.GAME_WORLD_PLAYER_UPDATE,
        response: statePlayer
      });
    }
    animateEnemies() {
      let storeState = this.context.store.getState();
      let statePlayer = storeState.world.player;
      let stateMap = Object.assign({}, storeState.world.maps[storeState.world.activeMap]);
      let enemies = stateMap.enemies;
      let spritesExplode = this.props.sprites.getFrames('enemy-explode');
      for (let i = 0, len = enemies.length; i < len; i++) {
        if (Math.abs(enemies[i].x - statePlayer.x) > this.props.width) continue;
        let enemy = enemies[i];
        if (enemy.death) {
          if (!enemy.respawn.enabled) continue;
          enemy.respawn.time++;
          if (enemy.respawn.time >= enemy.respawn.timer && Math.abs(statePlayer.x - enemy.x) >= stateMap.tileX * 5) {
            enemy.respawn.time = 0;
            enemy.death = false;
            enemy.frame = 1;
          }
          continue;
        }
        let maxFrame = enemy.die ? spritesExplode : this.props.sprites.getFrames(`enemy-${enemy.type}-left`);
        let minFrame = enemy.die ? spritesExplode : 1;
        if (enemy.die) {
          if (enemy.frame === maxFrame) {
            enemy.die = false;
            enemy.death = true;
            enemy.respawn.time = 0;
          } else {
            enemy.frame++;
          }
          continue;
        }
        if (this.counter % 2 === 0) {
          enemy.frame = enemy.frame >= maxFrame ? minFrame : enemy.frame + 1;
        }
        if (enemy.live.timer > 0) enemy.live.timer--;
      }
      stateMap.enemies = enemies;
      this.context.store.dispatch({
        type: _gameWorldActions.GAME_WORLD_MAP_UPDATE,
        response: stateMap,
        name: storeState.world.activeMap
      });
    }
    animateQuests() {
      let storeState = this.context.store.getState();
      let statePlayer = storeState.world.player;
      let stateMap = Object.assign({}, storeState.world.maps[storeState.world.activeMap]);
      let quests = stateMap.quests;
      for (let i = 0, len = quests.length; i < len; i++) {
        if (Math.abs(quests[i].x - statePlayer.x) > this.props.width) continue;
        let quest = quests[i];
        let maxFrame = this.props.sprites.getFrames(`quest-${quest.name}-left`);
        let minFrame = 1;
        if (this.counter % 2 === 0) {
          quest.frame = quest.frame >= maxFrame ? minFrame : quest.frame + 1;
        }
      }
      stateMap.quests = quests;
      this.context.store.dispatch({
        type: _gameWorldActions.GAME_WORLD_MAP_UPDATE,
        response: stateMap,
        name: storeState.world.activeMap
      });
    }
    animateEnvironment() {
      let storeState = this.context.store.getState();
      let statePlayer = Object.assign({}, storeState.world.player);
      let stateMap = Object.assign({}, storeState.world.maps[storeState.world.activeMap]);
      let stars = stateMap.stars;
      let gridWidthLimit = Math.ceil(this.props.width / stateMap.tileX);
      let playerGridX = Math.ceil(statePlayer.x / stateMap.tileX);
      if (stateMap.clouds.length > 0) {
        let newClouds = [];
        let lastCloud = stateMap.clouds.length - 1;
        for (let i in stateMap.clouds) {
          let cloud = stateMap.clouds[i];
          cloud.x -= cloud.speed;
          if (parseInt(i) === 0 && cloud.x < -150) {
            let height = stateMap.tileY / 2;
            let cloudHeight = height + height * (Math.random() * 2);
            let cloudSpeed = Math.random() * 0.05 + 1.1;
            let fromX = stateMap.clouds[lastCloud].x + (Math.ceil(Math.random() * 100) + 100);
            cloud.x = fromX;
            cloud.y = cloudHeight;
            cloud.speed = cloudSpeed;
          }
          newClouds.push(cloud);
        }
        stateMap.clouds = newClouds;
      }
      let spritesStarExplode = this.props.sprites.getFrames('star-explode');
      let spritesStar = this.props.sprites.getFrames('star');
      for (let i in stars) {
        if (stars[i] === null) continue;
        let star = stars[i];
        let index = parseInt(i);
        if (!star.collected && Math.abs(index - playerGridX) > gridWidthLimit) continue;
        if (!star.collected) {
          star.frame = star.frame === spritesStar ? 1 : star.frame + 1;
        } else if (star.collected && star.frame === spritesStarExplode) {
          stateMap.stars[index] = null;
        } else {
          star.frame++;
        }
      }
      for (let i = 0, len = stateMap.exit.length; i < len; i++) {
        let exit = stateMap.exit[i];
        if (exit.blocker === null) {
          if (this.counter % 3 === 0) stateMap.exit[i].type.frame = exit.type.frame === this.props.sprites.getFrames(['exit', exit.type.name].join('-')) ? 1 : exit.type.frame + 1;
        } else if (!exit.blocker.destroyed) {
          stateMap.exit[i].blocker.frame = 1;
        } else if (exit.blocker.destroyed && exit.blocker.frame === this.props.sprites.getFrames(['blocker', exit.type.name].join('-'))) {
          stateMap.exit[i].blocker = null;
        } else {
          if (this.counter % 3 === 0) stateMap.exit[i].blocker.frame++;
        }
      }
      for (let i = 0, len = stateMap.items.length; i < len; i++) {
        let item = stateMap.items[i];
        if (!item.collected && Math.abs(item / stateMap.tileX - playerGridX) > gridWidthLimit) continue;
        if (!item.collected) {
          let itemName = ['item', item.name].join('-');
          item.frame = item.frame === this.props.sprites.getFrames(itemName) ? 1 : item.frame + 1;
        } else if (item.collected && item.frame === this.props.sprites.getFrames('star-explode')) {
          item.visible = false;
        } else {
          item.frame++;
        }
      }
      stateMap.stars = Array.from(stars);
      this.context.store.dispatch({
        type: _gameWorldActions.GAME_WORLD_MAP_UPDATE,
        response: stateMap,
        name: storeState.world.activeMap
      });
    }
    render() {
      return (0, dom.element)("div", {});
    }
  }
  exports.default = GameAnimations;
});

