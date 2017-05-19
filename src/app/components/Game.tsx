import * as React from 'react';
import { IStore, IStoreContext, ISoundState, IGameMapState, IGameMapPlatformState, IPlayerState } from '../reducers';
import { Store } from 'redux';
import { Sprites, ISprite, ISpriteBlock } from '../libs/Sprites';
import GameLoader from '../components/GameLoader';
import StatusBar from '../components/StatusBar';
import GameAnimations from '../components/GameAnimations';
import GameRender from '../components/GameRender';
import Sound from '../Sound/Sound';
import { 
    PLAYER_UPDATE, 
    PLAYER_CLEAR,
    PLAYER_ADD_EXPERIENCE,
    PLAYER_ADD_STAR
} from '../actions/playerActions';
import { GAME_MAP_UPDATE } from '../actions/gameMapActions';

declare let imageType:typeof Image; 

declare global {
    interface Document {
        msExitFullscreen: any;
        mozCancelFullScreen: any;
        webkitGetGamepads: any;
    }

    interface Navigator {
        webkitGetGamepads: any;
    }

    interface HTMLElement {
        msRequestFullscreen: any;
        mozRequestFullScreen: any;
    }
}

export interface IGameProps {
    name: string;
    onPlayerDeath?: () => any;
    onPlayerWin?: () => any;
    onPlayerStats?: () => any;
    onMenu?: () => any;
}

export interface IGameState 
{
    loaded?: boolean;
    width?: number;
    height?: number;
    controls?: {
    	up?: boolean;
    	down?: boolean;
    	left?: boolean;
    	right?: boolean;
    };
    player?: IPlayerState;
    map?: IGameMapState;
    sound?: ISoundState;
    loader?: {
        opacity: number
    }
}


