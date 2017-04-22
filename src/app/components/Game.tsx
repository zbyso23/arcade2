import * as React from 'react';
import { IStore, IStoreContext } from '../reducers';
import { Store } from 'redux';
import { IPlayerState } from '../reducers/IPlayerState';
import { IGameMapState } from '../reducers/IGameMapState';
import { PLAYER_UPDATE } from '../actions/playerActions';
import { GAME_MAP_UPDATE } from '../actions/gameMapActions';

declare var imageType:typeof Image; 

export interface IGameProps {
    name: string;
    onPlayerDeath?: () => any;
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
}

function mapStateFromStore(store: IStore, state: IGameState): IGameState {
    let newState = Object.assign({}, state, {player: store.player, map: store.map});
    return newState;
}

export default class Game extends React.Component<IGameProps, IGameState> {

    static contextTypes: React.ValidationMap<any> = 
    {
        store: React.PropTypes.object
    }
    
    context: IStoreContext;
    unsubscribe: Function;

	private ctx: CanvasRenderingContext2D;
    private requestAnimation: number = 0;
	private animationTime: number = 35;
	private timer: any;

	private imgLeft: any;
	private imgRight: any;

	private images: any = [[120,106,'img/sonic-left.png'], [120,106,'img/sonic-right.png']]
	private imagesLeft: number = 0;

