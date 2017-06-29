import * as React from 'react';
import { Promise } from 'es6-promise';

import { 
    IStore, 
    IStoreContext, 
    ISoundState, 
    IGameMapState, 
    IGameMapItemState,
    IGameMapEnemyState,
    IGameMapExitState,
    IGameMapPlatformState, 
    IPlayerState,
    IGameMapQuestState,
    IGameMapEnvironmentState,
    IGameWorldQuestTriggerPartState
} from '../reducers';
import { Store } from 'redux';
import { Sprites, ISprite, ISpriteBlock } from '../libs/Sprites';
import { 
    PLAYER_UPDATE, 
    PLAYER_CLEAR,
    PLAYER_ADD_EXPERIENCE,
    PLAYER_ADD_STAR
} from '../actions/playerActions';

import { 
    GAME_WORLD_QUEST_ACTIVE_UPDATE,
    GAME_WORLD_MAP_UPDATE,
    GAME_WORLD_MAP_SWITCH,
    GAME_WORLD_MAP_START_SET,
    GAME_WORLD_PLAYER_UPDATE,
    GAME_WORLD_PLAYER_ADD_EXPERIENCE,
    GAME_WORLD_PLAYER_ADD_STAR,
    GAME_WORLD_UPDATE,
    GAME_WORLD_EXPORT,
    GAME_WORLD_IMPORT
} from '../actions/gameWorldActions';

import { GAME_MAP_UPDATE } from '../actions/gameMapActions';
import Sound from '../Sound/Sound';

export interface IGameLoopProps {
	width?: number;
	height?: number;
    onProcessWin?: () => any;
    onProcessMapChange?: (map: string) => any;
}

export interface IGameLoopControlsState {
    up?: boolean;
    down?: boolean;
    left?: boolean;
    right?: boolean;
    use?: boolean;
    attack?: boolean;
    dirChanged?: number;
}


export interface IGameLoopState 
{
    loaded?: boolean;
    sound?: ISoundState;
    mapSize?: number;
    controls?: IGameLoopControlsState;
    controlsLast?: IGameLoopControlsState;
}

function mapStateFromStore(store: IStore, state: IGameLoopState): IGameLoopState {
    if(!store.world.loaded) return state;
    let newState = Object.assign({}, state, {sound: store.sound});
    if(!state.loaded) newState.mapSize = ((store.world.maps[store.world.activeMap].length - 2) * store.world.maps[store.world.activeMap].tileX);
    return newState;
}

let mounted = false;

export default class GameLoop extends React.Component<IGameLoopProps, IGameLoopState> {

    private cached: { [id: string]: HTMLImageElement } = {};

    static contextTypes: React.ValidationMap<any> = 
    {
        store: React.PropTypes.object
    }
    
    context: IStoreContext;
    unsubscribe: Function;

    private handlerKeyUp: any;
    private handlerKeyDown: any;


	private animationTime: number = 30;
	private timer: any;
	private counter: number = 0;
    private lastTime: Date;
    private lastTimeLag: number = 0;

    private gamepad: any = null;
    private gamepadJumpReleased: boolean = true;

    private questPopup: any = null;
    private dialogPopup: any = null;

    private detected: { quest: any, exit: any, timeoutQuest: number, timeoutExit: number } = { quest: null, exit: null, timeoutQuest: 0, timeoutExit: 0 };
    private detectedElement: any = null;

    constructor(props: IGameLoopProps) {
        super(props);
        this.state = { 
        	loaded: false, 
            sound: null,
            mapSize: 0,
            controls: {
                up: false,
                down: false,
                left: false,
                right: false,
                use: false,
                attack: false,
                dirChanged: 0
            }
        };

        this.loop = this.loop.bind(this);
        this.run = this.run.bind(this);
        this.progressQuest = this.progressQuest.bind(this);
        this.closePopupDialog = this.closePopupDialog.bind(this);
        this.handlerKeyUp = this.processKeyUp.bind(this);
        this.handlerKeyDown = this.processKeyDown.bind(this);
        this.handleGamepadConnected = this.handleGamepadConnected.bind(this);
        this.handleGamepadDisconnected = this.handleGamepadDisconnected.bind(this);
    }

    componentDidMount() 
    {
        mounted = true;
        console.log('gameLoop componentDidMount() ');
        let storeState = this.context.store.getState();
        this.unsubscribe = this.context.store.subscribe(this.setStateFromStore.bind(this));
        let newState = Object.assign({}, this.state);
        this.setState(mapStateFromStore(this.context.store.getState(), newState));
        window.addEventListener('keydown', this.handlerKeyDown);
        window.addEventListener('keyup', this.handlerKeyUp);
        window.addEventListener("gamepadconnected", this.handleGamepadConnected);
        window.addEventListener("gamepaddisconnected", this.handleGamepadDisconnected);
        if(storeState.world.text.wellcome.title !== '') this.createWellcomePopup();
        this.run();
    }

    componentWillUnmount() 
    {
        mounted = false;
        console.log('componentWillUnmount()');
        clearTimeout(this.timer);
        window.removeEventListener('keydown', this.handlerKeyDown);
        window.removeEventListener('keyup', this.handlerKeyUp);
        window.removeEventListener("gamepadconnected", this.handleGamepadConnected);
        window.removeEventListener("gamepaddisconnected", this.handleGamepadDisconnected);
        if (this.unsubscribe) 
        {
            this.unsubscribe();
        }
        this.musicOff().then(() => {
            console.log('Music stop');
        }).catch((error: string) => {
            console.log('Music stop error', error);
        });
    }

    setStateFromStore() 
    {
        let storeState = this.context.store.getState();
        this.setState(mapStateFromStore(this.context.store.getState(), this.state));
    }

    run ()
    {
        console.log('gameLoop run() ', this.state);
        this.lastTime = new Date();
        this.timer = setTimeout(this.loop, this.animationTime);
    }

    processKeyDown(e: KeyboardEvent)
    {
        if(e.repeat) 
        {
            let assignKeys = [32, 37, 39, 38, 40, 69];
            if(assignKeys.indexOf(e.keyCode) > -1) e.preventDefault();
            return;
        }
        this.toggleKey(e);
    }

    processKeyUp(e: KeyboardEvent)
    {
        this.toggleKey(e);
    }

