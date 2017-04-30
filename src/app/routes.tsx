
import * as React from 'react';
import * as Router from 'react-router';
import { Route, IndexRoute } from 'react-router';


import AppFrame from './views/AppFrame';
import NotFoundView from './views/NotFoundView';
//import HomeView from './views/HomeView';
import GameView from './views/GameView';

import { 
	LINK_GAME,
	LINK_EDITOR
} from './routesList';

var routeMap = (
    <Route path="/" component={AppFrame}>
        <IndexRoute component={GameView}/>
        <Route path={LINK_GAME} component={GameView}/>
        <Route path="*" component={NotFoundView} />
    </Route>
);

export default routeMap;
