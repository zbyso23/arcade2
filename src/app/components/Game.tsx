import * as React from 'react';
import { IStore, IStoreContext, ISoundState, IGameMapState, IGameMapPlatformState, IPlayerState } from '../reducers';
import { Store } from 'redux';
import { Sprites, ISprite, ISpriteBlock } from '../libs/Sprites';
import { Environment, IEnvironment, IEnvironmentBlock } from '../libs/Environment';
import GameLoader from '../components/GameLoader';
import StatusBar from '../components/StatusBar';
import GameAnimations from '../components/GameAnimations';
import GameRender from '../components/GameRender';
import GameLoop from '../components/GameLoop';
import Sound from '../Sound/Sound';
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

import { 
    PLAYER_UPDATE, 
    PLAYER_CLEAR,
    PLAYER_ADD_EXPERIENCE,
    PLAYER_ADD_STAR
} from '../actions/playerActions';
import { GAME_MAP_UPDATE } from '../actions/gameMapActions';

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

export interface IGameProps {
    name: string;
    onPlayerDeath?: () => any;
    onPlayerWin?: () => any;
    onPlayerStats?: () => any;
    onPlayerMapChange?: (map: string) => any;
    onMenu?: () => any;
}

export interface IGameControlsState {
    up?: boolean;
    down?: boolean;
    left?: boolean;
    right?: boolean;
}


export interface IGameState 
{
    loaded?: boolean;
    width?: number;
    height?: number;
    controls?: IGameControlsState;
    sound?: ISoundState;
    loader?: {
        opacity: number
    }
}


function mapStateFromStore(store: IStore, state: IGameState): IGameState {
    if(!store.world.loaded) return state;
    let newState = Object.assign({}, state, {sound: store.sound});
    return newState;
}

export default class Game extends React.Component<IGameProps, IGameState> {

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
    private environment: Environment;
    private counter: number = 0;

    private mapSize: number = 0;

    private gamepad: any = null;
    private gamepadJumpReleased: boolean = true;

    // private sound: Sound;

    constructor(props: IGameProps) {
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
            sound: null
        };

        this.handlerKeyUp = this.processKeyUp.bind(this);
        this.handlerKeyDown = this.processKeyDown.bind(this);
        this.handleGamepadConnected = this.handleGamepadConnected.bind(this);
        this.handleGamepadDisconnected = this.handleGamepadDisconnected.bind(this);
        this.processStats = this.processStats.bind(this);
        this.processMenu = this.processMenu.bind(this);
        this.processMapChange = this.processMapChange.bind(this);

        this.animate = this.animate.bind(this);
        this.toggleFullScreen = this.toggleFullScreen.bind(this);