    toggleKey(e: KeyboardEvent)
    {
        // console.log('toggleKey', e.keyCode);
        /*
        9 - Tab
        32 - Space
        113 - F2
        37 - ArrowLeft
        39 - ArrowRight
        69 - e - use
        */
        let storeState = this.context.store.getState();

        let statePlayer = storeState.world.player;
        let assignKeys = [32, 37, 39, 38, 40, 69, 17];
        if(assignKeys.indexOf(e.keyCode) === -1) return;
        e.preventDefault();
        if(!statePlayer.started) 
        {
            this.musicOn().then(() => {
                console.log('Music played');
            }).catch((error: string) => {
                console.log('Music play error', error);
            });
            statePlayer.started = true;
            this.context.store.dispatch({type: GAME_WORLD_PLAYER_UPDATE, response: statePlayer });
        }
        let newControls = Object.assign({}, this.state.controls);
        switch(e.keyCode)
        {
            case 32:
                newControls.up = (e.type === 'keyup' || statePlayer.y !== statePlayer.surface) ? false : true;
                break;

            case 37:
                newControls.left = (e.type === 'keyup') ? false : true;
                break;

            case 39:
                newControls.right = (e.type === 'keyup') ? false : true;
                break;

            case 69:
                newControls.use = (e.type === 'keyup') ? false : true;
                break;

            case 17:
                newControls.attack = (e.type === 'keyup' || !this.havePlayerAttackItem() || statePlayer.y !== statePlayer.surface) ? false : true;
                break;
        }

        if((newControls.right && !this.state.controls.right) || (newControls.left && !this.state.controls.left))
        {
            statePlayer.right = (newControls.right && !this.state.controls.right) ? true : false;
            statePlayer.speed *= 0.6;
            newControls.dirChanged = statePlayer.speed * 0.45;
            this.context.store.dispatch({type: GAME_WORLD_PLAYER_UPDATE, response: statePlayer });
        }
        if(newControls.attack !== this.state.controls.attack)
        {
            statePlayer.attack = newControls.attack;
            this.context.store.dispatch({type: GAME_WORLD_PLAYER_UPDATE, response: statePlayer });
        }
        this.setState({controls: newControls});
    }

    handleGamepadConnected(e: any)
    {
        console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.", e.gamepad.index, e.gamepad.id, e.gamepad.buttons.length, e.gamepad.axes.length);
        this.gamepad = e.gamepad;
    }

    handleGamepadDisconnected(e: any)
    {
        this.gamepad = null;
    }

    checkGamepad ()
    {
        // console.log('checkGamepad', this.gamepad);
        if(this.gamepad === null) return;
        let storeState = this.context.store.getState();
        let statePlayer = storeState.world.player;
        let y = 0;
        let x = 0;
        let buttonA = false;
        let buttonB = false;
        let buttonC = false;
        let isControls = false;
        let isWebkit = (navigator.webkitGetGamepads) ? true : false;
        if(this.gamepad.axes[0] != 0) 
        {
            x += this.gamepad.axes[0];
        } 
        else if(this.gamepad.axes[1] != 0) 
        {
            y -= this.gamepad.axes[1];
        } 
        else if(this.gamepad.axes[2] != 0) 
        {
            x -= this.gamepad.axes[2];
        } 
        else if(this.gamepad.axes[3] != 0) 
        {
            y += this.gamepad.axes[3];
        }

        if((!isWebkit && (this.gamepad.buttons[0].value > 0 || this.gamepad.buttons[0].pressed == true)) ||
            (isWebkit && this.gamepad.buttons[0] === 1))
        {
            if(this.gamepadJumpReleased && statePlayer.jump === statePlayer.y) 
            {
                buttonA = true;
                this.gamepadJumpReleased = false;
            }
        }
        else
        {
            this.gamepadJumpReleased = true;
        }

        if((!isWebkit && (this.gamepad.buttons[1].value > 0 || this.gamepad.buttons[1].pressed == true)) ||
            (isWebkit && this.gamepad.buttons[1] === 1))
        {
            buttonB = true;
        }
        if((!isWebkit && (this.gamepad.buttons[2].value > 0 || this.gamepad.buttons[2].pressed == true)) ||
            (isWebkit && this.gamepad.buttons[2] === 1))
        {
            buttonC = true;
        }

        let newControls = Object.assign({}, this.state.controls);
        if(buttonA) newControls.up = true;
        newControls.use = (buttonB);
        newControls.attack = (buttonC && !buttonA);
        switch(x)
        {
            case -1:
                newControls.right = false;
                newControls.left = true;
                isControls = true;
                break;

            case 1:
                newControls.right = true;
                newControls.left = false;
                isControls = true;
                break;

            default:
                newControls.right = false;
                newControls.left = false;
                break;
        }

        
        if(!statePlayer.started && isControls)
        {
            statePlayer.started = true;
            this.context.store.dispatch({type: GAME_WORLD_PLAYER_UPDATE, response: statePlayer });
        }

        if((newControls.right && !this.state.controls.right) || (newControls.left && !this.state.controls.left))
        {           
            statePlayer.right = (newControls.right && !this.state.controls.right) ? true : false;
            this.context.store.dispatch({type: GAME_WORLD_PLAYER_UPDATE, response: statePlayer });
        }
        if(newControls.attack !== this.state.controls.attack)
        {
            statePlayer.attack = newControls.attack;
            this.context.store.dispatch({type: GAME_WORLD_PLAYER_UPDATE, response: statePlayer });
        }
        // console.log('button', newControls);
        this.setState({controls: newControls});
    }

    soundOn(id: string)
    {
        this.state.sound.sound.play(id, false, false);
    }

    soundLoop(id: string)
    {
        this.state.sound.sound.play(id, true, false);
    }

    soundOff(id: string)
    {
        this.state.sound.sound.stop(id, false);
    }

    musicOn(): Promise<string>
    {
        let storeState = this.context.store.getState();
        let id = ['music-map', storeState.world.activeMap].join('-');
        // id = (storeState.world.activeMap === 'cave') ? 'music-map-cave' : 'music-map-hills';
        console.log('musicOn', id);
        return this.state.sound.sound.playPromise(id, true, false);
    }

    musicOff(): Promise<string>
    {
        let storeState = this.context.store.getState();
        let id = ['music-map', storeState.world.activeMap].join('-');
        // id = (storeState.world.activeMap === 'cave') ? 'music-map-cave' : 'music-map-hills';
        console.log('musicOff', id);
        return this.state.sound.sound.stopPromise(id, false);
    }

    loop()
    {
        let storeState = this.context.store.getState();
        this.counter++;
        if(this.counter === 1000) this.counter = 0;
        let newTime = new Date();
        if(storeState.world.activeQuest !== null)
        {
            this.lastTime = newTime;
            this.timer = setTimeout(this.loop, this.animationTime);
            return;
        }
        let delta = Math.abs(((newTime.getSeconds() * 1000) + newTime.getMilliseconds()) - ((this.lastTime.getSeconds() * 1000) + this.lastTime.getMilliseconds()));
        delta /= 1000000;
        
        let statePlayer = storeState.world.player;
        let mapLoadingDelay = false;
        if(statePlayer.started)
        {
            if(!statePlayer.death && !statePlayer.falling) this.loopPlayer(delta);
            mapLoadingDelay = this.loopEnvironment(delta);
            if(!mapLoadingDelay) this.loopEnemies(delta);
            if(!mapLoadingDelay) this.loopQuests(delta);
        }
        this.lastTime = newTime;
        if(!mapLoadingDelay && (this.counter % 2) === 0) this.checkGamepad();
        let time = (mapLoadingDelay) ? this.animationTime * 10 : this.animationTime;
        this.timer = setTimeout(this.loop, time);

    }

