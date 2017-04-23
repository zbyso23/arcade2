import { IGameMapState } from './IGameMapState';
import { GAME_MAP_UPDATE, GAME_MAP_CHANGE_LENGTH } from '../actions/gameMapActions';

function getEmptyMapFall(length: number): Array<boolean> {
	let mapFall   = [];
	for(let i = 0; i < length; i++)
	{
		mapFall.push(false);
	}
	return mapFall;
}

function getEmptyMapFloorHeight(length: number): Array<number> {
	let mapFloorHeight = [];
	for(let i = 0; i < length; i++)
	{
		mapFloorHeight.push(null);
	}
	return mapFloorHeight;
}

function getDefaultState(): IGameMapState
{
	return {
		length: 0,
		size: 0,
		offset: 0,
		tileX: 0,
		tileY: 0,
		ground: [],
		floor: [],
		stars: [],
		exit: [],
		height: 0,
		floorHeight: [],
		groundFall: []
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
			let groundFall = getEmptyMapFall(newLength);
			let floorHeight = getEmptyMapFloorHeight(newLength);
			let stars = getEmptyMapFloorHeight(newLength);
			let newState = state;
			newState['length'] = action.response;
			newState['size'] = action.response;
			newState['groundFall'] = groundFall;
			newState['floorHeight'] = floorHeight;
			newState['stars'] = groundFall;
			return Object.assign({}, newState);
		}
	}
	return state;
}
