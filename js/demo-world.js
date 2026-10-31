/* Two handcrafted levels using only the original sprites, backgrounds and audio. */
window.ArcadeDemo = {
  create(load) {
    const worldTypes=load('reducers/gameWorldReducer');
    const mapTypes=load('reducers/gameMapReducer');
    const world=worldTypes.getDefaultState();
    const X=92,Y=104,groundY=8*Y;
    const trigger=(experience=0)=>Object.assign(worldTypes.getDefaultQuestTriggerState(),{experience});
    function map(title,image){return Object.assign(mapTypes.getDefaultState(),{
      title,length:32,size:32,tileX:X,tileY:Y,height:9,offset:0,
      spawn:{x:2*X,y:groundY},ground:[{from:0,to:32*X,type:2}],groundFall:Array(32).fill(true),
      stars:Array(32).fill(null),spikes:Array(32).fill(null),background:{image,factor:-0.065}
    });}
    function platform(m,from,to,row){m.floor.push({from:from*X,to:to*X,height:row*Y,bothSide:false,type:2});}
    function stars(m,positions,row,value=25){for(const x of positions)m.stars[x]={x,y:row,frame:1,value,collected:false};}
    function item(name,x,title,text){return Object.assign(mapTypes.getDefaultItemState(),{
      name,x:x*X,y:groundY,visible:true,collected:false,
      properties:{canAttack:name==='sword',canDestruct:name==='pickaxe'},text:{title,finished:text},trigger:trigger(25)
    });}
    function enemy(type,from,to,lives=0){return Object.assign(mapTypes.getDefaultEnemyState(),{
      type,from,to,xGrid:from,x:from*X,y:groundY,visible:true,speed:1,
      resistent:{jump:type!=='bandit'},following:{enabled:false,range:3},
      live:{lives,timer:0,defeated:false},text:{title:'',finished:''},trigger:trigger(type==='orc'?100:50)
    });}
    function npc(name,x,quest){return Object.assign(mapTypes.getDefaultQuestState(),{
      name,x:x*X,y:groundY,from:x*X,to:(x+1)*X,speed:0,right:false,visible:true,quest
    });}
    function exit(x,map,win=false,visible=true,type='cave'){return {x:x*X,y:groundY,map,win,visible,type:{name:type,frame:1},blocker:null};}
    function scenery(name,x,width,height){return {name,x:x*X,y:groundY,width,height,frame:1,visible:true};}
    const hills=map("1 — The Fisher's Meadow",'map-hills1.png');
    const cave=map("2 — Charles's Hollow",'map-cave1.png');
    platform(hills,10,14,7);platform(hills,18,22,6);platform(hills,23,26,7);
    stars(hills,[3,6,7,10,16,17,23,25],8);stars(hills,[11,12,13],6,50);stars(hills,[19,20,21],5,50);
    hills.items=[item('sword',8,'A trusty sword','Hold Ctrl to attack while facing an enemy. The bandit ahead can also be defeated by jumping on him.')];
    hills.enemies=[enemy('bandit',14,16)];
    hills.environment=[scenery('house',1,3,2),scenery('house-white',19,3,3),scenery('cave',27,3,2)];
    hills.exit=[exit(27,'cave')];
    platform(cave,8,12,6);platform(cave,14,18,7);platform(cave,20,23,6);
    stars(cave,[4,7,11,13,19,21,27,28],8);stars(cave,[9,10,11],5,50);stars(cave,[15,16,17],6,50);
    cave.items=[item('pickaxe',10,"The fisher's missing pickaxe",'You found it! Return to the fisher for a bonus, or help Charles defeat the orc and open the blue portal.')];
    cave.enemies=[enemy('scorpion',16,18),enemy('orc',24,25,1)];
    cave.exit=[exit(2,'hills'),exit(29,'',true,false,'portal-blue')];
    cave.environment=[scenery('cave',1,3,2)];
    const fisher=worldTypes.getDefaultQuestState();
    Object.assign(fisher,{name:'fisher',retryable:true,title:'The missing pickaxe',text:{
      introduction:'Charles the horse went into the cave with my pickaxe. Take the sword beside the path, find them, and bring the tool back. Press E near a cave entrance to travel.',
      accepted:'Thank you! The cave is at the far right of this meadow. The pickaxe should be on the cave floor. Come back to me after collecting it for a bonus reward.',
      rejected:'No hurry. You can still explore the cave and talk to Charles. Come back if you change your mind.',
      progress:'Still looking? Cross the meadow and enter the cave. The pickaxe is beyond Charles. Once you have it, return through the entrance and talk to me.',
      finished:'My pickaxe! Thank you. Charles is still waiting in the cave: defeat his orc guard, then speak to him again to reveal the blue portal.'
    },accept:{items:[{map:'cave',name:'pickaxe',x:10*X,y:groundY}],enemy:[]},trigger:{accepted:trigger(50),rejected:trigger(),finished:trigger(300)}});
    const charles=worldTypes.getDefaultQuestState();
    Object.assign(charles,{name:'charles',retryable:true,title:"Charles and the blue portal",text:{
      introduction:'I am Charles. An orc is guarding the way out. Please recover the pickaxe on the cave floor, defeat the orc near the far end, and come back to me. I can reveal the blue portal.',
      accepted:'Find the pickaxe, then defeat the orc with your sword. Face him and hold Ctrl; he needs two hits. The scorpion also needs a sword. Return to me when both tasks are done.',
      rejected:'I will wait here. You can accept this task later. The blue portal will remain hidden until you help me.',
      progress:'You need the pickaxe and the defeated orc. The pickaxe is on the floor to the right. The orc is farther along. Use E to talk to me when you are ready.',
      finished:'You did it! The blue portal has appeared at the far right of this cave. Press E beside it to finish the demo. You can visit the fisher first for his bonus reward.'
    },accept:{items:[{map:'cave',name:'pickaxe',x:10*X,y:groundY}],enemy:[{map:'cave',name:'orc',x:24*X,y:groundY}]},trigger:{accepted:trigger(50),rejected:trigger(),finished:trigger(400)}});
    charles.trigger.finished.exit.push({map:'cave',name:'portal-blue',x:29*X,y:groundY,hide:false});
    hills.quests=[npc('fisher',4,fisher)];cave.quests=[npc('charles',5,charles)];
    world.maps={hills,cave};world.items={sword:{name:'sword',properties:{canAttack:true,canDestruct:false}},pickaxe:{name:'pickaxe',properties:{canAttack:false,canDestruct:true}}};
    world.enemies={bandit:{type:'bandit',resistent:{jump:false}},scorpion:{type:'scorpion',resistent:{jump:true}},orc:{type:'orc',resistent:{jump:true}}};
    world.environment={house:{name:'house',width:3,height:2},'house-white':{name:'house-white',width:3,height:3},cave:{name:'cave',width:3,height:2}};
    world.quests={fisher:JSON.parse(JSON.stringify(fisher)),charles:JSON.parse(JSON.stringify(charles))};
    world.player=load('reducers/playerReducer').getDefaultState();Object.assign(world.player,{x:2*X,y:groundY,jump:groundY,surface:groundY});
    world.startMap='hills';world.activeMap='hills';world.loaded=true;world.demo='fisher-and-charles-v1';
    world.text.wellcome={title:'The Fisher & Charles — Two-level demo',text:'Talk to the fisher with E. Collect the sword, enter the cave, and help Charles the horse open the blue portal. Arrows: move · Space: jump · Ctrl: attack · E: talk / travel · Tab: attributes. Returning the pickaxe to the fisher is a bonus quest.'};
    return world;
  }
};
