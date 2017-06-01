import * as React from 'react';
import { IStore, IStoreContext, ISoundState, IGameMapState, IGameMapPlatformState, IGameMapStarState, IGameMapSpikeState, IPlayerState } from '../reducers';
import { Store } from 'redux';
import { Sprites, ISprite, ISpriteBlock } from '../libs/Sprites';
import GameLoader from '../components/GameLoader';
import StatusBar from '../components/StatusBar';
import EditorMapBar from '../components/EditorMapBar';
import GameAnimations from '../components/GameAnimations';
import GameRender from '../components/GameRender';
import GameLoop from '../components/GameLoop';
import Sound from '../Sound/Sound';
import { 
    PLAYER_UPDATE, 
    PLAYER_CLEAR,
    PLAYER_ADD_EXPERIENCE,
    PLAYER_ADD_STAR
} from '../actions/playerActions';
import { 
    GAME_MAP_UPDATE,
    GAME_MAP_EXPORT,
    GAME_MAP_IMPORT
} from '../actions/gameMapActions';

import { 
    GAME_WORLD_MAP_UPDATE,
    GAME_WORLD_MAP_SWITCH,
    GAME_WORLD_MAP_START_SET,
    GAME_WORLD_PLAYER_UPDATE,
    GAME_WORLD_EXPORT,
    GAME_WORLD_IMPORT
} from '../actions/gameWorldActions';


declare let imageType:typeof Image; 

// declare global {
//     interface Document {
//         msExitFullscreen: any;
//         mozCancelFullScreen: any;
//         webkitGetGamepads: any;
//     }

//     interface Navigator {
//         webkitGetGamepads: any;
//     }

//     interface HTMLElement {
//         msRequestFullscreen: any;
//         mozRequestFullScreen: any;
//     }
// }

export interface IEditorMapProps {
    name: string;
    onPlayerDeath?: () => any;
    onPlayerWin?: () => any;
    onPlayerStats?: () => any;
    onMenu?: () => any;
}

export interface IEditorMapControlsState {
    up?: boolean;
    down?: boolean;
    left?: boolean;
    right?: boolean;
}


export interface IEditorMapState 
{
    loaded?: boolean;
    width?: number;
    height?: number;
    controls?: IEditorMapControlsState;
    player?: IPlayerState;
    map?: IGameMapState;
    sound?: ISoundState;
    loader?: {
        opacity: number
    };
    selected?: {
        name: string;
        value: string;
        data: any;
        x: number;
    };
    popup?: {
        visible: boolean;
        type: string;
        x: number;
        y: number;
        parameters: any;
    }
}


function mapStateFromStore(store: IStore, state: IEditorMapState): IEditorMapState {
    let newState = Object.assign({}, state);
    return newState;
}

export default class EditorMap extends React.Component<IEditorMapProps, IEditorMapState> {

    private cached: { [id: string]: HTMLImageElement } = {};

    static contextTypes: React.ValidationMap<any> = 
    {
        store: React.PropTypes.object
    }
    
    context: IStoreContext;
    unsubscribe: Function;
    private animationTime: number = 30;
    private timer: any;
    private isRunning: boolean = false;
    private handlerKeyUp: any;
    private handlerKeyDown: any;
    private sprites: Sprites;
    private counter: number = 0;

    private mapSize: number = 0;

    private gamepad: any = null;
    private gamepadJumpReleased: boolean = true;

    // private sound: Sound;

    constructor(props: IEditorMapProps) {
        super(props);
        this.state = { 
            loaded: false, 
            width: 0, 
            height: 0,
            controls: {
                up: false,
                down: false,
                left: false,
                right: false
            },
            loader: {
                opacity: 1
            },
            selected: {
                name: '',
                value: '',
                x: -1,
                data: null
            },
            popup: {
                visible: false,
                type: null,
                x: 0,
                y: 0,
                parameters: null
            }
        };

        this.handlerKeyUp = this.processKeyUp.bind(this);
        this.handlerKeyDown = this.processKeyDown.bind(this);
        this.handleGamepadConnected = this.handleGamepadConnected.bind(this);
        this.handleGamepadDisconnected = this.handleGamepadDisconnected.bind(this);
        this.processStats = this.processStats.bind(this);
        this.processMenu = this.processMenu.bind(this);

        this.animate = this.animate.bind(this);
        this.toggleFullScreen = this.toggleFullScreen.bind(this);

        this.run = this.run.bind(this);
        this.resize = this.resize.bind(this);
        this.checkFloorPlace = this.checkFloorPlace.bind(this);

        this.procedExitPlace = this.procedExitPlace.bind(this);
        this.procedItemPlace = this.procedItemPlace.bind(this);
        this.procedMapSwitch = this.procedMapSwitch.bind(this);
        
    }

