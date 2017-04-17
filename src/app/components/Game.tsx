import * as React from 'react';

declare var imageType:typeof Image; 

export interface GameProps {
    name: string;
}

export interface IGameStateMapPlatform
{
    from?: number;
    to?: number;
}

export interface IGameStateMap
{
    length?: number;
    offset?: number;
    floor?: Array<IGameStateMapPlatform>;
    fall?: Array<boolean>;
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
    player?: {
    	x?: number;
    	y?: number;
    	speed?: number;
    	right?: boolean;
    	jump?: number;
    	frame?: number;
        falling?: boolean;
        fall?: number;
    };
    map?: IGameStateMap;
}

export default class Game extends React.Component<GameProps, IGameState> {

	private ctx: CanvasRenderingContext2D;
	private animationTime: number = 50;
	private timer: any;

	private imgLeft: any;
	private imgRight: any;

	private images: any = [[120,106,'img/sonic-left.png'], [120,106,'img/sonic-right.png']]
	private imagesLeft: number = 0;

    constructor(props: GameProps) {
        super(props);
        let mapLength = 7900;
        let mapFall   = [];
        for(let i = 0; i <= mapLength; i++)
        {
            mapFall.push(false);
        }
        this.state = { 
        	loaded: true, 
        	width: 0, 
        	height: 0,
        	controls: {
        		up: false,
        		down: false,
        		left: false,
        		right: false
        	},
        	player: {
        		x: 50,
        		y: 220,
        		jump: 0,
        		speed: 0,
        		right: true,
        		frame: 1,
                falling: false,
                fall: 0
        	},
            map: {
                length: mapLength,
                offset: 0,
                floor: [],
                fall: mapFall
            }
        };

        this.processLoad = this.processLoad.bind(this);
        this.gameRender = this.gameRender.bind(this);
        this.redraw = this.redraw.bind(this);
        this.processKeyDown = this.processKeyDown.bind(this);
        this.processKeyUp = this.processKeyUp.bind(this);
        this.toggleFullScreen = this.toggleFullScreen.bind(this);

        this.generateRandomMap();
    }

    componentDidMount() 
    {
    	let width = window.innerWidth;
    	let height = window.innerHeight;
    	window.onresize = function(e: any)
    	{
    		this.resize();
    	}.bind(this);
        this.setState({width: width, height: height});
    	window.addEventListener('keydown', this.processKeyDown.bind(this));
    	window.addEventListener('keyup', this.processKeyUp.bind(this));
    	this.timer = setTimeout(this.animate.bind(this), this.animationTime);
        requestAnimationFrame(this.gameRender);
    }

    generateRandomMap()
    {
        let mapState = this.state.map;
        let mapPart = 100;
        let fromX = 0;
        let lastX = mapPart * (Math.ceil(Math.random() * 5) + 3);
        let floor = [];
        while(lastX < mapState.length)
        {
            floor.push({from: fromX, to: lastX});
            for(let i = fromX; i <= lastX; i++) mapState.fall[i] = true;
            fromX = lastX + (mapPart * (Math.ceil(Math.random() * 2)));
            lastX = (mapPart * (Math.ceil(Math.random() * 5)) + 3) + fromX;
        }
        console.log('floor', floor);
        mapState.floor = floor;
        this.setState({map: mapState});
    }

    resize()
    {
    	let width = window.innerWidth;
    	let height = window.innerHeight;
        this.setState({width: width, height: height});
    }

    animate()
    {
    	this.animatePlayer();
    	this.timer = setTimeout(this.animate.bind(this), this.animationTime);
    }

