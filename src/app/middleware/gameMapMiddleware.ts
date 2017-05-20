import { 
  GAME_MAP_UPDATE,
  GAME_MAP_EXPORT,
  GAME_MAP_IMPORT
} from '../actions/gameMapActions';
import { 
  PLAYER_UPDATE
} from '../actions/playerActions';


let l = function(id, value) {
console.log(id, value);
}

let webstorage = null;
if(typeof window !== 'undefined' && window.localStorage)
{
    webstorage = window.localStorage;
}

export function gameMapMiddleware(store) 
{
  
  return next => action => {
    const result = next(action);

    if(action.type === GAME_MAP_EXPORT)
    {
      l('action.type', 'GAME_MAP_EXPORT');
      let state = store.getState();
      let map = Object.assign({}, state.map);
      let statePlayerExport = Object.assign({}, state.player);
      map.offset = 0;
      l('action.state', map);
      if(webstorage === null) return result;
      let keyExport = ['map', action.response].join('-');
      webstorage.setItem(keyExport, JSON.stringify(map));
      statePlayerExport.x = 0;
      l('store.dispatch', statePlayerExport);
      store.dispatch({type: PLAYER_UPDATE, response: statePlayerExport })
    }

    if(action.type === GAME_MAP_IMPORT)
    {
      l('action.type', 'GAME_MAP_IMPORT');
      let state = store.getState();
      if(webstorage === null) return result;
      let keyImport = ['map', action.response].join('-');
      let mapJSON = webstorage.getItem(keyImport);
      if(mapJSON === null) return result;
      let newMap = Object.assign({}, state.map, JSON.parse(mapJSON));
      let statePlayerImport = Object.assign({}, state.player);
      l('action.state', newMap);
      store.dispatch({type: GAME_MAP_UPDATE, response: newMap })
      statePlayerImport.x = 0;
      l('store.dispatch', statePlayerImport);
      store.dispatch({type: PLAYER_UPDATE, response: statePlayerImport })
    }
    
    return result;
  }
}