    havePlayerDestructItem(): boolean
    {
        let storeState = this.context.store.getState();
        let stateMap    = storeState.world.maps[storeState.world.activeMap];
        let statePlayer = storeState.world.player;

        let itemsLen = statePlayer.character.items.length;
        if(itemsLen === 0) return false;
        for(let i = 0, len = statePlayer.character.items.length; i < len; i++)
        {
            if(statePlayer.character.items[i].properties.canDestruct) return true;
        }
        return false;
    }

    havePlayerAttackItem(): boolean
    {
        let storeState = this.context.store.getState();
        let stateMap    = storeState.world.maps[storeState.world.activeMap];
        let statePlayer = storeState.world.player;
        let itemsLen = statePlayer.character.items.length;
        if(itemsLen === 0) return false;
        for(let i = 0, len = statePlayer.character.items.length; i < len; i++)
        {
            if(statePlayer.character.items[i].properties.canAttack) return true;
        }
        return false;
    }

    loopPlayer(delta: number)
    {
        let storeState = this.context.store.getState();
        let stateMap    = storeState.world.maps[storeState.world.activeMap];
        let statePlayer = storeState.world.player;
        let statePlayerAttributes = statePlayer.character.attributes;
        let controlsState = Object.assign({}, this.state.controls);
// console.log('statePlayer.falling', statePlayer.falling);
//         if(statePlayer.falling)
//         {
            
//             let step = 1;
//             console.log('step FALL', statePlayer.fall, statePlayer.y);
//             statePlayer.y += step;
//             statePlayer.jump += step;
//             if(statePlayer.fall < statePlayer.y)
//             {
//                 statePlayer.death = true;
//                 statePlayer.fall = 0;
//                 statePlayer.falling = false;
//             }
//             this.context.store.dispatch({type: GAME_WORLD_PLAYER_UPDATE, response: statePlayer });
//             return;
//         }

        let lastSpeed = statePlayer.speed;
        let isJump = Math.abs(statePlayer.jump - statePlayer.y) > 0;
        let isControlsMove = (controlsState.left || controlsState.right);
        let isControlsJump = (controlsState.up);
        let isCollisionX   = false;
        let isCollisionY   = false;
        let walkStarted    = false;
        let walkStopped    = false;
        if(isControlsMove)
        {
            let speedMax = (isJump) ? statePlayerAttributes.speed : statePlayerAttributes.speed;
            let speedIncerase = (isJump) ? statePlayerAttributes.speed * 0.05 : statePlayerAttributes.speed * 0.05;
            let speedChange = (isJump) ? statePlayerAttributes.brake * 0.15 : statePlayerAttributes.brake * 0.3;
            
            speedIncerase = (speedIncerase + (delta));
            speedChange = (speedChange + (delta));
            let newSpeed = statePlayer.speed;
            newSpeed += speedIncerase;
            if(controlsState.dirChanged > 0)
            {
                controlsState.dirChanged *= 0.25;
                newSpeed -= speedChange;
                if(controlsState.dirChanged < 1)
                {
                    controlsState.dirChanged = 0;
                }
            }
            statePlayer.speed = (newSpeed > speedMax) ? speedMax : newSpeed;
        }

        let speedDecay = (isControlsMove ? 0.95 : 0.7);
        statePlayer.speed *= speedDecay + delta;
        if(statePlayer.speed < 0.1)
        {
            statePlayer.speed = 0;
        }
        statePlayer.x += (statePlayer.right) ? statePlayer.speed : -statePlayer.speed;
        if(statePlayer.speed > 0 && ((statePlayer.right && statePlayer.x >= stateMap.length * stateMap.tileX) ||
            (!statePlayer.right && statePlayer.x <= 0)))
        {
            statePlayer.x -= (statePlayer.right) ? statePlayer.speed : -statePlayer.speed;
            statePlayer.speed = 0;
            controlsState.left = 0;
            controlsState.right = 0;
        }
        walkStopped = (lastSpeed !== 0 && statePlayer.speed === 0);
        walkStarted = (lastSpeed === 0 && statePlayer.speed !== 0);

        //floor check
        let surface = statePlayer.surface;
        let above = 0;
        let sideCollision = false;
        let mapGroundHeight = (stateMap.tileY * (stateMap.height - 1));
        if(statePlayer.speed > 0 || isJump || surface > statePlayer.y)
        {
            let floor = stateMap.floor;
            let playerLeftX = Math.floor(statePlayer.x + (stateMap.tileX * 0.25));
            let playerRightX = Math.floor(statePlayer.x + (stateMap.tileX * 0.75));
            let playerX = Math.floor(statePlayer.x + (stateMap.tileX * 0.5));
            let platformDetected = null;
            surface = mapGroundHeight;
            for(let i in floor)
            {
                let platform = floor[i];
                if(false === (playerRightX >= platform.from && playerLeftX <= platform.to))
                {
                    continue;
                }
                
                if(statePlayer.y <= (platform.height - (stateMap.tileX)))
                {
                    platformDetected = platform;
                    surface = platform.height - stateMap.tileY;
                }

                if(!isJump) continue;
                if(platform.bothSide && statePlayer.y >= (platform.height))
                {
                    above = platform.height;
                }
                // if(above > 0 && platform.bothSide && (statePlayer.y - stateMap.tileY) >= platform.height && ((playerRightX > platform.to) || (playerLeftX < platform.from)))
                // {
                //     sideCollision = true;
                // }
            }
            statePlayer.floor = platformDetected;
            statePlayer.surface = surface;
        }

        if(isControlsJump)
        {
            if(!isJump)
            {
                statePlayer.jump = statePlayer.y - (300 + statePlayerAttributes.jump);
                this.soundOff('sfx-player-walk');
                this.soundOn('sfx-player-jump');
            }
            let isAboveCollision = ((isJump && above !== 0 && Math.abs(statePlayer.y - above) < (stateMap.tileY / 4)));
            if((statePlayer.y <= statePlayer.jump || isAboveCollision) || sideCollision)
            {
                controlsState.up = false;
                if(isAboveCollision && isControlsMove)
                {
                    statePlayer.speed = 0;
                    statePlayer.x     = storeState.world.player.x;
                }
                isJump = true;
            }
            // else if( sideCollision && isControlsMove )
            // {
            //     controlsState.left = false;
            //     controlsState.right = false;
            //     statePlayer.speed = 0;
            //     statePlayer.x     = storeState.world.player.x;
            // }
            else
            {
                statePlayer.y -= 30 + delta;
            }
        }

        //go down from floor
        if(!isControlsJump && !isJump && statePlayer.speed > 0 && surface > statePlayer.y)
        {
            statePlayer.jump = mapGroundHeight - (mapGroundHeight - statePlayer.y);
            // console.log('go down from floor', statePlayer.jump, statePlayer.y, surface);
            isJump = true;
            walkStopped = true;
            this.soundOn('sfx-player-jump');
        }
        //go down
        if(isJump)
        {
            statePlayer.y += 16 + delta;
            if(!isControlsJump)
            {
                //surface landing check
                if((statePlayer.surface - statePlayer.y) <= stateMap.tileY * 0.1)
                {
                    statePlayer.y = statePlayer.surface;
                    statePlayer.jump = statePlayer.y;
                    walkStarted = (statePlayer.speed !== 0);
                }
            }
            if(walkStarted) this.soundLoop('sfx-player-walk');
            if(walkStopped) this.soundOff('sfx-player-walk');
        }
        else
        {
            if(walkStopped) this.soundOff('sfx-player-walk');
            if(walkStarted) this.soundLoop('sfx-player-walk');
        }
        // Shift map - need refactor
        if(statePlayer.x >= (this.props.width / 2) && statePlayer.x < ((stateMap.length * stateMap.tileX) - (this.props.width / 2)))
        {
            stateMap.offset = Math.max(0, Math.ceil(statePlayer.x - (this.props.width / 2)));
        }
        this.setState({controls: controlsState});
        this.context.store.dispatch({type: GAME_WORLD_MAP_UPDATE, response: stateMap, name: storeState.world.activeMap });
        this.context.store.dispatch({type: GAME_WORLD_PLAYER_UPDATE, response: statePlayer });
    }

