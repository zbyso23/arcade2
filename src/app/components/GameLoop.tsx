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
    dirChanged?: number;
}


export interface IGameLoopState 
{
    loaded?: boolean;
    sound?: ISoundState;
    player?: IPlayerState;
    map?: IGameMapState;
    mapSize?: number;
    controls?: IGameLoopControlsState;
    controlsLast?: IGameLoopControlsState;
}

function mapStateFromStore(store: IStore, state: IGameLoopState): IGameLoopState {
    let newState = Object.assign({}, state, {sound: store.sound, player: store.player, map: store.map});
    if(!state.loaded) newState.mapSize = ((newState.map.length - 2) * newState.map.tileX);
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
    private lastTimeLag: number = 0;

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
                right: false,
                dirChanged: 0
            }
        };

        this.loop = this.loop.bind(this);
        this.run = this.run.bind(this);

        this.handlerKeyUp = this.processKeyUp.bind(this);
        this.handlerKeyDown = this.processKeyDown.bind(this);
    }

    componentDidMount() 
    {
        console.log('gameLoop componentDidMount() ');
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
        console.log('gameLoop run() ', this.state);
        this.timer = setTimeout(this.loop, this.animationTime);
    }

    processKeyDown(e: KeyboardEvent)
    {
        if(e.repeat) 
        {
            let assignKeys = [32, 37, 39, 38, 40];
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
        // console.log('toggleKey', e.keyCode);
        /*
        9 - Tab
        32 - Space
        113 - F2
        37 - ArrowLeft
        39 - ArrowRight
        */
        let assignKeys = [32, 37, 39, 38, 40];
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
            statePlayer.speed *= 0.6;
            newControls.dirChanged = statePlayer.speed * 0.45;
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


    loop()
    {
        
        this.counter++;
        if(this.counter === 1000) this.counter = 0;
        let newTime = new Date();
        // let delta = (((newTime.getSeconds() * 1000) + newTime.getMilliseconds()) - ((this.lastTime.getSeconds() * 1000) + this.lastTime.getMilliseconds()));
        // delta /= 40;
        let delta = 1.1;
        // this.lastTime = newTime;
        // if(delta > 1.5)
        // {
        //     this.lastTimeLag += delta;
        //     console.log('delta lag!', delta);
        //     this.timer = setTimeout(this.animate, this.animationTime);
        //     return;
        // }
        // delta += (this.lastTimeLag < 2.5) ? this.lastTimeLag : 2.5;
        let playerState = this.state.player;
        if(playerState.started)
        {
            if(!playerState.death) this.loopPlayer(delta);
            this.loopEnvironment(delta);
            this.loopEnemies(delta);
        }
        // this.lastTimeLag = 0;
        //if((this.counter % 2) === 0) console.log('delta', delta);
        this.timer = setTimeout(this.loop, this.animationTime);

    }

    loopPlayer(delta: number)
    {
        let statePlayer = this.state.player;
        let statePlayerAttributes = statePlayer.character.attributes;
        let controlsState = this.state.controls;
        let controlsLastState = this.state.controlsLast;
        let stateMap = this.state.map;


        let isJump = (statePlayer.jump !== statePlayer.y);

        let isControlsMove = (controlsState.left || controlsState.right);
        let isControlsJump = (controlsState.up);
        if(isControlsMove)
        {
            let speedMax = (isJump) ? statePlayerAttributes.speed / 1.5 : statePlayerAttributes.speed;
            let speedIncerase = (isJump) ? statePlayerAttributes.speed * 0.07 : statePlayerAttributes.speed * 0.05;
            let speedChange = (isJump) ? statePlayerAttributes.brake * 0.3 : statePlayerAttributes.brake * 0.3;
            speedIncerase = (speedIncerase * delta);
            speedChange = (speedChange * delta);
            let newSpeed = statePlayer.speed;
            newSpeed += speedIncerase;
            if(controlsState.dirChanged > 0)
            {
                controlsState.dirChanged *= 0.25;
                newSpeed -= speedChange;
                if(controlsState.dirChanged <= 0.1)
                {
                    controlsState.dirChanged = 0;
                }
            }
            statePlayer.speed = (newSpeed > speedMax) ? speedMax : newSpeed;
        }

        let speedDecay = (isControlsMove ? 0.95 : 0.7);
        statePlayer.speed *= speedDecay;
        if(statePlayer.speed < 0.1)
        {
            statePlayer.speed = 0;
        }
        statePlayer.x += (statePlayer.right) ? statePlayer.speed : -statePlayer.speed;
        // Shift map - need refactor
        // if(statePlayer.x >= (this.props.width / 2) && statePlayer.x < ((stateMap.length * stateMap.tileX) - (this.props.width / 2)))
        // {
        //     stateMap.offset = Math.max(0, Math.ceil(statePlayer.x - (this.props.width / 2)));
        //     // console.log('stateMap.offset', stateMap.offset);
        // }

        this.setState({controls: controlsState});
        this.context.store.dispatch({type: GAME_MAP_UPDATE, response: stateMap });
        this.context.store.dispatch({type: PLAYER_UPDATE, response: statePlayer });

    }

    loopPlayer2(delta: number)
    {
        let maxJumpHeight = 305;
        let playerState = this.state.player;
        let playerAttributes = playerState.character.attributes;
        let state = this.state;
        let controlsState = this.state.controls;
        let mapState = state.map;
        let speed = playerState.speed;
        let jump = playerState.jumping;
        let bothSide = false;
if((this.counter % 20) === 0 || this.lastTimeLag > 0) console.log('animatePlayer '+this.lastTimeLag.toString(), playerState);

        let isMoving = (controlsState.left || controlsState.right);
        let isJumping = (controlsState.up);

        //Move left-right
        if(isMoving)
        {
            let speedMax = (jump > 0) ? playerAttributes.speed / 1.5 : playerAttributes.speed;
            let speedIncerase = (jump > 0) ? playerAttributes.speed * 0.07 : playerAttributes.speed * 0.05;
            let speedChange = (jump > 0) ? playerAttributes.brake * 0.3 : playerAttributes.brake * 0.3;
            speedIncerase = (speedIncerase * delta);
            speedChange = (speedChange * delta);
            let newSpeed = speed;
            if(controlsState.right)
            {
                if(speed >= 0 && speed < speedMax)
                {
                    newSpeed += speedIncerase;
                }
                else if(speed < 0)
                {
                    newSpeed += speedChange;
                }
                state.player.speed = (newSpeed > speedMax) ? speedMax : newSpeed;
            }
            else
            {
                speedMax *= -1;
                
                if(speed <= 0 && speed > speedMax)
                {
                    newSpeed -= speedIncerase;
                }
                else if(speed > 0)
                {
                    newSpeed -= speedChange;
                }
                state.player.speed = (newSpeed < speedMax) ? speedMax : newSpeed;
            }
        }
        else if(speed !== 0)
        {
            let speedDecrase = (jump > 0) ? playerAttributes.brake * 0.42 : playerAttributes.brake;
            speedDecrase = (speedDecrase * delta);
            if(speed > 0)
            {
                state.player.speed = (speed >= speedDecrase) ? (speed - speedDecrase) : 0;
            }
            else if(speed < 0)
            {
                state.player.speed = (speed <= -speedDecrase) ? (speed + speedDecrase) : 0;
            }
        }
        let newPlayerX = (playerState.x + playerState.speed);
        let newPlayerY = playerState.y;
        if(newPlayerX <= 0 || newPlayerX >= this.state.mapSize)
        {
            newPlayerX = playerState.x
            playerState.speed = 0;
        }
        //Move left-right END

        let x = Math.max(0, Math.floor((newPlayerX + (state.map.tileX * 0.5)) / state.map.tileX));
        let floorX    = state.map.floorHeight[x];
        let floorHeight = (floorX === null) ? 0 : (floorX.height * state.map.tileY);
        let playerFloor = playerState.floor;
        let playerFloorHeight = (playerFloor === null) ? 0 : (playerFloor.height * state.map.tileY);

        //Jumping
        if(isJumping)
        {
            let isJumping = playerState.isJumping;
            let jumpValue = 31 * delta;
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
                jumpValue = jumpValue * delta;
                if((jumpValue + jump) > maxJump) jumpValue -= ((jumpValue + jump) - maxJump);
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
            jump = Math.floor(jump * delta);
        }
        if(jump > 0)
        {
            let jumpFactor = 15.85 * delta;
            jumpFactor *= (controlsState.up) ? Math.cos((jump - playerState.jumpFrom) / maxJumpHeight) : 1;
            let jumpValue = (jump >= jumpFactor) ? jumpFactor : jump;
            jump -= jumpValue;
            // if(state.player.speed > 0)
            // {
            //     state.player.speed = (state.player.speed > 0) ? state.player.speed - 1 : state.player.speed + 1;
            // }
            
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
                    playerState.y = Math.floor((floorX.height) * state.map.tileY);
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
        playerState.x = Math.floor(newPlayerX);
        if(jump === 0)
        {
            playerState.isJumping = false;
            playerState.jumpFrom = 0;
        }
        jump = Math.floor(jump);
        playerState.jumping = jump;
        //Jumping END

        // Shift map - need refactor
        if(playerState.x >= (this.props.width / 2) && playerState.x < ((mapState.length * mapState.tileX) - (this.props.width / 2)))
        {
            mapState.offset = Math.max(0, Math.ceil(playerState.x - (this.props.width / 2)));
            // console.log('mapState.offset', mapState.offset);
        }


        //Handbrake before fix floor definetly :)
        if(playerState.y > (mapState.height * mapState.tileY))
        {
            playerState.y = Math.floor(mapState.height * mapState.tileY);
            playerState.jumping = 0;
            playerState.jumpFrom = 0;
            controlsState.up = false;
        }
        this.setState({controls: controlsState});
        this.context.store.dispatch({type: GAME_MAP_UPDATE, response: mapState });
        this.context.store.dispatch({type: PLAYER_UPDATE, response: playerState });
	}

    loopEnvironment(delta: number)
    {
        let stateMap = this.state.map;
        let statePlayer = this.state.player;
        let stars = stateMap.stars;
        let spikes = stateMap.spikes;
        let x = Math.max(0, Math.floor((statePlayer.x + (stateMap.tileX * 0.5)) / stateMap.tileX));
        //Collect star
        let starCollectFactor = stateMap.tileY * 0.8;
        if(stars[x] !== null && !stars[x].collected)
        {
            // console.log('star on '+x.toString(), stars[x]);
            let starHeight = ((stars[x].y * stateMap.tileY) + stateMap.tileY);
            let isStar = (Math.abs(starHeight - statePlayer.y) <= starCollectFactor);
            if(isStar)
            {
                this.soundOn('sfx-item-star-collected');
                stateMap.stars[x].collected = true;
                stateMap.stars[x].frame = 1;
                this.context.store.dispatch({type: PLAYER_ADD_EXPERIENCE, response: stars[x].value });
                this.context.store.dispatch({type: PLAYER_ADD_STAR, response: 1 });
                // console.log('collect star', stars[x]);
            }
        }

        //Spikes
        let spikeDamageFactor = stateMap.tileY * 0.4;
        if(spikes[x] !== null) 
        {
            let spikeHeight = ((spikes[x].y * stateMap.tileY) + stateMap.tileY);
            let isSpike = (Math.abs(spikeHeight - statePlayer.y) <= spikeDamageFactor);
            if(isSpike) 
            {
                this.soundOn('sfx-player-death');
                this.soundOff('sfx-player-walk');
                statePlayer.death = true;
                statePlayer.frame = 1;
                this.context.store.dispatch({type: PLAYER_UPDATE, response: statePlayer });
                return;
            }
        }

        // Check Exit
        let exitOpenFactor = stateMap.tileY * 0.3;
        for(let i = 0, len = stateMap.exit.length; i < len; i++)
        {
            if(x !== stateMap.exit[i].x)
            {
                continue;
            }
            let exitHeight = ((stateMap.exit[i].y * stateMap.tileY) + stateMap.tileY);
            let isExit = (Math.abs(exitHeight - statePlayer.y) <= exitOpenFactor);
            if(!isExit) continue;
            if(stateMap.exit[i].win) this.props.onProcessWin();
            return;
        }

        //isFall ??
        if(!statePlayer.isJumping && statePlayer.floor === null && false === stateMap.groundFall[x])
        {
            statePlayer.falling = true;
            statePlayer.fall    = Math.floor(statePlayer.y);
        }
    }

    loopEnemies(delta: number)
    {
        let state = this.state;
        let mapState = state.map;
        let enemies = mapState.enemies;
        let playerState = state.player;
        let enemyCollisionFactor = state.map.tileY * 0.6;
        let enemyCollisionFactorX = state.map.tileX * 0.55;
        let xPlayer = Math.max(0, Math.floor((playerState.x + (state.map.tileX * 0.5)) / state.map.tileX));
        let width = this.props.width;
        let skipDetection = false;
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
            let enemyHeightDiff = playerState.y - enemy.height;
            if(!skipDetection && enemyNear && !playerState.death && Math.abs(enemyHeightDiff) < enemyCollisionFactor)
            {
                // let enemyHeight = (enemy.height + state.map.tileY);
                // let enemyHeightDiff = (enemy.height + enemyHeight - playerState.y);
                // if(enemyHeight >= (playerState.y - enemyCollisionFactor) && enemyHeight <= (playerState.y + enemyCollisionFactor))
                console.log('enemyHeightDiff', enemyHeightDiff);
                // if(Math.abs(enemyHeightDiff) < enemyCollisionFactor)
                // {
                    
                    console.log('enemyHeightDiff', enemyCollisionFactor);
                    if(enemyHeightDiff >= 0 && !this.state.controls.up)
                    {
                        this.soundOn('sfx-player-death');
                        this.soundOff('sfx-player-walk');
                        playerState.death = true;
                        playerState.frame = 1;
                        skipDetection = true;
                        this.context.store.dispatch({type: PLAYER_UPDATE, response: playerState });
                    }
                    else
                    {
                        this.soundOn('sfx-enemy-death');
                        enemy.frame = 1;
                        enemy.die = true;
                        skipDetection = true;
                        this.context.store.dispatch({type: PLAYER_ADD_EXPERIENCE, response: enemy.experience });
                    }
                // }
            }
            
            // Enemy following
            if(x !== xPlayer)
            {
                if(enemy.following.enabled && [enemy.from, enemy.to].indexOf(x) === -1 && Math.abs(x - xPlayer) <= enemy.following.range)
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