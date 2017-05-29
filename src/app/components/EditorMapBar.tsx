import * as React from 'react';
import { IStore, IStoreContext, IGameMapState, IPlayerState } from '../reducers';
import { Store } from 'redux';

declare let imageType:typeof Image; 

export interface IEditorMapBarProps {
    name?: string;
    value?: string;
}

export interface IEditorMapBarState 
{
    loaded?: boolean;
    width?: number;
    height?: number;
    player?: IPlayerState;
    map?: IGameMapState;
}

function mapStateFromStore(store: IStore, state: IEditorMapBarState): IEditorMapBarState {
    if(!store.world.loaded) return state;
    let newState = Object.assign({}, state, {player: store.world.player, map: store.world.maps[store.world.activeMap]});
    return newState;
}

export default class EditorMapBar extends React.Component<IEditorMapBarProps, IEditorMapBarState> {

    static contextTypes: React.ValidationMap<any> = 
    {
        store: React.PropTypes.object
    }
    
    context: IStoreContext;
    unsubscribe: Function;


    constructor(props: IEditorMapBarProps) {
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
        let widthPx = [this.state.width.toString(), "px"].join();
        let heightPx = [this.state.height.toString(), "px"].join();
        let divStyle = { opacity: 0.5, width: widthPx, height: heightPx };
        let divValues = null;
        let divName = null;

        let spanPoints = null;
        if(this.state.loaded)
        {
            // divStyle['width'] = width.toString() + 'px';
            // divStyle['height'] = height.toString() + 'px';
            // if(this.state.player.character.points > 0)
            // {
            //     spanPoints = <span className="game-status-points-left">{this.state.player.character.points}</span>;
            // }
            divName = <div className="editor-map-status-name">{this.props.name}</div>;
            divValues = <div className="editor-map-status-values">Data: {this.props.value}</div>;
        }
        return <div className="editor-map-status" style={divStyle}>
                 {divValues}{divName}
    			</div>;
    }
}