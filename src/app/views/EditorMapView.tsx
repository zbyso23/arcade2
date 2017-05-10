import * as React from 'react';
import { Link } from 'react-router';
import Hello from '../components/Hello';
import EditorMap from '../components/EditorMap';
import GameLoader from '../components/GameLoader';
import StatusBar from '../components/StatusBar';
import PlayerMenu from '../components/PlayerMenu';
import { IStore, IStoreContext, IGameMapStarState } from '../reducers';
import { PLAYER_UPDATE, PLAYER_CLEAR } from '../actions/playerActions';
import { GAME_MAP_UPDATE, GAME_MAP_CHANGE_LENGTH } from '../actions/gameMapActions';
import { 
    LINK_MENU,
    LINK_GAME,
    LINK_EDITOR
} from '../routesList';
/*
Idea for MapSprite [25 x 17] (2300 x 1768) [92x104] :
    1.  Char Move Left  [25]
    2.  Char Move Right [25]
    3.  Char Jump Left  [25]
    4.  Char Jump Right [25]
    5.  Star Gold + Silver [25]
    6.  Item Explode [25]
    7.  Jewels Red + Green [25]
    8.  Item A + B [25]
    9.  Enemy A Left [25]
    10. Enemy A Right [25]
    11. Enemy B Left [25]
    12. Enemy B Right [25]
    13. Enemy C Left [25]
    14. Enemy C Right [25]
    15. Environment Static [25]
    16. Environment Active [25]
    17. Platforms Ground [3] Normal [3] Solid [3] Move [3] Secret [3] Doors [3]
*/
export interface IEditorMapState 
{
    loaded?: boolean;
}


function mapStateFromStore(store: IStore, state: IEditorMapState): IEditorMapState 
{
    return { 
        loaded: true
    };
}

