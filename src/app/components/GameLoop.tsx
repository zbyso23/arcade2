import * as React from 'react';
import { IStore, IStoreContext, ISoundState, IGameMapState, IGameMapPlatformState, IPlayerState } from '../reducers';
import { Store } from 'redux';
import { Sprites, ISprite, ISpriteBlock } from '../libs/Sprites';
import { 
    PLAYER_UPDATE, 
    PLAYER_CLEAR,
    PLAYER_ADD_EXPERIENCE,
    PLAYER_ADD_STAR
} from '../actions/playerActions';

import { 
    GAME_WORLD_MAP_UPDATE,
    GAME_WORLD_MAP_SWITCH,
    GAME_WORLD_MAP_START_SET,
    GAME_WORLD_PLAYER_UPDATE,
    GAME_WORLD_PLAYER_ADD_EXPERIENCE,
    GAME_WORLD_PLAYER_ADD_STAR,
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

    private clock: THREE.Clock = null;

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
                dirChanged: 0
            }
        };

        this.loop = this.loop.bind(this);
        this.run = this.run.bind(this);

        this.handlerKeyUp = this.processKeyUp.bind(this);
        this.handlerKeyDown = this.processKeyDown.bind(this);
        this.handleGamepadConnected = this.handleGamepadConnected.bind(this);
        this.handleGamepadDisconnected = this.handleGamepadDisconnected.bind(this);
        this.isMounted2 = this.isMounted2.bind(this);
        
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
    }

    isMounted2()
    {
        return ('myRef' in this.refs);
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
        console.log('toggleKey', e.keyCode);
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
        let assignKeys = [32, 37, 39, 38, 40, 69];
        if(assignKeys.indexOf(e.keyCode) === -1) return;
        e.preventDefault();

        if(!statePlayer.started) 
        {
            statePlayer.started = true;
            this.context.store.dispatch({type: GAME_WORLD_PLAYER_UPDATE, response: statePlayer });
        }
        let newControls = Object.assign({}, this.state.controls);
        let playerWalkSound = -1;
        let playerJumpSound = false;
        switch(e.keyCode)
        {
            case 32:
                //|| (statePlayer.jump !== statePlayer.y)
                newControls.up = (e.type === 'keyup' || statePlayer.y !== statePlayer.surface) ? false : true;
                playerJumpSound = newControls.up;
                break;

            case 37:
                newControls.left = (e.type === 'keyup') ? false : true;
                playerWalkSound = (newControls.left) ? 1 : 0;
                break;

            case 39:
                newControls.right = (e.type === 'keyup') ? false : true;
                playerWalkSound = (newControls.right) ? 1 : 0;
                break;

            case 69:
                newControls.use = (e.type === 'keyup') ? false : true;
                break;
        }
        if(playerWalkSound !== -1) 
        {
            let toggle = (playerWalkSound === 0) ? this.soundOff('sfx-player-walk') : this.soundLoop('sfx-player-walk');
        }
        if(playerJumpSound) this.soundOn('sfx-player-jump');

        if((newControls.right && !this.state.controls.right) || (newControls.left && !this.state.controls.left))
        {
            statePlayer.right = (newControls.right && !this.state.controls.right) ? true : false;
            statePlayer.speed *= 0.6;
            newControls.dirChanged = statePlayer.speed * 0.45;
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
        let newControls = Object.assign({}, this.state.controls);
        if(buttonA) newControls.up = true;
        newControls.use = (buttonB);
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


    loop()
    {
        let storeState = this.context.store.getState();
        this.counter++;
        if(this.counter === 1000) this.counter = 0;
        let newTime = new Date();
        let delta = Math.abs(((newTime.getSeconds() * 1000) + newTime.getMilliseconds()) - ((this.lastTime.getSeconds() * 1000) + this.lastTime.getMilliseconds()));
        delta /= 1000000;
        
        let statePlayer = storeState.world.player;
        if(statePlayer.started)
        {
            if(!statePlayer.death) this.loopPlayer(delta);
            this.loopEnvironment(delta);
            this.loopEnemies(delta);
        }
        this.lastTime = newTime;
        if((this.counter % 2) === 0) this.checkGamepad();
        this.timer = setTimeout(this.loop, this.animationTime);

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

    loopPlayer(delta: number)
    {
        let storeState = this.context.store.getState();
        let stateMap    = storeState.world.maps[storeState.world.activeMap];
        let statePlayer = storeState.world.player;
        let statePlayerAttributes = statePlayer.character.attributes;
        let controlsState = Object.assign({}, this.state.controls);

        let isJump = Math.abs(statePlayer.jump - statePlayer.y) > 0;
        let isControlsMove = (controlsState.left || controlsState.right);
        let isControlsJump = (controlsState.up);
        let isCollisionX   = false;
        let isCollisionY   = false;
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
                if(platform.bothSide && (statePlayer.y - stateMap.tileY) >= platform.height)
                {
                    sideCollision = true;
                }
            }
            statePlayer.floor = platformDetected;
            statePlayer.surface = surface;
        }

        if(isControlsJump)
        {
            if(!isJump)
            {
                statePlayer.jump = statePlayer.y - (300 + statePlayerAttributes.jump);
            }
            let isAboveCollision = ((isJump && Math.abs(statePlayer.y - above) < stateMap.tileY / 4));
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
                    // console.log('landing', statePlayer.y, statePlayer.surface);
                }
            }
        }
        // Shift map - need refactor
        if(statePlayer.x >= (this.props.width / 2) && statePlayer.x < ((stateMap.length * stateMap.tileX) - (this.props.width / 2)))
        {
            stateMap.offset = Math.max(0, Math.ceil(statePlayer.x - (this.props.width / 2)));
            // console.log('stateMap.offset', stateMap.offset);
        }
        // if(platformDetected !== null) console.log('platformDetected! '+(controlsState.up?'UP':''), platformDetected);
        this.setState({controls: controlsState});
        this.context.store.dispatch({type: GAME_WORLD_MAP_UPDATE, response: stateMap, name: storeState.world.activeMap });
        this.context.store.dispatch({type: GAME_WORLD_PLAYER_UPDATE, response: statePlayer });
    }

    loopEnvironment(delta: number)
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
                return;
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
                this.soundOn('sfx-player-death');
                this.soundOff('sfx-player-walk');
                statePlayer.death = true;
                statePlayer.frame = 1;
                this.context.store.dispatch({type: GAME_WORLD_PLAYER_UPDATE, response: statePlayer });
                return;
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
            return;
        }


        // Check Exit
        let exitOpenFactor = stateMap.tileY * 0.3;
        for(let i = 0, len = stateMap.exit.length; i < len; i++)
        {
            if(typeof stateMap.exit[i] === "undefined") { console.log('stateMap UNDEF', i, stateMap.exit, stateMap); return; }
            if(!stateMap.exit[i].visible || Math.abs(stateMap.exit[i].x - statePlayer.x) > exitOpenFactor)
            {
                continue;
            }
            let exitHeight = ((stateMap.exit[i].y));
            let isExit = (Math.abs(exitHeight - statePlayer.y) <= exitOpenFactor);
            if(!isExit) continue;
            let exit = stateMap.exit[i];
            if(controlsState.use && exit.blocker === null)
            {
                if(exit.win)
                {
                    this.props.onProcessWin();
                }
                else
                {
                    // statePlayer.started = false;
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

                    // this.props.onProcessMapChange(exit.map);
                }
            }
            else if(exit.blocker !== null && !exit.blocker.destroyed && controlsState.use && this.havePlayerDestructItem())
            {
                stateMap.exit[i].blocker.destroyed = true;
                stateMap.exit[i].blocker.frame = 1;
                this.context.store.dispatch({type: GAME_WORLD_MAP_UPDATE, response: stateMap, name: storeState.world.activeMap });
            }
            // return;
        }

        //isFall ??
        let mapGroundHeight = (stateMap.tileY * (stateMap.height - 1));
        if(statePlayer.y === statePlayer.surface && statePlayer.y === mapGroundHeight && false === stateMap.groundFall[x])
        {
            statePlayer.falling = true;
            statePlayer.fall    = Math.floor(statePlayer.y);
        }
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
            let newEnemyX = (enemy.right) ? (enemy.x + speed) : (enemy.x - speed);
            x = Math.max(0, Math.floor((newEnemyX + (stateMap.tileX * 0.5)) / stateMap.tileX));
            enemy.xGrid = x;
            enemy.x = newEnemyX;

            let enemyNear   = (Math.abs(newEnemyX - statePlayer.x) >= enemyCollisionFactorX) ? false : true;

            // Enemy collision check
            let enemyHeightDiff = statePlayer.y - enemy.height;
            if(!skipDetection && enemyNear && !statePlayer.death && Math.abs(enemyHeightDiff) < enemyCollisionFactor)
            {
                // let enemyHeight = (enemy.height + state.map.tileY);
                // let enemyHeightDiff = (enemy.height + enemyHeight - statePlayer.y);
                // if(enemyHeight >= (statePlayer.y - enemyCollisionFactor) && enemyHeight <= (statePlayer.y + enemyCollisionFactor))
                // console.log('enemyHeightDiff', enemyHeightDiff);
                // if(Math.abs(enemyHeightDiff) < enemyCollisionFactor)
                // {
                    
                    // console.log('enemyHeightDiff', enemyCollisionFactor);
                    if(enemyHeightDiff >= 0 && !this.state.controls.up)
                    {
                        this.soundOn('sfx-player-death');
                        this.soundOff('sfx-player-walk');
                        statePlayer.death = true;
                        statePlayer.frame = 1;
                        skipDetection = true;
                        if(this.isMounted2()) this.context.store.dispatch({type: GAME_WORLD_PLAYER_UPDATE, response: statePlayer });
                    }
                    else
                    {
                        this.soundOn('sfx-enemy-death');
                        enemy.frame = 1;
                        enemy.die = true;
                        skipDetection = true;
                        if(this.isMounted2()) this.context.store.dispatch({type: GAME_WORLD_PLAYER_ADD_EXPERIENCE, response: enemy.experience });
                    }
                // }
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
        if(this.isMounted2()) this.context.store.dispatch({type: GAME_WORLD_MAP_UPDATE, response: stateMap, name: storeState.world.activeMap });
    }

    render()
    {
    	return <div ref="myRef"></div>;
    }
}