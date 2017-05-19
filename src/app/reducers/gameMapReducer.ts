// import { IGameMapState } from './IGameMapState';
import { GAME_MAP_UPDATE, GAME_MAP_CHANGE_LENGTH } from '../actions/gameMapActions';

export interface IGameMapGroundState
{
    from?: number;
    to?: number;
}

export interface IGameMapPlatformState
{
    from?: number;
    to?: number;
    height?: number;
    bothSide?: boolean;
}

export interface IGameMapEnemyState
{
    from?: number;
    to?: number;
    xGrid?: number;
    x?: number;
    right?: boolean;
    frame?: number;
    die?: boolean;
    death?: boolean;
    height?: number;
    speed?: number;
    experience?: number;
    respawn?: {
    	time?: number;
    	timer?: number
    },
    following?: {
    	enabled?: boolean;
    	range?: number;
    }
}

export interface IGameMapSpikeState
{
    x?: number;
    y?: number;
}

export interface IGameMapStarState
{
    x?: number;
    y?: number;
    frame?: number;
    value?: number;
    collected?: boolean;
}

export interface IGameMapCloudState
{
    x?: number;
    y?: number;
    speed?: number;
    type?: number;
}

export interface IGameMapExitState
{
    x?: number;
    y?: number;
    map?: string;
    win?: boolean;
}


export interface IGameMapState
{
    length?: number;
    size?: number;
    offset?: number;
    tileX?: number;
    tileY?: number;
    ground?: Array<IGameMapGroundState>;
    floor?: Array<IGameMapPlatformState>;
    stars?: Array<IGameMapStarState>;
    spikes?: Array<IGameMapSpikeState>;
    enemies?: Array<IGameMapEnemyState>;
    clouds?: Array<IGameMapCloudState>;
    height?: number;
    exit?: Array<IGameMapExitState>;
    floorHeight?: Array<IGameMapPlatformState>;
    groundFall?: Array<boolean>;
}

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
		spikes: [],
		enemies: [],
		clouds: [],
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
			let spikes = getEmptyMapFloorHeight(newLength);
			let newState = state;
			newState['length'] = action.response;
			newState['size'] = action.response;
			newState['groundFall'] = groundFall;
			newState['floorHeight'] = floorHeight;
			newState['stars'] = groundFall;
			newState['stars'] = groundFall;
			return Object.assign({}, newState);
		}
	}
	return state;
}
