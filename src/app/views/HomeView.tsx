//LoginView
import * as React from 'react';
import { Link } from 'react-router';
import Hello from '../components/Hello';
import Game from '../components/Game';
import { IStore, IStoreContext } from '../reducers';

export interface IHomeState 
{
    loaded?: boolean
}


function mapStateFromStore(store: IStore, state: IHomeState): IHomeState 
{
    return { 
        loaded: true
    };
}

export default class HomeView extends React.Component<any, IHomeState> 
{
    static contextTypes: React.ValidationMap<any> = 
    {
        store: React.PropTypes.object
    }
    
    context: IStoreContext;
    unsubscribe: Function;

    constructor(props: any) 
    {
        super(props);
        console.log(props);
        console.log(this.props);

        this.state = { loaded: false };
    }
    
    componentDidMount() 
    {

        let storeState = this.context.store.getState();
        console.log('storeState', storeState);
        this.setStateFromStore();
        
        this.unsubscribe = this.context.store.subscribe(this.setStateFromStore.bind(this));
        console.log(this.state);
        console.log(this.context);
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
        this.setState(mapStateFromStore(this.context.store.getState(), this.state));
    }
    
    
    render() {
        var loading = this.state.loaded ? "" : " (loading...)";
        return <div>
            <Game name="world" />
        </div>;
    }
}