        this.run = this.run.bind(this);
        this.resize = this.resize.bind(this);
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
        this.environment = new Environment(stateMap.tileX, stateMap.tileY);
        this.setState(mapStateFromStore(this.context.store.getState(), newState));
        storeState.sound.sound.loadList(['music-gameover', 'music-win', 'music-map-hills', 'music-map-cave', 'music-quest', 'sfx-enemy-death', 'sfx-star-collected', 'sfx-exit-cave-blocked', 'sfx-player-walk', 'sfx-player-jump', 'sfx-player-death', 'sfx-exit-detected', 'sfx-quest-detected', 'sfx-button']).then(() => {
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
        
        // mapState.clouds = this.getClouds(this.state.map.length * this.state.map.tileX, this.state.map.tileY / 2);
        this.context.store.dispatch({type: GAME_WORLD_MAP_UPDATE, response: stateMap, name: storeState.world.activeMap });
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
        // clearTimeout(this.timer);
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
        // this.timer = setTimeout(this.animate, this.animationTime);
    }

    processDeath()
    {
        let storeState = this.context.store.getState();
        let statePlayer = storeState.world.player;
        let stateMap = storeState.world.maps[storeState.world.activeMap];
        if(statePlayer.lives <= 0)
        {
            statePlayer.lives = 0;
            statePlayer.started = false;
            stateMap.offset = 0;
            this.context.store.dispatch({type: GAME_WORLD_PLAYER_UPDATE, response: statePlayer });
            this.context.store.dispatch({type: GAME_WORLD_MAP_UPDATE, response: stateMap, name: storeState.world.activeMap });
            this.isRunning = false;
            this.soundOff('sfx-player-walk');
            this.props.onPlayerDeath();
            return;
        }
        statePlayer.lives   = (statePlayer.lives - 1);
        statePlayer.x       = 50;
        statePlayer.y       = (stateMap.height - 1) * stateMap.tileY;
        statePlayer.jump    = (stateMap.height - 1) * stateMap.tileY;
        statePlayer.surface = (stateMap.height - 1) * stateMap.tileY;
        statePlayer.falling = false;
        statePlayer.fall    = 0;
        statePlayer.death   = false;
        statePlayer.started = false;
        statePlayer.right   = true;
        statePlayer.speed   = 0;
        statePlayer.frame   = 1;
        stateMap.offset = 0;
        this.context.store.dispatch({type: GAME_WORLD_PLAYER_UPDATE, response: statePlayer });
        this.context.store.dispatch({type: GAME_WORLD_MAP_UPDATE, response: stateMap, name: storeState.world.activeMap });
        this.setState({controls: {
            up: false,
            down: false,
            left: false,
            right: false
        }});
    }

    processWin()
    {
        let storeState = this.context.store.getState();
        let statePlayer = storeState.world.player;
        statePlayer.started = false;
        //Score update on Win - lives left and collected stars
        statePlayer.character.experience += (Math.floor(statePlayer.character.stars / 10) * 10) + (statePlayer.lives * 100);
        this.context.store.dispatch({type: GAME_WORLD_PLAYER_UPDATE, response: statePlayer });
        this.isRunning = false;
        this.soundOff('sfx-player-walk');
        this.props.onPlayerWin();
    }

    processMapChange(map: string)
    {
        this.props.onPlayerMapChange(map);
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
    	if(e.repeat) 
        {
            let assignKeys = [9, 113];
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
        // console.log('toggleKey', e);
        /*
        9 - Tab
        32 - Space
        113 - F2
        37 - ArrowLeft
        39 - ArrowRight
        */
        let assignKeys = [32, 37, 39, 9, 113];
        if(assignKeys.indexOf(e.keyCode) === -1) return;
        e.preventDefault();
        if(e.type === "keydown" && [9, 113].indexOf(e.keyCode) > -1)
        {
            if(e.keyCode === 9) this.processStats();
            if(e.keyCode === 113) this.processMenu();
            return;
        }
    }

    toggleFullScreen(e: any) 
    {
        if (!document.fullscreenElement) 
        {
            let el = document.documentElement;
            if (el.requestFullscreen) { el.requestFullscreen(); } else if (el.webkitRequestFullscreen) { el.webkitRequestFullscreen(); } else if (el.mozRequestFullScreen) { el.mozRequestFullScreen(); }  else if (el.msRequestFullscreen)  { el.msRequestFullscreen(); }
        } 
        else 
        {
            let el = document;
            if (el.webkitCancelFullScreen) { el.webkitCancelFullScreen(); } else if (el.mozCancelFullScreen) { el.mozCancelFullScreen(); }  else if (el.msExitFullscreen) { el.msExitFullscreen(); }
        }
    }

    render() {
        let state = this.state;
        let width = (state.loaded) ? state.width : 0;
    	let height = (state.loaded) ? state.height : 0;
        let loader = null;
        let gameAnimations = null;
        let gameRender = null;
        let gameLoop = null;
        let statusBar = (state.loaded) ? <div><StatusBar /></div> : null;
        let loaderStyle = { opacity: '0' };
        let drawPosition = false;
// drawPosition = true;
        loader = <div style={loaderStyle} onClick={(e) => this.toggleFullScreen(e)}><GameLoader /></div>;
        gameAnimations = <GameAnimations onProcessDeath={() => this.processDeath()} sprites={this.sprites} width={width} height={height} />;
        gameRender = <GameRender sprites={this.sprites} environment={this.environment} width={width} height={height} drawPosition={drawPosition} />;
        gameLoop = <GameLoop width={width} height={height} onProcessWin={() => this.processWin()} onProcessMapChange={(map: string) => this.processMapChange(map)} />;
        return <div ref="myRef">
                    <div className="game-screen" onClick={(e) => this.toggleFullScreen(e)}></div>
                    {statusBar}
                    {loader}
                    {gameAnimations}
                    {gameLoop}
                    {gameRender}
    			</div>;
    }
}