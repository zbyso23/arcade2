import * as React from 'react';
import { IStore, IStoreContext, IGameMapState, IPlayerState } from '../reducers';
import { Store } from 'redux';
import { PLAYER_UPDATE } from '../actions/playerActions';
import { GAME_MAP_UPDATE } from '../actions/gameMapActions';

declare let imageType:typeof Image; 

export interface IStatusBarProps {
}

export interface IStatusBarState 
{
    loaded?: boolean;
    width?: number;
    height?: number;
    player?: IPlayerState;
    map?: IGameMapState;
}

function mapStateFromStore(store: IStore, state: IStatusBarState): IStatusBarState {
    if(!store.world.loaded) return state;
    let newState = Object.assign({}, state, {player: store.world.player, map: store.world.maps[store.world.activeMap]});
    return newState;
}

export default class StatusBar extends React.Component<IStatusBarProps, IStatusBarState> {

    static contextTypes: React.ValidationMap<any> = 
    {
        store: React.PropTypes.object
    }
    
    context: IStoreContext;
    unsubscribe: Function;


    constructor(props: IStatusBarProps) {
        super(props);
        this.state = { 
        	loaded: false, 
        	width: 0, 
        	height: 0,
        	player: null,
            map: null
        };
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
        this.setState(mapStateFromStore(this.context.store.getState(), newState));
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
        let storeState = this.context.store.getState();
        this.setState(mapStateFromStore(this.context.store.getState(), this.state));
    }

    resize()
    {
    	let width = window.innerWidth;
    	let height = 150;
        this.setState({width: width, height: height});
    }

    render() {
    	let width = (this.state.loaded) ? this.state.width : 0;
    	let height = (this.state.loaded) ? this.state.height : 0;
		// let rows = [];
		// for (let i=1; i <= 9; i++) 
		// {
		// 	let id = 'sonic-right' + i.toString();
		// 	let idLeft = 'sonic-left' + i.toString();
		// 	let idJump = 'sonic-jump' + i.toString();
		// 	let src = 'img/sonic-right' + i.toString() + '.png';
		// 	let srcLeft = 'img/sonic-left' + i.toString() + '.png';
		// 	let srcJump = 'img/sonic-jump' + i.toString() + '.png';
		// 	rows.push(<img src={src} id={id} key={id} />);
		// 	rows.push(<img src={srcLeft} id={idLeft} key={idLeft} />);
		// 	rows.push(<img src={srcJump} id={idJump} key={idJump} />);
		// }
        let divStyle = {};
        let divLives = null;
        let divScore = null;
        let divStars = null;
        let divPoints = null;
        let divItems = null;
        let spanPoints = null;
        if(this.state.loaded)
        {
            // divStyle['width'] = width.toString() + 'px';
            // divStyle['height'] = height.toString() + 'px';
            if(this.state.player.character.points > 0)
            {
                spanPoints = <span className="game-status-points-left">{this.state.player.character.points}</span>;
            }
            divScore = <div className="game-status-score">{this.state.player.character.level}</div>;
            divPoints = <div className="game-status-points">{spanPoints}</div>;
            divLives = <div className="game-status-lives">x {this.state.player.lives}</div>;
            divStars = <div className="game-status-stars">x {this.state.player.character.stars}</div>;
            // Player items
            let itemsLen = this.state.player.character.items.length;
            let items: Array<any> = [];
            if(itemsLen > 0)
            {
                // let itemX = 1200;
                // let itemY = 50;

                for(let i = 0, len = this.state.player.character.items.length; i < len; i++)
                {
                    let item = this.state.player.character.items[i];
                    let imgPrefix = ['item', item.name].join('-');
                    let img = '../images/' + imgPrefix + '1.png';
                    let key = ['status', imgPrefix, i.toString()].join('-');
                    let itemElement = <img key={key} src={img} className="game-status-item" title={item.name} />;
                    items.push(itemElement);
                    // itemX += Math.floor(stateMap.tileX * 1.2);
                }
            }

            divItems = <div className="game-status-items">{items}</div>;
        }
        return <div className="game-status" style={divStyle}>
                 {divLives}{divStars}{divScore}{divPoints}{divItems}
    			</div>;
    }
}