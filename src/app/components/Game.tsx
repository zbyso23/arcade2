import * as React from 'react';
import { IStore, IStoreContext } from '../reducers';
import { Store } from 'redux';
import { IPlayerState } from '../reducers/IPlayerState';
import { IGameMapState } from '../reducers/IGameMapState';
import { IGameMapPlatformState } from '../reducers/IGameMapPlatformState';
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
private removeItemStarFrame = 1;
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
        if(playerState.fall < this.state.height)
        {
            console.log('animateFalling');
            let fall = 0;
            fall += (playerState.fall === 0) ? 1.5 : (playerState.fall / 12);
            playerState.fall += fall;
            playerState.y    += fall;
            this.context.store.dispatch({type: PLAYER_UPDATE, response: playerState });
        }
        else
        {
            console.log('processDeath');
            this.processDeath();
        }
    }

    animatePlayer()
    {

        console.log('animatePlayer');
        // let id = Math.floor(Math.random() * 99).toString();
    	let playerState = this.state.player;
    	let controlsState = this.state.controls;
        let mapState = this.state.map;
    	let speed = playerState.speed;
    	let speedMax = 44;
    	let controls = this.state.controls;

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
        let floorFrom = this.state.map.floorHeight[xFrom];
        let floorTo   = this.state.map.floorHeight[xTo];


    	let jump = playerState.jumping;
        let bothSide = false;
    	if(controls.up)
    	{
            let isJumping = playerState.isJumping;
            if(!isJumping) playerState.isJumping = true;
            let jumpValue = (17.7) + Math.abs(playerState.speed * 0.4);
            if(null !== floorFrom && floorFrom.bothSide)
            {
                let floorHeight = (floorFrom.height + 1) * this.state.map.tileY;
                let fromY = playerState.y;
                let toY = playerState.y - jumpValue;
                if(toY < floorHeight && fromY >= floorHeight) 
                {
                    bothSide = true;
                }
            }
            if(bothSide || (jump + jumpValue) >= 295)
            {
                controlsState.up = false;
            }
            else
            {
                jump += jumpValue;
                playerState.y -= jumpValue;
            }
    	}
		if(jump > 0)
		{
			let jumpFactor = 9.7;
            let jumpValue = (jump >= jumpFactor) ? jumpFactor : jump;
			jump -= jumpValue;
            playerState.y += jumpValue;
            if(!controlsState.up)
            {
                let fromY = playerState.y;
                let toY = playerState.y - (this.state.map.tileY * 0.3);
                let newFloor = null;
                if(null !== floorFrom && (((floorFrom.height) * this.state.map.tileY) <= fromY && ((floorFrom.height) * this.state.map.tileY) > toY))
                {
                    // console.log('na plosinu?');
                    // console.log(playerState.y, ((floorFrom.height) * this.state.map.tileY));
                    newFloor = floorFrom;
                }
                else if(null !== floorTo && (((floorTo.height) * this.state.map.tileY) <= fromY && ((floorTo.height) * this.state.map.tileY) > toY))
                {
                    // console.log('na plosinu?');
                    newFloor = floorTo;
                }
                if(newFloor !== null)
                {
                    playerState.y = ((newFloor.height) * this.state.map.tileY);
                    playerState.floor = newFloor;
                    playerState.isJumping = false;
                    jump = 0;
                }
            }
		}
        if(jump === 0 && playerState.x !== newPlayerX && playerState.floor !== null && (floorFrom === null || floorTo === null))
        {
            jump = (this.state.map.height - playerState.floor.height) * this.state.map.tileY;
            // console.log('z plosiny? JUMP', jump);
            playerState.floor = null;
            playerState.isJumping = true;
        }
        playerState.x = newPlayerX;
        if(jump === 0) playerState.isJumping = false;
        playerState.jumping = jump;

// this.removeItemStarFrame = (this.removeItemStarFrame <= 6) ? this.removeItemStarFrame + 1 : 1;


        if(playerState.x > (this.state.width / 2) && playerState.x < ((this.state.map.length * this.state.map.tileX) - (this.state.width / 2)))
        {
            mapState.offset = Math.floor(playerState.x - (this.state.width / 2));
        }

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

        if(!this.state.player.isJumping && playerState.floor === null && (false === this.state.map.groundFall[xFrom] && false === this.state.map.groundFall[xTo]))
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
        let mapState  = this.state.map;
        let mapHeight = this.state.map.height * this.state.map.tileY;
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

            if(platform.from * mapState.tileX > drawTo || platform.to * mapState.tileX < drawFrom) continue;
            this.ctx.fillRect(platform.from * mapState.tileX, mapHeight, ((platform.to - platform.from) * mapState.tileX), 20);
        }

        this.ctx.fillStyle = "#ddddff";
        for(let i in ground)
        {
            let platform = ground[i];
            if(platform.from * mapState.tileX > drawTo || platform.to * mapState.tileX < drawFrom) continue;
            this.ctx.fillRect(platform.from * mapState.tileX, mapHeight, ((platform.to - platform.from) * mapState.tileX), 2);
        }
        this.ctx.fillStyle = "#1111b9";
        for(let i in ground)
        {
            let platform = ground[i];
            if(platform.from * mapState.tileX > drawTo || platform.to * mapState.tileX < drawFrom) continue;
            this.ctx.fillRect(platform.from * mapState.tileX, mapHeight + 16, ((platform.to - platform.from) * mapState.tileX), 4);
        }


        let fillStyles = [
            ["#2222f9", "#ddddff", "#1111b9"],
            ["#f92222", "#ffdddd", "#b91111"],
        ]

        let floor = this.state.map.floor;
        for(let i in floor)
        {
            let platform = floor[i];
            if(platform.from * mapState.tileX > drawTo || platform.to * mapState.tileX < drawFrom) continue;
            this.ctx.fillStyle = (!platform.bothSide) ? fillStyles[0][0] : fillStyles[1][0];
            this.ctx.fillRect(platform.from * mapState.tileX, platform.height * this.state.map.tileY, ((platform.to - platform.from) * mapState.tileX), 20);

            let img = 'item-star' + this.removeItemStarFrame.toString();
            let el: HTMLImageElement = document.getElementById(img) as HTMLImageElement;
            this.ctx.drawImage(el, platform.from * mapState.tileX, (platform.height * this.state.map.tileY) - this.state.map.tileY);
        }
        for(let i in floor)
        {
            let platform = floor[i];
            this.ctx.fillStyle = (!platform.bothSide) ? fillStyles[0][1] : fillStyles[1][1];
            if(platform.from * mapState.tileX > drawTo || platform.to * mapState.tileX < drawFrom) continue;
            this.ctx.fillRect(platform.from * mapState.tileX, platform.height * this.state.map.tileY, ((platform.to - platform.from) * mapState.tileX), 2);
        }
        for(let i in floor)
        {
            let platform = floor[i];
            this.ctx.fillStyle = (!platform.bothSide) ? fillStyles[0][2] : fillStyles[1][2];
            if(platform.from * mapState.tileX > drawTo || platform.to * mapState.tileX < drawFrom) continue;
            this.ctx.fillRect(platform.from * mapState.tileX, (platform.height * this.state.map.tileY) + 16, ((platform.to - platform.from) * mapState.tileX), 4);
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
        if(playerState.jumping > 15)
    	{
    		img = 'sonic-jump' + playerState.frame.toString();
    	}
    	else
    	{
    		img = (playerState.right) ? 'sonic-right' + playerState.frame.toString() : 'sonic-left' + playerState.frame.toString();
    	}
    	let el: HTMLImageElement = document.getElementById(img) as HTMLImageElement;
        let y = playerState.y - mapState.tileY;
        // if(playerState.floor === null)
        // {
        //     if(playerState.jump === 0)
        //     {
        //         y = playerState.y - playerState.jump;
        //     }
        //     else
        //     {
        //         y = playerState.jumpFrom - playerState.jump;
        //     }
        // }
        // else
        // {
        //     let floor = playerState.floor;
        //     y = floor.height - 100;
        //     if(playerState.jump > 0)
        //     {
        //         y -= playerState.jump;
        //     }
        // }
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
    	let width = (this.state.loaded) ? (this.state.map.length * this.state.map.tileX) : 0;
    	let height = (this.state.loaded) ? this.state.height : 0;
		let rows = [];
		for (let i=1; i <= 9; i++) 
		{
			let id = 'sonic-right' + i.toString();
			let idLeft = 'sonic-left' + i.toString();
			let idJump = 'sonic-jump' + i.toString();

            let idEnemy = 'enemy-right' + i.toString();
            let idEnemyLeft = 'enemy-left' + i.toString();
            let idEnemyDeath = 'enemy-death-right' + i.toString();
            let idEnemyDeathLeft = 'enemy-death-left' + i.toString();

            let idStar = 'item-star' + i.toString();
            let idStarExplode = 'item-star-explode' + i.toString();

			let src = 'img/sonic-right' + i.toString() + '.png';
			let srcLeft = 'img/sonic-left' + i.toString() + '.png';
			let srcJump = 'img/sonic-jump' + i.toString() + '.png';

            let srcEnemy = 'img/enemy-right' + i.toString() + '.png';
            let srcEnemyLeft = 'img/enemy-left' + i.toString() + '.png';
            let srcEnemyDeath = 'img/enemy-death-right' + i.toString() + '.png';
            let srcEnemyDeathLeft = 'img/enemy-death-left' + i.toString() + '.png';

            let srcStar = 'img/item-star' + i.toString() + '.png';
            let srcStarExplode = 'img/item-star-explode' + i.toString() + '.png';

			rows.push(<img src={src} id={id} key={id} />);
			rows.push(<img src={srcLeft} id={idLeft} key={idLeft} />);
			rows.push(<img src={srcJump} id={idJump} key={idJump} />);

            rows.push(<img src={srcEnemy} id={idEnemy} key={idEnemy} />);
            rows.push(<img src={srcEnemyLeft} id={idEnemyLeft} key={idEnemyLeft} />);

            rows.push(<img src={srcEnemyDeath} id={idEnemyDeath} key={idEnemyDeath} />);
            rows.push(<img src={srcEnemyDeathLeft} id={idEnemyDeathLeft} key={idEnemyDeathLeft} />);

            rows.push(<img src={srcStarExplode} id={idStarExplode} key={idStarExplode} />);
            rows.push(<img src={srcStar} id={idStar} key={idStar} />);
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