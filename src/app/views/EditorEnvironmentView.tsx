//LoginView
import * as React from 'react';
import { Link } from 'react-router';
import GameLoader from '../components/GameLoader';
import { IStore, IStoreContext, IGameMapStarState } from '../reducers';
import { PLAYER_UPDATE, PLAYER_CLEAR } from '../actions/playerActions';
import { GAME_MAP_UPDATE, GAME_MAP_CHANGE_LENGTH } from '../actions/gameMapActions';
import { Environment, IEnvironment, IEnvironmentBlock } from '../libs/Environment';

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
// interface ISprite 
// {
//     id: string;
//     animated: boolean;
//     frames: number;
//     double: boolean;
// }

export interface IEditorEnvironmentState 
{
    loaded?: boolean;
    width?: number;
    height?: number;
    loader?: {
        imagesLeft?: number;
    }
}


function mapStateFromStore(store: IStore, state: IEditorEnvironmentState): IEditorEnvironmentState 
{
    return state;
    // return { 
    //     loaded: true
    // };
}

export default class EditorEnvironmentView extends React.Component<any, IEditorEnvironmentState> 
{
    static contextTypes: React.ValidationMap<any> = 
    {
        store: React.PropTypes.object
    }
    
    context: IStoreContext;
    unsubscribe: Function;

    private ctx: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;

    private environment: Array<IEnvironment> = [];
    private environmentCount: number = 0;
    private environmentBlocks: number = 0;
    private environmentHeight: number = 0;
    private environmentImg: { [id: string]: HTMLImageElement } = {};

    constructor(props: any) 
    {
        super(props);
        this.state = { 
            loaded: false,
            width: 0,
            height: 0,
            loader: {
                imagesLeft: 0
            }
        };
        
        this.loaderImagePrepare = this.loaderImagePrepare.bind(this);
        this.loaderImage = this.loaderImage.bind(this);
        this.processLoad = this.processLoad.bind(this);
        this.resize = this.resize.bind(this);
        this.run = this.run.bind(this);

        
        // this.onPlayerStatsClose = this.onPlayerStatsClose.bind(this);
    }
    
    componentDidMount() 
    {
        let storeState = this.context.store.getState();
        this.unsubscribe = this.context.store.subscribe(this.setStateFromStore.bind(this));
        let width = window.innerWidth;
        let height = window.innerHeight;
        this.resize = this.resize.bind(this);
        let newState = Object.assign({}, this.state);
        //newState.loaded = true;
        //this.loaderImagePrepare();
        
        newState.width = width;
        newState.height = height;
        this.setState(mapStateFromStore(this.context.store.getState(), newState));

        this.context.store.dispatch({type: GAME_WORLD_IMPORT });

        setTimeout(() => {
            let storeState = this.context.store.getState();
            this.context.store.dispatch({type: GAME_WORLD_MAP_SWITCH, response: storeState.world.startMap, editor: false });
            this.setState({loaded: true});
            console.log(this.state);
        }, 1000);

    }

    // componentDidMount() 
    // {
    //     let storeState = this.context.store.getState();
    //     this.setStateFromStore();
    //     this.unsubscribe = this.context.store.subscribe(this.setStateFromStore.bind(this));
    //     this.setState({loaded: true});
    // }

    loaderImagePrepare()
    {
        console.log('loaderImagePrepare()');
        let newState = Object.assign({}, this.state);
        newState.loader.imagesLeft = this.environmentCount;
        this.setState(newState);
        let count = 0;
        for(let i in this.environment)
        {
            let environmentItem = this.environment[i];
            for(let i = 1, len = environmentItem.frames; i <= len; i++)
            {
                let dir = '/images/';
                let id = environmentItem.id+i.toString();
                let src = dir+id+'.png';
                console.log('SRC', src);
                let img = new Image();
                img.onload = this.loaderImage;
                img.src = src;
                this.environmentImg[id] = img;
                count++;
            }
        }
        console.log('SRC COUNT', count);
    }