    private handlerKeyUp: any;
    private handlerKeyDown: any;

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
        	player: null,
            map: null
        };

        this.processLoad = this.processLoad.bind(this);
        this.gameRender = this.gameRender.bind(this);
        this.redraw = this.redraw.bind(this);
        this.handlerKeyUp = this.processKeyUp.bind(this);
        this.handlerKeyDown = this.processKeyDown.bind(this);
        this.toggleFullScreen = this.toggleFullScreen.bind(this);
    }

    componentDidMount() 
    {
        let storeState = this.context.store.getState();
        this.unsubscribe = this.context.store.subscribe(this.setStateFromStore.bind(this));
    	let width = window.innerWidth;
    	let height = window.innerHeight;
    	window.onresize = function(e: any)
    	{
    		this.resize();
    	}.bind(this);

        let newState = Object.assign({}, this.state);
        newState.loaded = true;
        newState.width = width;
        newState.height = height;
        this.setState(mapStateFromStore(this.context.store.getState(), newState));
    	window.addEventListener('keydown', this.handlerKeyDown);
    	window.addEventListener('keyup', this.handlerKeyUp);
    	this.timer = setTimeout(this.animate.bind(this), this.animationTime);
        this.requestAnimation = requestAnimationFrame(this.gameRender);
    }

    componentWillUnmount() 
    {
        if (this.unsubscribe) 
        {
            this.unsubscribe();
        }
        if (this.requestAnimation !== 0)
        {
            cancelAnimationFrame(this.requestAnimation);
        }
        window.removeEventListener('keydown', this.handlerKeyDown);
        window.removeEventListener('keyup', this.handlerKeyUp);
        clearTimeout(this.timer);
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
    	if(this.state.player.started) this.animatePlayer();
    	this.timer = setTimeout(this.animate.bind(this), this.animationTime);
    }

    animatePlayer()
    {
    	let playerState = this.state.player;
    	let controlsState = this.state.controls;
        let mapState = this.state.map;
    	let speed = playerState.speed;
    	let speedMax = 44;
    	let controls = this.state.controls;

        if(playerState.falling)
        {
            if(playerState.fall < this.state.height)
            {
                let fall = 0;
                fall += (playerState.fall === 0) ? 1.5 : (playerState.fall / 12);
                playerState.fall += fall;
                playerState.y    += fall;
                this.context.store.dispatch({type: PLAYER_UPDATE, response: playerState });
            }
            else
            {
                this.processDeath();
            }
            return;
        }

		let speedDecrase = 9.9;  	
		let speedIncerase = 2.7;
		let speedChange = 2.4;
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
    	let jump = playerState.jump;
        let jumpStarted = false;
    	if(controls.up)
    	{
    		if(jump >= 195)
    		{
    			controlsState.up = false;
    		}
    		else
    		{
                if(jump === 0) jumpStarted = true;
    			jump += (17.7) + (jump / 50);
    		}
    	}
    	else
    	{
    		if(jump > 0)
    		{
    			let jumpFactor = 21.2 - Math.abs(this.state.player.speed) / 9;
    			jump = (jump >= jumpFactor) ? jump - jumpFactor : 0;
    		}
    	}
    	let newPlayerX = (playerState.x + playerState.speed);
    	if(newPlayerX <= 40 || newPlayerX >= (this.state.map.length - 40)) 
    	{
    		newPlayerX = playerState.x
    		playerState.speed = 0
    	}
        if(jumpStarted)
        {
            playerState.jumpFrom = this.state.map.height - 100;
        }
        let x = Math.max(0, Math.ceil(newPlayerX + 46));
        //console.log('z plosiny? JUMP', jump);
        if(playerState.x !== newPlayerX && playerState.floor !== -1 && this.state.map.floorHeight[x] === -1)
        {
            let floorIndex = this.state.map.floorHeight[x];
            let floor      = this.state.map.floor[playerState.floor];
            if(floorIndex === -1)
            {
                playerState.jumpFrom = floor.height - 100;
                playerState.floor = -1;
                let newJump = (this.state.map.height - floor.height) - 100;
            }
        }
		playerState.x = newPlayerX;
        
        if(playerState.jump > jump && this.state.map.floorHeight[x] !== -1)
        {
            let floorIndex = this.state.map.floorHeight[x];
            let floor      = this.state.map.floor[floorIndex];
            let floorHeight = floor.height;
            let jumpFrom   = this.state.map.height - jump;
            let jumpTo     = this.state.map.height - playerState.jump;
            if(floorHeight <= jumpFrom && floorHeight >= jumpTo)
            {
                playerState.floor = floorIndex;
                jump = 0;
            }
        }
        playerState.jump = jump;
        // Anim Frames
		if(this.state.player.speed > 0 || this.state.player.speed < 0 || this.state.player.jump > 0)
		{
			let maxFrame = (this.state.player.jump > 0) ? 9 : 7;
            let minFrame = (this.state.player.jump > 0) ? 1 : 1;
			playerState.frame = (playerState.frame >= maxFrame) ? minFrame : playerState.frame + 1;
		}
		else
		{
			playerState.frame = (playerState.frame === 1 || playerState.frame >= 7) ? 1 : playerState.frame + 1;
		}

        if(playerState.x > (this.state.width / 2) && playerState.x < (this.state.map.length - (this.state.width / 2)))
        {
            mapState.offset = Math.floor(playerState.x - (this.state.width / 2));
        }
        
        if(false === this.state.map.groundFall[x] && this.state.player.jump === 0 && this.state.map.floorHeight[x] === -1)
        {
            playerState.falling = true;
            playerState.fall    = playerState.y;
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
        // let state = Object.assign({}, playerState);
        playerState.lives   = (playerState.lives - 1);
        playerState.x       = 50;
        playerState.y       = mapState.height - 100;
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

    processLoad(e)
    {
    	if(!e) return;
    	this.ctx = e.getContext('2d');
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
        let assignKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
        if(assignKeys.indexOf(e.key) === -1) return;
        e.preventDefault();
        if(!this.state.player.started) this.state.player.started = true;;
    	let newControls = { up: this.state.controls.up, down: this.state.controls.down, left: this.state.controls.left, right: this.state.controls.right };
    	switch(e.key)
    	{
    		case 'ArrowUp':
    			newControls.up = (e.type === 'keyup' || this.state.player.jump > 0) ? false : true;
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
        let player    = this.state.player;
        let mapHeight = this.state.map.height;
        let drawFrom = (player.x - width);
        let drawTo   = (player.x + width);
        let drawWidth = Math.max(drawTo - drawFrom, width);
    	this.ctx.clearRect(0, 0, drawWidth, this.state.height);

		var my_gradient=this.ctx.createLinearGradient(0, 0, 0, this.state.height);
		my_gradient.addColorStop(0, "#fefeff");
		my_gradient.addColorStop(0.6, "#5555ff");
        my_gradient.addColorStop(0.7, "#22a933");
        my_gradient.addColorStop(0.8, "#1c952d");
        my_gradient.addColorStop(1, "#111111");
		this.ctx.fillStyle=my_gradient;
		this.ctx.fillRect(drawFrom, 0, drawWidth, this.state.height);

		this.ctx.fillStyle = "#2222f9";
        let ground = this.state.map.ground;
        for(let i in ground)
        {
            let platform = ground[i];
            if(platform.from > drawTo || platform.to < drawFrom) continue;
            this.ctx.fillRect(platform.from, mapHeight, (platform.to - platform.from), 20);
        }

        this.ctx.fillStyle = "#ddddff";
        for(let i in ground)
        {
            let platform = ground[i];
            if(platform.from > drawTo || platform.to < drawFrom) continue;
            this.ctx.fillRect(platform.from, mapHeight, (platform.to - platform.from), 2);
        }
        this.ctx.fillStyle = "#1111b9";
        for(let i in ground)
        {
            let platform = ground[i];
            if(platform.from > drawTo || platform.to < drawFrom) continue;
            this.ctx.fillRect(platform.from, mapHeight + 16, (platform.to - platform.from), 4);
        }

        let floor = this.state.map.floor;
        for(let i in floor)
        {
            let platform = floor[i];
            if(platform.from > drawTo || platform.to < drawFrom) continue;
            this.ctx.fillRect(platform.from, platform.height, (platform.to - platform.from), 20);
        }

        this.ctx.fillStyle = "#ddddff";
        for(let i in floor)
        {
            let platform = floor[i];
            if(platform.from > drawTo || platform.to < drawFrom) continue;
            this.ctx.fillRect(platform.from - 5, platform.height, (platform.to - platform.from) + 10, 2);
        }
        this.ctx.fillStyle = "#1111b9";
        for(let i in floor)
        {
            let platform = floor[i];
            if(platform.from > drawTo || platform.to < drawFrom) continue;
            this.ctx.fillRect(platform.from, platform.height + 16, (platform.to - platform.from), 4);
        }



        // DEBUG
        // this.ctx.fillStyle = "#4cf747"; this.ctx.fillRect(this.state.player.x + 45, 335, 2, 20);
        // for(let i = 0, len = this.state.map.groundFall.length; i < len; i++) { this.ctx.fillStyle = (this.state.map.groundFall[i]) ? "#fc4737" : "#4cf747"; this.ctx.fillRect(i, 335, i + 1, 20); }
        this.redrawPlayer();
    }

    redrawPlayer()
    {
    	if(!this.state.loaded) return;
    	let img;
        let mapState = this.state.map;
    	let playerState = this.state.player;
        if(playerState.jump > 15)
    	{
    		img = 'sonic-jump' + playerState.frame.toString();
    	}
    	else
    	{
    		img = (playerState.right) ? 'sonic-right' + playerState.frame.toString() : 'sonic-left' + playerState.frame.toString();
    	}
    	let el: HTMLImageElement = document.getElementById(img) as HTMLImageElement;
        let y = 0;
        if(playerState.floor === -1)
        {
            if(playerState.jump === 0)
            {
                y = playerState.y - playerState.jump;
            }
            else
            {
                y = playerState.jumpFrom - playerState.jump;
            }
        }
        else
        {
            let floor = mapState.floor[playerState.floor];
            y = floor.height - 100;
            if(playerState.jump > 0)
            {
                y -= playerState.jump;
            }
        }
        
    	this.ctx.drawImage(el, playerState.x, y);
    }

	toggleFullScreen(e: any) {
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
    	let width = (this.state.loaded) ? this.state.map.length : 0;
    	let height = (this.state.loaded) ? this.state.height : 0;
		let rows = [];
		for (let i=1; i <= 9; i++) 
		{
			let id = 'sonic-right' + i.toString();
			let idLeft = 'sonic-left' + i.toString();
			let idJump = 'sonic-jump' + i.toString();
			let src = 'img/sonic-right' + i.toString() + '.png';
			let srcLeft = 'img/sonic-left' + i.toString() + '.png';
			let srcJump = 'img/sonic-jump' + i.toString() + '.png';
			rows.push(<img src={src} id={id} key={id} />);
			rows.push(<img src={srcLeft} id={idLeft} key={idLeft} />);
			rows.push(<img src={srcJump} id={idJump} key={idJump} />);
		}
        let canvasStyle = {};
        if(this.state.loaded)
        {
            canvasStyle['marginLeft'] = '-' + this.state.map.offset.toString() + 'px';
        }
        return <div>
                    <canvas className="game" style={canvasStyle} ref={(e) => this.processLoad(e)} onClick={(e) => this.toggleFullScreen(e)} width={width} height={height}></canvas>
        			{rows}
    			</div>;
    }
}