import { 
    GAME_WORLD_EXPORT,
    GAME_WORLD_IMPORT,
    GAME_WORLD_UPDATE
} from '../actions/gameWorldActions';

import { PLAYER_UPDATE } from '../actions/playerActions';
import { GAME_MAP_UPDATE } from '../actions/gameMapActions';

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
      l('action.type', 'GAME_WORLD_EXPORT');
      let state = store.getState();
      let stateExport = Object.assign({}, state.world);
      l('action.state', stateExport);
      
      let url = "/export?data=" + JSON.stringify(stateExport);
      ajax(url, (data: any) => {
        l('response', data);
      })
      l('action.url', url);
    }

    if(action.type === GAME_WORLD_IMPORT)
    {
      l('action.type', 'GAME_WORLD_IMPORT');
      let state = store.getState();
      let url = "/import";
      ajax(url, (data: any) => {
        let response = JSON.parse(data);
        l('response', response);
        if(response === null || response.result === false) return result;
        store.dispatch({type: GAME_WORLD_UPDATE, response: response.data });
      })
    }
    
    return result;
  }
}