    loaderImage()
    {
        let newState = Object.assign({}, this.state);
        newState.loader.imagesLeft -= 1;
        console.log('loaderImage()');
        if(newState.loader.imagesLeft === 0)
        {
            newState.loaded = true;
            this.run();
        }
        this.setState(newState);
    }

    resize()
    {
        let width = window.innerWidth;
        let height = window.innerHeight;
        this.setState({width: width, height: height});
    }

    run ()
    {
        console.log('draw');
        // if(1==1) return;
        let x = 0;
        let y = 0;
        let w = 92;
        let h = 104;
        for(let index in this.environment)
        {
            let environment = this.environment[index];
            for(let i = 1, len = environment.frames; i <= len; i++)
            {
                let id = environment.id+i.toString();
                this.ctx.drawImage(this.environmentImg[id], x, 0);
                let factor = environment.width;
                x += (w * factor);
            }
        }
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

    generateEnvironment()
    {
        console.log('generateEnvironment()');
        
        let storeState = this.context.store.getState();
        let stateMap = storeState.world.maps[storeState.world.activeMap];
        let environment: Environment = new Environment(stateMap.tileX, stateMap.tileY);;
        let environmentList: Array<IEnvironment> = environment.getEnvironment();
        let environmentCount = 0;
        // environmentList.push({id: 'sonic-right', animated: true, frames: 9, double: false});
        // environmentList.push({id: 'sonic-left', animated: true, frames: 9, double: false});
        // environmentList.push({id: 'sonic-jump', animated: true, frames: 9, double: false});
        // environmentList.push({id: 'enemy-right', animated: true, frames: 9, double: false});
        // environmentList.push({id: 'enemy-left', animated: true, frames: 9, double: false});
        // environmentList.push({id: 'enemy-death-right', animated: true, frames: 9, double: false});
        // environmentList.push({id: 'enemy-death-left', animated: true, frames: 9, double: false});
        // environmentList.push({id: 'star', animated: true, frames: 7, double: false});
        // environmentList.push({id: 'star-explode', animated: true, frames: 9, double: false});
        // environmentList.push({id: 'cloud', animated: true, frames: 5, double: true});
        // environmentList.push({id: 'crate', animated: false, frames: 1, double: false});
        // environmentList.push({id: 'platform-left', animated: false, frames: 6, double: false});
        // environmentList.push({id: 'platform-center', animated: false, frames: 6, double: false});
        // environmentList.push({id: 'platform-right', animated: false, frames: 6, double: false});
        // environmentList.push({id: 'world-grass', animated: true, frames: 1, double: false});
        // environmentList.push({id: 'world-tree', animated: true, frames: 2, double: false});

        for(let i in environmentList)
        {

            environmentCount += environmentList[i].frames;
            this.environmentBlocks += environmentList[i].frames * environmentList[i].width;
            this.environmentHeight = Math.max(this.environmentHeight, environmentList[i].height)
        }
        this.environment = environmentList;
        this.environmentCount = environmentCount;
    }

    processLoad(e)
    {
        if(!e || this.ctx) return;
        console.log('processLoad(e)');
        this.ctx = e.getContext('2d');
        this.generateEnvironment();
        this.loaderImagePrepare();
    }

    render() 
    {
        let loader = null;
        let canvas = null;
        let canvasStyle = {};
        let width = 0;
        let height = 0;
        if(this.state.loaded)
        {
            width = 92 * this.environmentBlocks;
            height = 104 * this.environmentHeight;
        }
        else
        {
            loader = <GameLoader />;
        }
        if(this.state.loaded)
        {
            canvas = <canvas className="game" style={canvasStyle} ref={(e) => this.processLoad(e)} width={width} height={height} key="canvas-environment"></canvas>
        }
        return <div>
            {loader}
            {canvas}
        </div>;
    }
}
