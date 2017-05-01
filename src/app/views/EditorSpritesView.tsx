//LoginView
import * as React from 'react';
import { Link } from 'react-router';
import GameLoader from '../components/GameLoader';
import { IStore, IStoreContext } from '../reducers';
import { IGameMapStarState } from '../reducers/IGameMapStarState';
import { PLAYER_UPDATE, PLAYER_CLEAR } from '../actions/playerActions';
import { GAME_MAP_UPDATE, GAME_MAP_CHANGE_LENGTH } from '../actions/gameMapActions';

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
export interface ISprite 
{
    id: string;
    animated: boolean;
    frames: number;
}



export interface IEditorSpritesState 
{
    loaded?: boolean;
    width?: number;
    height?: number;
    loader?: {
        imagesLeft?: number;
    }
}


function mapStateFromStore(store: IStore, state: IEditorSpritesState): IEditorSpritesState 
{
    return { 
        loaded: true
    };
}

export default class EditorSpritesView extends React.Component<any, IEditorSpritesState> 
{
    static contextTypes: React.ValidationMap<any> = 
    {
        store: React.PropTypes.object
    }
    
    context: IStoreContext;
    unsubscribe: Function;

    private ctx: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;

    private sprites: Array<ISprite> = [];
    private spritesCount: number = 0;
    private spritesImg: { [id: string]: HTMLImageElement } = {};

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
        newState.loader.imagesLeft = this.spritesCount;
        this.setState(newState);
        for(let i in this.sprites)
        {
            let sprite = this.sprites[i];
            for(let i = 1, len = sprite.frames; i <= len; i++)
            {
                let id = sprite.id+i.toString();
                let src = '/img/'+id+'.png';
                let img = new Image();
                img.onload = this.loaderImage;
                img.src = src;
                this.spritesImg[id] = img;
            }
        }
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
        let w = 92;
        for(let index in this.sprites)
        {
            let sprite = this.sprites[index];
            for(let i = 1, len = sprite.frames; i <= len; i++)
            {
                let id = sprite.id+i.toString();
                this.ctx.drawImage(this.spritesImg[id], x, 0);
                x += w;
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

    generateSprites()
    {
        console.log('generateSprites()');
        let sprites: Array<ISprite> = [];
        let spritesCount = 0;
        sprites.push({id: 'sonic-right', animated: true, frames: 9});
        sprites.push({id: 'sonic-left', animated: true, frames: 9});
        sprites.push({id: 'sonic-jump', animated: true, frames: 9});
        sprites.push({id: 'enemy-right', animated: true, frames: 9});
        sprites.push({id: 'enemy-left', animated: true, frames: 9});
        sprites.push({id: 'enemy-death-right', animated: true, frames: 9});
        sprites.push({id: 'enemy-death-left', animated: true, frames: 9});
        sprites.push({id: 'item-star', animated: true, frames: 7});
        sprites.push({id: 'item-star-explode', animated: true, frames: 9});
        sprites.push({id: 'exit', animated: true, frames: 20});
        
        for(let i in sprites)
        {
            spritesCount += sprites[i].frames;
        }
        this.sprites = sprites;
        this.spritesCount = spritesCount;
    }

    processLoad(e)
    {
        if(!e || this.ctx) return;
        console.log('processLoad(e)');
        this.ctx = e.getContext('2d');
        this.generateSprites();
        this.loaderImagePrepare();
    }

    render() {
        var loading = this.state.loaded ? "" : " (loading...)";
        let loader = null;
        let canvasStyle = {};
        let width = 0;
        let height = 0;
        if(this.state.loaded)
        {
            width = 92 * this.spritesCount;
            height = 104;
        }
        else
        {
            loader = <GameLoader />;
        }
        return <div>
            {loader}
            <canvas className="game" style={canvasStyle} ref={(e) => this.processLoad(e)} width={width} height={height} key="canvas-sprite"></canvas>
        </div>;
    }
}