    loopEnvironment(delta: number): boolean
    {
        let storeState = this.context.store.getState();
        let stateMap    = storeState.world.maps[storeState.world.activeMap];
        let statePlayer = storeState.world.player;
        let stars = stateMap.stars;
        let spikes = stateMap.spikes;
        let controlsState = this.state.controls;
        let x = Math.max(0, Math.min(stateMap.length - 1, Math.floor((statePlayer.x + (stateMap.tileX * 0.5)) / stateMap.tileX)));
        //Collect star
        let starCollectFactor = stateMap.tileY * 0.8;
        if(stars[x] !== null && !stars[x].collected)
        {
            // console.log('star on '+x.toString(), stars[x]);
            let starHeight = ((stars[x].y * stateMap.tileY));
            let isStar = (Math.abs(starHeight - statePlayer.y) <= starCollectFactor);
            if(isStar)
            {
                this.soundOn('sfx-star-collected');
                stateMap.stars[x].collected = true;
                stateMap.stars[x].frame = 1;
                this.context.store.dispatch({type: GAME_WORLD_PLAYER_ADD_EXPERIENCE, response: stars[x].value });
                this.context.store.dispatch({type: GAME_WORLD_PLAYER_ADD_STAR, response: 1 });
                return false;
                // console.log('collect star', stars[x]);
            }
        }

        // Spikes
        let spikeDamageFactor = stateMap.tileY * 0.4;
        if(spikes[x] !== null) 
        {
            let spikeHeight = ((spikes[x].y * stateMap.tileY));
            let isSpike = (Math.abs(spikeHeight - statePlayer.y) <= spikeDamageFactor);
            if(isSpike && !statePlayer.death) 
            {
                this.soundOff('sfx-player-walk');
                this.soundOn('sfx-player-death');
                statePlayer.death = true;
                statePlayer.frame = 1;
                this.context.store.dispatch({type: GAME_WORLD_PLAYER_UPDATE, response: statePlayer });
                return false;
            }
        }

        // Items
        let itemTakeFactor = stateMap.tileY * 0.3;
        for(let i = 0, len = stateMap.items.length; i < len; i++)
        {
            let item = stateMap.items[i];
            if(item.collected || !item.visible) continue;
            let isCollectX = (Math.abs(item.x - statePlayer.x) <= itemTakeFactor);
            if(!isCollectX) continue;
            let isCollectY = (Math.abs(item.y - statePlayer.y) <= itemTakeFactor);
            if(!isCollectY) continue;
            let playerItem = Object.assign({}, item);
            this.soundOn('sfx-star-collected');
            stateMap.items[i].collected = true;
            stateMap.items[i].frame = 1;
            statePlayer.character.items.push(playerItem);
            this.context.store.dispatch({type: GAME_WORLD_MAP_UPDATE, response: stateMap, name: storeState.world.activeMap });
            this.context.store.dispatch({type: GAME_WORLD_PLAYER_UPDATE, response: statePlayer });
            //trigger
            this.triggerItem(i);
            if(item.text.title !== '') this.createItemPopup(item, i);
            return false;
        }

        
        // Check Exit
        let newDetected = null;
        let exitOpenFactor = stateMap.tileY * 0.3;
        let exitOpenFactorX = stateMap.tileX * 1.2;
        for(let i = 0, len = stateMap.exit.length; i < len; i++)
        {
            if(typeof stateMap.exit[i] === "undefined") { console.log('!!stateMap UNDEF', i, stateMap.exit, stateMap); return; }
            if(!stateMap.exit[i].visible) continue;
            if(Math.abs(stateMap.exit[i].x - statePlayer.x) > exitOpenFactorX)
            {
                continue;
            }
            let exitHeight = ((stateMap.exit[i].y));
            let isExit = (Math.abs(exitHeight - statePlayer.y) <= exitOpenFactor);
            if(!isExit) continue;
            let exit = stateMap.exit[i];
            newDetected = exit;
            if(controlsState.use && exit.blocker === null)
            {
                if(exit.win)
                {
                    this.props.onProcessWin();
                    return true;
                }
                else
                {
                    // statePlayer.started = false;
                    this.musicOff().then(() => {
                        console.log('Music stop');
                        this.context.store.dispatch({type: GAME_WORLD_PLAYER_UPDATE, response: statePlayer });
                        this.context.store.dispatch({type: GAME_WORLD_MAP_SWITCH, response: exit.map, editor: false });

                        storeState = this.context.store.getState();
                        stateMap    = storeState.world.maps[exit.map];
                        if(statePlayer.x < (this.props.width / 2))
                        {
                            stateMap.offset = 0;
                            
                        }
                        else if(statePlayer.x <= ((stateMap.length * stateMap.tileX) - (this.props.width / 2)))
                        {
                            stateMap.offset = Math.max(0, Math.ceil(statePlayer.x - (this.props.width / 2)));
                        }
                        else
                        {
                            stateMap.offset = ((stateMap.length * stateMap.tileX) - (this.props.width));
                        }
                        this.context.store.dispatch({type: GAME_WORLD_MAP_UPDATE, response: stateMap, name: exit.map });
                        // this.musicOn().then(() => {
                        //     console.log('Music played');
                        // }).catch((error: string) => {
                        //     console.log('Music play error', error);
                        // });
                    }).catch((error: string) => {
                        console.log('Music stop error', error);
                    });

                    // this.soundLoop('map-music-'+exit.map);
                    return true;
                    // this.props.onProcessMapChange(exit.map);
                }
            }
            else if(exit.blocker !== null && !exit.blocker.destroyed && controlsState.use && this.havePlayerDestructItem())
            {
                stateMap.exit[i].blocker.destroyed = true;
                stateMap.exit[i].blocker.frame = 1;
                this.context.store.dispatch({type: GAME_WORLD_MAP_UPDATE, response: stateMap, name: storeState.world.activeMap });
                this.soundOn('sfx-exit-cave-blocked');
                return;
            }
            // return;
        }

        if(newDetected === null && this.detected.exit !== null)
        {
            this.detected.timeoutExit--;
            if(this.detected.timeoutExit === 0) 
            {
                this.detected.exit = null;
                this.detectedElement = null;
            };
        }
        else if(newDetected !== null)
        {
            if(this.detected.timeoutExit <= 5) this.soundOn('sfx-exit-detected');
            this.detected.timeoutExit = 10;
            this.detected.exit = newDetected;
            let exitName = ['to ', newDetected.map].join(' ') + (newDetected.blocker === null ? '' : ' (blocked)');
            this.detectedElement = <div className="game-detected"><div className="title">Exit</div><div className="text">{exitName}</div></div>;
        }

        //isFall ??
        let mapGroundHeight = (stateMap.tileY * (stateMap.height - 1));
        if(!statePlayer.falling && statePlayer.y === statePlayer.surface && statePlayer.y === mapGroundHeight)
        {
            let ground = stateMap.ground;
            let isFalling = true;
            for(let i = 0, len = ground.length; i < len; i++)
            {
                let from = ground[i].from;
                let to   = ground[i].to;
                if(statePlayer.x < from || statePlayer.x >= to)
                {
                    continue;
                }
                isFalling = false;
                break;
            }
            if(isFalling)
            {
                statePlayer.falling = true;
                statePlayer.fall    = statePlayer.y + stateMap.tileY;
                this.context.store.dispatch({type: GAME_WORLD_PLAYER_UPDATE, response: statePlayer });
            }
        }
        return false;
    }

