import * as React from 'react';
import { IStore, IStoreContext, ISoundState, IGameMapState, IGameMapPlatformState, IPlayerState } from '../reducers';
import { Store } from 'redux';
import { Sprites, ISprite, ISpriteBlock } from '../libs/Sprites';
import { PLAYER_UPDATE } from '../actions/playerActions';
import { GAME_MAP_UPDATE } from '../actions/gameMapActions';

let VIEW_ANGLE = 75;
let NEAR = 0.1;
let FAR = 1000;

declare let imageType:typeof Image; 

export interface IGameRender3DProps {
    sprites?: Sprites;
    width?: number;
    height?: number;
    drawPosition?: boolean;
}

export interface IGameRender3DState 
{
    loaded?: boolean;
    loader?: {
        imagesLeft: number,
        opacity: number,
    };
    width?: number;
    height?: number;
}


export class TextureAnimator 
{    
    private tilesHorizontal: number;
    private tilesVertical: number;
    private numberOfTiles: number;
    private tileDisplayDuration: number;
    private currentDisplayTime: number;
    private currentTile: number;
    private texture: any;

    constructor(texture: any, tilesHoriz: number, tilesVert: number, numTiles: number, tileDispDuration: number)
    {
        this.tilesHorizontal = tilesHoriz;
        this.tilesVertical = tilesVert;
        // how many images does this spritesheet contain?
        //  usually equals tilesHoriz * tilesVert, but not necessarily,
        //  if there at blank tiles at the bottom of the spritesheet. 
        this.numberOfTiles = numTiles;
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping; 
        texture.repeat.set( 1 / this.tilesHorizontal, 1 / this.tilesVertical );
        // how long should each image be displayed?
        this.tileDisplayDuration = tileDispDuration;
        // how long has the current image been displayed?
        this.currentDisplayTime = 0;
        // which image is currently being displayed?
        this.currentTile = 0;
        this.texture = texture;

    }
    // note: texture passed by reference, will be updated by the update function.
    frame(frame: number)
    {
        let frameKey = (frame >= this.tilesHorizontal) ? 0 : frame;
        let currentColumn = frameKey % this.tilesHorizontal;
        this.texture.offset.x = currentColumn / this.tilesHorizontal;
console.log(frame, this.texture.offset.x);
        let currentRow = Math.floor(frameKey / this.tilesHorizontal );
        this.texture.offset.y = currentRow / this.tilesVertical;
    };

    update = function(milliSec: number )
    {
        this.currentDisplayTime += milliSec;
        while (this.currentDisplayTime > this.tileDisplayDuration)
        {
            this.currentDisplayTime -= this.tileDisplayDuration;
            this.currentTile++;
            if (this.currentTile == this.numberOfTiles)
                this.currentTile = 0;
            let currentColumn = this.currentTile % this.tilesHorizontal;
            this.texture.offset.x = currentColumn / this.tilesHorizontal;
            let currentRow = Math.floor( this.currentTile / this.tilesHorizontal );
            this.texture.offset.y = currentRow / this.tilesVertical;
        }
    };
}        


export class TextureAnimator2
{    
    private tilesHorizontal: number;
    private tilesVertical: number;
    private numberOfTiles: number;
    private tileDisplayDuration: number;
    private currentDisplayTime: number;
    private currentTile: number;
    private texture: any;

