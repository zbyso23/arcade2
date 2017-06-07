//LoginView
import * as React from 'react';
import { Link } from 'react-router';
import Hello from '../components/Hello';
import Game from '../components/Game';
import GameMapNext from '../components/GameMapNext';
import GameOver from '../components/GameOver';
import GameWin from '../components/GameWin';
import GameLoader from '../components/GameLoader';
import StatusBar from '../components/StatusBar';
import PlayerMenu from '../components/PlayerMenu';
import { IStore, IStoreContext, IGameMapStarState, IGameMapSpikeState } from '../reducers';
import { PLAYER_UPDATE, PLAYER_CLEAR } from '../actions/playerActions';
import { 
    GAME_MAP_IMPORT,
    GAME_MAP_UPDATE, 
    GAME_MAP_CHANGE_LENGTH 
} from '../actions/gameMapActions';

import { 
    GAME_WORLD_MAP_UPDATE,
    GAME_WORLD_MAP_SWITCH,
    GAME_WORLD_MAP_START_SET,
    GAME_WORLD_ITEM_ADD,
    GAME_WORLD_ITEM_UPDATE,
    GAME_WORLD_PLAYER_UPDATE,
    GAME_WORLD_PLAYER_CLEAR,
    GAME_WORLD_EXPORT,
    GAME_WORLD_IMPORT
} from '../actions/gameWorldActions';

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
export interface IGameState 
{
    loaded?: boolean;
    gameOver?: boolean;
    gameWin?: boolean;
    showStats?: boolean;
    showMapNext?: boolean;
}


function mapStateFromStore(store: IStore, state: IGameState): IGameState 
{
    if(!store.world.loaded) return state;
    return { 
        loaded: state.loaded,
        gameOver: state.gameOver,
        gameWin: state.gameWin
    };
}

