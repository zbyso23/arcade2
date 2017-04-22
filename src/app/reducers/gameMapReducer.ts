import { IGameMapState } from './IGameMapState';
import { GAME_MAP_UPDATE, GAME_MAP_CHANGE_LENGTH } from '../actions/gameMapActions';

function getEmptyMapFall(length: number): Array<boolean> {
	let mapFall   = [];
	for(let i = 0; i <= length; i++)
	{
		mapFall.push(false);
	}
	return mapFall;
}

function getDefaultState(): IGameMapState
{
	return {
		length: 0,
		offset: 0,
		floor: [],
		height: 0,
		fall: []
	};
}

export default function reducer(state: IGameMapState = getDefaultState(), action): IGameMapState
{
	switch (action.type)
	{
		case GAME_MAP_UPDATE: {
			return Object.assign({}, state, action.response);
		}

		case GAME_MAP_CHANGE_LENGTH: {
			let newLength = action.response;
			let fall = getEmptyMapFall(newLength);
			let newState = state;
			newState['length'] = action.response;
			newState['fall'] = fall;
			return Object.assign({}, newState);
		}
	}
	return state;
}
