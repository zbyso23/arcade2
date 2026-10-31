'use strict';
(() => {
  const load = ArcadeModules.load;
  const actions = load('actions/gameWorldActions');
  const worldReducer = load('reducers/gameWorldReducer').default;
  const soundReducer = load('reducers/soundReducer').default;
  const listeners = new Set();
  let state = {world: worldReducer(undefined, {}), sound: soundReducer(undefined, {})};
  window.ArcadeStore = {
    getState: () => state,
    subscribe: fn => { listeners.add(fn); return () => listeners.delete(fn); },
    dispatch(action) {
      if (action.type === actions.GAME_WORLD_EXPORT) { ArcadeFiles.save(); return action; }
      if (action.type === actions.GAME_WORLD_IMPORT) { ArcadeFiles.open(); return action; }
      state = {world: worldReducer(state.world, action), sound: soundReducer(state.sound, action)};
      for (const fn of [...listeners]) fn();
      return action;
    }
  };
  const clone = value => JSON.parse(JSON.stringify(value));
  state.world=ArcadeDemo.create(load);
  let documentWorld=clone(state.world), playSnapshot=null, currentRoute='';
  const status=document.getElementById('file-status');
  const stamp=()=>new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);
  function download(data,filename,type='application/json') {
    const url=URL.createObjectURL(new Blob([data],{type})); const a=document.createElement('a');
    a.href=url; a.download=filename;a.hidden=true;document.body.append(a);a.click();a.remove(); setTimeout(()=>URL.revokeObjectURL(url),30000);
  }
  function snapshot() { return clone(currentRoute==='/game' ? documentWorld : state.world); }
  function validate(input) {
    if(input?.format && (input.format!=='arcade2-world' || input.version!==1))throw Error('Unsupported world format or version.');
    const world=clone(input?.format==='arcade2-world' ? input.world : input);
    if(!world || !world.maps || typeof world.maps!=='object' || Array.isArray(world.maps)) throw Error('Missing maps object.');
    const names=Object.keys(world.maps); if(!names.length || names.length>100) throw Error('World needs 1–100 maps.');
    if(!names.includes(world.startMap)) throw Error('startMap must name an existing map.');
    const finite = (v,min,max) => typeof v==='number' && Number.isFinite(v) && v>=min && v<=max;
    for(const [name,map] of Object.entries(world.maps)) {
      if(!map || !Number.isInteger(map.length) || !finite(map.length,4,5000) || !finite(map.tileX,8,512) || !finite(map.tileY,8,512) || !finite(map.height,1,100))throw Error('Invalid map geometry: '+name);
      // Legacy server exports sometimes stored the sparse stars array as a numeric dictionary.
      if(map.stars && !Array.isArray(map.stars) && Object.keys(map.stars).every(k=>/^\d+$/.test(k) && Number(k)<20000)){
        const a=Array(map.length).fill(null);for(const [k,v] of Object.entries(map.stars))a[Number(k)]=v;map.stars=a;
      }
      for(const key of ['ground','floor','stars','spikes','enemies','items','environment','quests','clouds','exit','groundFall'])if(!Array.isArray(map[key]) || map[key].length>20000)throw Error('Invalid '+key+' in '+name);
      if(!map.background || !/^[a-zA-Z0-9_.-]+\.png$/.test(map.background.image) || !finite(map.background.factor,-10,10)) throw Error('Invalid background in '+name);
      for(const exit of map.exit)if(!exit || (!exit.win && !names.includes(exit.map)) || !finite(exit.x,0,5000*512) || !finite(exit.y,-512,51200))throw Error('Invalid exit in '+name);
      map.offset=0;
    }
    for(const key of ['items','enemies','environment','quests'])if(!world[key] || typeof world[key]!=='object' || Array.isArray(world[key]))throw Error('Missing '+key+' definitions.');
    world.activeMap=world.startMap; world.activeQuest=null; world.reload=true; world.loaded=true;
    world.player=Object.assign(load('reducers/playerReducer').getDefaultState(),world.player || {});
    if(!world.player.character || !world.player.character.attributes || !Array.isArray(world.player.character.items))throw Error('Invalid player character.');
    world.player.started=false;
    world.text=world.text || {};world.text.wellcome=Object.assign({title:'',text:''},world.text.wellcome || {});
    return world;
  }
  const picker=document.getElementById('world-file');
  window.ArcadeFiles={
    snapshot, validate,
    save() { const world=snapshot(); documentWorld=clone(world); download(JSON.stringify({format:'arcade2-world',version:1,world},null,2),'ArcadeII-World_'+stamp()+'.json');status.textContent='World downloaded'; },
    open() { picker.value='';picker.click(); },
    importText(text) {
      const next=validate(JSON.parse(text));
      documentWorld=clone(next); playSnapshot=null;
      state.world=next;
      // Remount canvases: they contain cached background/sprite geometry.
      route(); status.textContent='World loaded'; return next;
    },

  };
  picker.addEventListener('change',async()=>{
    const f=picker.files[0];if(!f)return;
    try{if(f.size>20*1024*1024)throw Error('World file exceeds 20 MB.');ArcadeFiles.importText(await f.text());}
    catch(error){status.textContent='Load failed: '+error.message;}
  });
  document.getElementById('save-world').onclick=()=>ArcadeFiles.save();
  document.getElementById('load-world').onclick=()=>ArcadeFiles.open();
  
  document.getElementById('mute').onclick=e=>{const sound=state.sound.sound;sound.muted?sound.unmute():sound.mute();e.currentTarget.textContent=sound.muted?'Sound off':'Sound on';};
  document.getElementById('new-map').onclick=()=>{
    if(currentRoute==='/game')return;
    const name=prompt('New map name (letters, numbers, hyphen):','map-'+(Object.keys(state.world.maps).length+1));
    if(!name)return;if(!/^[a-z][a-z0-9-]{0,40}$/.test(name)||Object.hasOwn(state.world.maps,name)){status.textContent='Choose a new valid map name';return;}
    const map=clone(state.world.maps[state.world.startMap]);map.offset=0;state.world.maps[name]=map;
    ArcadeStore.dispatch({type:actions.GAME_WORLD_MAP_SWITCH,response:name,editor:true});status.textContent='Map added: '+name;
  };
  document.getElementById('start-map').onclick=()=>{if(currentRoute==='/game')return;state.world.startMap=state.world.activeMap;status.textContent='Start map: '+state.world.startMap;};
  const routes={'/':'MenuView','/game':'GameView','/editor':'EditorView','/editor-map':'EditorMapView','/editor/sprites':'EditorSpritesView','/editor/environment':'EditorEnvironmentView'};
  function route() {
    const next=location.hash.slice(1)||'/';
    state.sound.sound.stopAll();
    // Keep authoring data separate from collected items, defeated enemies and player position.
    if(currentRoute==='/game' && playSnapshot){state.world=clone(playSnapshot);playSnapshot=null;}
    if(next==='/game'){documentWorld=clone(state.world);playSnapshot=clone(documentWorld);state.world=clone(documentWorld);state.world.player.started=false;}
    currentRoute=next;
    const View=load('views/'+(routes[next]||'NotFoundView')).default;
    ArcadeDOM.mount(ArcadeDOM.element(View,{history:{push:path=>{location.hash=path;}}}),document.getElementById('app'));
    document.body.dataset.route=next;
    document.getElementById('new-map').hidden=next!=='/editor-map';document.getElementById('start-map').hidden=next!=='/editor-map';
    document.getElementById('editor-help').hidden=next!=='/editor-map';
    queueMicrotask(()=>window.dispatchEvent(new Event('resize')));
  }
  const saved=document.getElementById('saved-world');
  if(saved){try{state.world=validate(JSON.parse(saved.textContent));documentWorld=clone(state.world);}catch(e){status.textContent='Embedded world failed: '+e.message;}}
  window.addEventListener('hashchange',route);
  window.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.code==='KeyS'){e.preventDefault();ArcadeFiles.save();}});
  window.addEventListener('blur',()=>{window.dispatchEvent(new KeyboardEvent('keyup',{key:'ArrowRight',keyCode:39}));window.dispatchEvent(new KeyboardEvent('keyup',{key:'ArrowLeft',keyCode:37}));});
  route();
})();