    soundOn(id: string)
    {
        let storeState = this.context.store.getState();
        storeState.sound.sound.play(id, false, false);
    }

    soundLoop(id: string)
    {
        let storeState = this.context.store.getState();
        storeState.sound.sound.play(id, true, false);
    }

    soundOff(id: string)
    {
        let storeState = this.context.store.getState();
        storeState.sound.sound.stop(id, false);
    }

    componentDidMount() 
    {
        let storeState = this.context.store.getState();
        this.unsubscribe = this.context.store.subscribe(this.setStateFromStore.bind(this));
        let width = window.innerWidth;
        let height = window.innerHeight;
        let newState = Object.assign({}, this.state);
        newState.loaded = true;
        newState.width = width;
        newState.height = height;
        let stateMap = storeState.world.maps[storeState.world.activeMap];
        this.sprites = new Sprites(stateMap.tileX, stateMap.tileY);
        this.setState(mapStateFromStore(this.context.store.getState(), newState));
        storeState.sound.sound.loadList(['music-gameover', 'music-win', 'music-map-cave', 'sfx-enemy-death', 'sfx-star-collected', 'sfx-player-walk', 'sfx-player-jump', 'sfx-player-death']).then(() => {
            let music = 'music-map-cave';
            // this.state.sound.sound.playBackground(music);
            this.run();
        });
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

    run ()
    {
        let storeState = this.context.store.getState();
        let stateMap = storeState.world.maps[storeState.world.activeMap];
        this.mapSize = ((stateMap.length - 2) * stateMap.tileX);
        window.addEventListener('keydown', this.handlerKeyDown);
        window.addEventListener('keyup', this.handlerKeyUp);
        window.addEventListener('resize', this.resize);
        window.addEventListener("gamepadconnected", this.handleGamepadConnected);
        window.addEventListener("gamepaddisconnected", this.handleGamepadDisconnected);
// this.timer = setTimeout(this.animate, this.animationTime);
        this.resize();
        let mapState = Object.assign({}, stateMap);
        // mapState.clouds = this.getClouds(stateMap.length * stateMap.tileX, stateMap.tileY / 2);
        this.context.store.dispatch({type: GAME_WORLD_MAP_UPDATE, response: mapState, name: storeState.world.activeMap });
        this.isRunning = true;
    }


    getClouds(length: number, height: number): Array<any>
    {
        let fromX = Math.ceil(Math.random() * 90) * -1;
        let clouds = [];
        while(fromX < length)
        {
            let cloudHeight = height + (height * (Math.random() * 2));
            let cloudSpeed  = (Math.random() * 0.25) + 1.1;
            let cloud  = { x: fromX, y: cloudHeight, type: Math.ceil(Math.random() * 5), speed: cloudSpeed };
            clouds.push(cloud);
            fromX += (Math.ceil(Math.random() * 100) + 100);
        }
        return clouds;
    }

    componentWillUnmount() 
    {
        clearTimeout(this.timer);
        window.removeEventListener('keydown', this.handlerKeyDown);
        window.removeEventListener('keyup', this.handlerKeyUp);
        window.removeEventListener('resize', this.resize);
        window.removeEventListener("gamepadconnected", this.handleGamepadConnected);
        window.removeEventListener("gamepaddisconnected", this.handleGamepadDisconnected);
        if (this.unsubscribe) 
        {
            this.unsubscribe();
        }
    }
    
    setStateFromStore() 
    {
        let storeState = this.context.store.getState();
        this.setState(mapStateFromStore(this.context.store.getState(), this.state));
    }

    resize()
    {
        let width = window.innerWidth;
        let height = window.innerHeight;
        this.setState({width: width, height: height});
    }

    animate()
    {
        if(!this.isRunning) return;
        this.counter++;
        if(this.counter === 1000) this.counter = 0;
        if(this.state.loader.opacity > 0)
        {
            let newState = Object.assign({}, this.state);
            newState.loader.opacity -= (newState.loader.opacity <= 0.4) ? 0.035 : 0.05;
            if(newState.loader.opacity <= 0.05) newState.loader.opacity = 0;
            this.setState(newState);
        }
        if((this.counter % 2) === 0) this.checkGamepad();
        this.timer = setTimeout(this.animate, this.animationTime);
    }

    checkGamepad ()
    {
        if(this.gamepad === null) return;
        let storeState = this.context.store.getState();
        let statePlayer = storeState.world.player;
        let y = 0;
        let x = 0;
        let button = false;
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
                button = true;
                this.gamepadJumpReleased = false;
            }
        }
        else
        {
            this.gamepadJumpReleased = true;
        }
        let newControls = Object.assign({}, this.state.controls);
        if(button) newControls.up = true;
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

