import * as React from 'react';
import { Link } from 'react-router';
import { IStore, IStoreContext, ISoundState } from '../reducers';
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
    sound?: ISoundState;
}

function mapStateFromStore(store: IStore, state: IMenuViewState): IMenuViewState 
{
    let newState = Object.assign({}, state);
    newState.sound = store.sound;
    return newState;
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
        	height: 0,
            sound: null
        };

        this.procedNewGame = this.procedNewGame.bind(this);
        this.procedEditor  = this.procedEditor.bind(this);
    }

    componentDidMount() 
    {
        console.log('Mount');
        let storeState = this.context.store.getState();
        this.setStateFromStore();
        storeState.sound.sound.loadList(['music-menu']);
        this.unsubscribe = this.context.store.subscribe(this.setStateFromStore.bind(this));

    	let width = window.innerWidth;
    	let height = 150;
    	window.onresize = function(e: any)
    	{
    		this.resize();
    	}.bind(this);

        let newState = Object.assign({}, this.state);
        newState.width = width;
        newState.height = height;
        this.setState(mapStateFromStore(this.context.store.getState(), newState));
        let music = 'music-menu';
        storeState.sound.sound.loadList([music]).then(() => {
            let newState = Object.assign({}, this.state);
            newState.loaded = true;
            // newState.sound.sound.playBackground(music);
            this.setState(mapStateFromStore(this.context.store.getState(), newState));
        }).catch(() => {
        });
    }

    componentWillUnmount() 
    {
        if (this.unsubscribe) 
        {
            this.unsubscribe();
        }
        // this.state.sound.sound.stop('music-menu');
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
        setTimeout(function() { this.props.history.push(LINK_GAME) }.bind(this), 500);
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
