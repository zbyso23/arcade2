import * as React from 'react';
import { IStore, IStoreContext, IGameMapState, IPlayerState } from '../reducers';
import { Store } from 'redux';
import { PLAYER_UPDATE } from '../actions/playerActions';
import { GAME_MAP_UPDATE } from '../actions/gameMapActions';

declare let imageType:typeof Image; 

export interface IGameMapNextProps {
    onNextMap?: () => any;
}

export interface IGameMapNextState 
{
    loaded?: boolean;
    width?: number;
    height?: number;
    player?: IPlayerState;
    map?: IGameMapNextState;
}

function mapStateFromStore(store: IStore, state: IGameMapNextState): IGameMapNextState {
    if(!store.world.loaded) return state;
    let newState = Object.assign({}, state, {player: store.world.player, map: store.world.maps[store.world.activeMap]});
    return newState;
}

export default class GameMapNext extends React.Component<IGameMapNextProps, IGameMapNextState> {

    static contextTypes: React.ValidationMap<any> = 
    {
        store: React.PropTypes.object
    }
    
    context: IStoreContext;
    unsubscribe: Function;


    constructor(props: IGameMapNextProps) {
        super(props);
        this.state = { 
        	loaded: false, 
        	width: 0, 
        	height: 0,
        	player: null,
            map: null
        };

        this.procedNextMap = this.procedNextMap.bind(this);
    }

    componentDidMount() 
    {
        let storeState = this.context.store.getState();
        this.setStateFromStore();
        
        this.unsubscribe = this.context.store.subscribe(this.setStateFromStore.bind(this));

    	let width = window.innerWidth;
    	let height = 150;
    	window.onresize = function(e: any)
    	{
    		this.resize();
    	}.bind(this);

        let newState = Object.assign({}, this.state);
        newState.loaded = true;
        newState.width = width;
        newState.height = height;
        this.setState(mapStateFromStore(this.context.store.getState(), newState));
        storeState.sound.sound.loadList(['music-win']).then(() => {
            let music = 'music-win';
            storeState.sound.sound.playBackground(music);
        });

    }

    componentWillUnmount() 
    {
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
    	let height = 150;
        this.setState({width: width, height: height});
    }

    procedNextMap (e: any)
    {
        e.preventDefault();
        this.props.onNextMap();
    }

    render() {
        let storeState = this.context.store.getState();
    	let width = (this.state.loaded) ? this.state.width : 0;
    	let height = (this.state.loaded) ? this.state.height : 0;
        let divStyle = {};
        let divNextMap = null;
        let divTitle = null;
        let divScore = null;
        let divStars = null;
        let divLives = null;
        if(this.state.loaded)
        {
            divTitle = <h2>You Win!</h2>;
            divScore = <div className="game-win-score">Next Map: {storeState.world.activeMap}</div>;
            divStars = <div className="game-win-stars">x {this.state.player.character.stars}</div>;
            divLives = <div className="game-win-lives">Lives: {this.state.player.lives}</div>;
            divNextMap = <div className="game-win-new" onClick={(e) => this.procedNextMap(e)}>Next Map</div>;
        }
        return <div className="game-win" style={divStyle}>
                {divTitle}
                {divScore}
                {divStars}
                {divLives}
                {divNextMap}
    			</div>;
    }
}