    loopEnemies(delta: number)
    {
        let storeState = this.context.store.getState();
        let stateMap    = storeState.world.maps[storeState.world.activeMap];
        let statePlayer = storeState.world.player;
        let enemies = stateMap.enemies;
        let enemyCollisionFactor = stateMap.tileY * 0.6;
        let enemyCollisionFactorX = stateMap.tileX * 0.55;
        let xPlayer = Math.max(0, Math.floor((statePlayer.x + (stateMap.tileX * 0.5)) / stateMap.tileX));
        let width = this.props.width;
        let skipDetection = false;
        for(let i = 0, len = enemies.length; i < len; i++)
        {
            let enemy = enemies[i];
            if(Math.abs(enemy.x - statePlayer.x) >= width) continue;
            if(enemy.death || enemy.die || !enemy.visible) continue;

            let x = Math.max(0, Math.floor((enemy.x + (stateMap.tileX * 0.5)) / stateMap.tileX));
            let dirChanged = false;
            if(enemy.right && x > enemy.to)
            {
                enemy.right = false;
                dirChanged = true;
            }
            else if(!enemy.right && x < enemy.from)
            {
                enemy.right = true;
                dirChanged = true;
            }
            let speed = enemy.speed + delta;
            if(enemy.live.timer > 0) speed /= 3;
            let newEnemyX = (enemy.right) ? (enemy.x + speed) : (enemy.x - speed);
            x = Math.max(0, Math.floor((newEnemyX + (stateMap.tileX * 0.5)) / stateMap.tileX));
            enemy.xGrid = x;
            enemy.x = newEnemyX;
            let enemyNear   = (Math.abs(newEnemyX - statePlayer.x) >= enemyCollisionFactorX) ? false : true;

            // Enemy collision check
            let enemyHeightDiff = statePlayer.y - enemy.y;
            if(enemy.live.timer === 0 && !skipDetection && enemyNear && !statePlayer.death && Math.abs(enemyHeightDiff) < enemyCollisionFactor)
            {
                let isAttack  = (statePlayer.attack && ((statePlayer.right && newEnemyX > statePlayer.x) || (!statePlayer.right && newEnemyX < statePlayer.x)));
                if(isAttack || (!enemy.resistent.jump && enemyHeightDiff < 0))
                {
console.log('enemy de', enemy.resistent.jump, enemyHeightDiff);
                    if(enemy.live.lives === 0)
                    {
                        this.soundOn('sfx-enemy-death');
                        enemy.frame = 1;

                        enemy.die = true;
                        skipDetection = true;
                        //trigger
                        if(!enemy.live.defeated)
                        {
                            this.triggerEnemy(i);
                            if(enemy.text.title !== '') this.createEnemyPopup(enemy, i);
                            enemy.live.defeated = true;
                        }
                    }
                    else
                    {
                        this.soundOn('sfx-enemy-death');
                        enemy.live.lives--;
                        enemy.live.timer = (enemy.speed * 20);
                    }
                }
                else
                {
                    this.soundOn('sfx-player-death');
                    this.soundOff('sfx-player-walk');
                    statePlayer.death = true;
                    statePlayer.frame = 1;
                    skipDetection = true;
                    this.context.store.dispatch({type: GAME_WORLD_PLAYER_UPDATE, response: statePlayer });
                }
            }
            
            // Enemy following
            if(x !== xPlayer)
            {
                if(enemy.following.enabled && [enemy.from, enemy.to].indexOf(x) === -1 && Math.abs(x - xPlayer) <= enemy.following.range)
                {
                    enemy.right = (xPlayer > x) ? true : false;
                }
                continue;
            }
        }
        stateMap.enemies = enemies;
        this.context.store.dispatch({type: GAME_WORLD_MAP_UPDATE, response: stateMap, name: storeState.world.activeMap });
    }

    loopQuests(delta: number)
    {
        let storeState = this.context.store.getState();
        let stateMap    = storeState.world.maps[storeState.world.activeMap];
        let statePlayer = storeState.world.player;
        let quests = stateMap.quests;
        let questCollisionFactor = stateMap.tileY * 0.6;
        // let questCollisionFactorX = stateMap.tileX * 0.55;
        let questCollisionFactorX = stateMap.tileX * 1.15;
        let width = this.props.width;
        let controlsState = this.state.controls;
        let skipDetection = false;
        let newDetected = null;
        // this.detected.quest = null;
        for(let i = 0, len = quests.length; i < len; i++)
        {
            let quest = quests[i];
            if(Math.abs(quest.x - statePlayer.x) >= width) continue;
            if(!quest.visible) continue;

            let x = Math.max(0, Math.floor((quest.x + (stateMap.tileX * 0.5))));
            let dirChanged = false;
            if(quest.right && x > quest.to)
            {
                quest.right = false;
                dirChanged = true;
            }
            else if(!quest.right && x < quest.from)
            {
                quest.right = true;
                dirChanged = true;
            }

            let speed = quest.speed + delta;
            let newQuestX = (quest.right) ? (quest.x + speed) : (quest.x - speed);
            x = Math.max(0, (newQuestX + (stateMap.tileX * 0.5)));
            quest.xGrid = Math.floor(x / stateMap.tileX);
            quest.x = newQuestX;

            if(quest.rejected) continue;
            let questNear   = (Math.abs(newQuestX - statePlayer.x) >= questCollisionFactorX) ? false : true;
            if(!questNear) continue;
            let questHeightDiff = statePlayer.y - quest.y;
            if(Math.abs(questHeightDiff) > questCollisionFactor) continue;
            newDetected = quest;
            // Quest collision check
            if(!controlsState.use) continue;
            
            if(!skipDetection && !statePlayer.death && Math.abs(questHeightDiff) < questCollisionFactor)
            {
                console.log('questColision', quest);
                this.context.store.dispatch({type: GAME_WORLD_QUEST_ACTIVE_UPDATE, response: quest.quest });
                this.processQuest(quest, i);
                this.createQuestPopup(quest, i);
                if(statePlayer.speed !== 0) this.soundOff('sfx-player-walk');
                this.musicOff().then(() => {
                    console.log('Music stop');
                    this.soundLoop('music-quest');
                }).catch((error: string) => {
                    console.log('Music stop error', error);
                }); 
            }
        }
        if(newDetected === null && this.detected.quest !== null)
        {
            this.detected.timeoutQuest--;
            if(this.detected.timeoutQuest === 0) 
            {
                this.detected.quest = null;
                this.detectedElement = null;
            }
        }
        else if(newDetected !== null)
        {
            if(this.detected.timeoutQuest < 25) this.soundOn('sfx-quest-detected');
            this.detected.timeoutQuest = 50;
            this.detected.quest = newDetected;
            this.detectedElement = <div className="game-detected"><div className="title">Quest</div><div className="text">{newDetected.quest.title}</div></div>;

        }

        stateMap.quests = quests;
        this.context.store.dispatch({type: GAME_WORLD_MAP_UPDATE, response: stateMap, name: storeState.world.activeMap });
    }