    animatePlayer()
    {
    	let statePlayer = this.state.player;
    	let stateControls = this.state.controls;
        let stateMap = this.state.map;
    	let speed = statePlayer.speed;
    	let speedMax = 44;
    	let controls = this.state.controls;

        if(statePlayer.falling)
        {
            if(statePlayer.fall < this.state.height)
            {
                let fall = 0;
                fall += (statePlayer.fall === 0) ? 1.5 : (statePlayer.fall / 20);
                statePlayer.fall += fall;
                statePlayer.y    += fall;
                this.setState({player: statePlayer});
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
    	let jump = statePlayer.jump;
    	if(controls.up)
    	{
    		if(jump >= 195)
    		{
    			stateControls.up = false;
    		}
    		else
    		{
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
    	statePlayer.jump = jump;
    	let newPlayerX = (statePlayer.x + statePlayer.speed);
    	if(newPlayerX <= 40 || newPlayerX >= (this.state.map.length - 40)) 
    	{
    		newPlayerX = statePlayer.x
    		statePlayer.speed = 0
    	}
		statePlayer.x = newPlayerX;
		if(this.state.player.speed > 0 || this.state.player.speed < 0 || this.state.player.jump > 0)
		{
			let maxFrame = (this.state.player.jump > 0) ? 9 : 7;
            let minFrame = (this.state.player.jump > 0) ? 1 : 1;
			statePlayer.frame = (statePlayer.frame >= maxFrame) ? minFrame : statePlayer.frame + 1;
		}
		else
		{
			statePlayer.frame = (statePlayer.frame === 1 || statePlayer.frame >= 7) ? 1 : statePlayer.frame + 1;
		}

        if(statePlayer.x > (this.state.width / 2) && statePlayer.x < (this.state.map.length - (this.state.width / 2)))
        {
            stateMap.offset = Math.floor(statePlayer.x - (this.state.width / 2));
        }
        let x = Math.max(0, Math.ceil(statePlayer.x + 46));
        if(false === this.state.map.fall[x] && this.state.player.jump === 0)
        {
            statePlayer.falling = true;
            statePlayer.fall    = statePlayer.y;
        }
		this.setState({player: statePlayer, controls: stateControls, map: stateMap});
    }

    processLoad(e)
    {
    	if(!e) return;
    	this.ctx = e.getContext('2d');
    }

    processKeyDown(e: KeyboardEvent)
    {
    	e.preventDefault();
    	if(e.repeat) return;
    	this.toggleKey(e);
    }

    processKeyUp(e: KeyboardEvent)
    {
    	e.preventDefault();
    	this.toggleKey(e);
    }

    toggleKey(e: KeyboardEvent)
    {
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
    		this.setState({player: statePlayer});
    	}
    	this.setState({controls: newControls});
    }

    gameRender()
    {
    	
    	this.redraw();
    	requestAnimationFrame(this.gameRender);
    }

    redraw()
    {
    	this.ctx.clearRect(0, 0, this.state.width, this.state.height);

		var my_gradient=this.ctx.createLinearGradient(0, 0, this.state.map.length, 0);
		my_gradient.addColorStop(0, "#7777ff");
		my_gradient.addColorStop(0.33, "#f95555");
        my_gradient.addColorStop(0.5, "#22a933");
		my_gradient.addColorStop(0.67, "#9999f9");
        my_gradient.addColorStop(1, "#fc4737");
		this.ctx.fillStyle=my_gradient;
		this.ctx.fillRect(0, 0, this.state.map.length, this.state.height);

		this.ctx.fillStyle = "#2222f9";
        let floor = this.state.map.floor;
        for(let i in floor)
        {
            let platform = floor[i];
            this.ctx.fillRect(platform.from, 315, (platform.to - platform.from), 20);
        }

        this.ctx.fillStyle = "#ddddff";
        for(let i in floor)
        {
            let platform = floor[i];
            this.ctx.fillRect(platform.from, 313, (platform.to - platform.from), 2);
        }

        // DEBUG
        // this.ctx.fillStyle = "#4cf747"; this.ctx.fillRect(this.state.player.x + 45, 335, 2, 20);
        // for(let i = 0, len = this.state.map.fall.length; i < len; i++) { this.ctx.fillStyle = (this.state.map.fall[i]) ? "#fc4737" : "#4cf747"; this.ctx.fillRect(i, 335, i + 1, 20); }
        this.redrawPlayer();
    }

    redrawPlayer()
    {
    	if(!this.state.loaded) return;
    	let img;
    	if(this.state.player.jump > 15)
    	{
    		img = 'sonic-jump' + this.state.player.frame.toString();
    	}
    	else
    	{
    		img = (this.state.player.right) ? 'sonic-right' + this.state.player.frame.toString() : 'sonic-left' + this.state.player.frame.toString();
    	}
    	let el: HTMLImageElement = document.getElementById(img) as HTMLImageElement;
    	this.ctx.drawImage(el, this.state.player.x, this.state.player.y - this.state.player.jump);
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
    	let width = (!this.state.loaded) ? 0 : this.state.width;
    	let height = (!this.state.loaded) ? 0 : this.state.height;
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
        const canvasStyle = {
            marginLeft: '-' + this.state.map.offset.toString() + 'px'
        };
        return <div>
        			<canvas className="game" style={canvasStyle} ref={(e) => this.processLoad(e)} onClick={(e) => this.toggleFullScreen(e)} width={this.state.map.length} height={height}></canvas>
        			{rows}
    			</div>;
    }
}