    processDeath()
    {

    }

    processWin()
    {
    }

    processMenu()
    {
        this.isRunning = false;
        this.props.onMenu();
    }

    processStats()
    {
        this.isRunning = false;
        this.soundOff('sfx-player-walk');
        this.props.onPlayerStats();
    }

    processKeyDown(e: KeyboardEvent)
    {
        // if(e.repeat) 
        // {
        //     let assignKeys = [9, 113];
        //     if(assignKeys.indexOf(e.keyCode) > -1) e.preventDefault();
        //     return;
        // }
        this.toggleKey(e);
    }

    processKeyUp(e: KeyboardEvent)
    {
        this.toggleKey(e);
    }

    checkFloorPlace(newFloor: any, ignoreIndex: number): boolean
    {
        let storeState = this.context.store.getState();
        let stateMap = storeState.world.maps[storeState.world.activeMap];
        for(let i = 0, len = stateMap.floor.length; i < len; i++)
        {
            if(i === ignoreIndex) continue;
            let floor = stateMap.floor[i];
            if((floor.from < newFloor.from && floor.to > newFloor.from) || (floor.from < newFloor.to && floor.to > newFloor.to))
            {
                return false;
            }
        }
        return true;
    }

    toggleKey(e: KeyboardEvent)
    {
        // console.log('toggleKey', e);
        /*
        9 - Tab
        32 - Space
        113 - F2
        37 - ArrowLeft
        39 - ArrowRight
        38 - ArrowUP
        40 - ArrowDown
        */
        let assignKeys = [32, 37, 39, 9, 113, 38, 40];
        let assignKeysNames = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '-', '=', '_', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')'];
        if(assignKeys.indexOf(e.keyCode) === -1 && assignKeysNames.indexOf(e.key) === -1) return;
        e.preventDefault();
        if(e.type === "keydown" && [9, 113].indexOf(e.keyCode) > -1)
        {
            if(e.keyCode === 9) this.processStats();
            if(e.keyCode === 113) this.processMenu();
            return;
        }
        if(e.type === "keyup") 
        {
            this.detectObjects();
            return;
        }

        let heightVariants = [9, 7, 6, 5];
        let groundVariants = [25, 32, 42];
        let floorVariants = [3, 5, 7, 9, 12];
        let floorGapVariants = [2, 3, 4, 5];
        let starValues = [10, 25, 50, 100];
        let enemyValues = [100, 150];
        let storeState = this.context.store.getState();
        let statePlayer = Object.assign({}, storeState.world.player);
        if(!statePlayer.started) statePlayer.started = true;
// console.log('key', e.keyCode);
        let stateMap = storeState.world.maps[storeState.world.activeMap];
        let isPos = false;
        if(!e.shiftKey)
        {
            switch(e.keyCode)
            {
                case 32:
                    //Space
                    if(!e.ctrlKey) this.context.store.dispatch({type: GAME_WORLD_IMPORT });
                    if(e.ctrlKey) this.context.store.dispatch({type: GAME_WORLD_EXPORT });
                    break;

                case 38:
                    isPos = (statePlayer.y > stateMap.tileY);
                    if(isPos) statePlayer.y -= stateMap.tileY / 2;
                    break;

                case 40:
                    isPos = (statePlayer.y < (stateMap.tileY * 9));
                    if(isPos) statePlayer.y += stateMap.tileY / 2;
                    break;

                case 37:
                    isPos = (statePlayer.x > 0);
                    if(isPos) statePlayer.x -= stateMap.tileX;
                    
                    break;

                case 39:
                    isPos = (statePlayer.x <= (stateMap.length * stateMap.tileX));
                    if(isPos) statePlayer.x += stateMap.tileX;
                    break;
            }
        }

