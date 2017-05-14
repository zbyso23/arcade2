import * as React from 'react';
import { Link } from 'react-router';
import { IStore, IStoreContext } from '../reducers';
import { 
    LINK_MENU,
    LINK_GAME,
    LINK_EDITOR
} from '../routesList';

export interface IMenuViewState 
{
    loaded?: boolean;
    width?: number;
    height?: number;
}

function mapStateFromStore(store: IStore, state: IMenuViewState): IMenuViewState 
{
    return state;
}

export default class MenuView extends React.Component<any, IMenuViewState> 
{

    static contextTypes: React.ValidationMap<any> = 
    {
        store: React.PropTypes.object
    }
    
    context: IStoreContext;
    unsubscribe: Function;


    constructor(props: any) {
        super(props);
        this.state = { 
        	loaded: false, 
        	width: 0, 
        	height: 0
        };

        this.procedNewGame = this.procedNewGame.bind(this);
        this.procedEditor  = this.procedEditor.bind(this);
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
    	let height = window.innerHeight;
        this.setState({width: width, height: height});
    }

    procedNewGame (e: any)
    {
    	e.preventDefault();
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
        this.props.history.push(LINK_GAME);
    }

    procedEditor (e: any)
    {
    	e.preventDefault();
    }

    render() {
    	let width = (this.state.loaded) ? this.state.width : 0;
    	let height = (this.state.loaded) ? this.state.height : 0;
        let divStyle = {};
        let divTitle = null;
        let divNewGame = null;
        let divEditor = null;
        if(this.state.loaded)
        {
            divTitle   = <h2>ARCADE II</h2>;
            divNewGame = <div onClick={(e) => this.procedNewGame(e)} className="game-menu-new">New Game</div>;
            divEditor  = <Link to={LINK_EDITOR}><div className="game-menu-editor">Editor</div></Link>;
        }
        return <div className="game-menu" style={divStyle}>
                {divTitle}
                {divNewGame}
                {divEditor}
    			</div>;   
	}
}
