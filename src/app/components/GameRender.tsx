import * as React from 'react';
import { IStore, IStoreContext, ISoundState, IGameMapState, IGameMapPlatformState, IPlayerState } from '../reducers';
import { Store } from 'redux';
import { Sprites, ISprite, ISpriteBlock } from '../libs/Sprites';
import { PLAYER_UPDATE } from '../actions/playerActions';
import { GAME_MAP_UPDATE } from '../actions/gameMapActions';

declare let imageType:typeof Image; 

export interface IGameRenderProps {
    sprites?: Sprites;
    width?: number;
    height?: number;
}

export interface IGameRenderState 
{
    loaded?: boolean;
    player?: IPlayerState;
    map?: IGameMapState;
    loader?: {
        imagesLeft: number,
        opacity: number,
    }
}

function mapStateFromStore(store: IStore, state: IGameRenderState): IGameRenderState {
    let newState = Object.assign({}, state, {player: store.player, map: store.map});
    return newState;
}

export default class GameRender extends React.Component<IGameRenderProps, IGameRenderState> {

    private cached: { [id: string]: HTMLImageElement } = {};

    static contextTypes: React.ValidationMap<any> = 
    {
        store: React.PropTypes.object
    }
    
    context: IStoreContext;
    unsubscribe: Function;

    private ctx: CanvasRenderingContext2D;
    private canvasFB: HTMLCanvasElement;
    private ctxFB: CanvasRenderingContext2D;
    private canvasBackground: HTMLCanvasElement;
    private ctxBackground: CanvasRenderingContext2D;
    private canvasSprites: HTMLCanvasElement;
    private ctxSprites: CanvasRenderingContext2D;

    private mapImage: HTMLImageElement;
    private spritesImage: HTMLImageElement;
    private mapLoaded: boolean = false;
    private spritesLoaded: boolean = false;

    private requestAnimation: any;
    private counter: number = 0;

    constructor(props: IGameRenderProps) {
        super(props);
        this.state = { 
            loaded: false, 
            player: null,
            map: null,
            loader: {
                imagesLeft: 0,
                opacity: 1
            },
        };

        this.loaderImage = this.loaderImage.bind(this);
        this.gameRender = this.gameRender.bind(this);
    }

    componentDidMount() 
    {
        let storeState = this.context.store.getState();
        this.unsubscribe = this.context.store.subscribe(this.setStateFromStore.bind(this));
        let newState = Object.assign({}, this.state);
        this.setState(mapStateFromStore(this.context.store.getState(), newState));
        this.loaderImagePrepare();
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
    }

    loaderImagePrepare()
    {
        let newState = Object.assign({}, this.state);
        newState.loader.imagesLeft = 2;
        this.setState(newState);

        let i = new Image();
        i.onload = this.loaderImage;
        //i.src = 'img/map-background2.jpg';
        i.src = 'images/map-cave1.png';
        this.mapImage = i;

        let i2 = new Image();
        i2.onload = this.loaderImage;
        i2.src = 'images/sprites.png';
        this.spritesImage = i2;
    }

    loaderImage()
    {
        let newState = Object.assign({}, this.state);
        newState.loader.imagesLeft -= 1;
        if(newState.loader.imagesLeft === 0)
        {
            setTimeout(() => {
                this.setState({loaded: true});
                this.gameRender();
            }, 20);
        }
        this.setState(newState);
    }


    gameRender()
    {
        if(this.state.loaded) 
        {
            this.redraw();
            // DEBUG
            // ctx.fillStyle = "#4cf747"; this.ctx.fillRect(this.state.player.x + 45, 335, 2, 20);
            // for(let i = 0, len = this.state.map.groundFall.length; i < len; i++) { this.ctx.fillStyle = (this.state.map.groundFall[i]) ? "#fc4737" : "#4cf747"; this.ctx.fillRect(i, 335, i + 1, 20); }
            this.redrawPlayer();
            // this.ctx.clearRect(drawFrom, 0, drawWidth, this.state.height);
            // this.ctx.drawImage(this.canvasFB, 0, 0);
        }
        this.requestAnimation = requestAnimationFrame(this.gameRender);
    }

