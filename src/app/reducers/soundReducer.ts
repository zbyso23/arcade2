import { ISound } from '../Sound/ISound';
import Sound from '../Sound/Sound';
import SoundPlaceholder from '../Sound/SoundPlaceholder';

import { 
	SOUND_LOAD, 
	SOUND_PLAY,
	SOUND_STOP
} from '../actions/soundActions';


console.log('new Sound');
let sound = (typeof window === "undefined") ? new SoundPlaceholder() : new Sound();

export interface ISoundState 
{
	sound?: ISound;
}

function getDefaultState(): ISoundState
{
	return {
		sound: sound
	};
}

export default function reducer(state: ISoundState = getDefaultState(), action): ISoundState
{
	switch (action.type)
	{
		// case SOUND_LOAD: {
		// 	return Object.assign({}, state, action.response);
		// }
	}
	return state;
}
