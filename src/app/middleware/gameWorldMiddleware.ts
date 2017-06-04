import { Socket } from '../socket/Socket';

import { 
    GAME_WORLD_EXPORT,
    GAME_WORLD_IMPORT,
    GAME_WORLD_UPDATE
} from '../actions/gameWorldActions';

import { PLAYER_UPDATE } from '../actions/playerActions';
import { GAME_MAP_UPDATE } from '../actions/gameMapActions';

let io = new Socket();

let l = function(id, value) {
console.log(id, value);
}

let webstorage = null;
if(typeof window !== 'undefined' && window.localStorage)
{
    webstorage = window.localStorage;
}

let ajax = (url: string, callback: any) => {
  let http = new XMLHttpRequest();
  http.open("GET", url, true);
  l('action.url', url);
  http.onreadystatechange = () => {
      if(http.readyState == 4 && http.status == 200) 
      {
          callback(http.responseText);
      }
  }
  http.send();
}


export function gameWorldMiddleware(store) 
{
  
  return next => action => {
    const result = next(action);

    if(action.type === GAME_WORLD_EXPORT)
    {
      // l('action.type', 'GAME_WORLD_EXPORT');
      let state = store.getState();
      let stateExport = Object.assign({}, state.world);
      // l('action.state', stateExport);     
      let worldJSON = JSON.stringify(stateExport);
      let message = Object.assign({}, action.message);
      message['action'] = GAME_WORLD_EXPORT;
      message['data'] = worldJSON;
      io.send(message).then((response) => {
        // l('GAME_WORLD_EXPORT SUCCESS', response);
      }).catch((error) => {
        // l('GAME_WORLD_EXPORT ERROR', error);
      });
    }

    if(action.type === GAME_WORLD_IMPORT)
    {
      // l('action.type', 'GAME_WORLD_IMPORT');
      let state = store.getState();
      let message = Object.assign({}, action.message);
      message['action'] = GAME_WORLD_IMPORT;
      // l('GAME_WORLD_IMPORT [state]', state);
      // l('GAME_WORLD_IMPORT', action);
      io.send(message).then((response) => {
        // l('GAME_WORLD_IMPORT SUCCESS', response);
        let world = JSON.parse(response.data);
        if(response === null) return result;
        response.activeMap = '';
        store.dispatch({type: GAME_WORLD_UPDATE, response: world });
      }).catch((error) => {
        // l('GAME_WORLD_IMPORT ERROR', error);
      });
    }

    return result;
  }
}