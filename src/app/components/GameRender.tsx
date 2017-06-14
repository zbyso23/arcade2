import * as React from 'react';
import { IStore, IStoreContext, ISoundState, IGameMapState, IGameMapPlatformState, IPlayerState } from '../reducers';
import { Store } from 'redux';
import { Sprites, ISprite, ISpriteBlock } from '../libs/Sprites';
import { Environment, IEnvironment, IEnvironmentBlock } from '../libs/Environment';
import { GAME_WORLD_MAP_RELOADED } from '../actions/gameWorldActions';
import GameLoader from './GameLoader';

declare let imageType:typeof Image; 

export interface IGameRenderProps {
    sprites?: Sprites;
    environment?: Environment;
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
    private canvasEnvironment: HTMLCanvasElement;
    private ctxEnvironment: CanvasRenderingContext2D = null;

    private mapImage: HTMLImageElement;
    private spritesImage: HTMLImageElement;
    private environmentImage: HTMLImageElement;
    private mapLoaded: boolean = false;
    private spritesLoaded: boolean = false;
    private environmentLoaded: boolean = false;

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
        this.loaderImagesLeft = 0;
        // this.setState(newState);

        let prepareImageBlank = (src: string) => {
            this.loaderImagesLeft++;
            let i5 = new Image();
            i5.onload = this.loaderImage;
            console.log('prepareBlankImage', src);
            i5.src = src;
            return i5;
        }
        prepareImageBlank = prepareImageBlank.bind(this);

        let questTypes = ['introduction', 'accepted', 'rejected', 'progress', 'finished'];
        for(let i in storeState.world.quests)
        {
            let quest = storeState.world.quests[i];

            for(let j in questTypes)
            {
                let type = questTypes[j];
                let src = ['images/quest', quest.name, type+'.png'].join('-');
                prepareImageBlank(src);
            }
        }
        for(let i in storeState.world.items)
        {
            let item = storeState.world.items[i];
            let src = ['images/dialog-item', item.name, 'finished.png'].join('-');
            prepareImageBlank(src);
        }
        for(let i in storeState.world.enemies)
        {
            let enemy = storeState.world.enemies[i];
            let src = ['images/dialog-enemy', enemy.type, 'finished.png'].join('-');
            prepareImageBlank(src);
        }

        this.mapImage = prepareImageBlank('images/' + storeState.world.maps[storeState.world.activeMap].background.image);
        this.spritesImage = prepareImageBlank('images/sprites.png');
        this.environmentImage = prepareImageBlank('images/environment.png');
        prepareImageBlank('images/dialog-wellcome.png');

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
        else if(this.ctxEnvironment && !this.environmentLoaded)
        {
            this.ctxEnvironment.drawImage(this.environmentImage, 0, 0);
            this.environmentLoaded = true;
        }
        if(!this.spritesLoaded || !this.mapLoaded || !this.environmentLoaded)
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
            let from = platform.from - stateMap.offset;
            let to   = (platform.to - from);
            