function mapStateFromStore(store: IStore, state: IGameState): IGameState {
    let newState = Object.assign({}, state, {sound: store.sound, player: store.player, map: store.map});
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
            sound: null,
        	player: null,
            map: null
        };

        this.handlerKeyUp = this.processKeyUp.bind(this);
        this.handlerKeyDown = this.processKeyDown.bind(this);
        this.handleGamepadConnected = this.handleGamepadConnected.bind(this);
        this.handleGamepadDisconnected = this.handleGamepadDisconnected.bind(this);
        this.processStats = this.processStats.bind(this);
        this.processMenu = this.processMenu.bind(this);

        this.animate = this.animate.bind(this);

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
        this.sprites = new Sprites(storeState.map.tileX, storeState.map.tileY);
        this.setState(mapStateFromStore(this.context.store.getState(), newState));
        storeState.sound.sound.loadList(['music-gameover', 'music-win', 'music-map-cave', 'sfx-enemy-death', 'sfx-item-star-collected', 'sfx-player-walk', 'sfx-player-jump', 'sfx-player-death']).then(() => {
            let music = 'music-map-cave';
            this.state.sound.sound.playBackground(music);
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
        this.mapSize = ((this.state.map.length - 2) * this.state.map.tileX);
        window.addEventListener('keydown', this.handlerKeyDown);
        window.addEventListener('keyup', this.handlerKeyUp);
        window.addEventListener('resize', this.resize);
        window.addEventListener("gamepadconnected", this.handleGamepadConnected);
        window.addEventListener("gamepaddisconnected", this.handleGamepadDisconnected);
        this.timer = setTimeout(this.animate, this.animationTime);
        this.resize();
        let mapState = Object.assign({}, this.state.map);
        // mapState.clouds = this.getClouds(this.state.map.length * this.state.map.tileX, this.state.map.tileY / 2);
        this.context.store.dispatch({type: GAME_MAP_UPDATE, response: mapState });
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
        if(this.state.player.started)
        {
            if(!this.state.player.falling && !this.state.player.death)
            {
                this.animateEnemies();
                this.animatePlayer();
            }
        }
        if((this.counter % 2) === 0) this.checkGamepad();
        this.timer = setTimeout(this.animate, this.animationTime);
    }

    checkGamepad ()
    {
        if(this.gamepad === null) return;
        let y = 0;
        let x = 0;
        let button = false;
        let isControls = false;
        let statePlayer = this.state.player;
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
            if(this.gamepadJumpReleased && statePlayer.jumping === 0) 
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
            this.context.store.dispatch({type: PLAYER_UPDATE, response: statePlayer });
        }

        if((newControls.right && !this.state.controls.right) || (newControls.left && !this.state.controls.left))
        {           
            statePlayer.right = (newControls.right && !this.state.controls.right) ? true : false;
            this.context.store.dispatch({type: PLAYER_UPDATE, response: statePlayer });
        }
        // console.log('button', newControls);
        this.setState({controls: newControls});
    }


    animatePlayer()
    {
        let maxJumpHeight = 305;
    	let playerState = this.state.player;
        let playerAttributes = playerState.character.attributes;
        let state = this.state;
    	let controlsState = state.controls;
        let mapState = state.map;
        let stars = mapState.stars;
        let spikes = mapState.spikes;
    	let speed = playerState.speed;
        let jump = playerState.jumping;
        let bothSide = false;

        if(controlsState.left || controlsState.right)
        {
            let speedMax = (jump > 0) ? playerAttributes.speed / 1.5 : playerAttributes.speed;
            let speedIncerase = (jump > 0) ? playerAttributes.speed * 0.07 : playerAttributes.speed * 0.05;
            let speedChange = (jump > 0) ? playerAttributes.brake * 0.3 : playerAttributes.brake * 0.3;
            if(controlsState.right)
            {
                if(speed >= 0 && speed < speedMax)
                {
                    state.player.speed += speedIncerase;
                }
                else if(speed < 0)
                {
                    state.player.speed += speedChange;
                }
            }
            else
            {
                speedMax *= -1;
                if(speed <= 0 && speed > speedMax)
                {
                    state.player.speed -= speedIncerase;
                }
                else if(speed > 0)
                {
                    state.player.speed -= speedChange;
                }
            }
        }
    	else
    	{
            let speedDecrase = (jump > 0) ? playerAttributes.brake * 0.42 : playerAttributes.brake;
    		if(speed > 0)
    		{
    			state.player.speed = (speed >= speedDecrase) ? speed - speedDecrase : 0;
    		}
    		else if(speed < 0)
    		{
    			state.player.speed = (speed <= -speedDecrase) ? speed + speedDecrase : 0;
    		}
    	}
        let newPlayerX = (playerState.x + playerState.speed);
        let newPlayerY = playerState.y;
        if(newPlayerX <= 0 || newPlayerX >= this.mapSize)
        {
            newPlayerX = playerState.x
            playerState.speed = 0;
        }

        let x = Math.max(0, Math.floor((newPlayerX + (state.map.tileX * 0.5)) / state.map.tileX));
        let floorX    = state.map.floorHeight[x];
        let floorHeight = (floorX === null) ? 0 : (floorX.height * state.map.tileY);
        let playerFloor = playerState.floor;
        let playerFloorHeight = (playerFloor === null) ? 0 : (playerFloor.height * state.map.tileY);


    	if(controlsState.up)
    	{
            let isJumping = playerState.isJumping;
            let jumpValue = 50;
            if(!isJumping) 
            {
                playerState.isJumping = true;
                playerState.jumpFrom = playerFloorHeight;
                jump = playerFloorHeight;
            }
            if(null !== floorX && floorX.bothSide)
            {
                let floorHeight = (floorX.height + 0.75) * state.map.tileY;
                let fromY = playerState.y;
                let toY = playerState.y - jumpValue;
                if(toY < floorHeight && fromY >= floorHeight) 
                {
                    bothSide = true;
                }
            }
            let maxJump = (maxJumpHeight + playerAttributes.jump + playerState.jumpFrom);
            if(bothSide || (jump + jumpValue) > maxJump)
            {
                controlsState.up = false;
            }
            else
            {
                jumpValue *= Math.cos((jump - playerState.jumpFrom) / maxJumpHeight);
                jump += jumpValue;
                playerState.y -= jumpValue;
            }
    	}
        if(jump === 0)
        {
            if(playerFloor !== null && playerFloorHeight > playerState.y)
            {
                jump = (playerFloor.height * state.map.tileY) - playerState.y;
            }
            else if(playerFloor === null && playerFloorHeight > playerState.y)
            {
                jump = (state.map.height * state.map.tileY) - playerState.y;
            }
        }
		if(jump > 0)
		{
			let jumpFactor = 21.7;
            jumpFactor *= (controlsState.up) ? Math.cos((jump - playerState.jumpFrom) / maxJumpHeight) : 1;
            let jumpValue = (jump >= jumpFactor) ? jumpFactor : jump;
			jump -= jumpValue;
            if(state.player.speed > 0)
            {
                state.player.speed = (state.player.speed > 0) ? state.player.speed - 1 : state.player.speed + 1;
            }
            
            playerState.y += jumpValue;
            if(!controlsState.up && null !== floorX)
            {
                let fromY = playerState.y;
                let toY = playerState.y - jumpValue;
                // console.log('na plosinu TEST', fromY);
                // console.log(playerState.y, ((floorX.height) * state.map.tileY));
                let height = ((floorX.height) * state.map.tileY);
                if(height <= fromY && height >= toY)
                {
                    // console.log('na plosinu X', floorX);
                    playerState.isJumping = false;
                    jump = 0;
                    playerState.jumpFrom = 0;
                    playerState.y = ((floorX.height) * state.map.tileY);
                    playerState.floor = playerFloor = floorX;
                }
                else if(toY > height)
                {
                    // console.log('na zem');
                    playerState.floor = null;
                    playerState.jumpFrom = 0;
                    jump = (state.map.height * state.map.tileY) - playerState.y;
                    playerState.isJumping = true;                       
                }
            }
		}
        if(jump === 0 && playerState.x !== newPlayerX && playerFloor !== null && floorX === null)
        {
            jump = (state.map.height - playerFloor.height) * state.map.tileY;
            // console.log('z plosiny? JUMP', jump);
            playerState.floor = null;
            playerState.jumpFrom = 0;
            playerState.isJumping = true;
        }
        playerState.x = newPlayerX;
        if(jump === 0) 
        {
            playerState.isJumping = false;
            playerState.jumpFrom = 0;
        }
        playerState.jumping = jump;

        //Collect star
        let starCollectFactor = state.map.tileY * 0.8;
        if(stars[x] !== null && !stars[x].collected)
        {
            // console.log('star on '+x.toString(), stars[x]);
            let starHeight = ((stars[x].y * state.map.tileY) + state.map.tileY);
            // console.log('CHECK collect star', stars[x]);
            // console.log((playerState.y - starCollectFactor), (playerState.y + starCollectFactor));
            if(starHeight >= (playerState.y - starCollectFactor) && starHeight <= (playerState.y + starCollectFactor))
            {
                this.soundOn('sfx-item-star-collected');
                mapState.stars[x].collected = true;
                mapState.stars[x].frame = 1;
                this.context.store.dispatch({type: PLAYER_ADD_EXPERIENCE, response: stars[x].value });
                this.context.store.dispatch({type: PLAYER_ADD_STAR, response: 1 });
                // console.log('collect star', stars[x]);
            }
        }

        //Spikes
        let spikeCollectFactor = this.state.map.tileY * 0.4;
        if(spikes[x] !== null) 
        {
            // console.log('spike on '+x.toString(), spikes[x]);
            let spikeHeight = ((spikes[x].y * this.state.map.tileY) + this.state.map.tileY);
            if(spikeHeight >= (playerState.y - spikeCollectFactor) && spikeHeight <= (playerState.y + spikeCollectFactor))
            {
                this.soundOn('sfx-player-death');
                this.soundOff('sfx-player-walk');
                playerState.death = true;
                playerState.frame = 1;
                this.context.store.dispatch({type: PLAYER_UPDATE, response: playerState });
                return;
            }
        }


        let exitOpenFactor = this.state.map.tileY * 0.3;
        for(let i = 0, len = mapState.exit.length; i < len; i++)
        {
            if(x !== mapState.exit[i].x)
            {
                continue;
            }
            // console.log('Exit?');
            let exitHeight = ((mapState.exit[i].y * this.state.map.tileY) + this.state.map.tileY);
            //console.log((playerState.y - exitOpenFactor), (playerState.y + exitOpenFactor));
            if(exitHeight >= (playerState.y - exitOpenFactor) && exitHeight <= (playerState.y + exitOpenFactor))
            {
                // console.log('Exit!');
                if(mapState.exit[i].win) this.processWin();
                return;
            }
        }

        if(playerState.x >= (this.state.width / 2) && playerState.x < ((this.state.map.length * this.state.map.tileX) - (this.state.width / 2)))
        {
            mapState.offset = Math.max(0, Math.ceil(playerState.x - (this.state.width / 2)));
            // console.log('mapState.offset', mapState.offset);
        }

        //isFall ??
        if(!this.state.player.isJumping && playerState.floor === null && false === this.state.map.groundFall[x])
        {
            playerState.falling = true;
            playerState.fall    = playerState.y;
        }


        //Handbrake before fix floor definetly :)
        if(playerState.y > (mapState.height * mapState.tileY))
        {
            playerState.y = (mapState.height * mapState.tileY);
            playerState.jumping = 0;
            playerState.jumpFrom = 0;
            controlsState.up = false;
        }
        this.setState({controls: controlsState});
        this.context.store.dispatch({type: GAME_MAP_UPDATE, response: mapState });
        this.context.store.dispatch({type: PLAYER_UPDATE, response: playerState });
    }

    animateEnemies()
    {
        let state = this.state;
        let mapState = state.map;
        let enemies = mapState.enemies;
        let playerState = state.player;
        let enemyCollisionFactor = state.map.tileY * 0.6;
        let enemyCollisionFactorX = state.map.tileX * 0.55;
        let xPlayer = Math.max(0, Math.floor((playerState.x + (state.map.tileX * 0.5)) / state.map.tileX));
        for(let i = 0, len = enemies.length; i < len; i++)
        {
            let enemy = enemies[i];
            if(Math.abs(enemy.x - playerState.x) >= state.width) continue;
            if(enemy.death || enemy.die) continue;

            let x = Math.max(0, Math.floor((enemy.x + (mapState.tileX * 0.5)) / mapState.tileX));
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
            let newEnemyX = (enemy.right) ? (enemy.x + enemy.speed) : (enemy.x - enemy.speed);
            x = Math.max(0, Math.floor((newEnemyX + (mapState.tileX * 0.5)) / mapState.tileX));
            enemy.xGrid = x;
            enemy.x = newEnemyX;

            let enemyNear   = (Math.abs(newEnemyX - playerState.x) >= enemyCollisionFactorX) ? false : true;

            // Enemy collision check
            if(enemyNear)
            {
                let enemyHeight = ((enemy.height * state.map.tileY) + state.map.tileY);
                if(enemyHeight >= (playerState.y - enemyCollisionFactor) && enemyHeight <= (playerState.y + enemyCollisionFactor))
                {
                    if(enemyHeight > playerState.y && !this.state.controls.up)
                    {
                        this.soundOn('sfx-enemy-death');
                        enemy.frame = 1;
                        enemy.die = true;
                        this.context.store.dispatch({type: PLAYER_ADD_EXPERIENCE, response: enemy.experience });
                    }
                    else
                    {
                        this.soundOn('sfx-player-death');
                        this.soundOff('sfx-player-walk');
                        playerState.death = true;
                        playerState.frame = 1;
                        this.context.store.dispatch({type: PLAYER_UPDATE, response: playerState });
                    }
                }
            }
            
            // Enemy following
            if(x !== xPlayer)
            {
                if(enemy.following.enabled && Math.abs(x - xPlayer) <= enemy.following.range && [enemy.from, enemy.to].indexOf(x) === -1)
                {
                    enemy.right = (xPlayer > x) ? true : false;
                }
                continue;
            }

        }
        mapState.enemies = enemies;
        this.context.store.dispatch({type: GAME_MAP_UPDATE, response: mapState });
    }

    processDeath()
    {
        let storeState = this.context.store.getState();
        let mapState = storeState.map;
        let playerState = storeState.player;
        if(playerState.lives <= 0)
        {
            playerState.lives = 0;
            playerState.started = false;
            mapState.offset = 0;
            this.context.store.dispatch({type: PLAYER_UPDATE, response: playerState });
            this.context.store.dispatch({type: GAME_MAP_UPDATE, response: mapState });
            this.isRunning = false;
            this.soundOff('sfx-player-walk');
            this.props.onPlayerDeath();
            return;
        }
        playerState.lives   = (playerState.lives - 1);
        playerState.x       = 50;
        playerState.y       = mapState.height * mapState.tileY;
        playerState.falling = false;
        playerState.fall    = 0;
        playerState.death   = false;
        playerState.started = false;
        playerState.right   = true;
        playerState.jumping = 0;
        playerState.isJumping = false;
        playerState.speed   = 0;
        playerState.frame   = 1;
        mapState.offset = 0;
        this.context.store.dispatch({type: PLAYER_UPDATE, response: playerState });
        this.context.store.dispatch({type: GAME_MAP_UPDATE, response: mapState });
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
        let playerState = storeState.player;
        playerState.started = false;
        //Score update on Win - lives left and collected stars
        playerState.character.experience += (Math.floor(playerState.character.stars / 10) * 10) + (playerState.lives * 100);
        this.context.store.dispatch({type: PLAYER_UPDATE, response: playerState });
        this.isRunning = false;
        this.soundOff('sfx-player-walk');
        this.props.onPlayerWin();
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
            let assignKeys = [32, 37, 39, 9, 113];
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

        if(!this.state.player.started) this.state.player.started = true;
        
        let newControls = Object.assign({}, this.state.controls);
        let playerWalkSound = -1;
        let playerJumpSound = false;
    	switch(e.keyCode)
    	{
    		case 32:
    			newControls.up = (e.type === 'keyup' || this.state.player.jumping > 0) ? false : true;
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
    	}
        if(playerWalkSound !== -1) 
        {
            let toggle = (playerWalkSound === 0) ? this.soundOff('sfx-player-walk') : this.soundLoop('sfx-player-walk');
        }
        if(playerJumpSound) this.soundOn('sfx-player-jump');

    	if((newControls.right && !this.state.controls.right) || (newControls.left && !this.state.controls.left))
    	{
    		let statePlayer = this.state.player;
    		statePlayer.right = (newControls.right && !this.state.controls.right) ? true : false;
            this.context.store.dispatch({type: PLAYER_UPDATE, response: statePlayer });
    	}
    	this.setState({controls: newControls});
    }


    render() {
        let state = this.state;
        let width = (state.loaded) ? state.width : 0;
    	let height = (state.loaded) ? state.height : 0;
        let loader = null;
        let gameAnimations = null;
        let gameRender = null;
        let statusBar = (state.loaded) ? <div><StatusBar /></div> : null;
        if(state.loader.opacity > 0)
        {
            let loaderStyle = { opacity: state.loader.opacity.toString() };
            loader = <div style={loaderStyle}><GameLoader /></div>;
        }
        else
        {
            gameAnimations = <GameAnimations onProcessDeath={() => this.processDeath()} sprites={this.sprites} width={width} height={height} />;
            gameRender = <GameRender sprites={this.sprites} width={width} height={height} />;
        }
        return <div>
                    {statusBar}
                    {loader}
                    {gameAnimations}
                    {gameRender}
    			</div>;
    }
}