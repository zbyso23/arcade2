/* Optional browser checks. Open index.html?selftest=1; no test dependencies. */
'use strict';
if(new URLSearchParams(location.search).get('selftest')==='1') {
  (async()=>{
    const results=[],errors=[];window.addEventListener('error',e=>errors.push(e.message));
    const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
    const check=(name,ok)=>{results.push({name,pass:!!ok});if(!ok)throw Error(name);};
    const key=(type,key,keyCode)=>window.dispatchEvent(new KeyboardEvent(type,{key,keyCode,bubbles:true,cancelable:true}));
    const go=async route=>{location.hash=route;await pause(1600);};
    const initial=ArcadeFiles.snapshot();
    try {
      check('No external framework globals',!window.React&&!window.Redux&&!window.ts);
      const world=ArcadeFiles.validate({format:'arcade2-world',version:1,world:initial});
      check('World schema and start map',!!world.maps[world.startMap]);
      const invalid=JSON.parse(JSON.stringify(initial));invalid.startMap='missing-map';let rejected=false;
      try{ArcadeFiles.validate(invalid);}catch(_){rejected=true;}check('Reject invalid world before loading',rejected);
      const legacy=JSON.parse(JSON.stringify(initial));legacy.maps[legacy.startMap].stars={...legacy.maps[legacy.startMap].stars};
      check('Legacy sparse stars import',Array.isArray(ArcadeFiles.validate(legacy).maps[legacy.startMap].stars));
      const before=JSON.stringify(ArcadeFiles.snapshot());try{ArcadeFiles.importText('{broken');}catch(_){}
      check('Malformed JSON leaves world unchanged',JSON.stringify(ArcadeFiles.snapshot())===before);
      let blob,filename;const originalURL=URL.createObjectURL;
      const intercept=e=>{if(e.target.tagName==='A'&&e.target.download){filename=e.target.download;e.preventDefault();}};
      document.addEventListener('click',intercept,true);URL.createObjectURL=b=>{blob=b;return originalURL(b);};
      try{ArcadeFiles.save();}finally{URL.createObjectURL=originalURL;document.removeEventListener('click',intercept,true);}
      check('Timestamped JSON download',/^ArcadeII-World_\d{14}\.json$/.test(filename));
      const text=await blob.text();const fileWorld=ArcadeFiles.validate(JSON.parse(text));
      check('Save contains every map',Object.keys(fileWorld.maps).join()===Object.keys(initial.maps).join());
      await go('/game');
      for(const el of document.querySelectorAll('.quest-button'))if(el.textContent==='Close')el.click();
      const x=ArcadeStore.getState().world.player.x;
      key('keydown','ArrowRight',39);await pause(500);key('keyup','ArrowRight',39);
      check('Game movement updates player',ArcadeStore.getState().world.player.x>x);
      check('Game canvas is visible and sized',document.querySelector('canvas.game')?.height===1080);
      await go('/editor-map');
      let p=ArcadeStore.getState().world.player;const cursor=p.x;
      key('keydown','ArrowRight',39);key('keyup','ArrowRight',39);await pause(60);
      check('Editor cursor moves by one tile',ArcadeStore.getState().world.player.x===cursor+ArcadeStore.getState().world.maps[ArcadeStore.getState().world.activeMap].tileX);
      key('keydown','1',49);key('keyup','1',49);await pause(60);
      const edited=ArcadeFiles.snapshot();
      check('Editor places a star',edited.maps[edited.activeMap].stars.some(s=>s && s.y===0));
      ArcadeFiles.importText(JSON.stringify({format:'arcade2-world',version:1,world:edited}));await pause(1600);
      check('Edited world survives file roundtrip',ArcadeFiles.snapshot().maps[edited.activeMap].stars.some(s=>s && s.y===0));
      await go('/editor/sprites');check('Sprite atlas generator',document.querySelector('canvas')?.width>1000);
      await go('/editor/environment');check('Environment atlas generator',document.querySelector('canvas')?.width>0);
      await go('/editor');check('Editor navigation',document.getElementById('app').textContent.includes('Sprites'));
      check('No uncaught runtime errors',errors.length===0);
    }catch(error){results.push({name:error.message,pass:false});}
    finally {
      location.hash='/';ArcadeFiles.importText(JSON.stringify(initial));await pause(100);
      const panel=document.createElement('pre');panel.id='test-results';
      panel.style.cssText='position:fixed;z-index:200000;inset:60px 20px 20px;background:#102033;color:#fff;border:2px solid #62d4bc;padding:20px;overflow:auto;white-space:pre-wrap;user-select:text;font:15px/1.5 monospace';
      panel.textContent='ARCADE II — BROWSER CHECKS\n\n'+results.map(r=>(r.pass?'PASS  ':'FAIL  ')+r.name).join('\n')+'\n\n'+(errors.join('\n')||'No uncaught errors.')+'\n\nReload index.html without ?selftest=1 to play.';
      document.body.append(panel);window.ArcadeTestResults=results;
    }
  })();
}