    constructor(texture: any, tilesHoriz: number, tilesVert: number, numTiles: number, tileDispDuration: number)
    {
        this.tilesHorizontal = tilesHoriz;
        this.tilesVertical = tilesVert;
        // how many images does this spritesheet contain?
        //  usually equals tilesHoriz * tilesVert, but not necessarily,
        //  if there at blank tiles at the bottom of the spritesheet. 
        this.numberOfTiles = numTiles;
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping; 
        texture.repeat.set( 1 / this.tilesHorizontal, 1 / this.tilesVertical );
        // how long should each image be displayed?
        this.tileDisplayDuration = tileDispDuration;
        // how long has the current image been displayed?
        this.currentDisplayTime = 0;
        // which image is currently being displayed?
        this.currentTile = 0;
        this.texture = texture;

    }
    // note: texture passed by reference, will be updated by the update function.
    frame(frame: number)
    {
        if (frame === this.tilesHorizontal) frame = 0;
        var currentColumn = frame % this.tilesHorizontal;
        this.texture.offset.x = currentColumn / this.tilesHorizontal;
        var currentRow = Math.floor( frame / this.tilesHorizontal );
        this.texture.offset.y = currentRow / this.tilesVertical;
    };

        
    update(milliSec: number )
    {
        this.currentDisplayTime += milliSec;
        while (this.currentDisplayTime > this.tileDisplayDuration)
        {
            this.currentDisplayTime -= this.tileDisplayDuration;
            this.currentTile++;
            if (this.currentTile == this.numberOfTiles)
                this.currentTile = 0;
            var currentColumn = this.currentTile % this.tilesHorizontal;
            this.texture.offset.x = currentColumn / this.tilesHorizontal;
            var currentRow = Math.floor( this.currentTile / this.tilesHorizontal );
            this.texture.offset.y = currentRow / this.tilesVertical;
        }
    };
}        


function mapStateFromStore(store: IStore, state: IGameRender3DState): IGameRender3DState {
    // let newState = Object.assign({}, state, {player: store.player, map: store.map});
    // return newState;
    return state;
}

export default class GameRender3D extends React.Component<IGameRender3DProps, IGameRender3DState> {

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

    private renderer: THREE.WebGLRenderer = null;
    private scene: THREE.Scene = null;
    private camera: THREE.OrthographicCamera = null;
    private geometry: THREE.BoxGeometry = null;
    private material: THREE.MeshNormalMaterial = null;

    private cube: THREE.Mesh = null;

    private animators = {
        player: null,
        stars: [],
        spikes: [],
        enemies: []
    };

    private mesh = {
        player: null,
        stars: [],
        spikes: [],
        enemies: []
    };

    private clock: THREE.Clock;

    private sceneRendered = false;


    private mapImage: HTMLImageElement;
    private spritesImage: HTMLImageElement;
    private mapLoaded: boolean = false;
    private spritesLoaded: boolean = false;

    private requestAnimation: any;
    private counter: number = 0;

    private handlerKeyUp: any;
    private handlerKeyDown: any;

    constructor(props: IGameRender3DProps) {
        super(props);
        this.state = { 
            loaded: false, 
            loader: {
                imagesLeft: 0,
                opacity: 1
            },
            width: 0,
            height: 0
        };

        this.loaderImage = this.loaderImage.bind(this);
        this.gameRender = this.gameRender.bind(this);
        this.gameRenderPrepare = this.gameRenderPrepare.bind(this);
        this.toggleFullScreen = this.toggleFullScreen.bind(this);

        this.handlerKeyUp = this.processKeyUp.bind(this);
        this.handlerKeyDown = this.processKeyDown.bind(this);
        this.resize = this.resize.bind(this);
    }

    componentDidMount() 
    {
        let storeState = this.context.store.getState();
        this.unsubscribe = this.context.store.subscribe(this.setStateFromStore.bind(this));
        window.addEventListener('keydown', this.handlerKeyDown);
        window.addEventListener('keyup', this.handlerKeyUp);
        window.addEventListener('resize', this.resize);
        let newState = Object.assign({}, this.state);
        this.setState(mapStateFromStore(this.context.store.getState(), newState));
        this.loaderImagePrepare();
    }

    componentWillUnmount() 
    {
        window.removeEventListener('keydown', this.handlerKeyDown);
        window.removeEventListener('keyup', this.handlerKeyUp);
        window.removeEventListener('resize', this.resize);
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
        console.log('loaderImagePrepare()', this.state.loader.imagesLeft);
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
        console.log('loaderImagePrepare()', this.state.loader.imagesLeft);
    }