            if(to < drawFrom || from > drawTo) continue;
            let x = from;
            this.props.sprites.setFrame('ground-left', platform.type, this.canvasSprites, ctx, x, mapHeight);
            let parts = Math.floor((platform.to - platform.from) / stateMap.tileX) - 1;
            while(--parts > 0)
            {
                x += stateMap.tileX;
                this.props.sprites.setFrame('ground-center', platform.type, this.canvasSprites, ctx, x, mapHeight);
            }
            x += stateMap.tileX;
            this.props.sprites.setFrame('ground-right', platform.type, this.canvasSprites, ctx, x, mapHeight);
        }

        let environment = stateMap.environment;
        for(let i = 0, len = environment.length; i < len; i++)
        {
            let environmentItem = environment[i];
            let x = (environmentItem.x) - stateMap.offset;
            if(x < drawFrom || x > drawTo) continue;
            let y = environmentItem.y - ((environmentItem.height - 1) * stateMap.tileY);
            if(environmentItem.visible)
            {
                let imgPrefix;
                let frame = 1;
                imgPrefix = ['environment', environmentItem.name].join('-');
                frame = environmentItem.frame;
                this.props.environment.setFrame(imgPrefix, frame, this.canvasEnvironment, ctx, x, y);
            }

            if(!this.props.drawPosition) continue;
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = "#8fffac";
            ctx.fillRect(x, y, environmentItem.width * stateMap.tileX, environmentItem.height * stateMap.tileY);
            ctx.globalAlpha = 1.0;
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

            let x = from;
            this.props.sprites.setFrame('platform-left', platform.type, this.canvasSprites, ctx, from, height);
            let diff = Math.floor((platform.to - platform.from) / stateMap.tileX);
            for(let i = 1, len = diff - 1; i < len; i++)
            {
                x += stateMap.tileX;
                this.props.sprites.setFrame('platform-center', platform.type, this.canvasSprites, ctx, x, height);
            }
            x += stateMap.tileX;
            this.props.sprites.setFrame('platform-right', platform.type, this.canvasSprites, ctx, x, height);

            if(!this.props.drawPosition) continue;
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = "#8fefff";
            for(let i = 0, len = (platform.to - platform.from) - stateMap.tileX; i <= len; i += stateMap.tileX)
            {
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
            ctx.fillStyle = "#fdff8f";
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
            ctx.fillStyle = "#ff4444";
            ctx.fillRect(x, (spike.y * stateMap.tileY), stateMap.tileX, stateMap.tileY);
            ctx.globalAlpha = 1.0;
        }

        for(let i = 0, len = stateMap.exit.length; i < len; i++)
        {
            let exit = stateMap.exit[i];
            let x = (exit.x) - stateMap.offset;
            if(x < drawFrom || x > drawTo) continue;
            // console.log('x', x, drawFrom, drawTo, exit);
            if(exit.visible)
            {
                let imgPrefix;
                let frame = 1;
                if(exit.blocker === null)
                {
                    imgPrefix = ['exit', exit.type.name].join('-');
                    frame = exit.type.frame;
                }
                else
                {
                    imgPrefix = ['blocker', exit.type.name].join('-');
                    frame = exit.blocker.frame;
                    
                }
                // console.log(imgPrefix, frame);
                this.props.sprites.setFrame(imgPrefix, frame, this.canvasSprites, ctx, x, exit.y);
            }
            if(!this.props.drawPosition) continue;
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = "#ffb0f5";
            let width = stateMap.tileX * 2;
            ctx.fillRect(x, exit.y, width, stateMap.tileY);
            ctx.globalAlpha = 1.0;
        }

        for(let i = 0, len = stateMap.items.length; i < len; i++)
        {
            let item = stateMap.items[i];
            let x = (item.x) - stateMap.offset;
            if(x < drawFrom || x > drawTo) continue;
            if(item.visible)
            {
                // console.log('x', x, drawFrom, drawTo, exit);
                let imgPrefix = (item.collected) ? 'star-explode' : ['item', item.name].join('-');
                this.props.sprites.setFrame(imgPrefix, item.frame, this.canvasSprites, ctx, x, item.y);
            }
            if(!this.props.drawPosition) continue;
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = "#ff9244";
            ctx.fillRect(x, item.y, stateMap.tileX, stateMap.tileY);
            ctx.globalAlpha = 1.0;
        }

        let enemies = stateMap.enemies;
        let imgExplode = 'enemy-explode';
        for(let i = 0, len = enemies.length; i < len; i++)
        {
            let enemy = enemies[i];
            let x = Math.floor(enemy.x - stateMap.offset);

            if(enemy.death || x < drawFrom || x > drawTo) continue;
            if(enemy.visible)
            {
                let img = (enemy.right) ? `enemy-${enemy.type}-right` : `enemy-${enemy.type}-left`;
                if(enemy.die)
                {
                    img = imgExplode;
                }

                if(enemy.live.timer > 0)
                {
                    ctx.globalCompositeOperation = (enemy.live.timer < 20 && ((this.counter % 2) === 0)) ? 'source-over' : 'luminosity';
                    ctx.globalAlpha = 0.75;
                }
                this.props.sprites.setFrame(img, enemy.frame, this.canvasSprites, ctx, x, enemy.y);
                if(enemy.live.timer > 0) 
                {
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.globalAlpha = 1.0;
                }
            }
            if(!this.props.drawPosition) continue;
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = "#d21400";
            ctx.fillRect(x, (enemy.y * stateMap.tileY), stateMap.tileX, stateMap.tileY);
            ctx.globalAlpha = 0.3;
            ctx.fillRect(((enemy.from * stateMap.tileX) - 1) - stateMap.offset, enemy.y, ((enemy.to - (enemy.from - 1)) * stateMap.tileX), stateMap.tileY);
            ctx.globalAlpha = 1.0;

        }

        let quests = stateMap.quests;
        let questHeightOffset = (stateMap.tileY * 0.05);
        for(let i = 0, len = quests.length; i < len; i++)
        {
            let quest = quests[i];
            let x = Math.floor(quest.x - stateMap.offset);
            if(x < drawFrom || x > drawTo) continue;
            if(quest.visible)
            {
                let img = (quest.right) ? `quest-${quest.name}-right` : `quest-${quest.name}-left`;
                this.props.sprites.setFrame(img, quest.frame, this.canvasSprites, ctx, x, quest.y + questHeightOffset);
            }
            if(!this.props.drawPosition) continue;
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = "#e24420";
            ctx.fillRect(x, quest.y, stateMap.tileX, stateMap.tileY);
            ctx.globalAlpha = 0.3;
            ctx.fillRect(x, quest.y, (quest.to - (quest.x)), stateMap.tileY);
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
            let itemX = 1200;
            let itemY = 50;
            for(let i = 0, len = statePlayer.character.items.length; i < len; i++)
            {
                let item = statePlayer.character.items[i];
                let imgPrefix = ['item', item.name].join('-');
                this.props.sprites.setFrame(imgPrefix, 1, this.canvasSprites, ctx, itemX, itemY);
                itemX += Math.floor(stateMap.tileX * 1.2);
            }
        }


        if(!this.props.drawPosition) return;
        ctx.globalAlpha = 0.7;
        let playerLeftX = statePlayer.x + (stateMap.tileX * 0.75);
        let playerRightX = statePlayer.x + (stateMap.tileX * 0.25);
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

    processEnvironmentLoad(e)
    {
        if(!e || this.canvasEnvironment) return;
        this.canvasEnvironment = e;
        this.ctxEnvironment = e.getContext('2d');
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
            if (el.requestFullscreen) { el.requestFullscreen(); } else if (el.webkitRequestFullscreen) { el.webkitRequestFullscreen(); } else if (el.mozRequestFullScreen) { el.mozRequestFullScreen(); }  else if (el.msRequestFullscreen)  { el.msRequestFullscreen(); }
        } 
        else 
        {
            let el = document;
            if (el.webkitCancelFullScreen) { el.webkitCancelFullScreen(); } else if (el.mozCancelFullScreen) { el.mozCancelFullScreen(); }  else if (el.msExitFullscreen) { el.msExitFullscreen(); }
        }
    }

    render()
    {
        let loader = null;
        let state = this.state;
        let width = (state.loaded) ? this.props.width : 0;
        let height = (state.loaded) ? this.props.height : 0;
        let widthBackground = (state.loaded) ? this.mapImage.width : 0;
        let heightBackground = (state.loaded) ? this.mapImage.height : 0;
        let widthSprites = (state.loaded) ? this.spritesImage.width : 0;
        let heightSprites = (state.loaded) ? this.spritesImage.height : 0;
        let widthEnvironment = (state.loaded) ? this.environmentImage.width : 0;
        let heightEnvironment = (state.loaded) ? this.environmentImage.height : 0;
        let loaderStyle = { opacity: '1' };
        loader = (!this.spritesLoaded || !this.mapLoaded || !this.environmentLoaded) ? <div style={loaderStyle} onClick={(e) => this.toggleFullScreen(e)}><GameLoader /></div> : null;
        let canvasStyle = {};
        let canvasBackgroundStyle = { display: 'none' };
        return <div>{loader}
                    <canvas className="game" style={canvasStyle} ref={(e) => this.processLoad(e)} onClick={(e) => this.toggleFullScreen(e)} width={width} height={height} key="canvas-map"></canvas>
                    <canvas style={canvasBackgroundStyle} ref={(e) => this.processBackgroundLoad(e)} width={widthBackground} height={heightBackground} key="canvas-map-background"></canvas>
                    <canvas style={canvasBackgroundStyle} ref={(e) => this.processSpritesLoad(e)} width={widthSprites} height={heightSprites} key="canvas-map-sprites"></canvas>
                    <canvas style={canvasBackgroundStyle} ref={(e) => this.processEnvironmentLoad(e)} width={widthEnvironment} height={heightEnvironment} key="canvas-map-environment"></canvas>
                    <canvas style={canvasBackgroundStyle} ref={(e) => this.processFramebufferLoad(e)} width={width} height={height} key="canvas-map-framebuffer"></canvas>
                </div>;
    }
}