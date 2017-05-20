import * as React from 'react';
import { IStore, IStoreContext, ISoundState, IGameMapState, IGameMapPlatformState, IPlayerState } from '../reducers';
import { Store } from 'redux';
import { Sprites, ISprite, ISpriteBlock } from '../libs/Sprites';
import { PLAYER_UPDATE } from '../actions/playerActions';
import { GAME_MAP_UPDATE } from '../actions/gameMapActions';

export interface IGameAnimationsProps {
	sprites?: Sprites;
	width?: number;
	height?: number;
	onProcessDeath?: () => any;
}

export interface IGameAnimationsState 
{
    loaded?: boolean;
    player?: IPlayerState;
    map?: IGameMapState;
}

function mapStateFromStore(store: IStore, state: IGameAnimationsState): IGameAnimationsState {
    let newState = Object.assign({}, state, {player: store.player, map: store.map});
    return newState;
}

export default class GameAnimations extends React.Component<IGameAnimationsProps, IGameAnimationsState> {

    private cached: { [id: string]: HTMLImageElement } = {};

    static contextTypes: React.ValidationMap<any> = 
    {
        store: React.PropTypes.object
    }
    
    context: IStoreContext;
    unsubscribe: Function;

	private animationTime: number = 30;
	private timer: any;
	private counter: number = 0;

    constructor(props: IGameAnimationsProps) {
        super(props);
        this.state = { 
        	loaded: false, 
        	player: null,
            map: null
        };

        this.animate = this.animate.bind(this);
        this.run = this.run.bind(this);
    }

    componentDidMount() 
    {
        let storeState = this.context.store.getState();
        this.unsubscribe = this.context.store.subscribe(this.setStateFromStore.bind(this));
        let newState = Object.assign({}, this.state);
        this.setState(mapStateFromStore(this.context.store.getState(), newState));
        this.run();
    }

    componentWillUnmount() 
    {
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
        this.timer = setTimeout(this.animate, this.animationTime);
    }


    animate()
    {
        this.counter++;
        if(this.counter === 1000) this.counter = 0;
        if(this.state.player.started)
        {
            if(this.state.player.falling)
            {
                this.animateFalling();
            }
            else if(this.state.player.death)
            {
                this.animateDeath();
                this.animateEnemies();
            }
            else
            {
                this.animateEnemies();
                this.animatePlayer();
            }
        }
        this.animateEnvironment();
        this.timer = setTimeout(this.animate, this.animationTime);
    }

    animateFalling()
    {
        let playerState = this.state.player;
        if(playerState.fall >= this.props.height)
        {
            this.props.onProcessDeath();
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

        if(playerState.frame === this.props.sprites.getFrames('ninja-explode'))
        {
            this.props.onProcessDeath();
            return;
        }
        playerState.frame += 1;
        this.context.store.dispatch({type: PLAYER_UPDATE, response: playerState });
    }

    animatePlayer()
    {

        let storeState = this.context.store.getState();
    	let statePlayer = Object.assign({}, storeState.player);
        let isJump = (statePlayer.y !== statePlayer.jump);
        // console.log('animatePlayer', statePlayer.speed);
        // Anim Frames
        if(statePlayer.speed === 0 && !isJump)
        {
        	statePlayer.frame = (statePlayer.frame === 1 || statePlayer.frame >= 10) ? 1 : statePlayer.frame + 1;
        }
        else
        {
            let maxFrame = (isJump) ? this.props.sprites.getFrames('ninja-jump') : this.props.sprites.getFrames('ninja-left');
            let minFrame = (isJump) ? 1 : 10;
            // console.log('animatePlayer MinMaxframe', [statePlayer.y.toString(), statePlayer.jump.toString()].join(' x '));
            // console.log('animatePlayer frame before', statePlayer.frame);
            // console.log('animatePlayer wtf?', this.props.sprites.getFrames('ninja-left'));
            statePlayer.frame = (statePlayer.frame >= maxFrame) ? minFrame : statePlayer.frame + 1;
            // console.log('animatePlayer frame', statePlayer.frame);
        }
        this.context.store.dispatch({type: PLAYER_UPDATE, response: statePlayer });
	}

    animateEnemies()
    {
        let state = this.state;
        let mapState = state.map;
        let enemies = mapState.enemies;
        let playerState = state.player;
        let xPlayer = Math.max(0, Math.floor((playerState.x + (mapState.tileX * 0.5)) / mapState.tileX));
        for(let i = 0, len = enemies.length; i < len; i++)
        {
            let enemy = enemies[i];
            if(Math.abs(enemy.x - playerState.x) >= this.props.width) continue;
            if(enemy.death) 
            {
                enemy.respawn.time++;
                if(enemy.respawn.time >= enemy.respawn.timer && Math.abs(playerState.x - enemy.x) >= (mapState.tileX * 5))
                {
                    enemy.respawn.time = 0;
                    enemy.death = false;
                    enemy.frame = 1;
                }
                continue;
            }

            let maxFrame = (enemy.die) ? this.props.sprites.getFrames('enemy-explode') : this.props.sprites.getFrames('enemy-left');
            let minFrame = (enemy.die) ? this.props.sprites.getFrames('enemy-explode') : 5;
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

            if((this.counter % 2) === 0)
            {
                enemy.frame = (enemy.frame >= maxFrame) ? minFrame : enemy.frame + 1;
            }
        }
        mapState.enemies = enemies;
        this.context.store.dispatch({type: GAME_MAP_UPDATE, response: mapState });
    }

    animateEnvironment()
    {
        let mapState = this.state.map;
        let stars = mapState.stars;
        let gridWidthLimit = Math.ceil(this.props.width / mapState.tileX);
        let playerGridX = Math.ceil(this.state.player.x / mapState.tileX);

        // Anim Clouds
        if(mapState.clouds.length > 0)
        {
	        let newClouds = [];
	        let lastCloud = mapState.clouds.length - 1;
	        for(let i in mapState.clouds)
	        {
	            let cloud = mapState.clouds[i];
	            cloud.x -= (cloud.speed);
	            if(parseInt(i) === 0 && cloud.x < -150) 
	            {
	                let height = mapState.tileY / 2
	                let cloudHeight = height + (height * (Math.random() * 2));
	                let cloudSpeed  = (Math.random() * 0.05) + 1.1;
	                let fromX = (mapState.clouds[lastCloud].x + (Math.ceil(Math.random() * 100) + 100)); 
	                cloud.x = fromX;
	                cloud.y = cloudHeight;
	                cloud.speed = cloudSpeed;
	            }
	            newClouds.push(cloud);
	        }
	        mapState.clouds = newClouds;
        }

        // Anim stars
        for(let i in stars)
        {
            if(stars[i] === null) continue;
            let star = stars[i];
            let index = parseInt(i);
            if(!star.collected && Math.abs(index - playerGridX) > gridWidthLimit) continue;
            if(!star.collected)
            {
                star.frame = (star.frame === this.props.sprites.getFrames('item-star')) ? 1 : star.frame + 1;
            }
            else if(star.collected && (star.frame === this.props.sprites.getFrames('item-star-explode')))
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

    render()
    {
    	return <div></div>;
    }
}