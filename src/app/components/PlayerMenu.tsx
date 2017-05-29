import * as React from 'react';
import { IStore, IStoreContext, IGameMapState, IPlayerState, IPlayerCharacterAttributesState } from '../reducers';
import { Store } from 'redux';
import StatusBar from '../components/StatusBar';
import { 
    PLAYER_UPDATE,
    PLAYER_ADD_ATTRIBUTES
} from '../actions/playerActions';

import { 
    GAME_WORLD_MAP_UPDATE,
    GAME_WORLD_MAP_SWITCH,
    GAME_WORLD_MAP_START_SET,
    GAME_WORLD_PLAYER_UPDATE,
    GAME_WORLD_PLAYER_ADD_EXPERIENCE,
    GAME_WORLD_PLAYER_ADD_STAR,
    GAME_WORLD_PLAYER_ADD_ATTRIBUTES,
    GAME_WORLD_EXPORT,
    GAME_WORLD_IMPORT
} from '../actions/gameWorldActions';

import { GAME_MAP_UPDATE } from '../actions/gameMapActions';

declare let imageType:typeof Image; 

export interface IPlayerMenuProps {
    onBackToGame?: () => any;
}

export interface IPlayerMenuState 
{
    loaded?: boolean;
    width?: number;
    height?: number;
    tab?: string;
    player?: IPlayerState;
    map?: IGameMapState;
    attributes?: IPlayerCharacterAttributesState;
    points?: number;
}

function mapStateFromStore(store: IStore, state: IPlayerMenuState): IPlayerMenuState {
    let attributes = Object.assign({}, store.world.player.character.attributes);
    let points = store.world.player.character.points;
    let newState = Object.assign({}, state, {player: store.world.player, map: store.world.maps[store.world.activeMap], attributes: attributes, points: points});
    return newState;
}

export default class PlayerMenu extends React.Component<IPlayerMenuProps, IPlayerMenuState> {

    static contextTypes: React.ValidationMap<any> = 
    {
        store: React.PropTypes.object
    }
    
    context: IStoreContext;
    unsubscribe: Function;

    private handlerKeyUp: any;
    private handlerKeyDown: any;

    constructor(props: IPlayerMenuProps) {
        super(props);
        let attributes: IPlayerCharacterAttributesState = {
            speed: 0,
            brake: 0,
            jump: 0
        };
        this.state = { 
        	loaded: false, 
        	width: 0, 
        	height: 0,
            tab: 'stats',
        	player: null,
            attributes: attributes,
            points: 0,
            map: null
        };
        this.handlerKeyDown = this.processKeyDown.bind(this);
        this.procedBackToGame = this.procedBackToGame.bind(this);
        this.changeAttribute = this.changeAttribute.bind(this);
    }

    componentDidMount() 
    {
        let storeState = this.context.store.getState();
        this.setStateFromStore();
        
        this.unsubscribe = this.context.store.subscribe(this.setStateFromStore.bind(this));

    	let width = window.innerWidth;
    	let height = 150;
    	window.onresize = function(e: any)
    	{
    		this.resize();
    	}.bind(this);

        let newState = Object.assign({}, this.state);
        newState.loaded = true;
        newState.width = width;
        newState.height = height;
        newState.attributes = Object.assign({}, storeState.player.character.attributes);
        newState.points = storeState.player.character.points;
        this.setState(newState);
        window.addEventListener('keyup', this.handlerKeyUp);
        window.addEventListener('keydown', this.handlerKeyDown);
        this.setState(mapStateFromStore(this.context.store.getState(), newState));
    }

    componentWillUnmount() 
    {
        if (this.unsubscribe) 
        {
            this.unsubscribe();
        }
        window.removeEventListener('keyup', this.handlerKeyUp);
        window.removeEventListener('keydown', this.handlerKeyDown);
    }
    
    setStateFromStore() 
    {
        let storeState = this.context.store.getState();
        this.setState(mapStateFromStore(this.context.store.getState(), this.state));
    }

    resize()
    {
    	let width = window.innerWidth;
    	let height = 150;
        this.setState({width: width, height: height});
    }

    processKeyDown(e: KeyboardEvent)
    {
        if(e.key !== 'Tab' || e.repeat) return;
        this.procedBackToGame(e);
    }

    processKeyUp(e: KeyboardEvent)
    {
        e.preventDefault();
    }

    procedBackToGame (e: any)
    {
        e.preventDefault();
        this.props.onBackToGame();
    }

    procedAttributeUpdate (e: any)
    {
        e.preventDefault();
        this.context.store.dispatch({type: GAME_WORLD_PLAYER_ADD_ATTRIBUTES, response: this.state.attributes });
    }

