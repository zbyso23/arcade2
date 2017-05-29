// import { IGameMapState } from './IGameMapState';
import { GAME_MAP_UPDATE, GAME_MAP_CHANGE_LENGTH } from '../actions/gameMapActions';

export interface IGameMapBackgroundState
{
    image?: string;
    factor?: number;
}

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

export interface IGameMapItemPropertiesState
{
    canDestruct?: boolean;
}

export interface IGameMapItemState
{
    x?: number;
    y?: number;
    frame?: number;
    name?: string;
    collected?: boolean;
    visible?: boolean;
    properties?: IGameMapItemPropertiesState;
}

export interface IGameMapCloudState
{
    x?: number;
    y?: number;
    speed?: number;
    type?: number;
}

export interface IGameMapExitBlockerState
{
    name?: string;
    frame?: number;
    destroyed?: boolean;
}

export interface IGameMapExitTypeState
{
    name?: string;
    frame?: number;
}

export interface IGameMapExitState
{
    x?: number;
    y?: number;
    map?: string;
    win?: boolean;
    type?: IGameMapExitTypeState;
    blocker?: IGameMapExitBlockerState;
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
    items?: Array<IGameMapItemState>;
    clouds?: Array<IGameMapCloudState>;
    height?: number;
    exit?: Array<IGameMapExitState>;
    groundFall?: Array<boolean>;
    background?: IGameMapBackgroundState;
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
        items: [],
		clouds: [],
		exit: [],
		height: 0,
		groundFall: [],
        background: {
            image: null,
            factor: 0
        }
	};
}

export default function reducer(state: IGameMapState = getDefaultState(), action): IGameMapState
{
	switch (action.type)
	{
		case GAME_MAP_UPDATE: {
            console.log('GAME_MAP_UPDATE', action.response);
			return Object.assign({}, state, action.response);
		}

		case GAME_MAP_CHANGE_LENGTH: {
			let newLength = action.response;
			let groundFall = getEmptyMapFall(newLength);
			let stars = getEmptyMapFloorHeight(newLength);
			let spikes = getEmptyMapFloorHeight(newLength);
			let newState = state;
			newState['length'] = action.response;
			newState['size'] = action.response;
			newState['groundFall'] = groundFall;
			newState['stars'] = stars;
			newState['spikes'] = spikes;
			return Object.assign({}, newState);
		}
	}
	return state;
}

export { getDefaultState };
