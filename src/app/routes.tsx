
import * as React from 'react';
import * as Router from 'react-router';
import { Route, IndexRoute } from 'react-router';


import AppFrame from './views/AppFrame';
import NotFoundView from './views/NotFoundView';
//import HomeView from './views/HomeView';
import MenuView from './views/MenuView';
import GameView from './views/GameView';
import EditorView from './views/EditorView';
import EditorSpritesView from './views/EditorSpritesView';
import EditorMapView from './views/EditorMapView';
// import EditorWorldView from './views/EditorWorldView';

import { 
	LINK_MENU,
	LINK_GAME,
	LINK_EDITOR,
	LINK_EDITOR_SPRITES,
	LINK_EDITOR_MAP,
	LINK_EDITOR_WORLD
} from './routesList';

var routeMap = (
    <Route path="/" component={AppFrame}>
        <IndexRoute component={MenuView}/>
        <Route path={LINK_GAME} component={GameView}/>
        <Route path={LINK_EDITOR} component={EditorView}/>
        <Route path={LINK_EDITOR_SPRITES} component={EditorSpritesView}/>
        <Route path={LINK_EDITOR_MAP} component={EditorMapView}/>
        <Route path={LINK_MENU} component={MenuView}/>
        <Route path="*" component={NotFoundView} />
    </Route>
);

export default routeMap;
