import * as React from 'react';
import { IStore, IStoreContext, IGameMapState, IGameMapPlatformState, IPlayerState } from '../reducers';
import { Store } from 'redux';
import { Sprites, ISprite, ISpriteBlock } from '../libs/Sprites';
import GameLoader from '../components/GameLoader';
import StatusBar from '../components/StatusBar';
import { 
    PLAYER_UPDATE, 
    PLAYER_CLEAR,
    PLAYER_ADD_EXPERIENCE,
    PLAYER_ADD_STAR
} from '../actions/playerActions';
import { GAME_MAP_UPDATE } from '../actions/gameMapActions';

declare var imageType:typeof Image; 

declare global {
    interface Document {
        msExitFullscreen: any;
        mozCancelFullScreen: any;
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
    loader?: {
        imagesLeft: number,
        opacity: number,
    }
}


function mapStateFromStore(store: IStore, state: IGameState): IGameState {
    let newState = Object.assign({}, state, {player: store.player, map: store.map});
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
    private clouds: any = [];
	private ctx: CanvasRenderingContext2D;
    private canvasFB: HTMLCanvasElement;
    private ctxFB: CanvasRenderingContext2D;
    private canvasBackground: HTMLCanvasElement;
    private ctxBackground: CanvasRenderingContext2D;
    private canvasSprites: HTMLCanvasElement;
    private ctxSprites: CanvasRenderingContext2D;
    private requestAnimation: number = 0;
	private animationTime: number = 30;
	private timer: any;
    private isRunning: boolean = false;
    private mapImage: HTMLImageElement;
    private spritesImage: HTMLImageElement;
    private mapLoaded: boolean = false;
    private spritesLoaded: boolean = false;
    private handlerKeyUp: any;
    private handlerKeyDown: any;
    private sprites: Sprites;
    private counter: number = 0;

    private mapSize: number = 0;

    private gamepad: any = null;
    private gamepadJumpReleased: boolean = true;

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
                imagesLeft: 0,
                opacity: 1
            },
        	player: null,
            map: null
        };

        this.processLoad = this.processLoad.bind(this);
        this.gameRender = this.gameRender.bind(this);
        this.redraw = this.redraw.bind(this);
        this.handlerKeyUp = this.processKeyUp.bind(this);
        this.handlerKeyDown = this.processKeyDown.bind(this);
        this.handleGamepadConnected = this.handleGamepadConnected.bind(this);
        this.toggleFullScreen = this.toggleFullScreen.bind(this);
        this.processStats = this.processStats.bind(this);
        this.processMenu = this.processMenu.bind(this);

        this.animate = this.animate.bind(this);

        this.run = this.run.bind(this);
        this.resize = this.resize.bind(this);
        this.loaderImage = this.loaderImage.bind(this);
    }

    loaderImagePrepare()
    {
        let newState = Object.assign({}, this.state);
        newState.loader.imagesLeft = 2;
        this.setState(newState);

        let i = new Image();
        i.onload = this.loaderImage;
        //i.src = 'img/map-background2.jpg';
        i.src = 'images/map-cave1.png';
        this.mapImage = i;

        let i2 = new Image();
        i2.onload = this.loaderImage;
        i2.src = 'images/sprites.png';
        this.spritesImage = i2;
    }

    loaderImage()
    {
        let newState = Object.assign({}, this.state);
        newState.loader.imagesLeft -= 1;
        if(newState.loader.imagesLeft === 0)
        {
            newState.loaded = true;
            this.run();
        }
        this.setState(newState);
    }

    componentDidMount() 
    {
        let storeState = this.context.store.getState();
        this.unsubscribe = this.context.store.subscribe(this.setStateFromStore.bind(this));
    	let width = window.innerWidth;
    	let height = window.innerHeight;
        let newState = Object.assign({}, this.state);
        //newState.loaded = true;
        this.loaderImagePrepare();
        newState.width = width;
        newState.height = height;
        this.sprites = new Sprites(storeState.map.tileX, storeState.map.tileY);
        //this.clouds = this.getClouds(storeState.map.length * storeState.map.tileX, storeState.map.tileY / 2);
        this.clouds = this.getClouds(width, storeState.map.tileY / 2);
        this.setState(mapStateFromStore(this.context.store.getState(), newState));
    }

    handleGamepadConnected(e: any)
    {
        console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.", e.gamepad.index, e.gamepad.id, e.gamepad.buttons.length, e.gamepad.axes.length);
        this.gamepad = e.gamepad;
    }

    run ()
    {
        this.mapSize = ((this.state.map.length - 2) * this.state.map.tileX);
        window.addEventListener('keydown', this.handlerKeyDown);
        window.addEventListener('keyup', this.handlerKeyUp);
        window.addEventListener('resize', this.resize);
        window.addEventListener("gamepadconnected", this.handleGamepadConnected);
        this.timer = setTimeout(this.animate, this.animationTime);
        this.requestAnimation = requestAnimationFrame(this.gameRender);
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
            let cloud  = [fromX, cloudHeight, Math.ceil(Math.random() * 5), cloudSpeed];
            clouds.push(cloud);
            fromX += (Math.ceil(Math.random() * 100) + 100);
        }
        return clouds;
    }

    componentWillUnmount() 
    {
        if (this.requestAnimation !== 0)
        {
            cancelAnimationFrame(this.requestAnimation);
        }
        clearTimeout(this.timer);
        
        
        window.removeEventListener('keydown', this.handlerKeyDown);
        window.removeEventListener('keyup', this.handlerKeyUp);
        window.removeEventListener('resize', this.resize);
        window.removeEventListener("gamepadconnected", this.handleGamepadConnected);
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
        this.mapLoaded = false;
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
            if(this.state.player.falling)
            {
                this.animateFalling();
            }
            else if(this.state.player.death)
            {
                this.animateDeath();
            }
            else
            {
                this.animateEnemies();
                this.animatePlayer();
            }
        }
        this.animateEnvironment();
        if((this.counter % 2) === 0) this.checkGamepad();
        this.timer = setTimeout(this.animate, this.animationTime);
    }

    checkGamepad ()
    {
        if(this.gamepad === null) return;
        var y = 0;
        var x = 0;
        var button = false;
        let isControls = false;
        let statePlayer = this.state.player;
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

        if((this.gamepad.buttons[0].value > 0 || this.gamepad.buttons[0].pressed == true))
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

    animateFalling()
    {
        let playerState = this.state.player;
        if(playerState.fall >= this.state.height)
        {
            this.processDeath();
            return;
        }
        let fall = 0;
        fall += (playerState.fall === 0) ? 1.5 : (playerState.fall / 12);
        playerState.fall += fall;
        playerState.y    += fall;
        this.context.store.dispatch({type: PLAYER_UPDATE, response: playerState });
    }


    animateDeath()
    {
        let playerState = this.state.player;

        if(playerState.frame === this.sprites.getFrames('ninja-explode'))
        {
            this.processDeath();
            return;
        }
        playerState.frame += 1;
        this.context.store.dispatch({type: PLAYER_UPDATE, response: playerState });
    }


    animatePlayer()
    {
        let maxJumpHeight = 305;
    	let playerState = this.state.player;
        let playerAttributes = playerState.character.attributes;
    	let controlsState = this.state.controls;
        let mapState = this.state.map;
        let stars = mapState.stars;
        let spikes = mapState.spikes;
    	let speed = playerState.speed;
        let jump = playerState.jumping;
        let bothSide = false;

        if(controlsState.left || controlsState.right)
        {
            let speedMax = playerAttributes.speed;
            let speedIncerase = (jump > 0) ? playerAttributes.speed * 0.032 : playerAttributes.speed * 0.05;
            let speedChange = (jump > 0) ? playerAttributes.brake * 0.3 : playerAttributes.brake * 0.3;
            if(controlsState.right)
            {
                if(speed >= 0 && speed < speedMax)
                {
                    this.state.player.speed += speedIncerase;
                }
                else if(speed < 0)
                {
                    this.state.player.speed += speedChange;
                }
            }
            else
            {
                speedMax *= -1;
                if(speed <= 0 && speed > speedMax)
                {
                    this.state.player.speed -= speedIncerase;
                }
                else if(speed > 0)
                {
                    this.state.player.speed -= speedChange;
                }
            }
        }
    	else
    	{
            let speedDecrase = (jump > 0) ? playerAttributes.brake * 0.42 : playerAttributes.brake;
    		if(speed > 0)
    		{
    			this.state.player.speed = (speed >= speedDecrase) ? speed - speedDecrase : 0;
    		}
    		else if(speed < 0)
    		{
    			this.state.player.speed = (speed <= -speedDecrase) ? speed + speedDecrase : 0;
    		}
    	}
        let newPlayerX = (playerState.x + playerState.speed);
        let newPlayerY = playerState.y;
        if(newPlayerX <= 0 || newPlayerX >= this.mapSize)
        {
            newPlayerX = playerState.x
            playerState.speed = 0;
        }

        let x = Math.max(0, Math.floor((newPlayerX + (this.state.map.tileX * 0.5)) / this.state.map.tileX));
        let floorX    = this.state.map.floorHeight[x];
        let floorHeight = (floorX === null) ? 0 : (floorX.height * this.state.map.tileY);
        let playerFloor = playerState.floor;
        let playerFloorHeight = (playerFloor === null) ? 0 : (playerFloor.height * this.state.map.tileY);


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
                let floorHeight = (floorX.height + 0.75) * this.state.map.tileY;
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
                jump = (playerFloor.height * this.state.map.tileY) - playerState.y;
            }
            else if(playerFloor === null && playerFloorHeight > playerState.y)
            {
                jump = (this.state.map.height * this.state.map.tileY) - playerState.y;
            }
        }
		if(jump > 0)
		{
			let jumpFactor = 21.7;
            jumpFactor *= (controlsState.up) ? Math.cos((jump - playerState.jumpFrom) / maxJumpHeight) : 1;
            let jumpValue = (jump >= jumpFactor) ? jumpFactor : jump;
			jump -= jumpValue;
            if(this.state.player.speed > 0)
            {
                this.state.player.speed = (this.state.player.speed > 0) ? this.state.player.speed - 1 : this.state.player.speed + 1;
            }
            
            playerState.y += jumpValue;
            if(!controlsState.up && null !== floorX)
            {
                let fromY = playerState.y;
                let toY = playerState.y - jumpValue;
                // console.log('na plosinu TEST', fromY);
                // console.log(playerState.y, ((floorX.height) * this.state.map.tileY));
                let height = ((floorX.height) * this.state.map.tileY);
                if(height <= fromY && height >= toY)
                {
                    // console.log('na plosinu X', floorX);
                    playerState.isJumping = false;
                    jump = 0;
                    playerState.jumpFrom = 0;
                    playerState.y = ((floorX.height) * this.state.map.tileY);
                    playerState.floor = playerFloor = floorX;
                }
                else if(toY > height)
                {
                    // console.log('na zem');
                    playerState.floor = null;
                    playerState.jumpFrom = 0;
                    jump = (this.state.map.height * this.state.map.tileY) - playerState.y;
                    playerState.isJumping = true;                       
                }
            }
		}
        if(jump === 0 && playerState.x !== newPlayerX && playerFloor !== null && floorX === null)
        {
            jump = (this.state.map.height - playerFloor.height) * this.state.map.tileY;
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
        let starCollectFactor = this.state.map.tileY * 0.8;
        if(stars[x] !== null && !stars[x].collected)
        {
            // console.log('star on '+x.toString(), stars[x]);
            let starHeight = ((stars[x].y * this.state.map.tileY) + this.state.map.tileY);
            // console.log('CHECK collect star', stars[x]);
            // console.log((playerState.y - starCollectFactor), (playerState.y + starCollectFactor));
            if(starHeight >= (playerState.y - starCollectFactor) && starHeight <= (playerState.y + starCollectFactor))
            {
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
            mapState.offset = Math.ceil(playerState.x - (this.state.width / 2));
            // console.log('mapState.offset', mapState.offset);
        }

        // Anim Frames
        if(this.state.player.speed > 0 || this.state.player.speed < 0 || this.state.player.jumping > 0)
        {
            // console.log('anim frames!', this.state.player.jump);
            let maxFrame = (this.state.player.jump > 0) ? this.sprites.getFrames('ninja-jump') : this.sprites.getFrames('ninja-left');
            let minFrame = (this.state.player.jump > 0) ? 1 : 10;
            playerState.frame = (playerState.frame >= maxFrame) ? minFrame : playerState.frame + 1;
        }
        else
        {
            playerState.frame = (playerState.frame === 1 || playerState.frame >= 10) ? 1 : playerState.frame + 1;

            // let maxFrame = this.sprites.getFrames('ninja-left');
            // let minFrame = 10;
            // if((this.counter % 8) === 0) playerState.frame = (playerState.frame >= maxFrame) ? minFrame : playerState.frame + 1;
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
        let mapState = this.state.map;
        let enemies = mapState.enemies;
        let playerState = this.state.player;
        let enemyCollisionFactor = this.state.map.tileY * 0.6;
        let enemyCollisionFactorX = this.state.map.tileX * 0.55;
        let xPlayer = Math.max(0, Math.floor((playerState.x + (this.state.map.tileX * 0.5)) / this.state.map.tileX));
        for(let i = 0, len = enemies.length; i < len; i++)
        {
            let enemy = enemies[i];
            if(Math.abs(enemy.x - playerState.x) >= this.state.width) continue;
            if(enemy.death) 
            {
                enemy.respawn.time++;
                if(enemy.respawn.time >= enemy.respawn.timer && Math.abs(playerState.x - enemy.x) >= (this.state.map.tileX * 5))
                {
                    enemy.respawn.time = 0;
                    enemy.death = false;
                    enemy.frame = 1;
                }
                continue;
            }

            let maxFrame = (enemy.die) ? this.sprites.getFrames('enemy-explode') : this.sprites.getFrames('enemy-left');
            let minFrame = (enemy.die) ? this.sprites.getFrames('enemy-explode') : 5;
            if(enemy.die)
            {
                if(enemy.frame === maxFrame) 
                {
                    enemy.die   = false;
                    enemy.death = true;
                    enemy.respawn.time = 0;
                }
                else
                {
                    enemy.frame++;
                }
                continue;
            }

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
            if((this.counter % 2) === 0)
            {
                enemy.frame = (enemy.frame >= maxFrame) ? minFrame : enemy.frame + 1;
            }
            let enemyNear   = (Math.abs(newEnemyX - playerState.x) >= enemyCollisionFactorX) ? false : true;

            // Enemy collision check
            if(enemyNear)
            {
                let enemyHeight = ((enemy.height * this.state.map.tileY) + this.state.map.tileY);
                if(enemyHeight >= (playerState.y - enemyCollisionFactor) && enemyHeight <= (playerState.y + enemyCollisionFactor))
                {
                    if(enemyHeight > playerState.y && !this.state.controls.up)
                    {
                        enemy.frame = 1;
                        enemy.die = true;
                        this.context.store.dispatch({type: PLAYER_ADD_EXPERIENCE, response: enemy.experience });
                    }
                    else
                    {
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

    animateEnvironment()
    {
        let mapState = this.state.map;
        let stars = mapState.stars;
        let gridWidthLimit = Math.ceil(this.state.width / mapState.tileX);
        let playerGridX = Math.ceil(this.state.player.x / mapState.tileX);
        // Anim Clouds
        let newClouds = [];
        let lastCloud = this.clouds.length - 1;
        for(let i in this.clouds)
        {
            this.clouds[i][0] -= (this.clouds[i][3]);
            if(parseInt(i) === 0 && this.clouds[i][0] < -150) continue;
            newClouds.push(this.clouds[i]);
        }
        if(this.clouds[lastCloud][0] < (this.state.width * 0.95))
        {
            let height = this.state.map.tileY / 2
            let cloudHeight = height + (height * (Math.random() * 2));
            let cloudSpeed  = (Math.random() * 0.25) + 1.1;
            let fromX = (this.clouds[lastCloud][0] + (Math.ceil(Math.random() * 100) + 100)); 
            let cloud  = [fromX, cloudHeight, Math.ceil(Math.random() * 5), cloudSpeed];
            newClouds.push(cloud);
        }
        this.clouds = newClouds;

        // Anim stars
        for(let i in stars)
        {
            if(stars[i] === null) continue;
            let star = stars[i];
            let index = parseInt(i);
            if(!star.collected && Math.abs(index - playerGridX) > gridWidthLimit) continue;
            if(!star.collected)
            {
                star.frame = (star.frame === this.sprites.getFrames('item-star')) ? 1 : star.frame + 1;
            }
            else if(star.collected && (star.frame === this.sprites.getFrames('item-star-explode')))
            {
                mapState.stars[index] = null;
            }
            else
            {
                star.frame++;
            }
        }
        mapState.stars = Object.assign({}, stars);
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
        this.props.onPlayerStats();
    }

    processLoad(e)
    {
    	if(!e || this.ctx) return;
    	this.ctx = e.getContext('2d');
    }

    processBackgroundLoad(e)
    {
        if(!e || this.canvasBackground) return;
        this.canvasBackground = e;
        this.ctxBackground = e.getContext('2d');
    }

    processSpritesLoad(e)
    {
        if(!e || this.canvasSprites) return;
        this.canvasSprites = e;
        this.ctxSprites = e.getContext('2d');
    }

    processFramebufferLoad(e)
    {
        if(!e || this.canvasFB) return;
        this.canvasFB = e;
        this.ctxFB = e.getContext('2d');
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

        if(!this.state.player.started) this.state.player.started = true;;
    	let newControls = { up: this.state.controls.up, down: this.state.controls.down, left: this.state.controls.left, right: this.state.controls.right };
    	switch(e.keyCode)
    	{
    		case 32:
    			newControls.up = (e.type === 'keyup' || this.state.player.jumping > 0) ? false : true;
    			break;

    		case 37:
    			newControls.left = (e.type === 'keyup') ? false : true;
    			break;

    		case 39:
    			newControls.right = (e.type === 'keyup') ? false : true;
    			break;
    	}
    	if((newControls.right && !this.state.controls.right) || (newControls.left && !this.state.controls.left))
    	{
    		let statePlayer = this.state.player;
    		statePlayer.right = (newControls.right && !this.state.controls.right) ? true : false;
            this.context.store.dispatch({type: PLAYER_UPDATE, response: statePlayer });
    	}
    	this.setState({controls: newControls});
    }

    gameRender()
    {
    	this.redraw();
    	this.requestAnimation = requestAnimationFrame(this.gameRender);
    }

    redraw()
    {
        let width     = this.state.width;
        let height    = this.state.height;
        let player    = this.state.player;
        let mapState  = this.state.map;
        let mapHeight = this.state.map.height * this.state.map.tileY;
        let drawFrom = Math.min(0, (player.x - width));
        let drawTo   = (player.x + width);
        let drawWidth = drawTo - drawFrom;
        let ctx       = this.ctx;//FB;
    	ctx.clearRect(drawFrom, 0, drawWidth, this.state.height);
        if(this.mapLoaded)
        {
            //ctx.drawImage(this.canvasBackground, (mapState.offset * -.13), 0);
            ctx.drawImage(this.canvasBackground, (mapState.offset * -.065), 0);
        }

        if(this.ctxBackground && !this.mapLoaded)
        {
            this.ctxBackground.drawImage(this.mapImage, 0, 0);
            this.mapLoaded = true;
        }

        if(this.ctxSprites && !this.spritesLoaded)
        {
            this.ctxSprites.drawImage(this.spritesImage, 0, 0);
            this.spritesLoaded = true;
        }

        if(!this.spritesLoaded) return;

        let ground = this.state.map.ground;
        for(let i in ground)
        {
            let platform = ground[i];
            let from = (platform.from * mapState.tileX) - mapState.offset;
            let to2   = ((platform.to - platform.from) * mapState.tileX);
            let to   = from + to2;
            let type = 2;
            if(to < drawFrom || from > drawTo) continue;
            for(let i = 0, len = (platform.to - platform.from); i <= len; i++)
            {
                let x = ((platform.from + i) * mapState.tileX) - mapState.offset;
                let name = 'ground-center';
                if(i === 0 || i === len)
                {
                    name = (i === 0) ? 'ground-left' : 'ground-right';
                }
                this.sprites.setFrame(name, type, this.canvasSprites, ctx, x, mapHeight);
            }
        }

        let floor = this.state.map.floor;
        for(let i in floor)
        {
            let platform = floor[i];
            let from = (platform.from * mapState.tileX) - mapState.offset;
            let to2   = (((platform.to - platform.from) + 1) * mapState.tileX);
            let to   = from + to2;
            if(to < drawFrom || from > drawTo) continue;
            let height = (platform.height * this.state.map.tileY);
            // 1 - light red, 2 - light blue, 3 - light green, 4 - blue, 5 - gray, 6 - red
            //let type = (!platform.bothSide) ? 4 : 1;
            let type = (!platform.bothSide) ? 3 : 5;
            for(let i = 0, len = (platform.to - platform.from); i <= len; i++)
            {
                let x = ((platform.from + i) * mapState.tileX) - mapState.offset;
                let name = 'platform-center';
                if(i === 0 || i === len)
                {
                    name = (i === 0) ? 'platform-left' : 'platform-right';
                }
                this.sprites.setFrame(name, type, this.canvasSprites, ctx, x, height);
            }
        }

        let stars = mapState.stars;
        for(let i in stars)
        {
            let star = stars[i];
            if(star === null) continue;
            let x = (star.x * mapState.tileX) - mapState.offset;
            if(x < drawFrom || x > drawTo) continue;
            let imgPrefix = (star.collected) ? 'item-star-explode' : 'item-star';
            this.sprites.setFrame(imgPrefix, star.frame, this.canvasSprites, ctx, x, (star.y * this.state.map.tileY));
        }

        let spikes = mapState.spikes;
        for(let i in spikes)
        {
            let spike = spikes[i];
            if(spike === null) continue;
            let x = (spike.x * mapState.tileX) - mapState.offset;
            if(x < drawFrom || x > drawTo) continue;
            let imgPrefix = 'spike';
            this.sprites.setFrame(imgPrefix, 1, this.canvasSprites, ctx, x, (spike.y * this.state.map.tileY));
        }

        for(let i = 0, len = mapState.exit.length; i < len; i++)
        {
            let x = (mapState.exit[i].x * mapState.tileX) - mapState.offset;
            if(x >= drawFrom && x <= drawTo) 
            {
                let imgPrefix = 'exit';
                this.sprites.setFrame(imgPrefix, 1, this.canvasSprites, ctx, x, (mapState.exit[i].y * this.state.map.tileY));
            }
        }

        let enemies = mapState.enemies;
        let enemyHeightOffset = (mapState.tileY * 0.05);
        for(let i = 0, len = enemies.length; i < len; i++)
        {
            let enemy = enemies[i];
            let x = enemy.x - mapState.offset;
            if(enemy.death || x < drawFrom || x > drawTo) continue;
            let img = (enemy.right) ? 'enemy-right' : 'enemy-left';;
            if(enemy.die)
            {
                img = 'enemy-explode';

            }
            this.sprites.setFrame(img, enemy.frame, this.canvasSprites, ctx, x, (enemy.height * this.state.map.tileY) + enemyHeightOffset);
        }

        // for(let i in this.clouds)
        // {
        //     let cloud = this.clouds[i];
        //     if(cloud[0] < (width/-2) || cloud[0] > drawTo) continue;
        //     let imgPrefix = 'cloud';
        //     this.sprites.setFrame(imgPrefix, cloud[2], this.canvasSprites, ctx, cloud[0], cloud[1]);
        // }
        
        // DEBUG
        // ctx.fillStyle = "#4cf747"; this.ctx.fillRect(this.state.player.x + 45, 335, 2, 20);
        // for(let i = 0, len = this.state.map.groundFall.length; i < len; i++) { this.ctx.fillStyle = (this.state.map.groundFall[i]) ? "#fc4737" : "#4cf747"; this.ctx.fillRect(i, 335, i + 1, 20); }
        this.redrawPlayer();
        // this.ctx.clearRect(drawFrom, 0, drawWidth, this.state.height);
        // this.ctx.drawImage(this.canvasFB, 0, 0);
    }

    getCached(img: string): HTMLImageElement
    {
        let el: HTMLImageElement;
        if(this.cached.hasOwnProperty(img))
        {
            return this.cached[img];
        }
        el = document.getElementById(img) as HTMLImageElement;
        this.cached[img] = el;
        return el;
    }

    redrawPlayer()
    {
    	if(!this.state.loaded) return;
        let ctx       = this.ctx;//FB;
        let mapState = this.state.map;
        let playerState = this.state.player;
    	let img = (playerState.right) ? 'ninja-right' : 'ninja-left';;
        if(playerState.death)
        {
            img = 'ninja-explode';

        }
        else if(playerState.jumping > 15)
        {
            img = (playerState.right) ? 'ninja-jump-right' : 'ninja-jump-left';
        }
        let y = Math.ceil(playerState.y - (mapState.tileY * 0.95));
        this.sprites.setFrame(img, playerState.frame, this.canvasSprites, ctx, playerState.x - this.state.map.offset, y);
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

    render() {
        let width = (this.state.loaded) ? this.state.width : 0;
    	let height = (this.state.loaded) ? this.state.height : 0;
        let widthBackground = (this.state.loaded) ? this.mapImage.width : 0;
        let heightBackground = (this.state.loaded) ? this.mapImage.height : 0;
        let widthSprites = (this.state.loaded) ? this.spritesImage.width : 0;
        let heightSprites = (this.state.loaded) ? this.spritesImage.height : 0;
        let loader = null;
        let statusBar = (this.state.loaded) ? <div><StatusBar /></div> : null;
        let canvasStyle = {};
        let canvasBackgroundStyle = { display: 'none' };
        if(this.state.loader.opacity > 0)
        {
            let loaderStyle = { opacity: this.state.loader.opacity.toString() };
            loader = <div style={loaderStyle}><GameLoader /></div>;
        }
        return <div>
                    {statusBar}
                    {loader}
                    <canvas className="game" style={canvasStyle} ref={(e) => this.processLoad(e)} onClick={(e) => this.toggleFullScreen(e)} width={width} height={height} key="canvas-map"></canvas>
                    <canvas style={canvasBackgroundStyle} ref={(e) => this.processBackgroundLoad(e)} width={widthBackground} height={heightBackground} key="canvas-map-background"></canvas>
                    <canvas style={canvasBackgroundStyle} ref={(e) => this.processSpritesLoad(e)} width={widthSprites} height={heightSprites} key="canvas-map-sprites"></canvas>
                    <canvas style={canvasBackgroundStyle} ref={(e) => this.processFramebufferLoad(e)} width={width} height={height} key="canvas-map-framebuffer"></canvas>
    			</div>;
    }
}