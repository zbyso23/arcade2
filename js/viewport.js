/* Fixed-height game coordinates; scale the entire native UI to fit the window. */
window.ArcadeViewport={width:1280,height:1080};
(() => {
 function resize(){
   const top=document.getElementById('offline-bar').getBoundingClientRect().height||52;
   const available=Math.max(120,window.innerHeight-top);
   const scale=Math.min(window.innerWidth/1280,available/1080);
   const width=Math.max(1280,Math.floor(window.innerWidth/scale));
   ArcadeViewport.width=width;
   const stage=document.getElementById('app');
   stage.style.width=width+'px';stage.style.height='1080px';stage.style.transform='scale('+scale+')';stage.style.top=top+'px';
 }
 window.addEventListener('resize',resize);resize();
})();
