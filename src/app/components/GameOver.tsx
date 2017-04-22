import * as React from 'react';
import { IStore, IStoreContext } from '../reducers';
import { Store } from 'redux';
import { IPlayerState } from '../reducers/IPlayerState';
import { IGameMapState } from '../reducers/IGameMapState';
import { PLAYER_UPDATE } from '../actions/playerActions';
import { GAME_MAP_UPDATE } from '../actions/gameMapActions';

declare var imageType:typeof Image; 

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
    let newState = Object.assign({}, state, {player: store.player, map: store.map});
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
        let divScore = null;
        if(this.state.loaded)
        {
            divScore = <div className="game-over-score">Score: {this.state.player.score}</div>;
            divNewGame = <div className="game-over-new" onClick={(e) => this.procedPlayAgain(e)}>Play Again</div>;
        }
        return <div className="game-over" style={divStyle}>
                 {divScore}
                 {divNewGame}
    			</div>;
    }
}