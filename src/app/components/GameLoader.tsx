import * as React from 'react';
import { IStore, IStoreContext } from '../reducers';
import { Store } from 'redux';
import { IPlayerState } from '../reducers/IPlayerState';
import { IGameMapState } from '../reducers/IGameMapState';
import { PLAYER_UPDATE } from '../actions/playerActions';
import { GAME_MAP_UPDATE } from '../actions/gameMapActions';

declare var imageType:typeof Image; 

export interface IGameLoaderProps {
}

export interface IGameLoaderState 
{
    loaded?: boolean;
    width?: number;
    height?: number;
    player?: IPlayerState;
    map?: IGameMapState;
}

function mapStateFromStore(store: IStore, state: IGameLoaderState): IGameLoaderState {
    let newState = Object.assign({}, state, {player: store.player, map: store.map});
    return newState;
}

export default class GameLoader extends React.Component<IGameLoaderProps, IGameLoaderState> {

    static contextTypes: React.ValidationMap<any> = 
    {
        store: React.PropTypes.object
    }
    
    context: IStoreContext;
    unsubscribe: Function;

    constructor(props: IGameLoaderProps) {
        super(props);
        this.state = { 
        	loaded: false, 
        	width: 0, 
        	height: 0,
        	player: null,
            map: null
        };
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

    render() {
    	let width = (this.state.loaded) ? this.state.width : 0;
    	let height = (this.state.loaded) ? this.state.height : 0;
        let divStyle = {};
        let divTitle = null;
        let divScore = null;
        let divStars = null;
        let divLives = null;
        let divSpinner = <div className="spinner" key="spinner">
                            <div className="cube1" key="spinner-cube1"></div>
                            <div className="cube2" key="spinner-cube2"></div>
                            <div className="cube3" key="spinner-cube3"></div>
                            <div className="cube4" key="spinner-cube4"></div>
                        </div>;
        if(this.state.loaded)
        {
            divTitle = <h2>Loading map</h2>;
            divScore = <div className="game-loader-score">Level: {this.state.player.character.level} ({this.state.player.character.experience})</div>;
            divStars = <div className="game-loader-stars">x {this.state.player.character.stars}</div>;
            divLives = <div className="game-loader-lives">Lives: {this.state.player.lives}</div>;
        }
        let loaderClass = "game-loader";
        return <div className={loaderClass} style={divStyle}>
                {divTitle}
                {divScore}
                {divStars}
                {divLives}
                {divSpinner}
    			</div>;
    }
}