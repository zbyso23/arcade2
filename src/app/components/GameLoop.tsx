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
import { GAME_MAP_UPDATE } from '../actions/gameMapActions';
import Sound from '../Sound/Sound';

export interface IGameLoopProps {
	width?: number;
	height?: number;
    onProcessWin?: () => any;
}

export interface IGameLoopControlsState {
    up?: boolean;
    down?: boolean;
    left?: boolean;
    right?: boolean;
}


export interface IGameLoopState 
{
    loaded?: boolean;
    sound?: ISoundState;
    player?: IPlayerState;
    map?: IGameMapState;
    mapSize?: number;
    controls?: IGameLoopControlsState;
}

function mapStateFromStore(store: IStore, state: IGameLoopState): IGameLoopState {
    let newState = Object.assign({}, state, {sound: store.sound, player: store.player, map: store.map});
    newState.mapSize = ((newState.map.length - 2) * newState.map.tileX);
    return newState;
}

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

    constructor(props: IGameLoopProps) {
        super(props);
        this.state = { 
        	loaded: false, 
            sound: null,
        	player: null,
            map: null,
            mapSize: 0,
            controls: {
                up: false,
                down: false,
                left: false,
                right: false
            }
        };

        this.animate = this.animate.bind(this);
        this.run = this.run.bind(this);

        this.handlerKeyUp = this.processKeyUp.bind(this);
        this.handlerKeyDown = this.processKeyDown.bind(this);
    }

    componentDidMount() 
    {
        let storeState = this.context.store.getState();
        this.unsubscribe = this.context.store.subscribe(this.setStateFromStore.bind(this));
        let newState = Object.assign({}, this.state);
        this.setState(mapStateFromStore(this.context.store.getState(), newState));
        window.addEventListener('keydown', this.handlerKeyDown);
        window.addEventListener('keyup', this.handlerKeyUp);
        this.run();
    }

    componentWillUnmount() 
    {
        window.removeEventListener('keydown', this.handlerKeyDown);
        window.removeEventListener('keyup', this.handlerKeyUp);
        clearTimeout(this.timer);
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

    run ()
    {
        this.lastTime = new Date();
        this.timer = setTimeout(this.animate, this.animationTime);
    }

    processKeyDown(e: KeyboardEvent)
    {
        if(e.repeat) 
        {
            let assignKeys = [32, 37, 39];
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
        let assignKeys = [32, 37, 39];
        if(assignKeys.indexOf(e.keyCode) === -1) return;
        e.preventDefault();

        if(!this.state.player.started) 
        {
            let statePlayer = this.state.player;
            statePlayer.started = true;
            this.context.store.dispatch({type: PLAYER_UPDATE, response: statePlayer });
        }
        
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


    animate()
    {
        this.counter++;
        let newTime = new Date();
        let delta = (((newTime.getSeconds() * 1000) + newTime.getMilliseconds()) - ((this.lastTime.getSeconds() * 1000) + this.lastTime.getMilliseconds()));
        delta /= 30;
        this.lastTime = newTime;
        if(this.counter === 1000) this.counter = 0;
        let playerState = this.state.player;
        if(playerState.started)
        {
            this.animateEnemies(delta);
            if(!playerState.death) this.animatePlayer(delta);
        }
        this.timer = setTimeout(this.animate, this.animationTime);
    }

    animatePlayer(delta: number)
    {
        let maxJumpHeight = 305;
        let playerState = this.state.player;
        let playerAttributes = playerState.character.attributes;
        let state = this.state;
        let controlsState = this.state.controls;
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
                    state.player.speed += (speedIncerase * delta);
                }
                else if(speed < 0)
                {
                    state.player.speed += (speedChange * delta);
                }
            }
            else
            {
                speedMax *= -1;
                if(speed <= 0 && speed > speedMax)
                {
                    state.player.speed -= (speedIncerase * delta);
                }
                else if(speed > 0)
                {
                    state.player.speed -= (speedChange * delta);
                }
            }
        }
        else
        {
            let speedDecrase = (jump > 0) ? playerAttributes.brake * 0.42 : playerAttributes.brake;
            speedDecrase *= delta;
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
        if(newPlayerX <= 0 || newPlayerX >= this.state.mapSize)
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
            let jumpValue = 32 * delta;
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
            let jumpFactor = 15.85 * delta;
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
                if(mapState.exit[i].win) this.props.onProcessWin();
                return;
            }
        }

        if(playerState.x >= (this.props.width / 2) && playerState.x < ((this.state.map.length * this.state.map.tileX) - (this.props.width / 2)))
        {
            mapState.offset = Math.max(0, Math.ceil(playerState.x - (this.props.width / 2)));
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

    animateEnemies(delta: number)
    {
        let state = this.state;
        let mapState = state.map;
        let enemies = mapState.enemies;
        let playerState = state.player;
        let enemyCollisionFactor = state.map.tileY * 0.6;
        let enemyCollisionFactorX = state.map.tileX * 0.55;
        let xPlayer = Math.max(0, Math.floor((playerState.x + (state.map.tileX * 0.5)) / state.map.tileX));
        let width = this.props.width;
        for(let i = 0, len = enemies.length; i < len; i++)
        {
            let enemy = enemies[i];
            if(Math.abs(enemy.x - playerState.x) >= width) continue;
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
            let speed = enemy.speed * delta;
            let newEnemyX = (enemy.right) ? (enemy.x + speed) : (enemy.x - speed);
            x = Math.max(0, Math.floor((newEnemyX + (mapState.tileX * 0.5)) / mapState.tileX));
            enemy.xGrid = x;
            enemy.x = newEnemyX;

            let enemyNear   = (Math.abs(newEnemyX - playerState.x) >= enemyCollisionFactorX) ? false : true;

            // Enemy collision check
            if(enemyNear && !playerState.death)
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

    render()
    {
    	return <div></div>;
    }
}