    changeAttribute (e: any, type: string, add: boolean)
    {
        e.preventDefault();
        console.log('changeAttribute '+type, add);
        if(['speed', 'brake', 'jump'].indexOf(type) === -1) return;
        console.log('changeAttribute2 '+type, add);
        if(add && this.state.points === 0) return;
        console.log('changeAttribute3 '+type, add);
        let newState = this.state;
        let value = (add) ? 1 : -1;
        switch(type)
        {
            case 'speed':
                if(!add && newState.attributes.speed === newState.player.character.attributes.speed) return;
                newState.attributes.speed += value;
                break;

            case 'brake':
                if(!add && newState.attributes.brake === newState.player.character.attributes.brake) return;
                newState.attributes.brake += value;
                break;

            case 'jump':
                if(!add && newState.attributes.jump === newState.player.character.attributes.jump) return;
                newState.attributes.jump += value;
                break;
        }
        newState.points = (add) ? newState.points - 1 : newState.points + 1;
        this.setState(newState);
        console.log('this.state '+type, this.state);
    }

    getAttributeItem(type: string): any
    {
        let valueCurrent = 0;
        let valueCharacter = 0;
        let key = 'game-player-menu-stats-item-' + type;
        switch(type)
        {
            case 'speed':
                valueCurrent = this.state.attributes.speed;
                valueCharacter = this.state.player.character.attributes.speed;
                name = 'Speed';
                break;

            case 'brake':
                valueCurrent = this.state.attributes.brake;
                valueCharacter = this.state.player.character.attributes.brake;
                name = 'Brake';
                break;

            case 'jump':
                valueCurrent = this.state.attributes.jump;
                valueCharacter = this.state.player.character.attributes.jump;
                name = 'Jump';
                break;

            default:
                return null;
        }
        let classPlus = (this.state.points === 0) ? "game-player-menu-stats-item-plus" : "game-player-menu-stats-item-plus active";
        let classMinus = (valueCurrent === valueCharacter) ? "game-player-menu-stats-item-minus" : "game-player-menu-stats-item-minus active";
        return <div className="game-player-menu-stats-item" key={key}>
                <div className="game-player-menu-stats-item-name" >{name}</div>
                <div className="game-player-menu-stats-item-value" >{valueCurrent}</div>
                <div className={classMinus} data-id="minus-speed" onClick={(e) => this.changeAttribute(e, type, false)}>-</div>
                <div className={classPlus} data-id="plus-speed" onClick={(e) => this.changeAttribute(e, type, true)}>+</div>
            </div>;
    }

    render() {
    	let width = (this.state.loaded) ? this.state.width : 0;
    	let height = (this.state.loaded) ? this.state.height : 0;
        let divStyle = {};
        
        let tabs: Array<any> = [];
        let divWindow = null;
        // let divNewGame = null;
        // let divTitle = null;
        // let divScore = null;
        // let divStars = null;
        // let divLives = null;
        if(this.state.loaded)
        {

            tabs.push(<div className="player-menu-tab active" data-id="stats" key="player-menu-tab-stats">Stats</div>);
            switch(this.state.tab)
            {
                case 'stats':
                    let attributes: Array<any> = [];
                    attributes.push(this.getAttributeItem('speed'));
                    attributes.push(this.getAttributeItem('brake'));
                    attributes.push(this.getAttributeItem('jump'));
                    let updateButton = null;
                    let pointsLeft = (this.state.points > 0) ? <span>... {this.state.points.toString()} points</span> : <span></span>;
                    if(this.state.player.character.points === this.state.points)
                    {
                        updateButton = <div className="game-player-menu-stats-update" key="game-player-menu-stats-update">Update</div>;
                    }
                    else
                    {
                        updateButton = <div className="game-player-menu-stats-update active" onClick={(e) => this.procedAttributeUpdate(e)} key="game-player-menu-stats-update">Update</div>;
                    }
                    let classPlus = (this.state.points <= 0) ? "game-player-menu-stats-item-plus" : "game-player-menu-stats-item-plus active";
                    let classMinus = (this.state.player.character.points === this.state.points) ? "game-player-menu-stats-item-minus" : "game-player-menu-stats-item-minus active";
                    let classUpdate = (this.state.player.character.points === this.state.points) ? "game-player-menu-stats-update" : "game-player-menu-stats-update active";
                    divWindow = <div className="game-player-menu-stats" key="game-player-menu-stats">
                                    <h2>Attributes {pointsLeft}</h2>
                                    {attributes}
                                    {updateButton}
                                </div>;
                    break;
            }
            // divTitle = <h2>You Win!</h2>;
            // divScore = <div className="game-win-score">Level: {this.state.player.character.level} ({this.state.player.character.experience})</div>;
            // divStars = <div className="game-win-stars">x {this.state.player.character.stars}</div>;
            // divLives = <div className="game-win-lives">Lives: {this.state.player.lives}</div>;
            // divNewGame = <div className="game-win-new" onClick={(e) => this.procedPlayAgain(e)}>Play Again</div>;
        }
        return <div className="game-player-menu" style={divStyle}>
                <StatusBar />
                <div className="game-player-menu-stats-tabs" key="game-player-menu-stats-tabs">{tabs}</div>
                {divWindow}
    			</div>;
    }
}