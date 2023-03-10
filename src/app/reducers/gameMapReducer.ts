// import { IGameMapState } from './IGameMapState';
import { GAME_MAP_UPDATE, GAME_MAP_CHANGE_LENGTH } from '../actions/gameMapActions';

import { 
    IGameWorldItemPropertiesState,
    IGameWorldQuestTriggerState,
    IGameWorldQuestTriggerPartState,
    IGameWorldQuestState
} from './gameWorldReducer';
import { getDefaultQuestState as getDefaultWorldQuestState, getDefaultQuestTriggerState  } from './gameWorldReducer';

export interface IGameMapBackgroundState
{
    image?: string;
    factor?: number;
}

export interface IGameMapGroundState
{
    from?: number;
    to?: number;
    type?: number;
}

export interface IGameMapPlatformState
{
    from?: number;
    to?: number;
    height?: number;
    type?: number;
    bothSide?: boolean;
}

export interface IGameMapEnemyResistentState
{
    jump?: boolean;
}

export interface IGameMapEnemyState
{
    visible?: boolean;
    type?: string;
    from?: number;
    to?: number;
    xGrid?: number;
    x?: number;
    y?: number;
    speed?: number;
    right?: boolean;
    frame?: number;
    die?: boolean;
    death?: boolean;
    resistent?: IGameMapEnemyResistentState,
    respawn?: {
    	time?: number;
    	timer?: number;
        enabled?: boolean;
    },
    following?: {
    	enabled?: boolean;
    	range?: number;
    },
    live?: {
        lives?: number;
        timer?: number;
        defeated?: boolean;
    },
    text?: {
        title?: string;
        finished?: string;
    }
    trigger?: IGameWorldQuestTriggerState;
}

export interface IGameMapSpikeState
{
    x?: number;
    y?: number;
}

export interface IGameMapEnvironmentState
{
    x?: number;
    y?: number;
    name?: string;
    width?: number;
    height?: number;
    visible?: boolean;
}


export interface IGameMapStarState
{
    x?: number;
    y?: number;
    frame?: number;
    value?: number;
    collected?: boolean;
}

export interface IGameMapItemState
{
    x?: number;
    y?: number;
    frame?: number;
    name?: string;
    collected?: boolean;
    visible?: boolean;
    properties?: IGameWorldItemPropertiesState;
    text?: {
        title?: string;
        finished?: string;
    };
    trigger?: IGameWorldQuestTriggerState;

}

export interface IGameMapQuestState
{
    x?: number;
    y?: number;
    from?: number;
    to?: number;
    xGrid?: number;
    right?: boolean;
    speed?: number;
    frame?: number;
    name?: string;
    visible?: boolean;
    quest?: IGameWorldQuestState;
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
    visible?: boolean;
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
    environment?: Array<IGameMapEnvironmentState>;
    quests?: Array<IGameMapQuestState>;
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
        environment: [],
        quests: [],
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

function getDefaultQuestState(): IGameMapQuestState
{
    return {
        x: 0,
        y: 0,
        from: 0,
        to: 0,
        xGrid: 0,
        right: true,
        speed: 0,
        frame: 1,
        name: 'charles',
        visible: false,
        quest: getDefaultWorldQuestState()
    };
}

function getDefaultEnemyState(): IGameMapEnemyState
{
    return {
        visible: false,
        type: 'bandit',
        from: 0,
        to: 0,
        xGrid: 0,
        x: 0,
        right: true,
        frame: 1,
        die: false,
        death: false,
        y: 0,
        speed: 1,
        resistent: {
            jump: false
        },
        respawn: {
            time: 0,
            timer: 0,
            enabled: false,
        },
        following: {
            enabled: false,
            range: 2,
        },
        live: {
            lives: 0,
            timer: 0,
            defeated: false
        },
        text: {
            title: 'title',
            finished: 'finished'
        },
        trigger: getDefaultQuestTriggerState(),
    };
}

function getDefaultItemState(): IGameMapItemState
{
    return {
        visible: false,
        name: 'pickaxe',
        x: 0,
        y: 0,
        frame: 1,
        collected: false,
        properties: {
            canDestruct: true
        },
        text: {
            title: 'title',
            finished: 'finished'
        },
        trigger: getDefaultQuestTriggerState(),
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

export { getDefaultState, getDefaultQuestState, getDefaultEnemyState, getDefaultItemState };