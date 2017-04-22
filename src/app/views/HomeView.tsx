//LoginView
import * as React from 'react';
import { Link } from 'react-router';
import Hello from '../components/Hello';
import Game from '../components/Game';
import GameOver from '../components/GameOver';
import StatusBar from '../components/StatusBar';
import { IStore, IStoreContext } from '../reducers';
import { PLAYER_UPDATE, PLAYER_CLEAR } from '../actions/playerActions';
import { GAME_MAP_UPDATE, GAME_MAP_CHANGE_LENGTH } from '../actions/gameMapActions';

export interface IHomeState 
{
    loaded?: boolean;
    gameOver?: boolean;
}


function mapStateFromStore(store: IStore, state: IHomeState): IHomeState 
{
    return { 
        loaded: true,
        gameOver: state.gameOver
    };
}

export default class HomeView extends React.Component<any, IHomeState> 
{
    static contextTypes: React.ValidationMap<any> = 
    {
        store: React.PropTypes.object
    }
    
    context: IStoreContext;
    unsubscribe: Function;

    constructor(props: any) 
    {
        super(props);

        this.state = { loaded: false, gameOver: false };
        this.onPlayerDeath = this.onPlayerDeath.bind(this);
        this.onPlayAgain = this.onPlayAgain.bind(this);
    }
    
    componentDidMount() 
    {

        let storeState = this.context.store.getState();
        this.setStateFromStore();
        
        this.unsubscribe = this.context.store.subscribe(this.setStateFromStore.bind(this));
        this.generateRandomMap();
        let statePlayer = storeState.player;
        statePlayer.lives = 1;
        statePlayer.score = 0;
        this.context.store.dispatch({type: PLAYER_UPDATE, response: statePlayer });
        this.setState({loaded: true});
    }


    generateRandomMap()
    {
        let storeState = this.context.store.getState();
        let mapLength = 14000;
        this.context.store.dispatch({type: GAME_MAP_CHANGE_LENGTH, response: mapLength });
        let mapState = storeState.map;
        let playerState = storeState.player;
        let mapPart = 100;
        let mapGroundPart = mapPart * 3;
        let fromX = 0;
        let groundMul = 3;
        let groundOffset = 3;
        let lastX = mapGroundPart * (Math.ceil(Math.random() * groundMul) + groundOffset);
        let floor = [];
        while(lastX < mapLength)
        {
            floor.push({from: fromX, to: lastX});
            for(let i = fromX; i <= lastX; i++) mapState.fall[i] = true;
            fromX = lastX + mapPart;
            lastX = (mapGroundPart * (Math.ceil(Math.random() * groundMul)) + groundOffset) + fromX;
            if((mapLength - lastX) > mapGroundPart)
            {
                continue;
            }
            lastX = mapLength;
            floor.push({from: fromX, to: lastX});
            for(let i = fromX; i <= lastX; i++) mapState.fall[i] = true;
            break;
        }
        mapState.floor = floor;
        mapState.height = 400;
        playerState.y = mapState.height - 100;
        this.context.store.dispatch({type: GAME_MAP_UPDATE, response: mapState });
        this.context.store.dispatch({type: PLAYER_UPDATE, response: playerState });
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
        this.setState(mapStateFromStore(this.context.store.getState(), this.state));
    }

    onPlayerDeath ()
    {
        this.setState({gameOver: true});
        this.context.store.dispatch({type: PLAYER_CLEAR });
    }

    onPlayAgain ()
    {
        let storeState = this.context.store.getState();
        this.generateRandomMap();
        let statePlayer = storeState.player;
        let mapState = storeState.map;
        statePlayer.lives = 1;
        statePlayer.score = 0;
        mapState.offset = 0;
        this.context.store.dispatch({type: PLAYER_UPDATE, response: statePlayer });
        this.context.store.dispatch({type: GAME_MAP_UPDATE, response: mapState });
        this.setState({gameOver: false});
    }
    
    render() {
        var loading = this.state.loaded ? "" : " (loading...)";
        let gameStatusBar = null;
        let game = null;
        if(this.state.loaded)
        {
            if(this.state.gameOver)
            {
                game          = <GameOver onPlayAgain={this.onPlayAgain} />;
            }
            else
            {
                gameStatusBar = <StatusBar />;
                game          = <Game name="world" onPlayerDeath={this.onPlayerDeath} />;
            }
        }
        return <div>
            {gameStatusBar}
            {game}
        </div>;
    }
}
