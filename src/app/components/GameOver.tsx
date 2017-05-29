import * as React from 'react';
import { IStore, IStoreContext, IGameMapState, IPlayerState } from '../reducers';
import { Store } from 'redux';
import { PLAYER_UPDATE } from '../actions/playerActions';
import { GAME_MAP_UPDATE } from '../actions/gameMapActions';

declare let imageType:typeof Image; 

export interface IGameOverProps {
    onPlayAgain?: () => any;
}

export interface IGameOverState 
{
    loaded?: boolean;
    width?: number;
    height?: number;
    player?: IPlayerState;
    map?: IGameMapState;
}

function mapStateFromStore(store: IStore, state: IGameOverState): IGameOverState {
    if(!store.world.loaded) return state;
    let newState = Object.assign({}, state, {player: store.world.player, map: store.world.maps[store.world.activeMap]});
    return newState;
}

export default class GameOver extends React.Component<IGameOverProps, IGameOverState> {

    static contextTypes: React.ValidationMap<any> = 
    {
        store: React.PropTypes.object
    }
    
    context: IStoreContext;
    unsubscribe: Function;


    constructor(props: IGameOverProps) {
        super(props);
        this.state = { 
        	loaded: false, 
        	width: 0, 
        	height: 0,
        	player: null,
            map: null
        };

        this.procedPlayAgain = this.procedPlayAgain.bind(this);
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
        storeState.sound.sound.loadList(['music-gameover']).then(() => {
            let music = 'music-gameover';
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

    procedPlayAgain (e: any)
    {
        e.preventDefault();
        this.props.onPlayAgain();
    }

    render() {
    	let width = (this.state.loaded) ? this.state.width : 0;
    	let height = (this.state.loaded) ? this.state.height : 0;
        let divStyle = {};
        let divNewGame = null;
        let divTitle = null;
        let divScore = null;
        let divStars = null;
        if(this.state.loaded)
        {
            divTitle = <h2>Game Over</h2>;
            divScore = <div className="game-over-score">Level: {this.state.player.character.level} ({this.state.player.character.experience})</div>;
            divStars = <div className="game-over-stars">x {this.state.player.character.stars}</div>;
            divNewGame = <div className="game-over-new" onClick={(e) => this.procedPlayAgain(e)}>Play Again</div>;
        }
        return <div className="game-over" style={divStyle}>
                {divTitle}
                {divScore}
                {divStars}
                {divNewGame}
    			</div>;
    }
}