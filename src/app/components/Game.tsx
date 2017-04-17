import * as React from 'react';

declare var imageType:typeof Image; 

export interface GameProps {
    name: string;
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
    }
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
        		x: 10,
        		y: 220,
        		jump: 0,
        		speed: 0,
        		right: true,
        		frame: 1
        	}
        };

        this.processLoad = this.processLoad.bind(this);
        this.gameRender = this.gameRender.bind(this);
        this.redraw = this.redraw.bind(this);
        this.processKeyDown = this.processKeyDown.bind(this);
        this.processKeyUp = this.processKeyUp.bind(this);
    }

    componentDidMount() 
    {
    	let width = window.innerWidth;
    	let height = window.innerHeight;
        this.setState({width: width, height: height});
    	window.addEventListener('keydown', this.processKeyDown.bind(this));
    	window.addEventListener('keyup', this.processKeyUp.bind(this));
    	this.timer = setTimeout(this.animate.bind(this), this.animationTime);
        requestAnimationFrame(this.gameRender);
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
    	let speed = statePlayer.speed;
    	let speedMax = 14;
    	let controls = this.state.controls;

		let speedDecrase = 0.9;  	
		let speedIncerase = 0.7;
		let speedChange = 1.4;
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
    		if(jump >= 235)
    		{
    			stateControls.up = false;
    		}
    		else
    		{
    			jump += 11.7;
    		}
    	}
    	else
    	{
    		if(jump > 0)
    		{
    			let jumpFactor = 6.2 - Math.abs(this.state.player.speed) / 7;
    			jump = (jump >= jumpFactor) ? jump - jumpFactor : 0;
    		}
    	}
    	statePlayer.jump = jump;
    	let newPlayerX = (statePlayer.x + statePlayer.speed);
    	if(newPlayerX <= 0 || newPlayerX >= this.state.width) 
    	{
    		newPlayerX = statePlayer.x
    		statePlayer.speed = 0
    	}
		statePlayer.x = newPlayerX;
		if(this.state.player.speed > 0 || this.state.player.speed < 0 || this.state.player.jump > 0)
		{
			let maxFrame = (this.state.player.jump > 0) ? 9 : 7;
			statePlayer.frame = (statePlayer.frame >= maxFrame) ? 1 : statePlayer.frame + 1;
		}
		else
		{
			statePlayer.frame = (statePlayer.frame === 1 || statePlayer.frame >= 7) ? 1 : statePlayer.frame + 1;
		}
		this.setState({player: statePlayer, controls: stateControls});
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

		var my_gradient=this.ctx.createLinearGradient(0, 0, this.state.width, 0);
		my_gradient.addColorStop(0, "#7777ff");
		my_gradient.addColorStop(0.5, "#f95555");
		my_gradient.addColorStop(1, "white");
		this.ctx.fillStyle=my_gradient;
		this.ctx.fillRect(0, 0, this.state.width, this.state.height);

		this.ctx.fillStyle = "#2222f9";
		this.ctx.fillRect(0, 290, this.state.width, 295);
    	this.redrawPlayer();
    }

    redrawPlayer()
    {
    	if(!this.state.loaded) return;
    	let img;
    	if(this.state.player.jump > 0)
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
        return <div>
        			<canvas className="game" ref={(e) => this.processLoad(e)} width={width} height={height}></canvas>
        			{rows}
    			</div>;
    }
}