    redraw()
    {
        let width     = this.props.width;
        let height    = this.props.height;
        let player    = this.state.player;
        let mapState  = this.state.map;
        let mapHeight = mapState.height * this.state.map.tileY;
        let drawFrom = Math.min(0, (player.x - width));
        let drawTo   = (player.x + width);
        let drawWidth = drawTo - drawFrom;
        let ctx       = this.ctx;//FB;
        ctx.clearRect(drawFrom, 0, drawWidth, this.props.height);
        if(this.mapLoaded)
        {
            //ctx.drawImage(this.canvasBackground, (mapState.offset * -.13), 0);
            ctx.drawImage(this.canvasBackground, (mapState.offset * -.065), 0);
        }

        if(this.ctxBackground && !this.mapLoaded)
        {
            this.ctxBackground.drawImage(this.mapImage, 0, 0);
            this.mapLoaded = true;
        }

        if(this.ctxSprites && !this.spritesLoaded)
        {
            this.ctxSprites.drawImage(this.spritesImage, 0, 0);
            this.spritesLoaded = true;
        }

        if(!this.spritesLoaded) return;

        let ground = this.state.map.ground;
        for(let i in ground)
        {
            let platform = ground[i];
            let from = (platform.from * mapState.tileX) - mapState.offset;
            let to2   = ((platform.to - platform.from) * mapState.tileX);
            let to   = from + to2;
            let type = 2;
            if(to < drawFrom || from > drawTo) continue;
            for(let i = 0, len = (platform.to - platform.from); i <= len; i++)
            {
                let x = ((platform.from + i) * mapState.tileX) - mapState.offset;
                let name = 'ground-center';
                if(i === 0 || i === len)
                {
                    name = (i === 0) ? 'ground-left' : 'ground-right';
                }
                this.props.sprites.setFrame(name, type, this.canvasSprites, ctx, x, mapHeight);
            }
        }

        let floor = this.state.map.floor;
        for(let i in floor)
        {
            let platform = floor[i];
            let from = (platform.from * mapState.tileX) - mapState.offset;
            let to2   = (((platform.to - platform.from) + 1) * mapState.tileX);
            let to   = from + to2;
            if(to < drawFrom || from > drawTo) continue;
            let height = (platform.height * this.state.map.tileY);
            // 1 - light red, 2 - light blue, 3 - light green, 4 - blue, 5 - gray, 6 - red
            //let type = (!platform.bothSide) ? 4 : 1;
            let type = (!platform.bothSide) ? 3 : 5;
            for(let i = 0, len = (platform.to - platform.from); i <= len; i++)
            {
                let x = ((platform.from + i) * mapState.tileX) - mapState.offset;
                let name = 'platform-center';
                if(i === 0 || i === len)
                {
                    name = (i === 0) ? 'platform-left' : 'platform-right';
                }
                this.props.sprites.setFrame(name, type, this.canvasSprites, ctx, x, height);
            }
        }

        let stars = mapState.stars;
        for(let i in stars)
        {
            let star = stars[i];
            if(star === null) continue;
            let x = (star.x * mapState.tileX) - mapState.offset;
            if(x < drawFrom || x > drawTo) continue;
            let imgPrefix = (star.collected) ? 'item-star-explode' : 'item-star';
            this.props.sprites.setFrame(imgPrefix, star.frame, this.canvasSprites, ctx, x, (star.y * this.state.map.tileY));
        }

        let spikes = mapState.spikes;
        for(let i in spikes)
        {
            let spike = spikes[i];
            if(spike === null) continue;
            let x = (spike.x * mapState.tileX) - mapState.offset;
            if(x < drawFrom || x > drawTo) continue;
            let imgPrefix = 'spike';
            this.props.sprites.setFrame(imgPrefix, 1, this.canvasSprites, ctx, x, (spike.y * this.state.map.tileY));
        }

        for(let i = 0, len = mapState.exit.length; i < len; i++)
        {
            let x = (mapState.exit[i].x * mapState.tileX) - mapState.offset;
            if(x >= drawFrom && x <= drawTo) 
            {
                let imgPrefix = 'exit';
                this.props.sprites.setFrame(imgPrefix, 1, this.canvasSprites, ctx, x, (mapState.exit[i].y * this.state.map.tileY));
            }
        }

        let enemies = mapState.enemies;
        let enemyHeightOffset = (mapState.tileY * 0.05);
        for(let i = 0, len = enemies.length; i < len; i++)
        {
            let enemy = enemies[i];
            let x = enemy.x - mapState.offset;
            if(enemy.death || x < drawFrom || x > drawTo) continue;
            let img = (enemy.right) ? 'enemy-right' : 'enemy-left';;
            if(enemy.die)
            {
                img = 'enemy-explode';

            }
            this.props.sprites.setFrame(img, enemy.frame, this.canvasSprites, ctx, x, (enemy.height * this.state.map.tileY) + enemyHeightOffset);
        }

        for(let i in this.state.map.clouds)
        {
            let cloud = this.state.map.clouds[i];
            if(cloud.x < (width/-2) || cloud.x > drawTo) continue;
            let imgPrefix = 'cloud';
            this.props.sprites.setFrame(imgPrefix, cloud.type, this.canvasSprites, ctx, cloud.x, cloud.y);
        }
    }

    redrawPlayer()
    {
        let ctx       = this.ctx;//FB;
        let mapState = this.state.map;
        let playerState = this.state.player;
        let img = (playerState.right) ? 'ninja-right' : 'ninja-left';;
        if(playerState.death)
        {
            img = 'ninja-explode';

        }
        else if(playerState.jumping > 15)
        {
            img = (playerState.right) ? 'ninja-jump-right' : 'ninja-jump-left';
        }
        let y = Math.ceil(playerState.y - (mapState.tileY * 0.95));
        this.props.sprites.setFrame(img, playerState.frame, this.canvasSprites, ctx, playerState.x - this.state.map.offset, y);
    }

    processLoad(e)
    {
        if(!e || this.ctx) return;
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