    processQuest(quest: IGameMapQuestState, index: number): IGameMapQuestState
    {
        if(quest.quest.completed || !quest.quest.accepted) return quest;
        if(quest.quest.accepted)
        {
            let isAccepted = this.validateQuest(quest, index);
            if(isAccepted)
            {
                let storeState = this.context.store.getState();
                let stateMap    = storeState.world.maps[storeState.world.activeMap];
                storeState.world.activeQuest.completed = true;
                stateMap.quests[index].quest.completed = true;
                this.context.store.dispatch({type: GAME_WORLD_QUEST_ACTIVE_UPDATE, response: storeState.world.activeQuest });
                this.context.store.dispatch({type: GAME_WORLD_MAP_UPDATE, response: stateMap, name: storeState.world.activeMap });
                this.triggerQuest('finished', index);
            }
            //validate -> trigger triggerQuest('rejected', index) -> switch to completed
        }
        return quest;
    }

    getItemFromMap(map: IGameMapState, x: number, y: number): { item: IGameMapItemState, index: number }
    {
        for(let i = 0, len = map.items.length; i < len; i++)
        {
            if(map.items[i].x === x && map.items[i].y === y) return { item: map.items[i], index: i };
        }
        return null;
    }

    getEnemyFromMap(map: IGameMapState, x: number, y: number): { enemy: IGameMapEnemyState, index: number }
    {
        let xGrid = Math.floor(x / map.tileX);
        for(let i = 0, len = map.enemies.length; i < len; i++)
        {
            if(map.enemies[i].from === xGrid && map.enemies[i].y === y) return { enemy: map.enemies[i], index: i };
        }
        return null;
    }

    getExitFromMap(map: IGameMapState, x: number, y: number): { exit: IGameMapExitState, index: number }
    {
        for(let i = 0, len = map.exit.length; i < len; i++)
        {
            if(map.exit[i].x === x && map.exit[i].y === y) return { exit: map.exit[i], index: i };
        }
        return null;
    }

    getEnvironmentFromMap(map: IGameMapState, x: number, y: number): { environment: IGameMapEnvironmentState, index: number }
    {
        for(let i = 0, len = map.environment.length; i < len; i++)
        {
            if(map.environment[i].x === x && map.environment[i].y === y) return { environment: map.environment[i], index: i };
        }
        return null;
    }

    getQuestFromMap(map: IGameMapState, x: number, y: number): { quest: IGameMapQuestState, index: number }
    {
        for(let i = 0, len = map.quests.length; i < len; i++)
        {
            if(map.quests[i].x === x && map.quests[i].y === y) return { quest: map.quests[i], index: i };
        }
        return null;
    }
    validateQuest(quest: IGameMapQuestState, index: number): boolean
    {
        let accept = quest.quest.accept;
        let isValid = true;
        let storeState = this.context.store.getState();
        for(let i = 0, len = accept.items.length; i < len; i++)
        {
            let map    = storeState.world.maps[accept.items[i].map];
            // console.log('validate item map', map);
            let item = this.getItemFromMap(map, accept.items[i].x, accept.items[i].y);
            if(item.item.collected) continue;
            isValid = false;
            break;

        }
        if(isValid) for(let i = 0, len = accept.enemy.length; i < len; i++)
        {
            let map    = storeState.world.maps[accept.enemy[i].map];
            let enemy = this.getEnemyFromMap(map, accept.enemy[i].x, accept.enemy[i].y);
            if(enemy.enemy.death) continue;
            isValid = false;
            break;
        }
        return isValid;
    }

    triggerPart(trigger: Array<IGameWorldQuestTriggerPartState>, part: string)
    {
        // IGameMapEnemyState
        let storeState = this.context.store.getState();
        let world      = storeState.world;
        for(let i = 0, len = trigger.length; i < len; i++)
        {
            let triggerItem = trigger[i];
            let map = world.maps[triggerItem.map];
            switch(part)
            {
                case 'exit':
                    let exit   = this.getExitFromMap(map, triggerItem.x, triggerItem.y);
                    console.log('trigger exit', exit, triggerItem);
                    if(exit === null) continue;
                    world.maps[triggerItem.map].exit[exit.index].visible = !triggerItem.hide;
                    break;

                case 'items':
                    let item   = this.getItemFromMap(map, triggerItem.x, triggerItem.y);
                    if(item === null || item.item.collected) continue;
                    world.maps[triggerItem.map].items[item.index].visible = !triggerItem.hide;
                    break;

                case 'enemy':
                    let enemy   = this.getEnemyFromMap(map, triggerItem.x, triggerItem.y);
                    console.log('trigger enemy', enemy, triggerItem);
                    if(enemy === null || enemy.enemy.death) continue;
                    world.maps[triggerItem.map].enemies[enemy.index].visible = !triggerItem.hide;
                    break;

                case 'environment':
                    let environment   = this.getEnvironmentFromMap(map, triggerItem.x, triggerItem.y);
                    console.log('trigger environment', environment, triggerItem);
                    if(environment === null) continue;
                    world.maps[triggerItem.map].environment[environment.index].visible = !triggerItem.hide;
                    break;

                case 'quest':
                    let quest   = this.getQuestFromMap(map, triggerItem.x, triggerItem.y);
                    console.log('trigger quest', quest, triggerItem);
                    if(quest === null) continue;
                    world.maps[triggerItem.map].quests[quest.index].visible = !triggerItem.hide;
                    break;
            }
        }
        this.context.store.dispatch({type: GAME_WORLD_UPDATE, response: world });
    }