    loaderImage()
    {
        console.log('loaderImage()', this.state.loader.imagesLeft);
        let newState = Object.assign({}, this.state);
        newState.loader.imagesLeft -= 1;
        if(newState.loader.imagesLeft === 0)
        {
            setTimeout(() => {
                this.setState({loaded: true});
                this.gameRenderPrepare();
            }, 50);
        }
        this.setState(newState);
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
        this.clock = new THREE.Clock();
        this.requestAnimation = requestAnimationFrame(this.gameRender);
    }

    createPlatform(from = 1, to = 1, level = 1): THREE.Mesh 
    {
        let height = 10;
        let depth = 10;
        let width = to - from;
        let geometry = new THREE.BoxGeometry(width, height, depth);
        let material = new THREE.MeshNormalMaterial();

        let mesh = new THREE.Mesh(geometry, material);
        mesh.position.x = from + (width / 2);
        mesh.position.y = level;
        console.log('mesh', mesh);
        return mesh;
    }

    createStar(x = 1, level = 1): THREE.Mesh 
    {
        let depth = 32;
        let radius = 20;

        let geometry = new THREE.SphereGeometry( radius, depth, depth );
        let material = new THREE.MeshBasicMaterial( {color: 0xffff00} );

        let mesh = new THREE.Mesh(geometry, material);
        mesh.position.x = x;
        mesh.position.y = level;
        console.log('mesh', mesh);
        return mesh;
    }

    createSpike(x = 1, level = 1): THREE.Mesh 
    {
        let depth = 32;
        let radius = 15;

        let geometry = new THREE.SphereGeometry( radius, depth, depth );
        let material = new THREE.MeshBasicMaterial( {color: 0xff2222} );

        let mesh = new THREE.Mesh(geometry, material);
        mesh.position.x = x;
        mesh.position.y = level;
        console.log('mesh', mesh);
        return mesh;
    }

    createPlayer(x = 1, level = 1): THREE.Mesh 
    {
        let depth = 32;
        let radius = 50;



        // let geometry = new THREE.SphereGeometry( radius, depth, depth );
        // let material = new THREE.MeshBasicMaterial( {color: 0x12ff2b} );
        // let mesh = new THREE.Mesh(geometry, material);

        // let runnerTexture = new THREE.ImageUtils.loadTexture( 'images/sprites.png' );
        let runnerTexture = new THREE.TextureLoader().load('images/sprites-ninja-walk-right.png');
        let animator = new TextureAnimator( runnerTexture, 21, 1, 21, 30 ); // texture, #horiz, #vert, #total, duration.
        let runnerMaterial = new THREE.MeshBasicMaterial( { map: runnerTexture, side:THREE.DoubleSide } );
        let runnerGeometry = new THREE.PlaneGeometry(radius, radius, 1, 1);
        let mesh = new THREE.Mesh(runnerGeometry, runnerMaterial);
        this.animators.player = animator;
        // mesh.position.set(x, level, 0);
        // scene.add(runner);

        mesh.position.x = x;
        mesh.position.y = level;
        console.log('mesh', mesh);
        return mesh;
    }


