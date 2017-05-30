import * as React from 'react';
import { IStore, IStoreContext, ISoundState, IGameMapState, IGameMapPlatformState, IPlayerState } from '../reducers';
import { Store } from 'redux';
import { Sprites, ISprite, ISpriteBlock } from '../libs/Sprites';
import { GAME_WORLD_MAP_RELOADED } from '../actions/gameWorldActions';

declare let imageType:typeof Image; 

export interface IGameRenderProps {
    sprites?: Sprites;
    width?: number;
    height?: number;
    drawPosition?: boolean;
}

export interface IGameRenderState 
{
    loaded?: boolean;
    loader?: {
        imagesLeft: number,
        opacity: number,
    }
}

function mapStateFromStore(store: IStore, state: IGameRenderState): IGameRenderState {
    // let newState = Object.assign({}, state, {player: store.player, map: store.map});
    // return newState;
    return state;
}

export default class GameRender extends React.Component<IGameRenderProps, IGameRenderState> {

    private cached: { [id: string]: HTMLImageElement } = {};

    static contextTypes: React.ValidationMap<any> = 
    {
        store: React.PropTypes.object
    }
    
    context: IStoreContext;
    unsubscribe: Function;

    private ctx: CanvasRenderingContext2D = null;
    private canvas: HTMLCanvasElement;
    private canvasFB: HTMLCanvasElement;
    private ctxFB: CanvasRenderingContext2D = null;
    private canvasBackground: HTMLCanvasElement;
    private ctxBackground: CanvasRenderingContext2D = null;
    private canvasSprites: HTMLCanvasElement;
    private ctxSprites: CanvasRenderingContext2D = null;

    private mapImage: HTMLImageElement;
    private spritesImage: HTMLImageElement;
    private mapLoaded: boolean = false;
    private spritesLoaded: boolean = false;

    private requestAnimation: any;
    private counter: number = 0;
    private loaderImagesLeft: number = 0;

    private reloading: boolean = false;

    private ajaxPreloader: any;

    constructor(props: IGameRenderProps) {
        super(props);
        this.state = { 
            loaded: false, 
            loader: {
                imagesLeft: 0,
                opacity: 1
            },
        };

        this.loaderImagePrepare = this.loaderImagePrepare.bind(this);
        this.loaderImage = this.loaderImage.bind(this);
        this.gameRender = this.gameRender.bind(this);
        this.gameRenderPrepare = this.gameRenderPrepare.bind(this);
        this.toggleFullScreen = this.toggleFullScreen.bind(this);
    }

    componentDidMount() 
    {
        let storeState = this.context.store.getState();
        this.unsubscribe = this.context.store.subscribe(this.setStateFromStore.bind(this));
        let newState = Object.assign({}, this.state);
        this.setState(mapStateFromStore(this.context.store.getState(), newState));
        this.reloading = true;
        this.loaderImagePrepare();
        // this.ajaxPreloader = setInterval(() => {
        //     let storeState = this.context.store.getState();
        //     console.log('this.ajaxPreloader', storeState.world.loaded);
        //     if(!storeState.world.loaded) return;
        //     this.loaderImagePrepare();
        //     clearInterval(this.ajaxPreloader);
        // }, 100);
    }

    componentWillUnmount() 
    {
        if (this.requestAnimation !== 0)
        {
            cancelAnimationFrame(this.requestAnimation);
        }
        if (this.unsubscribe) 
        {
            this.unsubscribe();
        }
    }

    setStateFromStore() 
    {
        let storeState = this.context.store.getState();
        this.setState(mapStateFromStore(this.context.store.getState(), this.state));
        if(!storeState.world.reload || this.reloading) return;
        if (this.requestAnimation !== 0) cancelAnimationFrame(this.requestAnimation);
        this.reloading = true;
        this.loaderImageMapPreload();
    }

