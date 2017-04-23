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
        statePlayer.lives = 5;
        statePlayer.score = 0;
        this.context.store.dispatch({type: PLAYER_UPDATE, response: statePlayer });
        this.setState({loaded: true});
    }


    generateRandomMap()
    {
        let storeState = this.context.store.getState();
        let mapState = storeState.map;
        let playerState = storeState.player;
        let mapTileX = 92;
        let mapTileY = 104;
        let mapLength = 152;// * mapTileX;
        this.context.store.dispatch({type: GAME_MAP_CHANGE_LENGTH, response: mapLength });
        let mapGroundPart = 8;
        let fromX = 0;
        let groundVariants = [15, 29, 32];
        let heightVariants = [6, 4.5, 3.5, 2.5];
        let lastX = groundVariants[Math.floor(Math.random() * groundVariants.length)];
        let ground = [];
        while(lastX < mapLength)
        {
            ground.push({from: fromX, to: lastX});
            for(let i = fromX; i < lastX; i++) mapState.groundFall[i] = true;
            fromX = lastX + 1;
            lastX = groundVariants[Math.floor(Math.random() * groundVariants.length)] + fromX;
            if((mapLength - lastX) > mapGroundPart)
            {
                continue;
            }
            lastX = mapLength;
            ground.push({from: fromX, to: lastX});
            for(let i = fromX; i < lastX; i++) mapState.groundFall[i] = true;
            break;
        }
        let floor = [];

        let floorVariants = [3, 4, 5, 7, 10];
        let floorGapVariants = [3, 3, 5, 5, 7, 14];

        fromX = floorGapVariants[Math.floor(Math.random() * floorGapVariants.length)];
        lastX = floorVariants[Math.floor(Math.random() * floorVariants.length)] + fromX;
        let index = -1;
        
        let maxHeight  = heightVariants[1];
        let minHeight  = heightVariants[heightVariants.length - 1];
        let height = maxHeight;
        while(lastX < mapLength)
        {
            let isBothSide = true;//(Math.random() > 0.5) ? true : false;
            floor.push({from: fromX, to: lastX, height: height, bothSide: isBothSide});
            index++;
            for(let i = fromX; i <= lastX; i++) mapState.floorHeight[i] = floor[index];
            fromX = lastX + floorGapVariants[Math.floor(Math.random() * floorGapVariants.length)];
            lastX = floorVariants[Math.floor(Math.random() * floorVariants.length)] + fromX;
            if(Math.random() < 0.65) 
            {
                height = (height === minHeight || (height < maxHeight && Math.random() >= 0.5)) ? height + 1 : height - 1;
            }
            //height = Math.floor(Math.random() * (maxHeight - minHeight)) + minHeight;
            if((mapLength - lastX) > 4)
            {
                continue;
            }
            lastX = mapLength;
            if(Math.random() < 0.65) 
            {
                height = (height === minHeight || (height < maxHeight && Math.random() >= 0.5)) ? height + 1 : height - 1;
            }
            isBothSide = (Math.random() > 0.8) ? true : false;
            floor.push({from: fromX, to: lastX, height: height, bothSide: isBothSide});
            index++;
            for(let i = fromX; i <= lastX; i++) mapState.floorHeight[i] = floor[index];
            break;
        }
        mapState.height = heightVariants[0];
        playerState.y = heightVariants[0] * mapTileY;
        mapState.ground = ground;
        mapState.floor = floor;
        mapState.tileX = mapTileX;
        mapState.tileY = mapTileY;
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
