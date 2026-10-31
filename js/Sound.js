/* HTMLAudioElement uses relative local files without fetch/XHR or AudioContext CORS. */
ArcadeModules.define('Sound/Sound', function(local, exports) {
  class Sound {
    constructor() { this.tracks = new Map(); this.muted = false; this.background = null; this.unlocked = false;
      const unlock = () => { this.unlocked = true; for(const a of this.tracks.values())if(a.dataset.wanted==='true')a.play().catch(()=>{}); };
      window.addEventListener('pointerdown', unlock); window.addEventListener('keydown', unlock);
    }
    load(id) { if (!this.tracks.has(id)) { const a = new Audio('audio/' + id + '.ogg'); a.preload = 'metadata'; a.muted = this.muted; this.tracks.set(id,a); } return Promise.resolve(id); }
    loadList(list) { return Promise.all(list.map(id => this.load(id))); }
    isLoaded(id) { return this.tracks.has(id); }
    isPlaying(id) { const a=this.tracks.get(id); return !!a && !a.paused; }
    play(id, loop=false) { this.load(id); const a=this.tracks.get(id); a.loop=loop; a.dataset.wanted='true'; if(this.unlocked)a.play().catch(()=>{}); }
    stop(id) { const a=this.tracks.get(id); if(a){a.dataset.wanted='false';a.pause();try{a.currentTime=0;}catch(_){}} }
    stopAll() { for(const id of this.tracks.keys())this.stop(id); }
    playPromise(id, loop=false) { this.play(id,loop); return Promise.resolve(id); }
    stopPromise(id) { this.stop(id); return Promise.resolve(id); }
    fadeIn(id) { this.play(id); }
    fadeOut(id) { this.stop(id); }
    mute() { this.muted=true; for(const a of this.tracks.values())a.muted=true; }
    unmute() { this.muted=false; for(const a of this.tracks.values())a.muted=false; }
    playBackground(id) { if(this.background && this.background!==id)this.stop(this.background); this.background=id; this.play(id,true); }
  }
  exports.default=Sound;
});
ArcadeModules.define('Sound/SoundPlaceholder', (local,exports) => {exports.default=local('Sound/Sound').default;});