    gameSceneRender()
    {
        this.resize();
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: false,
            antialias: true
        });
        this.scene = new THREE.Scene();
        // this.camera = new THREE.PerspectiveCamera(
        //     VIEW_ANGLE,
        //     this.state.width / this.state.width,
        //     NEAR,
        //     FAR
        // );
        
        this.camera = new THREE.OrthographicCamera( this.state.width / - 2, this.state.width / 2, this.state.height / 2, this.state.height / - 2);

        this.scene.add(this.camera);
        this.camera.position.x = 0;
        this.camera.position.y = 500;
        this.camera.position.z = 200;
        this.camera.updateProjectionMatrix();
        // this.camera.position.z = 2;
        // this.camera.position.x += (this.state.width / 2) / 1000;

        // let geometry = new THREE.BoxGeometry(1, 1, 1);
        // let material = new THREE.MeshNormalMaterial();
        // let cube = new THREE.Mesh(geometry, material);
        // let cube = this.createPlatform(10, 200, 10);
        // this.scene.add(cube);




        let storeState  = this.context.store.getState();
        let stateMap    = storeState.map;
        let statePlayer = storeState.player;

        let mapHeight = (10 * stateMap.tileY) - (stateMap.height * stateMap.tileY);

        let ground = stateMap.ground;
        for(let i in ground)
        {
            let platform = ground[i];
            let from = platform.from * stateMap.tileX;
            let to   = ((platform.to * stateMap.tileX) + stateMap.tileX);
            let height = (10 * stateMap.tileY) - platform.height;
            let cube = this.createPlatform(from, to, mapHeight);
            this.scene.add(cube);
        }

        let floor = stateMap.floor;
        for(let i in floor)
        {
            let platform = floor[i];
            let from = platform.from;
            let to   = platform.to - stateMap.tileX;
            let height = (10 * stateMap.tileY) - (platform.height);
            let cube = this.createPlatform(from, to, height);
            this.scene.add(cube);
        }

        let stars = stateMap.stars;
        let starsMesh = [];
        for(let i in stars)
        {
            let star = stars[i];

            if(star === null)
            {
                starsMesh.push(null);
                continue;
            }
            let x = (star.x * stateMap.tileX);
            let y = (10 * stateMap.tileY) - ((star.y * stateMap.tileY));
            let sphere = this.createStar(x, y);
            this.scene.add(sphere);
            starsMesh.push(sphere);
            // let imgPrefix = (star.collected) ? 'item-star-explode' : 'item-star';
        }

        let spikes = stateMap.spikes;
        let spikesMesh = [];
        for(let i in spikes)
        {
            let spike = spikes[i];
            if(spike === null)
            {
                spikesMesh.push(null);
                continue;
            }
            let x = (spike.x * stateMap.tileX);
            let y = (10 * stateMap.tileY) - ((spike.y * stateMap.tileY));
            let sphere = this.createSpike(x, y);
            this.scene.add(sphere);
            spikesMesh.push(sphere);
        }

        let player = this.createPlayer(statePlayer.x, (10 * stateMap.tileY) - statePlayer.y);
        this.scene.add(player);
        this.mesh.stars = starsMesh;
        this.mesh.spikes = spikesMesh;
        this.mesh.player = player;

    }

    gameRender()
    {
        if(this.state.loaded)
        {
            if(this.sceneRendered)
            {
                this.renderer.render(this.scene, this.camera);
            }
            else
            {
                if(this.renderer === null && typeof THREE !== 'undefined' && this.canvas)
                {
                    this.gameSceneRender();
                }
                this.sceneRendered = true;
            }
            this.redraw();
            this.redrawPlayer();
            // let drawFrom = Math.min(0, (this.state.player.x - this.props.width));
            // let drawTo   = (this.state.player.x + this.props.width);
            // let drawWidth = drawTo - drawFrom;
            // this.ctx.clearRect(drawFrom, 0, drawWidth, this.props.height);
            // this.ctx.drawImage(this.canvasFB, 0, 0);
        }
        this.requestAnimation = requestAnimationFrame(this.gameRender);
    }

    redraw()
    {
if(1==1) return;
        let width     = this.props.width;
        let height    = this.props.height;
        let storeState  = this.context.store.getState();
        let stateMap    = storeState.map;
        let statePlayer = storeState.player;

        let stars = this.mesh.stars;
        let frames = 7;
        let framesHalf = 7 / 2;
        for(let i in stateMap.stars)
        {
            let star = stateMap.stars[i];
            if(star === null) continue;
            let key = parseInt(i);
            if(star.collected)
            {
                this.mesh.stars[key].scale.x = 0.5 - (star.frame / 13);
                this.mesh.stars[key].scale.y = 0.5 - (star.frame / 13);
                if(star.frame === 7) 
                {
                    this.scene.remove(this.mesh.stars[key]);
                }
            }
            else
            {
                let f = (1 - ((star.frame - framesHalf) / frames));
                f = (star.frame / frames) - framesHalf;
                this.mesh.stars[key].scale.y = 3 + f;
                this.mesh.stars[key].scale.x = 3 + f;
            }
            
        }


        // for(let i = 0, len = stateMap.exit.length; i < len; i++)
        // {
        //     let x = (stateMap.exit[i].x * stateMap.tileX) - stateMap.offset;
        //     if(x >= drawFrom && x <= drawTo) 
        //     {
        //         let imgPrefix = 'exit';
        //         this.props.sprites.setFrame(imgPrefix, 1, this.canvasSprites, ctx, x, (stateMap.exit[i].y * stateMap.tileY));
                
        //         if(!this.props.drawPosition) continue;
        //         ctx.globalAlpha = 0.5;
        //         ctx.fillRect(x, (stateMap.exit[i].y * stateMap.tileY), stateMap.tileX, stateMap.tileY);
        //         ctx.globalAlpha = 1.0;

        //     }
        // }

        // let enemies = stateMap.enemies;
        // let enemyHeightOffset = (stateMap.tileY * 0.05);
        // for(let i = 0, len = enemies.length; i < len; i++)
        // {
        //     let enemy = enemies[i];
        //     let x = Math.floor(enemy.x - stateMap.offset);
        //     if(enemy.death || x < drawFrom || x > drawTo) continue;
        //     let img = (enemy.right) ? 'enemy-right' : 'enemy-left';;
        //     if(enemy.die)
        //     {
        //         img = 'enemy-explode';

        //     }
        //     this.props.sprites.setFrame(img, enemy.frame, this.canvasSprites, ctx, x, enemy.height + enemyHeightOffset);
        //     if(!this.props.drawPosition) continue;
        //     ctx.globalAlpha = 0.5;
        //     ctx.fillRect(x, (enemy.height * stateMap.tileY), stateMap.tileX, stateMap.tileY);
        //     ctx.globalAlpha = 0.3;
        //     ctx.fillRect(((enemy.from * stateMap.tileX) - 1) - stateMap.offset, enemy.height, ((enemy.to - (enemy.from - 1)) * stateMap.tileX), stateMap.tileY);
        //     ctx.globalAlpha = 1.0;

        // }

        // if(stateMap.clouds.length === 0) return;

        // for(let i in stateMap.clouds)
        // {
        //     let cloud = stateMap.clouds[i];
        //     if(cloud.x < (width/-2) || cloud.x > drawTo) continue;
        //     let imgPrefix = 'cloud';
        //     this.props.sprites.setFrame(imgPrefix, cloud.type, this.canvasSprites, ctx, Math.floor(cloud.x), Math.floor(cloud.y));
        // }
    }

    redrawPlayer()
    {
        // let ctx       = this.ctx;//FB;
        let storeState  = this.context.store.getState();
        let stateMap    = storeState.map;
        let statePlayer = storeState.player;

        this.mesh.player.position.x = statePlayer.x;
        this.mesh.player.position.y = (10 * stateMap.tileY) - (statePlayer.y + (stateMap.tileY * 0.7));

        // this.animators.player.update(1000 * this.clock.getDelta());
        let frame = (statePlayer.frame - 1);
        this.animators.player.frame(frame);
        // this.mesh.player.scale.x = 1 + (statePlayer.frame / 15);
        // this.mesh.player.scale.y = 1 + (statePlayer.frame / 15);
        this.camera.position.x = statePlayer.x;
    }

    processLoad(e)
    {
        if(!e || this.renderer !== null) return;
        this.canvas = e;
        // this.ctx = e.getContext('2d');
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

    processKeyDown(e: KeyboardEvent)
    {
        if(e.repeat) 
        {
            let assignKeys = [32, 37, 39, 38, 40];
            if(assignKeys.indexOf(e.keyCode) > -1) e.preventDefault();
            return;
        }
        this.toggleKey(e);
    }

    processKeyUp(e: KeyboardEvent)
    {
        this.toggleKey(e);
    }

    toggleKey(e: KeyboardEvent)
    {
        // console.log('toggleKey', e.keyCode);
        // console.log('toggleKey', e);
        /*
        9 - Tab
        32 - Space
        113 - F2
        37 - ArrowLeft
        39 - ArrowRight
        87 - w
        65 - a
        83 - s
        68 - d
        */
        // let storeState = this.context.store.getState();
        // let statePlayer = storeState.player;
        let assignKeys = [87, 65, 83, 68];
        if(assignKeys.indexOf(e.keyCode) === -1) return;
        let key = e.keyCode;
        let isShift = (e.shiftKey === true);
        let isCtrl = (e.ctrlKey === true);
        e.preventDefault();
        let offset = 100;
        offset *= (key === 65) ? -1 : 1;
        if(isShift)
        {
            this.camera.position.x += offset;
        }
        else if(isCtrl)
        {
            this.camera.position.y += offset;
        }
        console.log('camera', this.camera.position);
        // if(!statePlayer.started) 
        // {
        //     statePlayer.started = true;
        //     this.context.store.dispatch({type: PLAYER_UPDATE, response: statePlayer });
        // }
        // let newControls = Object.assign({}, this.state.controls);
        // let playerWalkSound = -1;
        // let playerJumpSound = false;
        // switch(e.keyCode)
        // {
        //     case 32:
        //         //|| (statePlayer.jump !== statePlayer.y)
        //         newControls.up = (e.type === 'keyup' || statePlayer.y !== statePlayer.surface) ? false : true;
        //         playerJumpSound = newControls.up;
        //         break;

        //     case 37:
        //         newControls.left = (e.type === 'keyup') ? false : true;
        //         playerWalkSound = (newControls.left) ? 1 : 0;
        //         break;

        //     case 39:
        //         newControls.right = (e.type === 'keyup') ? false : true;
        //         playerWalkSound = (newControls.right) ? 1 : 0;
        //         break;
        // }
        // if(playerWalkSound !== -1) 
        // {
        //     let toggle = (playerWalkSound === 0) ? this.soundOff('sfx-player-walk') : this.soundLoop('sfx-player-walk');
        // }
        // if(playerJumpSound) this.soundOn('sfx-player-jump');

        // if((newControls.right && !this.state.controls.right) || (newControls.left && !this.state.controls.left))
        // {
        //     statePlayer.right = (newControls.right && !this.state.controls.right) ? true : false;
        //     statePlayer.speed *= 0.6;
        //     newControls.dirChanged = statePlayer.speed * 0.45;
        //     this.context.store.dispatch({type: PLAYER_UPDATE, response: statePlayer });
        // }
        // this.setState({controls: newControls});
    }

    resize()
    {
        let width = window.innerWidth;
        let height = window.innerHeight;
        this.setState({width: width, height: height});
        if(this.renderer === null) return;

        // this.camera.left = this.state.width / - 2;
        // this.camera.right = this.state.width / 2;
        // this.camera.top = this.state.height / - 2;
        // this.camera.bottom = this.state.height / 2;
        this.camera.updateProjectionMatrix();
    }

    render()
    {
        let state = this.state;
        let width = (state.loaded) ? this.state.width : 0;
        let height = (state.loaded) ? this.state.height : 0;
        let widthBackground = (state.loaded) ? this.mapImage.width : 0;
        let heightBackground = (state.loaded) ? this.mapImage.height : 0;
        let widthSprites = (state.loaded) ? this.spritesImage.width : 0;
        let heightSprites = (state.loaded) ? this.spritesImage.height : 0;
        if(state.loaded && this.renderer !== null) this.renderer.setSize(this.state.width, this.state.height);
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