export default class EditorMapView extends React.Component<any, IEditorMapState> 
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

        this.state = { loaded: false };
        this.onMenu = this.onMenu.bind(this);
        this.onPlayerDeath = this.onPlayerDeath.bind(this);
        this.onPlayerWin = this.onPlayerWin.bind(this);
        this.onPlayAgain = this.onPlayAgain.bind(this);
        this.onPlayerStats = this.onPlayerStats.bind(this);
        this.onPlayerStatsClose = this.onPlayerStatsClose.bind(this);
    }
    
    componentDidMount() 
    {

        let storeState = this.context.store.getState();
        this.setStateFromStore();
        
        this.unsubscribe = this.context.store.subscribe(this.setStateFromStore.bind(this));
        this.generateRandomMap();
        let statePlayer = storeState.player;
        statePlayer.lives = 3;
        statePlayer.score = 0;
        statePlayer.stars = 0;
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
        let mapGroundPart = 10;
        let fromX = 0;
        let heightVariants = [10, 8.5, 7.5, 6.5];
        let groundVariants = [25, 32, 42];
        let floorVariants = [3, 4, 5, 7, 10];
        let floorGapVariants = [2, 3, 4, 5, 6];
        let starValues = [10, 25, 50, 100];

        let lastX = groundVariants[Math.floor(Math.random() * groundVariants.length)];
        let ground = [];
        while(lastX < mapLength)
        {
            ground.push({from: fromX, to: lastX});
            for(let i = fromX; i < lastX; i++) mapState.groundFall[i] = true;
            fromX = lastX + 0;
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
        let stars = [];
        for(let i = 0; i < mapLength; i++) stars.push(null);
        fromX = floorGapVariants[Math.floor(Math.random() * floorGapVariants.length)];
        lastX = floorVariants[Math.floor(Math.random() * floorVariants.length)] + fromX;
        let index = -1;
        let maxHeight  = heightVariants[1];
        let minHeight  = heightVariants[heightVariants.length - 1];
        let height = maxHeight;

        // let exitX = Math.round(Math.random() * (lastX - fromX)) + fromX;
        // exit.push(exitX);
        // exit.push(height - 1);
        // exit.push(1);

        while(lastX < mapLength)
        {
            let isBothSide = (Math.random() > 0.6) ? true : false;
            floor.push({from: fromX, to: lastX, height: height, bothSide: isBothSide});
            index++;


            let starFrame = 1;
            let floorRandom = function(length: number, factor: number, factorOffset: number): Array<number>
            {
                let numbers = [];
                let count   = Math.round(length / ((Math.random() * factor) + factorOffset));
                let part    = length / count;
                let offset  = 0;
                for(let i = 0, len = count; i < count; i++)
                {
                    let starX = Math.ceil((Math.random() * (part * 0.9)) + offset);
                    numbers.push(starX);
                    offset += part;
                }
                return numbers;
            }

            if(Math.random() > 0.01)
            {
                let starItems = floorRandom((lastX - fromX), 2.5, 2);
                for(let i in starItems)
                {
                    let starX = starItems[i] + fromX;
                    let star: IGameMapStarState = {
                        x: starX,
                        y: height - 1,
                        frame: starFrame,
                        value: starValues[Math.floor(Math.random() * starValues.length)],
                        collected: false
                    }
                    starFrame = (starFrame === 7) ? 1 : starFrame + 1;
                    stars[starX] = star;
                }
            }

            for(let i = fromX; i <= lastX; i++) mapState.floorHeight[i] = floor[index];
            let floorGapLength = floorGapVariants[Math.floor(Math.random() * floorGapVariants.length)];
            let lastHeight = height;
            if(Math.random() < 0.65) 
            {
                height = (height === minHeight || (height < maxHeight && Math.random() >= 0.2)) ? height + 1 : height - 1;
            }

            if(Math.random() > 0.01)
            {
                let starItems = floorRandom(floorGapLength - 1, 2.5, 1);
                let starHeight = height;
                if(lastHeight !== height)
                {
                    starHeight = (lastHeight > height) ? starHeight - 1.75 : starHeight - 2.75;
                }
                else
                {
                    starHeight -= 1.5;
                }
                for(let i in starItems)
                {
                    let starX = starItems[i] + lastX;
                    let star: IGameMapStarState = {
                        x: starX,
                        y: starHeight,
                        frame: starFrame,
                        value: starValues[Math.floor(Math.random() * starValues.length)],
                        collected: false
                    }
                    starFrame = (starFrame === 7) ? 1 : starFrame + 1;
                    stars[starX] = star;
                }
            }
            fromX = lastX + floorGapLength;
            lastX = floorVariants[Math.floor(Math.random() * floorVariants.length)] + fromX;

            if((mapLength - lastX) > 8) continue;
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
        //Add Exit
        let x = 0;
        let y = 0;
        if(floor.length > 3)
        {
            let lastFloor = floor[floor.length - 2];
            x = Math.round(Math.random() * (lastFloor.to - lastFloor.from)) + fromX;
            y = height - 1;
        }
        else
        {
            x = Math.ceil(mapLength * 0.94);
            y = heightVariants[0] - 1;
        }
        let exit   = {
            x: x,
            y: y,
            map: '',
            win: true
        };

        mapState.height = heightVariants[0];
        playerState.y = heightVariants[0] * mapTileY;
        mapState.ground = ground;
        mapState.floor = floor;
        mapState.stars = stars;
        mapState.exit  = [exit];
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

    onMenu ()
    {
        //Link to menu
        this.props.history.push(LINK_MENU);
    }

    onPlayerStats ()
    {
        this.setState({});
    }

    onPlayerStatsClose ()
    {
        this.setState({});
    }

    onPlayerDeath ()
    {
        this.setState({});
    }

    onPlayerWin ()
    {
        this.setState({});
    }

    onPlayAgain ()
    {
        this.context.store.dispatch({type: PLAYER_CLEAR });
        let storeState = this.context.store.getState();
        this.generateRandomMap();
        let statePlayer = storeState.player;
        let mapState = storeState.map;
        statePlayer.lives = 1;
        statePlayer.score = 0;
        mapState.offset = 0;
        this.context.store.dispatch({type: PLAYER_UPDATE, response: statePlayer });
        this.context.store.dispatch({type: GAME_MAP_UPDATE, response: mapState });
        this.setState({});
    }
    
    render() {
        var loading = this.state.loaded ? "" : " (loading...)";
        let gameStatusBar = null;
        let loader = null;
        let game = null;
        if(this.state.loaded)
        {
            if(1 === 2)
            {
                // gameStatusBar = <StatusBar />;
                game          = <PlayerMenu onBackToGame={this.onPlayerStatsClose} />;
            }
            else
            {
                // gameStatusBar = <StatusBar />;
                game          = <EditorMap name="world" onPlayerDeath={this.onPlayerDeath} onPlayerWin={this.onPlayerWin} onPlayerStats={this.onPlayerStats} onMenu={this.onMenu}/>;
            }
        }
        else
        {
            loader = <GameLoader />;
        }
        return <div>
            {loader}
            {gameStatusBar}
            {game}
        </div>;
    }
}