    triggerEnemy(index: number)
    {
        let storeState = this.context.store.getState();
        let enemy = storeState.world.maps[storeState.world.activeMap].enemies[index];
        let world = storeState.world;
        let trigger = enemy.trigger;
        console.log('triggerEnemy RUN', trigger);
        if(trigger === null) return;
        let parts = ['exit', 'items', 'enemy', 'environment', 'quest', 'experience'];
        for(let i = 0, len = parts.length; i < len; i++)
        {
            let part = parts[i];
            let triggerPart = null;
            switch(part)
            {
                case 'exit':
                    triggerPart = trigger.exit;
                    break;

                case 'items':
                    triggerPart = trigger.items;
                    break;

                case 'enemy':
                    triggerPart = trigger.enemy;
                    break;

                case 'environment':
                    triggerPart = trigger.environment;
                    break;

                case 'quest':
                    triggerPart = trigger.quest;
                    break;

                case 'experience':
                    this.context.store.dispatch({type: GAME_WORLD_PLAYER_ADD_EXPERIENCE, response: trigger.experience });
                    break;
            }
            if(part === 'experience') continue;
            this.triggerPart(triggerPart, part);
        }
    }

    triggerItem(index: number)
    {
        let storeState = this.context.store.getState();
        let enemy = storeState.world.maps[storeState.world.activeMap].items[index];
        let world = storeState.world;
        let trigger = enemy.trigger;
        console.log('triggerItem RUN', trigger);
        if(trigger === null) return;
        let parts = ['exit', 'items', 'enemy', 'environment', 'quest', 'experience'];
        for(let i = 0, len = parts.length; i < len; i++)
        {
            let part = parts[i];
            let triggerPart = null;
            switch(part)
            {
                case 'exit':
                    triggerPart = trigger.exit;
                    break;

                case 'items':
                    triggerPart = trigger.items;
                    break;

                case 'enemy':
                    triggerPart = trigger.enemy;
                    break;

                case 'environment':
                    triggerPart = trigger.environment;
                    break;

                case 'quest':
                    triggerPart = trigger.quest;
                    break;

                case 'experience':
                    this.context.store.dispatch({type: GAME_WORLD_PLAYER_ADD_EXPERIENCE, response: trigger.experience });
                    break;
            }
            if(part === 'experience') continue;
            this.triggerPart(triggerPart, part);
        }
    }

    triggerQuest(section: string, index: number)
    {
        if(['accepted', 'rejected', 'finished'].indexOf(section) === -1) return null;
        let storeState = this.context.store.getState();
        let quest = storeState.world.activeQuest;
        let world = storeState.world;
        let trigger = null;
        switch(section)
        {
            case 'accepted':
                console.log('triggerQuest RUN', section);
                trigger = quest.trigger.accepted;
                break;

            case 'rejected':
                console.log('triggerQuest RUN', section);
                trigger = quest.trigger.rejected;
                break;

            case 'finished':
                console.log('triggerQuest RUN', section);
                trigger = quest.trigger.finished;
                break;
        }
        if(trigger === null) return;
        let parts = ['exit', 'items', 'enemy', 'environment', 'quest', 'experience'];
        for(let i = 0, len = parts.length; i < len; i++)
        {
            let part = parts[i];
            let triggerPart = null;
            switch(part)
            {
                case 'exit':
                    triggerPart = trigger.exit;
                    break;

                case 'items':
                    triggerPart = trigger.items;
                    break;

                case 'enemy':
                    triggerPart = trigger.enemy;
                    break;

                case 'environment':
                    triggerPart = trigger.environment;
                    break;

                case 'quest':
                    triggerPart = trigger.quest;
                    break;

                case 'experience':
                    this.context.store.dispatch({type: GAME_WORLD_PLAYER_ADD_EXPERIENCE, response: trigger.experience });
                    break;
            }
            if(part === 'experience') continue;
            this.triggerPart(triggerPart, part);
        }
    }

    progressQuest(e: any, quest: IGameMapQuestState, action: string, index: number)
    {
        e.preventDefault();
        let storeState = this.context.store.getState();
        let stateMap    = storeState.world.maps[storeState.world.activeMap];
        let statePlayer = storeState.world.player;
        let quests = stateMap.quests;

        let element = null;
        let newActiveQuest = Object.assign({}, storeState.world.activeQuest);

        let imageUrl = null;
        let imagePrefix = ['../images/quest', quest.name].join('-');
        let imageClassName = 'game-quest-popup-image';
        this.soundOn('sfx-button');
        switch(action)
        {
            case 'accept': {
                storeState.world.activeQuest.accepted = true;
                stateMap.quests[index].quest.accepted = true;
                imageUrl = [imagePrefix, 'accepted.png'].join('-');
                this.questPopup = <div className="game-quest-popup quest-accepted"><img src={imageUrl} className={imageClassName} /><div className="quest-title">{quest.quest.title}</div><div className="quest-text">{quest.quest.text.accepted}</div><div className="quest-buttons quest-buttons-1"><div className="quest-button" onClick={(e) => this.progressQuest(e, quest, 'close', 0)}>Close</div></div></div>;
                this.context.store.dispatch({type: GAME_WORLD_QUEST_ACTIVE_UPDATE, response: storeState.world.activeQuest });
                this.context.store.dispatch({type: GAME_WORLD_MAP_UPDATE, response: stateMap, name: storeState.world.activeMap });
                this.triggerQuest('accepted', index);
                break;
            }

            case 'reject': {
                storeState.world.activeQuest.rejected = true;
                stateMap.quests[index].quest.rejected = true;
                imageUrl = [imagePrefix, 'rejected.png'].join('-');
                this.questPopup = <div className="game-quest-popup quest-rejected"><img src={imageUrl} className={imageClassName} /><div className="quest-title">{quest.quest.title}</div><div className="quest-text">{quest.quest.text.rejected}</div><div className="quest-buttons quest-buttons-1"><div className="quest-button" onClick={(e) => this.progressQuest(e, quest, 'close', 0)}>Close</div></div></div>;
                this.context.store.dispatch({type: GAME_WORLD_QUEST_ACTIVE_UPDATE, response: storeState.world.activeQuest });
                this.context.store.dispatch({type: GAME_WORLD_MAP_UPDATE, response: stateMap, name: storeState.world.activeMap });
                this.triggerQuest('rejected', index);
                break;
            }

            case 'close': {
                this.questPopup = null;
                this.context.store.dispatch({type: GAME_WORLD_QUEST_ACTIVE_UPDATE, response: null });
                this.soundOff('music-quest');
                this.musicOn().then(() => {
                    console.log('Music played');
                }).catch((error: string) => {
                    console.log('Music play error', error);
                });
                if(statePlayer.speed === 0) return;
                this.soundLoop('sfx-player-walk');
                break;
            }
        }
    }

    closePopupDialog(e: any)
    {
        e.preventDefault();
        this.soundOn('sfx-button');
        this.dialogPopup = null;
    }