    loaderImageMapPreload()
    {
        let storeState = this.context.store.getState();
        console.log('loaderImagePrepare()', this.loaderImagesLeft, storeState);
        let newState = Object.assign({}, this.state);
        this.loaderImagesLeft = 1;
        this.mapLoaded = false;
        console.log('storeState.world', storeState.world);
        this.mapImage.src = 'images/' + storeState.world.maps[storeState.world.activeMap].background.image;
    }

    loaderImagePrepare()
    {
        let storeState = this.context.store.getState();
        console.log('loaderImagePrepare()', this.loaderImagesLeft, storeState);
        let newState = Object.assign({}, this.state);
        this.loaderImagesLeft = 2;
        // this.setState(newState);

        let i = new Image();
        i.onload = this.loaderImage;
        console.log('storeState.world', storeState.world);
        i.src = 'images/' + storeState.world.maps[storeState.world.activeMap].background.image;
        
        this.mapImage = i;

        let i2 = new Image();
        i2.onload = this.loaderImage;
        i2.src = 'images/sprites.png';
        this.spritesImage = i2;
        console.log('loaderImagePrepare()', this.loaderImagesLeft);
    }

    loaderImage()
    {
        console.log('loaderImage()', this.loaderImagesLeft);
        this.loaderImagesLeft -= 1;
        if(this.loaderImagesLeft === 0)
        {
            setTimeout(() => {
                console.log('priprava?');
                this.setState({loaded: true});
                this.reloading = false;
                this.context.store.dispatch({type: GAME_WORLD_MAP_RELOADED });
                this.gameRenderPrepare();
            }, 50);
        }
    }

    gameRenderPrepare()
    {
        console.log('gameRenderPrepare()');

        if(++this.counter === 1000) this.counter = 0;
        if((this.counter % 10) !== 0)
        {
            this.requestAnimation = requestAnimationFrame(this.gameRenderPrepare);
            return;
        }
        if(this.ctxBackground && !this.mapLoaded)
        {
            this.ctxBackground.drawImage(this.mapImage, 0, 0);
            this.mapLoaded = true;
        } 
        else if(this.ctxSprites && !this.spritesLoaded)
        {
            this.ctxSprites.drawImage(this.spritesImage, 0, 0);
            this.spritesLoaded = true;
        }
        if(!this.spritesLoaded || !this.mapLoaded)
        {
            this.requestAnimation = requestAnimationFrame(this.gameRenderPrepare);
            return;
        }
        console.log('padl');
        this.requestAnimation = requestAnimationFrame(this.gameRender);
    }

    gameRender()
    {
        if(this.state.loaded)
        {
            this.redraw();
            this.redrawPlayer();
        }
        this.requestAnimation = requestAnimationFrame(this.gameRender);
    }

