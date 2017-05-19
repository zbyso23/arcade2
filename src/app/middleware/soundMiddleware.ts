import Sound from '../Sound/Sound';


import { 
  SOUND_LOAD, 
  SOUND_PLAY,
  SOUND_STOP
} from '../actions/soundActions';

// let sound = null;
let sound = (typeof window === "undefined") ? null : new Sound();

var l = function(id, value) {
console.log(id, value);
}

export function soundMiddleware(store) 
{
  
  return next => action => {
    const result = next(action);

    if(sound === null)
    {
      return result;
    }

    if(action.type === SOUND_LOAD)
    {
      l('action.type', 'SOUND_LOAD');
      let state = store.getState();
      let message = Object.assign({}, action.message);
      l('action.message', message);
      sound.loadList(message.list);
    }
    
    if(action.type === SOUND_PLAY)
    {
      l('action.type', 'SOUND_PLAY');
      let state = store.getState();
      let message = Object.assign({}, action.message);
      l('action.message', message);
      sound.play(message.id, message.loop);
    }

    if(action.type === SOUND_STOP)
    {
      l('action.type', 'SOUND_STOP');
      let state = store.getState();
      let message = Object.assign({}, action.message);
      l('action.message', message);
      sound.stop(message.id);
    }

    return result;
  }
}