    createQuestPopup(quest: IGameMapQuestState, index: number): any
    {
        let storeState = this.context.store.getState();
        if(quest === null) return null;
        let element = null;
        let imageUrl = null;
        let imagePrefix = ['../images/quest', quest.name].join('-');
        let imageClassName = 'game-quest-popup-image';
        let experience = (quest.quest.trigger.accepted.experience + quest.quest.trigger.finished.experience).toString();
        let mapItemsTexts = [];
        let mapItems: { [id: string]: Array<string> } = {};
        for(let i = 0, len = quest.quest.trigger.accepted.items.length; i < len; i++)
        {
            let trigger = quest.quest.trigger.accepted.items[i];
            if(trigger.hide) continue;
            if(!(trigger.map in mapItems))
            {
                mapItems[trigger.map] = [];
            }
            if(mapItems[trigger.map].indexOf(trigger.name) >= 0) continue;
            mapItems[trigger.map].push(trigger.name);
        }
        for(let map in mapItems)
        {
            let items = [];
            let length = mapItems[map].length
            for(let i = 0, len = length - 1; i < len; i++)
            {
                items.push(mapItems[map][i]);
            }
            let itemsText = [items.join(', '), mapItems[map][length-1]].join(' and ');
            mapItemsTexts.push('items '+ itemsText + ' on map ' + map);
        }
        let rewardText = (mapItemsTexts.length > 0) ? [mapItemsTexts.join(', '), experience + 'XP'].join(' and ') + '.' : experience + 'XP.';
        if(quest.quest.rejected)
        {
            imageUrl = [imagePrefix, 'rejected.png'].join('-');
            element = <div className="game-quest-popup quest-rejected"><img src={imageUrl} className={imageClassName} /><div className="quest-title">{quest.quest.title}</div><div className="quest-text">{quest.quest.text.rejected}</div><div className="quest-buttons quest-buttons-1"><div className="quest-button" onClick={(e) => this.progressQuest(e, quest, 'close', 0)}>Close</div></div></div>;
        }
        else if(quest.quest.completed)
        {
            imageUrl = [imagePrefix, 'finished.png'].join('-');
            element = <div className="game-quest-popup quest-finished"><img src={imageUrl} className={imageClassName} /><div className="quest-title">{quest.quest.title}</div><div className="quest-text">{quest.quest.text.finished}</div><div className="quest-reward-title">Reward:</div><div className="quest-reward-text">{rewardText}</div><div className="quest-buttons quest-buttons-1"><div className="quest-button" onClick={(e) => this.progressQuest(e, quest, 'close', 0)}>Close</div></div></div>;
        }
        else if(quest.quest.accepted)
        {
            imageUrl = [imagePrefix, 'progress.png'].join('-');
            element = <div className="game-quest-popup quest-progress"><img src={imageUrl} className={imageClassName} /><div className="quest-title">{quest.quest.title}</div><div className="quest-text">{quest.quest.text.progress}</div><div className="quest-reward-title">Reward:</div><div className="quest-reward-text">{rewardText}</div><div className="quest-buttons quest-buttons-1"><div className="quest-button" onClick={(e) => this.progressQuest(e, quest, 'close', 0)}>Close</div></div></div>;
        }
        else if(!quest.quest.accepted)
        {
            imageUrl = [imagePrefix, 'introduction.png'].join('-');
            element = <div className="game-quest-popup quest-introduction"><img src={imageUrl} className={imageClassName} /><div className="quest-title">{quest.quest.title}</div><div className="quest-text">{quest.quest.text.introduction}</div><div className="quest-reward-title">Reward:</div><div className="quest-reward-text">{rewardText}</div><div className="quest-buttons quest-buttons-3"><div className="quest-button" onClick={(e) => this.progressQuest(e, quest, 'accept', index)}>Accept</div><div className="quest-button" onClick={(e) => this.progressQuest(e, quest, 'reject', index)}>Reject</div><div className="quest-button" onClick={(e) => this.progressQuest(e, quest, 'close', 0)}>Close</div></div></div>;
        }
        this.questPopup = element;
   }

    createEnemyPopup(enemy: IGameMapEnemyState, index: number): any
    {
        let storeState = this.context.store.getState();
        if(enemy === null) return null;
        let element = null;
        let imageUrl = null;
        let imagePrefix = ['../images/dialog-enemy', enemy.type].join('-');
        let imageClassName = 'game-quest-popup-image';
        let experience = (enemy.trigger.experience).toString();
        let rewardText = experience + 'XP.';
        imageUrl = [imagePrefix, 'finished.png'].join('-');
        element = <div className="game-quest-popup quest-finished"><img src={imageUrl} className={imageClassName} /><div className="quest-title">{enemy.text.title}</div><div className="quest-text">{enemy.text.finished}</div><div className="quest-reward-title">Reward:</div><div className="quest-reward-text">{rewardText}</div><div className="quest-buttons quest-buttons-1"><div className="quest-button" onClick={(e) => this.closePopupDialog(e)}>Close</div></div></div>;
        this.dialogPopup = element;
   }

    createItemPopup(item: IGameMapItemState, index: number): any
    {
        let storeState = this.context.store.getState();
        if(item === null) return null;
        let element = null;
        let imageUrl = null;
        let imagePrefix = ['../images/dialog-item', item.name].join('-');
        let imageClassName = 'game-quest-popup-image';
        let experience = (item.trigger.experience).toString();
        let rewardText = experience + 'XP.';
        imageUrl = [imagePrefix, 'finished.png'].join('-');
        element = <div className="game-quest-popup quest-finished"><img src={imageUrl} className={imageClassName} /><div className="quest-title">{item.text.title}</div><div className="quest-text">{item.text.finished}</div><div className="quest-reward-title">Reward:</div><div className="quest-reward-text">{rewardText}</div><div className="quest-buttons quest-buttons-1"><div className="quest-button" onClick={(e) => this.closePopupDialog(e)}>Close</div></div></div>;
        this.dialogPopup = element;
   }

    createWellcomePopup(): any
    {
        let storeState = this.context.store.getState();
        let textWellcome = storeState.world.text.wellcome;
        let element = null;
        let imageUrl = null;
        let imagePrefix = ['../images/dialog'].join('-');
        let imageClassName = 'game-quest-popup-image';
        imageUrl = [imagePrefix, 'wellcome.png'].join('-');
        element = <div className="game-quest-popup quest-finished"><img src={imageUrl} className={imageClassName} /><div className="quest-title">{textWellcome.title}</div><div className="quest-text">{textWellcome.text}</div><div className="quest-buttons quest-buttons-1"><div className="quest-button" onClick={(e) => this.closePopupDialog(e)}>Close</div></div></div>;
        this.dialogPopup = element;
   }

    render()
    {
        let style = { opacity: 1 };
        let loaderStyle = { opacity: '0' };
        if(this.detected.exit !== null || this.detected.quest)
        {
            let opacity = (this.detected.exit === null) ? this.detected.timeoutQuest : this.detected.timeoutExit;
            opacity /= 10;
            style = { opacity: opacity };
        }
    	return <div ref="myRef"><div style={style}>{this.detectedElement}</div>{this.questPopup}{this.dialogPopup}</div>;
    }
}