    redraw()
    {

        let width     = this.props.width;
        let height    = this.props.height;
        let storeState  = this.context.store.getState();
        let stateMap    = storeState.world.maps[storeState.world.activeMap];
        let statePlayer = storeState.world.player;
        let mapHeight = stateMap.height * stateMap.tileY;
        let drawFrom = Math.min(0, (statePlayer.x - width));
        let drawTo   = (statePlayer.x + width);
        let drawWidth = drawTo - drawFrom;
        let ctx       = this.ctx;//FB;
        ctx.drawImage(this.canvasBackground, Math.floor(stateMap.offset * stateMap.background.factor), 0);
        
        let ground = stateMap.ground;
        for(let i in ground)
        {
            let platform = ground[i];
            let from = (platform.from * stateMap.tileX) - stateMap.offset;
            let to2   = ((platform.to - platform.from) * stateMap.tileX);
            let to   = from + to2;
            let type = 2;
            if(to < drawFrom || from > drawTo) continue;
            for(let i = 0, len = (platform.to - platform.from); i <= len; i++)
            {
                // let x = ((platform.from + i) * stateMap.tileX) - stateMap.offset;
                let x = from + (i * stateMap.tileX);
                let name = 'ground-center';
                if(i === 0 || i === len)
                {
                    name = (i === 0) ? 'ground-left' : 'ground-right';
                }
                this.props.sprites.setFrame(name, type, this.canvasSprites, ctx, x, mapHeight);
            }
        }

        let floor = stateMap.floor;
        for(let i in floor)
        {
            let platform = floor[i];
            let from = platform.from - stateMap.offset;
            let to2   = ((platform.to - platform.from) + stateMap.tileX);
            let to   = from + to2;
            if(to < drawFrom || from > drawTo) continue;
            let height = platform.height;
            // 1 - light red, 2 - light blue, 3 - light green, 4 - blue, 5 - gray, 6 - red
            //let type = (!platform.bothSide) ? 4 : 1;
            let type = (!platform.bothSide) ? 3 : 5;
            for(let i = 0, len = (platform.to - platform.from) - stateMap.tileX; i <= len; i += stateMap.tileX)
            {
                // let x = ((platform.from + i) * stateMap.tileX) - stateMap.offset;
                let x = from + i;
                let name = 'platform-center';
                if(i === 0 || i === len)
                {
                    name = (i === 0) ? 'platform-left' : 'platform-right';
                }
                this.props.sprites.setFrame(name, type, this.canvasSprites, ctx, x, height);
            }

            if(!this.props.drawPosition) continue;
            ctx.globalAlpha = 0.5;
            for(let i = 0, len = (platform.to - platform.from) - stateMap.tileX; i <= len; i += stateMap.tileX)
            {
                // let x = ((platform.from + i) * stateMap.tileX) - stateMap.offset;
                let x = from + i;
                let name = 'platform-center';
                if(i === 0 || i === len)
                {
                    name = (i === 0) ? 'platform-left' : 'platform-right';
                }
                ctx.fillRect(x, height, stateMap.tileX, stateMap.tileY);
            }
            ctx.globalAlpha = 1.0;
        }

        let stars = stateMap.stars;
        for(let i in stars)
        {
            let star = stars[i];
            if(star === null) continue;
            let x = (star.x * stateMap.tileX) - stateMap.offset;
            if(x < drawFrom || x > drawTo) continue;
            let imgPrefix = (star.collected) ? 'star-explode' : 'star';
            this.props.sprites.setFrame(imgPrefix, star.frame, this.canvasSprites, ctx, x, (star.y * stateMap.tileY));

            if(!this.props.drawPosition) continue;
            ctx.globalAlpha = 0.5;
            ctx.fillRect(x, (star.y * stateMap.tileY), stateMap.tileX, stateMap.tileY);
            ctx.globalAlpha = 1.0;
        }

        let spikes = stateMap.spikes;
        for(let i in spikes)
        {
            let spike = spikes[i];
            if(spike === null) continue;
            let x = (spike.x * stateMap.tileX) - stateMap.offset;
            if(x < drawFrom || x > drawTo) continue;
            let imgPrefix = 'spike';
            this.props.sprites.setFrame(imgPrefix, 1, this.canvasSprites, ctx, x, (spike.y * stateMap.tileY));

            if(!this.props.drawPosition) continue;
            ctx.globalAlpha = 0.5;
            ctx.fillRect(x, (spike.y * stateMap.tileY), stateMap.tileX, stateMap.tileY);
            ctx.globalAlpha = 1.0;
        }

        for(let i = 0, len = stateMap.exit.length; i < len; i++)
        {
            let exit = stateMap.exit[i];
            let x = (exit.x) - stateMap.offset;

            if(x >= drawFrom && x <= drawTo) 
            {
                // console.log('x', x, drawFrom, drawTo, exit);
                let imgPrefix;
                let frame = 1;
                if(exit.blocker === null)
                {
                    imgPrefix = exit.type.name;
                    frame = exit.type.frame;
                }
                else
                {
                    imgPrefix = exit.blocker.name;
                    frame = exit.blocker.frame;
                    
                }
                // console.log(imgPrefix, frame);
                this.props.sprites.setFrame(imgPrefix, frame, this.canvasSprites, ctx, x, exit.y);

                if(!this.props.drawPosition) continue;
                ctx.globalAlpha = 0.5;
                ctx.fillRect(x, exit.y, stateMap.tileX, stateMap.tileY);
                ctx.globalAlpha = 1.0;

            }
        }

        for(let i = 0, len = stateMap.items.length; i < len; i++)
        {
            let item = stateMap.items[i];
            if(!item.visible) continue;
            let x = (item.x) - stateMap.offset;

            if(x >= drawFrom && x <= drawTo) 
            {
                // console.log('x', x, drawFrom, drawTo, exit);
                let imgPrefix = (item.collected) ? 'star-explode' : ['item', item.name].join('-');
                this.props.sprites.setFrame(imgPrefix, item.frame, this.canvasSprites, ctx, x, item.y);

                if(!this.props.drawPosition) continue;
                ctx.globalAlpha = 0.5;
                ctx.fillRect(x, item.y, stateMap.tileX, stateMap.tileY);
                ctx.globalAlpha = 1.0;

            }
        }

        let enemies = stateMap.enemies;
        let enemyHeightOffset = (stateMap.tileY * 0.05);
        for(let i = 0, len = enemies.length; i < len; i++)
        {
            let enemy = enemies[i];
            let x = Math.floor(enemy.x - stateMap.offset);
            if(enemy.death || x < drawFrom || x > drawTo) continue;
            let img = (enemy.right) ? 'enemy-right' : 'enemy-left';;
            if(enemy.die)
            {
                img = 'enemy-explode';

            }
            this.props.sprites.setFrame(img, enemy.frame, this.canvasSprites, ctx, x, enemy.height + enemyHeightOffset);
            if(!this.props.drawPosition) continue;
            ctx.globalAlpha = 0.5;
            ctx.fillRect(x, (enemy.height * stateMap.tileY), stateMap.tileX, stateMap.tileY);
            ctx.globalAlpha = 0.3;
            ctx.fillRect(((enemy.from * stateMap.tileX) - 1) - stateMap.offset, enemy.height, ((enemy.to - (enemy.from - 1)) * stateMap.tileX), stateMap.tileY);
            ctx.globalAlpha = 1.0;

        }

        if(stateMap.clouds.length === 0) return;

        for(let i in stateMap.clouds)
        {
            let cloud = stateMap.clouds[i];
            if(cloud.x < (width/-2) || cloud.x > drawTo) continue;
            let imgPrefix = 'cloud';
            this.props.sprites.setFrame(imgPrefix, cloud.type, this.canvasSprites, ctx, Math.floor(cloud.x), Math.floor(cloud.y));
        }
    }

