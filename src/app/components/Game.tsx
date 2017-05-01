import * as React from 'react';
import { IStore, IStoreContext } from '../reducers';
import { Store } from 'redux';
import { IPlayerState } from '../reducers/IPlayerState';
import { IGameMapState } from '../reducers/IGameMapState';
import { IGameMapPlatformState } from '../reducers/IGameMapPlatformState';
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
    private mapImage: HTMLImageElement;
    private spritesImage: HTMLImageElement;
    private mapLoaded: boolean = false;
    private spritesLoaded: boolean = false;
    private handlerKeyUp: any;
    private handlerKeyDown: any;
    private sprites: Sprites;

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
        this.toggleFullScreen = this.toggleFullScreen.bind(this);
        this.processStats = this.processStats.bind(this);
        this.processMenu = this.processMenu.bind(this);
        
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
        i.src = 'img/map-background1.png';
        this.mapImage = i;

        let i2 = new Image();
        i2.onload = this.loaderImage;
        i2.src = 'img/sprites2.png';
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
        this.resize = this.resize.bind(this);
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

    run ()
    {
        window.addEventListener('keydown', this.handlerKeyDown);
        window.addEventListener('keyup', this.handlerKeyUp);
        window.addEventListener('resize', this.resize);
        this.timer = setTimeout(this.animate.bind(this), this.animationTime);
        this.requestAnimation = requestAnimationFrame(this.gameRender);
    }


    getClouds(length: number, height: number): Array<any>
    {
        let fromX = Math.ceil(Math.random() * 90) * -1;
        let clouds = [];
        while(fromX < length)
        {
            let cloudHeight = height + (height * (Math.random() / 3));
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
            else
            {
                this.animatePlayer();
            }
        }
    	this.timer = setTimeout(this.animate.bind(this), this.animationTime);
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

    animatePlayer()
    {
    	let playerState = this.state.player;
        let playerAttributes = playerState.character.attributes;
    	let controlsState = this.state.controls;
        let mapState = this.state.map;
        let stars = mapState.stars;
    	let speed = playerState.speed;
    	let speedMax = playerAttributes.speed;
    	let controls = this.state.controls;
        let jump = playerState.jumping;
        let bothSide = false;

		let speedDecrase = (jump > 0) ? playerAttributes.brake * 0.42 : playerAttributes.brake;
		let speedIncerase = (jump > 0) ? playerAttributes.brake * 0.01 : playerAttributes.brake * 0.27;
		let speedChange = (jump > 0) ? playerAttributes.brake * 0.09 : playerAttributes.brake * 0.25;
    	if(controls.right)
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
    	else if(controls.left)
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
    	else
    	{
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
        if(newPlayerX <= 0 || newPlayerX >= ((this.state.map.length - 2) * this.state.map.tileX))
        {
            newPlayerX = playerState.x
            playerState.speed = 0
        }

        let x = Math.max(0, Math.floor((newPlayerX + (this.state.map.tileX * 0.5)) / this.state.map.tileX));
        let xFrom = Math.max(0, Math.floor((newPlayerX + (this.state.map.tileX * 0.45)) / this.state.map.tileX));
        let xTo = Math.max(0, Math.floor((newPlayerX + (this.state.map.tileX * 0.55)) / this.state.map.tileX));
        let floorX    = this.state.map.floorHeight[x];
        let floorHeight = (floorX === null) ? 0 : (floorX.height * this.state.map.tileY);
        let playerFloor = playerState.floor;
        let playerFloorHeight = (playerFloor === null) ? 0 : (playerFloor.height * this.state.map.tileY);


    	if(controls.up)
    	{
            let isJumping = playerState.isJumping;
            let jumpValue = (playerAttributes.jump * 1.7) + Math.abs(playerState.speed * 0.2);
            if(!isJumping) 
            {
                playerState.isJumping = true;
                playerState.jumpFrom = playerFloorHeight;
                jump = playerFloorHeight;
            }
            if(null !== floorX && floorX.bothSide)
            {
                let floorHeight = (floorX.height + 1) * this.state.map.tileY;
                let fromY = playerState.y;
                let toY = playerState.y - jumpValue;
                if(toY < floorHeight && fromY >= floorHeight) 
                {
                    bothSide = true;
                }
            }
            if(bothSide || (jump + jumpValue) >= (279 + playerAttributes.jump + playerState.jumpFrom))
            {
                controlsState.up = false;
            }
            else
            {
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
			let jumpFactor = 19.7;
            let jumpValue = (jump >= jumpFactor) ? jumpFactor : jump;
			jump -= jumpValue;
            if(this.state.player.speed > 0)
            {
                this.state.player.speed = (this.state.player.speed > 0) ? this.state.player.speed - 0.5 : this.state.player.speed + 0.5;
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
        if(stars[x] !== null && !stars[x].collected)
        {
            let starHeight = ((stars[x].y * this.state.map.tileY) + this.state.map.tileY);
            let starCollectFactor = this.state.map.tileY;
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

        if(x === mapState.exit[0])
        {
            // console.log('Exit?');
            let exitHeight = ((mapState.exit[1] * this.state.map.tileY) + this.state.map.tileY);
            let exitOpenFactor = this.state.map.tileY * 0.3;
            console.log((playerState.y - exitOpenFactor), (playerState.y + exitOpenFactor));
            if(exitHeight >= (playerState.y - exitOpenFactor) && exitHeight <= (playerState.y + exitOpenFactor))
            {
                // console.log('Exit!');
                this.processWin();
                return;
            }
        }

        if(playerState.x >= (this.state.width / 2) && playerState.x < ((this.state.map.length * this.state.map.tileX) - (this.state.width / 2)))
        {
            mapState.offset = Math.ceil(playerState.x - (this.state.width / 2));
            // console.log('mapState.offset', mapState.offset);
        }

        // Anim Frames
        // console.log('anim frames?', this.state.player.jump);
        if(this.state.player.speed > 0 || this.state.player.speed < 0 || this.state.player.jumping > 0)
        {
            // console.log('anim frames!', this.state.player.jump);
            let maxFrame = (this.state.player.jump > 0) ? 9 : 9;
            let minFrame = (this.state.player.jump > 0) ? 1 : 5;
            playerState.frame = (playerState.frame >= maxFrame) ? minFrame : playerState.frame + 1;
        }
        else
        {
            playerState.frame = (playerState.frame === 1 || playerState.frame >= 7) ? 1 : playerState.frame + 1;
        }
        // Anim stars
        for(let i in stars)
        {
            if(stars[i] === null) continue;
            let star = stars[i];
            if(!star.collected)
            {
                star.frame = (star.frame === 7) ? 1 : star.frame + 1;
            }
            else if(star.collected && (star.frame === 9))
            {
                let index = parseInt(i);
                mapState.stars[index] = null;
            }
            else
            {
                star.frame++;
            }
        }

        // Anim Exit
        mapState.exit[2] = (mapState.exit[2] === 20) ? 1 : mapState.exit[2] + 1;

        if(!this.state.player.isJumping && playerState.floor === null && false === this.state.map.groundFall[x])
        {
            playerState.falling = true;
            playerState.fall    = playerState.y;
        }

        // Anim Clouds
        let newClouds = [];
        let lastCloud = this.clouds.length - 1;
        for(let i in this.clouds)
        {
            let half = 0.07;
            let heightChange = (Math.random() * (2 * half)) - half;
            this.clouds[i][0] -= (this.clouds[i][3]) + (playerState.speed / 90);
            this.clouds[i][1] += heightChange;
            if(parseInt(i) === 0 && this.clouds[i][0] < -150) continue;
            newClouds.push(this.clouds[i]);
        }
        if(this.clouds[lastCloud][0] < (this.state.width * 0.95))
        {
            let height = this.state.map.tileY / 2
            let cloudHeight = height + (height * (Math.random() / 3));
            let cloudSpeed  = (Math.random() * 0.25) + 1.1;
            let fromX = (this.clouds[lastCloud][0] + (Math.ceil(Math.random() * 100) + 100)); 
            let cloud  = [fromX, cloudHeight, Math.ceil(Math.random() * 5), cloudSpeed];
            newClouds.push(cloud);
        }
        this.clouds = newClouds;

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

    processDeath()
    {
        let storeState = this.context.store.getState();
        let mapState = storeState.map;
        let playerState = storeState.player;
        if(playerState.lives <= 0)
        {
            playerState.lives = 0;
            playerState.started = false;
            this.context.store.dispatch({type: PLAYER_UPDATE, response: playerState });
            this.props.onPlayerDeath();
            return;
        }
        playerState.lives   = (playerState.lives - 1);
        playerState.x       = 50;
        playerState.y       = mapState.height * mapState.tileY;
        playerState.falling = false;
        playerState.fall    = 0;
        playerState.started = false;
        playerState.right   = true;
        playerState.jump    = 0;
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
        playerState.score += (Math.floor(playerState.stars / 10) * 10) + (playerState.lives * 100);
        this.context.store.dispatch({type: PLAYER_UPDATE, response: playerState });
        this.props.onPlayerWin();
    }

    processMenu()
    {
        this.props.onMenu();
    }

    processStats()
    {
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
    	if(e.repeat) return;
    	this.toggleKey(e);
    }

    processKeyUp(e: KeyboardEvent)
    {
    	this.toggleKey(e);
    }

    toggleKey(e: KeyboardEvent)
    {
        // console.log('toggleKey', e);
        let assignKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'F2'];
        if(assignKeys.indexOf(e.key) === -1) return;
        e.preventDefault();
        if(e.type === "keydown" && ['Tab','F2'].indexOf(e.key) > -1)
        {
            if(e.key === 'Tab') this.processStats();
            if(e.key === 'F2') this.processMenu();
            return;
        }

        if(!this.state.player.started) this.state.player.started = true;;
    	let newControls = { up: this.state.controls.up, down: this.state.controls.down, left: this.state.controls.left, right: this.state.controls.right };
    	switch(e.key)
    	{
    		case 'ArrowUp':
    			newControls.up = (e.type === 'keyup' || this.state.player.jumping > 0) ? false : true;
    			break;

    		case 'ArrowDown':
    			newControls.down = (e.type === 'keyup') ? false : true;
    			break;

    		case 'ArrowLeft':
    			newControls.left = (e.type === 'keyup') ? false : true;
    			break;

    		case 'ArrowRight':
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
        let ctx       = this.ctxFB;
    	ctx.clearRect(drawFrom, 0, drawWidth, this.state.height);
        if(this.mapLoaded)
        {
            ctx.drawImage(this.canvasBackground, (mapState.offset * -.13), 0);
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
            if(to < drawFrom || from > drawTo) continue;
            for(let i = 0, len = (platform.to - platform.from); i <= len; i++)
            {
                let x = ((platform.from + i) * mapState.tileX) - mapState.offset;
                let name = 'platform-center';
                if(i === 0 || i === len)
                {
                    name = (i === 0) ? 'platform-left' : 'platform-right';
                }
                let type = 3;
                this.sprites.setFrame(name, type, this.canvasSprites, this.ctxFB, x, mapHeight);
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
            for(let i = 0, len = (platform.to - platform.from); i <= len; i++)
            {
                let x = ((platform.from + i) * mapState.tileX) - mapState.offset;
                let name = 'platform-center';
                if(i === 0 || i === len)
                {
                    name = (i === 0) ? 'platform-left' : 'platform-right';
                }
                let type = (!platform.bothSide) ? 2 : 1;
                this.sprites.setFrame(name, type, this.canvasSprites, this.ctxFB, x, height);
            }
        }

        let stars = this.state.map.stars;
        for(let i in stars)
        {
            let star = stars[i];
            if(star === null) continue;
            let x = (star.x * mapState.tileX) - mapState.offset;
            if(x < drawFrom || x > drawTo) continue;
            let imgPrefix = (star.collected) ? 'item-star-explode' : 'item-star';
            let img = imgPrefix + star.frame.toString();
            this.sprites.setFrame(imgPrefix, star.frame, this.canvasSprites, ctx, x, (star.y * this.state.map.tileY));
        }

        let x = (mapState.exit[0] * mapState.tileX) - mapState.offset;
        if(x >= drawFrom && x <= drawTo) 
        {
            
            let imgPrefix = 'crate';
            if(x >= drawFrom && x <= drawTo) 
            {
                this.sprites.setFrame(imgPrefix, mapState.exit[2], this.canvasSprites, ctx, x, (mapState.exit[1] * this.state.map.tileY));
            }
        }

        for(let i in this.clouds)
        {
            let cloud = this.clouds[i];
            if(cloud[0] < (width/-2) || cloud[0] > drawTo) continue;
            let imgPrefix = 'cloud';
            this.sprites.setFrame(imgPrefix, cloud[2], this.canvasSprites, ctx, cloud[0], cloud[1]);
        }
        
        // DEBUG
        // ctx.fillStyle = "#4cf747"; this.ctx.fillRect(this.state.player.x + 45, 335, 2, 20);
        // for(let i = 0, len = this.state.map.groundFall.length; i < len; i++) { this.ctx.fillStyle = (this.state.map.groundFall[i]) ? "#fc4737" : "#4cf747"; this.ctx.fillRect(i, 335, i + 1, 20); }
        this.redrawPlayer();
        this.ctx.clearRect(drawFrom, 0, drawWidth, this.state.height);
        this.ctx.drawImage(this.canvasFB, 0, 0);
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
        let mapState = this.state.map;
        let playerState = this.state.player;
    	let img = (playerState.right) ? 'sonic-right' : 'sonic-left';;
        if(playerState.jumping > 15)
    	{
    		img = 'sonic-jump';
    	}
        let y = playerState.y - mapState.tileY;
        this.sprites.setFrame(img, playerState.frame, this.canvasSprites, this.ctxFB, playerState.x - this.state.map.offset, y);
    }

	toggleFullScreen(e: any) 
    {
	  if (!document.fullscreenElement) 
	  {
	      document.documentElement.webkitRequestFullScreen();
	  } 
	  else 
	  {
	      document.webkitCancelFullScreen(); 
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