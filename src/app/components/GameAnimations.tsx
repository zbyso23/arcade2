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
}

function mapStateFromStore(store: IStore, state: IGameAnimationsState): IGameAnimationsState {
    // let newState = Object.assign({}, state, {player: store.player, map: store.map});
    // return newState;
    return state;
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
        	loaded: false
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
        let storeState = this.context.store.getState();
        let statePlayer = storeState.player;
        this.counter++;
        if(this.counter === 1000) this.counter = 0;
        if(statePlayer.started)
        {
            if(statePlayer.falling)
            {
                this.animateFalling();
            }
            else if(statePlayer.death)
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
        let storeState = this.context.store.getState();
        let statePlayer = storeState.player;
        if(statePlayer.fall >= this.props.height)
        {
            this.props.onProcessDeath();
            return;
        }

        let fall = 0;
        fall += (statePlayer.fall === 0) ? 1.5 : (statePlayer.fall / 12);
        statePlayer.fall += fall;
        statePlayer.y    += fall;
        this.context.store.dispatch({type: PLAYER_UPDATE, response: statePlayer });
    }

    animateDeath()
    {
        let storeState = this.context.store.getState();
        let statePlayer = storeState.player;

        if(statePlayer.frame === this.props.sprites.getFrames('ninja-explode'))
        {
            this.props.onProcessDeath();
            return;
        }
        statePlayer.frame += 1;
        this.context.store.dispatch({type: PLAYER_UPDATE, response: statePlayer });
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
            let maxFrame = (isJump) ? this.props.sprites.getFrames('ninja-jump-left') : this.props.sprites.getFrames('ninja-left');
            let minFrame = (isJump) ? 1 : 10;
            // console.log('animatePlayer MinMaxframe', [statePlayer.y.toString(), statePlayer.jump.toString()].join(' x '));
            // console.log('animatePlayer frame before', statePlayer.frame);
            // console.log('animatePlayer wtf?', this.props.sprites.getFrames('ninja-left'));
            statePlayer.frame = (statePlayer.frame >= maxFrame) ? minFrame : statePlayer.frame + 1;
        }
        this.context.store.dispatch({type: PLAYER_UPDATE, response: statePlayer });
	}

    animateEnemies()
    {
        let storeState = this.context.store.getState();
        let stateMap = Object.assign({}, storeState.map);
        let statePlayer = storeState.player;
        let enemies = stateMap.enemies;

        let xPlayer = Math.max(0, Math.floor((statePlayer.x + (stateMap.tileX * 0.5)) / stateMap.tileX));
        for(let i = 0, len = enemies.length; i < len; i++)
        {
            let enemy = enemies[i];
            if(Math.abs(enemy.x - statePlayer.x) >= this.props.width) continue;
            if(enemy.death) 
            {
                enemy.respawn.time++;
                if(enemy.respawn.time >= enemy.respawn.timer && Math.abs(statePlayer.x - enemy.x) >= (stateMap.tileX * 5))
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
        stateMap.enemies = enemies;
        this.context.store.dispatch({type: GAME_MAP_UPDATE, response: stateMap });
    }

    animateEnvironment()
    {
        let storeState = this.context.store.getState();
        let stateMap = Object.assign({}, storeState.map);
        let statePlayer = storeState.player;

        let stars = stateMap.stars;
        let gridWidthLimit = Math.ceil(this.props.width / stateMap.tileX);
        let playerGridX = Math.ceil(statePlayer.x / stateMap.tileX);

        // Anim Clouds
        if(stateMap.clouds.length > 0)
        {
	        let newClouds = [];
	        let lastCloud = stateMap.clouds.length - 1;
	        for(let i in stateMap.clouds)
	        {
	            let cloud = stateMap.clouds[i];
	            cloud.x -= (cloud.speed);
	            if(parseInt(i) === 0 && cloud.x < -150) 
	            {
	                let height = stateMap.tileY / 2
	                let cloudHeight = height + (height * (Math.random() * 2));
	                let cloudSpeed  = (Math.random() * 0.05) + 1.1;
	                let fromX = (stateMap.clouds[lastCloud].x + (Math.ceil(Math.random() * 100) + 100)); 
	                cloud.x = fromX;
	                cloud.y = cloudHeight;
	                cloud.speed = cloudSpeed;
	            }
	            newClouds.push(cloud);
	        }
	        stateMap.clouds = newClouds;
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
                stateMap.stars[index] = null;
            }
            else
            {
                star.frame++;
            }
        }

        // Anim exits
        for(let i = 0, len = stateMap.exit.length; i < len; i++)
        {
            let exit = stateMap.exit[i];
            if(exit.blocker === null)
            {
                stateMap.exit[i].type.frame = (exit.type.frame === this.props.sprites.getFrames(exit.type.name)) ? 1 : exit.type.frame + 1;
            }
            else if(!exit.blocker.destroyed)
            {
                stateMap.exit[i].blocker.frame = 1;
            }
            else if(exit.blocker.destroyed && (stateMap.exit[i].blocker.frame === this.props.sprites.getFrames(stateMap.exit[i].blocker.name)))
            {
                stateMap.exit[i].blocker = null;
            }
            else
            {
                stateMap.exit[i].blocker.frame++;
            }
        }

            // if(!star.collected)
            // {
            //     star.frame = (star.frame === this.props.sprites.getFrames('item-star')) ? 1 : star.frame + 1;
            // }
            // else if(star.collected && (star.frame === this.props.sprites.getFrames('item-star-explode')))
            // {
            //     stateMap.stars[index] = null;
            // }
            // else
            // {
            //     star.frame++;
            // }

        stateMap.stars = Object.assign({}, stars);
        this.context.store.dispatch({type: GAME_MAP_UPDATE, response: stateMap });
    }

    render()
    {
    	return <div></div>;
    }
}