    redrawPlayer()
    {
        let ctx       = this.ctx;//FB;
        let storeState  = this.context.store.getState();
        let stateMap    = storeState.world.maps[storeState.world.activeMap];
        let statePlayer = storeState.world.player;

        let img = (statePlayer.right) ? 'ninja-right' : 'ninja-left';;
        if(statePlayer.death)
        {
            img = 'ninja-explode';

        }
        else if(statePlayer.jump !== statePlayer.y)
        {
            img = (statePlayer.right) ? 'ninja-jump-right' : 'ninja-jump-left';
        }
        let y = Math.floor(statePlayer.y + (stateMap.tileY * 0.05));
        this.props.sprites.setFrame(img, statePlayer.frame, this.canvasSprites, ctx, Math.floor(statePlayer.x - stateMap.offset), y);


        // Player items
        let itemsLen = statePlayer.character.items.length;
        if(itemsLen > 0)
        {
            let itemX = Math.floor(stateMap.tileX * 0.2);
            let itemY = Math.floor(stateMap.tileY * 0.2);
            for(let i = 0, len = statePlayer.character.items.length; i < len; i++)
            {
                let item = statePlayer.character.items[i];
// console.log('item', item);
                let imgPrefix = ['item', item.name].join('-');
                this.props.sprites.setFrame(imgPrefix, 1, this.canvasSprites, ctx, itemX, itemY);
                itemY += Math.floor(stateMap.tileY * 1.2);
            }
        }


        if(!this.props.drawPosition) return;
        ctx.globalAlpha = 0.7;
        let playerLeftX = statePlayer.x + (stateMap.tileX * 0.85);
        let playerRightX = statePlayer.x + (stateMap.tileX * 0.15);
        ctx.fillRect(playerLeftX - stateMap.offset, statePlayer.y, 2, stateMap.tileY);
        ctx.fillRect(playerRightX - stateMap.offset, statePlayer.y, 2, stateMap.tileY);
        //ctx.fillRect(statePlayer.x - stateMap.offset, statePlayer.y - stateMap.tileY, stateMap.tileX, stateMap.tileY);
        ctx.globalAlpha = 1.0;
    }