export default class GameView extends React.Component<any, IGameState> 
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

        this.state = { loaded: false, gameOver: false, gameWin: false, showStats: false, showMapNext: false };
        this.onMenu = this.onMenu.bind(this);
        this.onPlayerDeath = this.onPlayerDeath.bind(this);
        this.onPlayerWin = this.onPlayerWin.bind(this);
        this.onPlayAgain = this.onPlayAgain.bind(this);
        this.onPlayerStats = this.onPlayerStats.bind(this);
        this.onPlayerStatsClose = this.onPlayerStatsClose.bind(this);
        this.onPlayerMapChange = this.onPlayerMapChange.bind(this);
        this.onShowMapClose = this.onShowMapClose.bind(this);
    }
    
    componentDidMount() 
    {

        let storeState = this.context.store.getState();
        this.setStateFromStore();
        
        this.unsubscribe = this.context.store.subscribe(this.setStateFromStore.bind(this));
        // this.generateRandomMap();
        this.context.store.dispatch({type: GAME_WORLD_IMPORT });

        setTimeout(() => {
            let storeState = this.context.store.getState();
            this.context.store.dispatch({type: GAME_WORLD_MAP_SWITCH, response: storeState.world.startMap, editor: false });
            this.setState({loaded: true});
            console.log(this.state);
        }, 1000);

// this.context.store.dispatch({type: GAME_MAP_IMPORT, response: 'cave' });
        // this.setState({loaded: true});
    }


    generateRandomMap()
    {
        let storeState = this.context.store.getState();
        let stateMap = storeState.map;
        let statePlayer = storeState.player;
        let mapTileX = 92;
        let mapTileY = 104;
        let mapLength = 300;// * mapTileX;
        this.context.store.dispatch({type: GAME_MAP_CHANGE_LENGTH, response: mapLength });
        let fromX = 0;
        // let heightVariants = [10, 8.5, 7.5, 6.5];
        // let heightVariants = [9, 7, 6, 5];
        let heightVariants = [7, 5.5, 4.5, 3.5];
        let mapGroundPart = heightVariants[0];

        let groundVariants = [25, 32, 42];
        let floorVariants = [3, 5, 7, 9, 12];
        let floorGapVariants = [2, 3, 4, 5];
        let starValues = [10, 25, 50, 100];
        let enemyValues = [100, 150];

        let lastX = groundVariants[Math.floor(Math.random() * groundVariants.length)];
        let ground = [];
        let floor = [];
        let stars = [];
        let spikes = [];
        let enemies = [];
        let items = [];
        let exits = [];
        for(let i = 0; i < mapLength; i++) 
        {
            stars.push(null);
            spikes.push(null);
        }
        // let spike: IGameMapSpikeState = {
        //     x: 2,
        //     y: 9
        // }
        // spikes[2] = spike;

        while(lastX < mapLength)
        {
            ground.push({from: fromX, to: lastX});
            for(let i = fromX; i < lastX; i++) stateMap.groundFall[i] = true;
            fromX = lastX + 0;
            lastX = groundVariants[Math.floor(Math.random() * groundVariants.length)] + fromX;
            if((mapLength - lastX) > mapGroundPart)
            {
                continue;
            }
            lastX = mapLength;
            ground.push({from: fromX, to: lastX});
            for(let i = fromX; i < lastX; i++) stateMap.groundFall[i] = true;
            break;
        }
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
        let exitX = Math.round(Math.random() * (mapLength / 50));
        let exitStart   = {
            x: 10  * mapTileX,
            y: (height - 1) * mapTileY,
            map: '',
            win: true,
            type: { name: 'exit-cave', frame: 1 },
            blocker: { name: 'blocker-cave', frame: 1, destroyed: false }
        };
        exits.push(exitStart);

        let itemStart   = {
            x: 8  * mapTileX,
            y: (height - 1) * mapTileY,
            frame: 1,
            name: 'pickaxe',
            collected: false,
            visible: true,
            properties: {
                canDestruct: true
            }
        };
        items.push(itemStart);
        let itemWorld = {
            name: itemStart.name,
            properties: itemStart.properties
        };
        this.context.store.dispatch({type: GAME_WORLD_ITEM_ADD, name: itemWorld.name, response: itemWorld });
        
        

        while((lastX - 3) < mapLength)
        {
            let isBothSide = (Math.random() > 0.6) ? true : false;
isBothSide = true;
            floor.push({from: fromX * mapTileX, to: (lastX + 1) * mapTileX, height: height * mapTileY, bothSide: isBothSide});
console.log('floor', floor)
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

            if(Math.random() > 0.25)
            {
                let starItems = floorRandom((lastX - fromX), 2.5, 2);
                for(let i in starItems)
                {
                    let starX = starItems[i] + fromX;
                    if(Math.random() > 0.3)
                    {
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
                    else
                    {
                        let spike: IGameMapSpikeState = {
                            x: starX,
                            y: height - 1
                        }
                        spikes[starX] = spike;
                    }
                }
            }
            if(Math.random() > 0.65)
            {
                let isFollowing = (Math.random() > 0.3) ? true : false;
                let followRange = Math.ceil(Math.random() * 2) + 3;
                let enemy = {
                    from: fromX,
                    to: lastX,
                    xGrid: fromX,
                    x: fromX * mapTileX,
                    right: true,
                    frame: 1,
                    die: false,
                    death: false,
                    height: (height - 1) * mapTileY,
                    speed: 2 + Math.ceil(Math.random() * 3),
                    experience: enemyValues[Math.floor(Math.random() * enemyValues.length)],
                    respawn: {
                        time: 0,
                        timer: 300
                    },
                    following: {
                        enabled: isFollowing,
                        range: followRange
                    }
                }

                enemies.push(enemy);
            }

            let floorGapLength = floorGapVariants[Math.floor(Math.random() * floorGapVariants.length)];
            let lastHeight = height;
            if(Math.random() < 0.65) 
            {
                height = (height === minHeight || (height < maxHeight && Math.random() >= 0.2)) ? height + 0.5 : height - 0.5;
            }

            if(floorGapLength > 3)
            {
                if(Math.random() > 0.8)
                {
                    let x = Math.ceil((floorGapLength) / 2) + lastX;
                    let spike: IGameMapSpikeState = {
                        x: x,
                        y: heightVariants[0] - 1
                    }
                    spikes[x] = spike;
                }
                else if(Math.random() > 0.75)
                {
                    let isFollowing = (Math.random() > 0.6) ? true : false;
                    let followRange = Math.ceil(Math.random() * 2) + 3;
                    let enemy = {
                        from: lastX,
                        to: lastX + floorGapLength,
                        xGrid: lastX,
                        x: lastX * mapTileX,
                        right: true,
                        frame: 1,
                        die: false,
                        death: false,
                        height: (heightVariants[0] - 1) * mapTileY,
                        speed: 2 + Math.ceil(Math.random() * 3),
                        experience: enemyValues[Math.floor(Math.random() * enemyValues.length)],
                        respawn: {
                            time: 0,
                            timer: 600
                        },
                        following: {
                            enabled: isFollowing,
                            range: followRange
                        }
                    }

                    enemies.push(enemy);
                }

            }
enemies = [];
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

            if((mapLength - lastX) > 10) continue;
            lastX = mapLength;
            if(Math.random() < 0.75) 
            {
                height = (height === minHeight || (height < maxHeight && Math.random() >= 0.5)) ? height + 1 : height - 1;
            }
            isBothSide = (Math.random() > 0.8) ? true : false;
            floor.push({from: fromX * mapTileX, to: (lastX + 1) * mapTileX, height: height * mapTileX, bothSide: isBothSide});
            index++;
            break;
        }
        //Add Exit
        let x = 0;
        let y = 0;
        if(floor.length > 3)
        {
            let lastFloor = floor[floor.length - 1];
            x = (lastFloor.from + 1);
            y = height - 1;
        }
        else
        {
            x = Math.ceil(mapLength * 0.92);
            y = heightVariants[0] - 1;
        }
        let exit   = {
            x: x * mapTileX,
            y: y * mapTileY,
            map: '',
            win: true,
            type: { name: 'exit-cave', frame: 1 },
            blocker: { name: 'blocker-cave', frame: 1, destroyed: false }
        };
        exits.push(exit);
        stateMap.height = heightVariants[0];
        statePlayer.y = (heightVariants[0] - 1) * mapTileY;
        statePlayer.jump = (heightVariants[0] - 1) * mapTileY;
        stateMap.ground = ground;
        stateMap.floor = floor;
        stateMap.stars = stars;
        stateMap.spikes = spikes;
        stateMap.enemies = enemies;
        stateMap.items = items;
        stateMap.exit  = exits;
        stateMap.tileX = mapTileX;
        stateMap.tileY = mapTileY;
        stateMap.background = {
            image: 'map-cave1.png',
            factor: -.065
        };
        this.context.store.dispatch({type: GAME_MAP_UPDATE, response: stateMap });
        this.context.store.dispatch({type: PLAYER_UPDATE, response: statePlayer });
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
        this.setState({showStats: true});
        let storeState = this.context.store.getState();
        let statePlayer = storeState.world.player;
        statePlayer.started = false;
        this.context.store.dispatch({type: GAME_WORLD_PLAYER_UPDATE, response: statePlayer });
    }

    onPlayerStatsClose ()
    {
        this.setState({showStats: false});
    }

    onPlayerDeath ()
    {
        this.setState({gameOver: true});
    }

    onPlayerWin ()
    {
        this.setState({gameWin: true});
    }

    onPlayAgain ()
    {
        this.context.store.dispatch({type: GAME_WORLD_PLAYER_CLEAR });
        let storeState = this.context.store.getState();
        let mapState   = storeState.world.maps[storeState.world.activeMap];
        mapState.offset = 0;
        this.context.store.dispatch({type: GAME_WORLD_MAP_UPDATE, response: mapState });
        //this.generateRandomMap();
        this.setState({gameOver: false, gameWin: false});
    }

    onPlayerMapChange (map: string)
    {

        let storeState = this.context.store.getState();
        // let statePlayer = storeState.world.player;
        // statePlayer.x = 50;
        // statePlayer.y = 50;
        // statePlayer.jump = 50;
        // statePlayer.started = false;
        // this.context.store.dispatch({type: GAME_WORLD_PLAYER_UPDATE, response: statePlayer });
        // this.context.store.dispatch({type: GAME_WORLD_MAP_SWITCH, response: map, editor: false });
        this.setState({showMapNext: true});
        // this.setState({loaded: false});
        // setTimeout(() => {
        // //     let storeState = this.context.store.getState();
        // //     let statePlayer = storeState.world.player;
        // //     this.context.store.dispatch({type: GAME_WORLD_PLAYER_UPDATE, response: statePlayer });
        // //     // statePlayer.started = true;
        //     this.setState({loaded: true});
        // }, 500);
    }

    onShowMapClose ()
    {
        let storeState = this.context.store.getState();
        let statePlayer = storeState.world.player;
        statePlayer.x = 50;
        statePlayer.y = 50;
        statePlayer.jump = 50;
        statePlayer.started = false;
        this.context.store.dispatch({type: GAME_WORLD_PLAYER_UPDATE, response: statePlayer });
        this.setState({showMapNext: false});
    }
    
    render() {
        let gameStatusBar = null;
        let loader = null;
        let game = null;
        if(this.state.loaded)
        {
            if(this.state.gameOver)
            {
                game          = <GameOver onPlayAgain={this.onPlayAgain} />;
            }
            else if(this.state.gameWin)
            {
                game          = <GameWin onPlayAgain={this.onPlayAgain} />;
            }
            else if(this.state.showStats)
            {
                // gameStatusBar = <StatusBar />;
                game          = <PlayerMenu onBackToGame={this.onPlayerStatsClose} />;
            }
            else if(this.state.showMapNext)
            {
                game          = <GameMapNext onNextMap={this.onShowMapClose} />;
            }
            else
            {
                // gameStatusBar = <StatusBar />;
                game          = <Game name="world" onPlayerDeath={this.onPlayerDeath} onPlayerWin={this.onPlayerWin} onPlayerStats={this.onPlayerStats} onPlayerMapChange={this.onPlayerMapChange} onMenu={this.onMenu}/>;
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
