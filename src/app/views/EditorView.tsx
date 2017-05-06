import * as React from 'react';
import { Link } from 'react-router';
import { IStore, IStoreContext } from '../reducers';
import { 
    LINK_MENU,
    LINK_GAME,
    LINK_EDITOR_MAP,
    LINK_EDITOR_SPRITES,
    LINK_EDITOR_WORLD
} from '../routesList';

export interface IMenuViewProps {
}

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

export default class EditorView extends React.Component<IMenuViewProps, IMenuViewState> 
{

    static contextTypes: React.ValidationMap<any> = 
    {
        store: React.PropTypes.object
    }
    
    context: IStoreContext;
    unsubscribe: Function;


    constructor(props: IMenuViewProps) {
        super(props);
        this.state = { 
            loaded: false, 
            width: 0, 
            height: 0
        };

        this.procedNewGame = this.procedNewGame.bind(this);
        this.procedEditor  = this.procedEditor.bind(this);
        this.resize = this.resize.bind(this);
    }

    componentDidMount() 
    {
        let storeState = this.context.store.getState();
        this.setStateFromStore();
        
        this.unsubscribe = this.context.store.subscribe(this.setStateFromStore.bind(this));

        let width = window.innerWidth;
        let height = 150;
        window.addEventListener('resize', this.resize);

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
        window.removeEventListener('resize', this.resize);
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
        let divSprites = null;
        let divMap = null;
        let divMenu = null;
        if(this.state.loaded)
        {
            divTitle   = <h2>ARCADE II Editor</h2>;
            divSprites = <Link to={LINK_EDITOR_SPRITES}><div className="game-menu-new">Sprites</div></Link>;
            divMap     = <Link to={LINK_EDITOR_MAP}><div className="game-menu-new">Map</div></Link>;
            divMenu    = <Link to={LINK_MENU}><div className="game-menu-editor">Back to Menu</div></Link>;
        }
        return <div className="game-menu" style={divStyle}>
                {divTitle}
                {divSprites}
                {divMap}
                {divMenu}
                </div>;   
    }
}