    processLoad(e)
    {
        if(!e || this.ctx) return;
        this.canvas = e;
        this.ctx = e.getContext('2d');
    }

    processBackgroundLoad(e)
    {
        if(!e || this.canvasBackground) return;
        this.canvasBackground = e;
        this.ctxBackground = e.getContext('2d');
    }

    processSpritesLoad(e)
    {
        if(!e || this.canvasSprites) return;
        this.canvasSprites = e;
        this.ctxSprites = e.getContext('2d');
    }

    processFramebufferLoad(e)
    {
        if(!e || this.canvasFB) return;
        this.canvasFB = e;
        this.ctxFB = e.getContext('2d');
    }

    toggleFullScreen(e: any) 
    {
        if (!document.fullscreenElement) 
        {
            let el = document.documentElement;
            if (el.requestFullscreen) 
            {
                el.requestFullscreen();
            } 
            else if (el.webkitRequestFullscreen) 
            {
                el.webkitRequestFullscreen();
            } 
            else if (el.mozRequestFullScreen) 
            {
                el.mozRequestFullScreen();
            } 
            else if (el.msRequestFullscreen) 
            {
                el.msRequestFullscreen();
            }
        } 
        else 
        {
            let el = document;
            if (el.webkitCancelFullScreen) 
            {
                el.webkitCancelFullScreen();
            } 
            else if (el.mozCancelFullScreen) 
            {
                el.mozCancelFullScreen();
            } 
            else if (el.msExitFullscreen) 
            {
                el.msExitFullscreen();
            }
        }
    }

    render()
    {
        let state = this.state;
        let width = (state.loaded) ? this.props.width : 0;
        let height = (state.loaded) ? this.props.height : 0;
        let widthBackground = (state.loaded) ? this.mapImage.width : 0;
        let heightBackground = (state.loaded) ? this.mapImage.height : 0;
        let widthSprites = (state.loaded) ? this.spritesImage.width : 0;
        let heightSprites = (state.loaded) ? this.spritesImage.height : 0;

        let canvasStyle = {};
        let canvasBackgroundStyle = { display: 'none' };
        return <div>
                    <canvas className="game" style={canvasStyle} ref={(e) => this.processLoad(e)} onClick={(e) => this.toggleFullScreen(e)} width={width} height={height} key="canvas-map"></canvas>
                    <canvas style={canvasBackgroundStyle} ref={(e) => this.processBackgroundLoad(e)} width={widthBackground} height={heightBackground} key="canvas-map-background"></canvas>
                    <canvas style={canvasBackgroundStyle} ref={(e) => this.processSpritesLoad(e)} width={widthSprites} height={heightSprites} key="canvas-map-sprites"></canvas>
                    <canvas style={canvasBackgroundStyle} ref={(e) => this.processFramebufferLoad(e)} width={width} height={height} key="canvas-map-framebuffer"></canvas>
                </div>;
    }
}