        if(isPos)
        {
// console.log('Position change');
            if(statePlayer.x >= (this.state.width / 2) && statePlayer.x < ((stateMap.length * stateMap.tileX) - (this.state.width / 2)))
            {
                stateMap.offset = Math.max(0, Math.ceil(statePlayer.x - (this.state.width / 2)));
            }
            this.context.store.dispatch({type: GAME_WORLD_PLAYER_UPDATE, response: statePlayer });

            this.detectObjects();
        }

        let isSelected = (this.state.selected.name !== '');
        let isShift = (e.shiftKey === true);
        if(!isPos)
        {
            switch(e.key)
            {
                case '0': // remove star / spike / enemy
                    if(isSelected)
                    {
                        console.log('0 - remove', this.state.selected);
                        let allowedRemove = ['star', 'spike', 'enemy', 'floor', 'exit', 'item'];
                        let x = this.state.selected.x;
                        if(allowedRemove.indexOf(this.state.selected.name) > -1)
                        {
                            switch(this.state.selected.name)
                            {
                                case 'star':
                                    stateMap.stars[x] = null;
                                    break;

                                case 'spike':
                                    stateMap.spikes[x] = null;
                                    break;

                                case 'enemy':
                                    let enemies = [];
                                    for(let i = 0, len = stateMap.enemies.length; i < len; i++)
                                    {
                                        if(this.state.selected.data.index === i) 
                                        {
                                            console.log('break', this.state.selected.data.index);
                                            continue;
                                        }
                                        enemies.push(stateMap.enemies[i]);
                                    }
                                    stateMap.enemies = enemies;
                                    break;

                                case 'floor':
                                    let newFloor = [];
                                    for(let i = 0, len = stateMap.floor.length; i < len; i++)
                                    {
                                        console.log('break 0', this.state.selected.data.index);
                                        if(this.state.selected.data.index === i) 
                                        {
                                            let floorItem = stateMap.floor[this.state.selected.data.index];
                                            console.log('break', this.state.selected.data.index);
                                            for(let j = floorItem.from, lenFloor = floorItem.to; j <= lenFloor; j += stateMap.tileX)
                                            {
                                                let k = Math.ceil(j / stateMap.tileX);
                                            }
                                            continue;
                                        }
                                        newFloor.push(stateMap.floor[i]);
                                    }
                                    stateMap.floor = newFloor;
                                    break;

                                case 'exit':
                                    let exit = [];
                                    for(let i = 0, len = stateMap.exit.length; i < len; i++)
                                    {
                                        if(this.state.selected.data.index === i) 
                                        {
                                            console.log('break', this.state.selected.data.index);
                                            continue;
                                        }
                                        exit.push(stateMap.exit[i]);
                                    }
                                    stateMap.exit = exit;
                                    break;

                                case 'item':
                                    let items = [];
                                    for(let i = 0, len = stateMap.items.length; i < len; i++)
                                    {
                                        if(this.state.selected.data.index === i) 
                                        {
                                            console.log('break', this.state.selected.data.index);
                                            continue;
                                        }
                                        items.push(stateMap.items[i]);
                                    }
                                    stateMap.items = items;
                                    break;
                            }
                        }
                    }
                    break;

                case '1': // star
                    if(!isSelected)
                    {
                        let x = this.state.selected.x;
                        let star: IGameMapStarState = {
                            x: x,
                            y: (statePlayer.y / stateMap.tileY),
                            frame: 1,
                            value: starValues[0],
                            collected: false
                        }
                        stateMap.stars[x] = star;
                    }
                    break;

                case '2': // spike
                    if(!isSelected)
                    {
                        let x = this.state.selected.x;
                        let spike: IGameMapSpikeState = {
                            x: x,
                            y: (statePlayer.y / stateMap.tileY)
                        }
                        stateMap.spikes[x] = spike;
                    }
                    break;

                case '3': // enemy
                case '#':
                    if(!isSelected)
                    {
                        let x = this.state.selected.x;
                        let isFollowing = (e.shiftKey);
                        let followRange = Math.ceil(Math.random() * 2) + 3;
                        let speed = (e.ctrlKey === true) ? 5 : 3; 
                        let xLast = (e.altKey === true) ? 5 : 3; 
                        let xp = 200 + (isFollowing ? 50 : 0) + (speed > 3 ? 100 : 0);
                        let enemy = {
                            from: x,
                            to: (xLast + x),
                            xGrid: x,
                            x: x * stateMap.tileX,
                            right: true,
                            frame: 1,
                            die: false,
                            death: false,
                            height: statePlayer.y,
                            speed: speed,
                            experience: xp,
                            respawn: {
                                time: 0,
                                timer: 10 * xp
                            },
                            following: {
                                enabled: isFollowing,
                                range: followRange
                            }
                        }
                        stateMap.enemies.push(enemy);
                    }
                    break;

                case '4': // Floor
                case '$':
                    let x = this.state.selected.x;
                    let length = (e.shiftKey) ? floorVariants[floorVariants.length - 1] : floorVariants[0];
                    let newFloor = {from: x * stateMap.tileX, to: (x + length) * stateMap.tileX, height: statePlayer.y, bothSide: e.ctrlKey};
                    if(!this.checkFloorPlace(newFloor, -1)) break;
                    stateMap.floor.push(newFloor);
                    break;

                case '5': // Exit
                case '%':
                    if(!isSelected)
                    {
                        let newPopup = Object.assign({}, this.state.popup);
                        if(!newPopup.visible || newPopup.type !== 'exit')
                        {
                            newPopup = {
                                visible: true,
                                type: 'exit',
                                x: this.state.selected.x * stateMap.tileX,
                                y: statePlayer.y,
                                parameters: { blocked: (e.shiftKey) }
                            };
                        }
                        else 
                        {
                            newPopup.visible = false;
                        }
                        this.setState({popup: newPopup});
                    }
                    break;

                case '6': // Item
                case '^':
                    if(!isSelected)
                    {
                        let newPopup = Object.assign({}, this.state.popup);
                        if(!newPopup.visible || newPopup.type !== 'item')
                        {
                            newPopup = {
                                visible: true,
                                type: 'item',
                                x: this.state.selected.x * stateMap.tileX,
                                y: statePlayer.y,
                                parameters: {}
                            };
                        } 
                        else 
                        {
                            newPopup.visible = false;
                        }
                        this.setState({popup: newPopup});
                    }
                    break;

                case '7': // Map switch
                case '&':
                    if(!isSelected)
                    {
                        let newPopup = Object.assign({}, this.state.popup);
                        if(!newPopup.visible || newPopup.type !== 'map-switch')
                        {
                            newPopup = {
                                visible: true,
                                type: 'map-switch',
                                x: this.state.selected.x * stateMap.tileX,
                                y: statePlayer.y,
                                parameters: {}
                            };
                        } 
                        else 
                        {
                            newPopup.visible = false;
                        }
                        this.setState({popup: newPopup});
                    }
                    break;

                case '+':
                case '-':
                case '=':
                case '_':
                    let isAdd = (e.key === '+' || e.key === '=');
                    if(isSelected)
                    {
                        console.log('+ - add', this.state.selected);
                        let allowedModify = ['star', 'enemy', 'floor'];
                        let x = this.state.selected.x;
                        if(allowedModify.indexOf(this.state.selected.name) > -1)
                        {
                            switch(this.state.selected.name)
                            {
                                case 'star':
                                    let star = stateMap.stars[x];
                                    let valueIndex = (starValues.indexOf(star.value) + 1);
                                    if(isAdd && valueIndex < starValues.length)
                                    {
                                        stateMap.stars[x].value = starValues[valueIndex];
                                    }
                                    else if(!isAdd && valueIndex > 1)
                                    {
                                        stateMap.stars[x].value = starValues[valueIndex - 2];
                                    }
                                    break;

                                case 'enemy':
                                    let enemy = stateMap.enemies[this.state.selected.data.index];
                                    if(!isShift)
                                    {
                                        if(isAdd)
                                        {
                                            stateMap.enemies[this.state.selected.data.index].to += 1;
                                            if(e.shiftKey === true) 
                                            {
                                            }
                                        }
                                        else if(!isAdd && (enemy.from < (enemy.to - 1)))
                                        {
                                            stateMap.enemies[this.state.selected.data.index].to -= 1;
                                            if(e.shiftKey === true) 
                                            {
                                            }
                                        }
                                    }
                                    break;

                                case 'floor':
                                    let newFloor = Object.assign({}, {from: stateMap.floor[this.state.selected.data.index].from, to: stateMap.floor[this.state.selected.data.index].to});
                                    let length = Math.ceil((newFloor.to - newFloor.from) / stateMap.tileX);
                                    let currentLengthIndex = floorVariants.indexOf(length);
                                    console.log('Index length', currentLengthIndex);
                                    if(currentLengthIndex === -1) break;
                                    if(isAdd && floorVariants[floorVariants.length - 1] === length)
                                    {
                                        //Max length
                                        console.log('Max length', length);
                                        break;
                                    }
                                    else if(!isAdd && floorVariants[0] === length)
                                    {
                                        //Min length
                                        console.log('Min length', length);
                                        break;
                                    }
                                    currentLengthIndex += (isAdd) ? 1 : -1;

                                    let newLength = floorVariants[currentLengthIndex] * stateMap.tileX;
                                    newFloor.to = newFloor.from + newLength;
                                    if(!this.checkFloorPlace(newFloor, this.state.selected.data.index)) break;
                                    console.log('isAllowed', true);
                                    stateMap.floor[this.state.selected.data.index].to = newFloor.to;
                                    break;
                            }
                        }
                    }
                    break;

            }
        }
        this.context.store.dispatch({type: GAME_WORLD_MAP_UPDATE, name: storeState.world.activeMap, response: stateMap });
        this.detectObjects();
        //editorMapBar
    }

    detectObjects()
    {
        let storeState = this.context.store.getState();
        let stateMap = storeState.world.maps[storeState.world.activeMap];
        let statePlayer = Object.assign({}, storeState.world.player);
        let newStateSelected = Object.assign({}, this.state.selected);
        let stars = stateMap.stars;
        let spikes = stateMap.spikes;
        let enemies = stateMap.enemies;
        let items = stateMap.items;
        let x = Math.max(0, Math.floor((statePlayer.x + (stateMap.tileX * 0.5)) / stateMap.tileX));
        newStateSelected.name = '';
        newStateSelected.value = '';
        newStateSelected.data = null;
        newStateSelected.x = x;
        if(stars[x] !== null)
        {
            let starHeight = ((stars[x].y * stateMap.tileY));
            if(starHeight === statePlayer.y)
            {
                newStateSelected.name = 'star';
                newStateSelected.value = JSON.stringify(stars[x]);
                newStateSelected.data = stars[x];
                console.log('collect star', stars[x]);
            }
        }

        if(spikes[x] !== null) 
        {
            let spikeHeight = ((spikes[x].y * stateMap.tileY));
            if(spikeHeight === statePlayer.y)
            {
                newStateSelected.name = 'spike';
                newStateSelected.value = JSON.stringify(spikes[x]);
                newStateSelected.data = spikes[x];
                console.log('spike', spikes[x]);
            }
        }

        for(let i = 0, len = stateMap.exit.length; i < len; i++)
        {
            if(statePlayer.x !== stateMap.exit[i].x || stateMap.exit[i].y !== statePlayer.y)
            {
                continue;
            }
            newStateSelected.name = 'exit';
            newStateSelected.value = JSON.stringify(stateMap.exit[i]);
            newStateSelected.data = stateMap.exit[i];
            newStateSelected.data.index = i;
            console.log('exit', stateMap.exit[i]);
        }

        for(let i = 0, len = enemies.length; i < len; i++)
        {
            let enemy = enemies[i];
            if(Math.abs(enemy.x - statePlayer.x) >= this.state.width) continue;

            let enemyNear   = (enemy.x !== statePlayer.x) ? false : true;
            // Enemy collision check
            if(enemyNear)
            {
                let enemyHeight = ((enemy.height));
                if(enemyHeight === statePlayer.y)
                {
                    newStateSelected.name = 'enemy';
                    newStateSelected.value = JSON.stringify(enemy);
                    newStateSelected.data = enemy;
                    newStateSelected.data.index = i;
                    console.log('enemy', enemy);
                }
            }
        }

        for(let i = 0, len = items.length; i < len; i++)
        {
            let item = items[i];
            if(Math.abs(item.x - statePlayer.x) >= this.state.width) continue;

            let itemNear   = (item.x !== statePlayer.x) ? false : true;
            // Enemy collision check
            if(itemNear && item.y === statePlayer.y)
            {
                newStateSelected.name = 'item';
                newStateSelected.value = JSON.stringify(item);
                newStateSelected.data = item;
                newStateSelected.data.index = i;
                console.log('item', item);
            }
        }

        for(let i = 0, len = stateMap.floor.length; i < len; i++)
        {
            let floorItem = stateMap.floor[i];
            for(let j = floorItem.from, length = floorItem.to; j < length; j += stateMap.tileX)
            {
                if(j !== statePlayer.x) continue;
                if(floorItem.height === statePlayer.y)
                {
                    newStateSelected.name = 'floor';
                    newStateSelected.value = JSON.stringify(floorItem);
                    newStateSelected.data = floorItem;
                    newStateSelected.data.index = i;
                    console.log('floor', floorItem);
                    break;
                }
            }
        }

        this.setState({selected: newStateSelected});
    }

    toggleFullScreen(e: any) 
    {
        if (!document.fullscreenElement) 
        {
            let el = document.documentElement;
            if (el.requestFullscreen) 
            {
                el.requestFullscreen();
            } 
            else if (el.webkitRequestFullscreen) 
            {
                el.webkitRequestFullscreen();
            } 
            else if (el.mozRequestFullScreen) 
            {
                el.mozRequestFullScreen();
            } 
            else if (el.msRequestFullscreen) 
            {
                el.msRequestFullscreen();
            }
        } 
        else 
        {
            let el = document;
            if (el.webkitCancelFullScreen) 
            {
                el.webkitCancelFullScreen();
            } 
            else if (el.mozCancelFullScreen) 
            {
                el.mozCancelFullScreen();
            } 
            else if (el.msExitFullscreen) 
            {
                el.msExitFullscreen();
            }
        }
    }

    procedExitPlace(e: any, mapName: string)
    {
        e.preventDefault();
        let storeState = this.context.store.getState();
        let stateMap = storeState.world.maps[storeState.world.activeMap];
        console.log('map', mapName);
        let statePopup = this.state.popup;
        let isWin = false;
        let map = mapName;
        if(mapName === 'win')
        {
            isWin = true;
            map = '';
        }
        let blocker = (statePopup.parameters.blocked) ? { name: 'blocker-cave', frame: 1, destroyed: false } : null;
        let newExit = { x: statePopup.x, y: statePopup.y, map: map, win: isWin, type: { name: 'exit-cave', frame: 1 }, blocker };
        stateMap.exit.push(newExit);
        this.context.store.dispatch({type: GAME_WORLD_MAP_UPDATE, name: storeState.world.activeMap, response: stateMap, editor: true });

        let newPopup = Object.assign({}, this.state.popup);
        newPopup.visible = false;
        this.setState({popup: newPopup});
    }

    procedItemPlace(e: any, itemName: string)
    {
        e.preventDefault();
        let storeState = this.context.store.getState();
        let statePopup = this.state.popup;
        let stateMap = storeState.world.maps[storeState.world.activeMap];
        let newItem = Object.assign({x: statePopup.x, y: statePopup.y, frame: 1, collected: false, visible: true}, storeState.world.items[itemName]);
        stateMap.items.push(newItem);
        this.context.store.dispatch({type: GAME_WORLD_MAP_UPDATE, name: storeState.world.activeMap, response: stateMap });
        console.log('item', newItem);

        let newPopup = Object.assign({}, this.state.popup);
        newPopup.visible = false;
        this.setState({popup: newPopup});
    }

    procedMapSwitch(e: any, mapName: string)
    {
        this.context.store.dispatch({type: GAME_WORLD_MAP_SWITCH, response: mapName });
        let newPopup = Object.assign({}, this.state.popup);
        newPopup.visible = false;
        this.setState({popup: newPopup});
    }


    render() {
        let storeState = this.context.store.getState();
        let stateMap = storeState.world.maps[storeState.world.activeMap];
        let state = this.state;
        let width = (state.loaded) ? state.width : 0;
        let height = (state.loaded) ? state.height : 0;
        let loader = null;
        let gameAnimations = null;
        let gameRender = null;
        let gameLoop = null;
        let editorMapBar = (state.loaded) ? <div><EditorMapBar name={this.state.selected.name} value={this.state.selected.value} /></div> : null;
        let loaderStyle = { opacity: '0' };
        let drawPosition = true;
        let popup = null;
        if(state.popup.visible)
        {
            let popupStyle = { position: 'absolute', marginLeft: '44vw', width: '12vw', marginTop: '45vh', minHeight: '10vh', backgroundColor: '#603abb', border: '1px solid black', padding: '1vh', borderRadius: '2vh' };
            let popupItemStyle = { display: 'block', float: 'left', width: '100%', backgroundColor: '#afb138', borderTop: '1px solid black', padding: '0.5vh' };
            let rows: Array<any> = [];
            switch(state.popup.type)
            {
                case 'exit':
                    let blockedName = (state.popup.parameters.blocked) ? 'blocked' : 'non-blocked';
                    let popupBlockedStyle = { display: 'block', float: 'left', width: '100%', backgroundColor: '#9c8383', borderTop: '1px solid black', padding: '0.5vh' };
                    for(let i in storeState.world.maps)
                    {
                        if(i === storeState.world.activeMap) continue;
                        let name = i;
                        let key = ['exit-map', name];
                        let row = <div key={key} style={popupItemStyle} onClick={(e) => this.procedExitPlace(e, name)}>{name}</div>;
                        rows.push(row);
                    }
                    let key = 'exit-map-win';
                    let name = 'win';
                    let row = <div key={key} style={popupBlockedStyle} onClick={(e) => this.procedExitPlace(e, name)}>{name}</div>;
                    rows.push(row);
                    popup = <div style={popupStyle}>EXIT<div>{rows}<div style={popupItemStyle}>{blockedName}</div></div></div>;
                    break;

                case 'item':
                    for(let i in storeState.world.items)
                    {
                        let name = i;
                        let key = ['item-map', name];
                        let row = <div key={key} style={popupItemStyle} onClick={(e) => this.procedItemPlace(e, name)}>{name}</div>;
                        rows.push(row);
                    }
                    popup = <div style={popupStyle}>ITEM<div>{rows}</div></div>;
                    break;

                case 'map-switch':
                    for(let i in storeState.world.maps)
                    {
                        if(i === storeState.world.activeMap) continue;
                        let name = i;
                        let key = ['switch-map', name];
                        let row = <div key={key} style={popupItemStyle} onClick={(e) => this.procedMapSwitch(e, name)}>{name}</div>;
                        rows.push(row);
                    }
                    popup = <div style={popupStyle}>MAP SWITCH<div>{rows}</div></div>;
                    break;
            }
        }
        loader = <div style={loaderStyle} onClick={(e) => this.toggleFullScreen(e)}><GameLoader /></div>;
        gameAnimations = <GameAnimations onProcessDeath={() => this.processDeath()} sprites={this.sprites} width={width} height={height} />;
        gameRender = <GameRender sprites={this.sprites} width={width} height={height} drawPosition={drawPosition} />;
        // gameLoop = <GameLoop width={width} height={height} onProcessWin={() => this.processWin()} />;
        return <div>
                    {editorMapBar}
                    {loader}
                    {popup}
                    {gameAnimations}
                    {gameLoop}
                    {gameRender}
                </div>;
    }
}