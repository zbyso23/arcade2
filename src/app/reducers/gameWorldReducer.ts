import { 
    GAME_WORLD_MAP_ADD,
    GAME_WORLD_MAP_UPDATE,
    GAME_WORLD_MAP_REMOVE,
    GAME_WORLD_MAP_CHANGE_LENGTH,
    GAME_WORLD_MAP_SWITCH,
    GAME_WORLD_MAP_START_SET,
    GAME_WORLD_PLAYER_UPDATE,
    GAME_WORLD_PLAYER_ADD_EXPERIENCE,
    GAME_WORLD_PLAYER_ADD_STAR,
    GAME_WORLD_PLAYER_ADD_ATTRIBUTES,
    GAME_WORLD_ITEM_ADD,
    GAME_WORLD_ITEM_UPDATE,
    GAME_WORLD_UPDATE,
    GAME_WORLD_EXPORT,
    GAME_WORLD_IMPORT
} from '../actions/gameWorldActions';

import { 
    IGameMapState
} from './gameMapReducer';

import { 
    IPlayerState
} from './playerReducer';

import { getDefaultState as getDefaultMapState } from './gameMapReducer';
import { getDefaultState as getDefaultPlayerState } from './playerReducer';

export interface IGameWorldItemPropertiesState
{
    canDestruct?: boolean;
}

export interface IGameWorldItemState
{
    name?: string;
    properties?: IGameWorldItemPropertiesState;
}

export interface IGameWorldState
{
    maps?: { [id: string]: IGameMapState };
    items?: { [id: string]: IGameWorldItemState };
    player?: IPlayerState;
    activeMap?: string;
    startMap?: string;
    loaded?: boolean;
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

let levels = [
    0,
    500,
    1500,
    3000,
    6000,
    12000,
    15000,
    30000
];

function getLevel(experience: number): number
{
    let level = 1;
    for(let i = 0, len = levels.length; i < len; i++)
    {
        if(experience < levels[i]) 
        {
            break;
        }
        level = i + 1;
    }
    return level;
}

function getDefaultState(): IGameWorldState
{
    return {
        maps: {},
        items: {},
        player: getDefaultPlayerState(),
        activeMap: '',
        startMap: '',
        loaded: false
    };
}

export default function reducer(state: IGameWorldState = getDefaultState(), action): IGameWorldState
{
    switch (action.type)
    {
        case GAME_WORLD_UPDATE: {
            let newState = Object.assign({}, state, action.response);
            newState.loaded = true;
            console.log('GAME_WORLD_UPDATE', newState);
            return Object.assign({}, newState);
        }

        case GAME_WORLD_PLAYER_UPDATE: {
            return Object.assign({}, state, {player: action.response});
        }

        case GAME_WORLD_MAP_ADD: {
            // if(state.hasOwnProperty(action.name)) return state;
            let newState = Object.assign({}, state);
            newState.maps[action.name] = action.response;
            return Object.assign({}, newState);
        }

        case GAME_WORLD_MAP_UPDATE: {
            // if(!state.hasOwnProperty(action.name)) return state;
            let newState = Object.assign({}, state);
            newState.maps[action.name] = action.response;
// console.log('GAME_WORLD_MAP_UPDATE', newState.maps);
            return Object.assign({}, newState);
        }

        case GAME_WORLD_MAP_CHANGE_LENGTH: {
            let newState = Object.assign({}, state);
            let newStateMap = Object.assign({}, newState.maps[state.activeMap]);
            let newLength = action.response;
            let groundFall = getEmptyMapFall(newLength);
            let stars = getEmptyMapFloorHeight(newLength);
            let spikes = getEmptyMapFloorHeight(newLength);
            newStateMap['length'] = action.response;
            newStateMap['size'] = action.response;
            newStateMap['groundFall'] = groundFall;
            newStateMap['stars'] = stars;
            newStateMap['spikes'] = spikes;
            newState.maps[newState.activeMap] = newStateMap;
            return Object.assign({}, newState);
        }


        case GAME_WORLD_MAP_REMOVE: {
            let newState = Object.assign({}, state);
            delete newState.maps[action.name];
            return newState;
        }

        case GAME_WORLD_MAP_SWITCH: {
            let newState = Object.assign({}, state);
            let isPresent = (action.response in newState.maps);
            if(!isPresent)
            {
                newState.maps[action.response] = getDefaultMapState();
            }
            newState.activeMap = action.response;
            console.log('map switch', newState);
            return newState;
        }

        case GAME_WORLD_MAP_START_SET: {
            let newState = Object.assign({}, state);
            newState.startMap = action.response;
            return newState;
        }

        case GAME_WORLD_ITEM_ADD:
        case GAME_WORLD_ITEM_UPDATE: {
            let newState = Object.assign({}, state);
            newState.items[action.name] = action.response;
            return newState;
        }

        case GAME_WORLD_PLAYER_UPDATE: {
            let newState = Object.assign({}, state);
            newState.player = action.response;
            return newState;
        }

        case GAME_WORLD_PLAYER_ADD_EXPERIENCE: {
            let newState = Object.assign({}, state);
            let newStatePlayer = newState.player;
            newStatePlayer.character.experience += action.response;
            let level = getLevel(newStatePlayer.character.experience);
            if(newStatePlayer.character.level < level)
            {
                newStatePlayer.character.points += (level - newStatePlayer.character.level) * 3;
            }
            newStatePlayer.character.level = level;
            newState.player = newStatePlayer;
            return newState;
        }

        case GAME_WORLD_PLAYER_ADD_STAR: {
            let newState = Object.assign({}, state);
            newState.player.character.stars += action.response;
            return newState;
        }

        case GAME_WORLD_PLAYER_ADD_ATTRIBUTES: {
            let newState = Object.assign({}, state);
            let newStatePlayer = newState.player;
            let newAttributes = action.response;
            let pointsLeft = newStatePlayer.character.points;
            if(pointsLeft === 0)
            {
                return newState;
            }
            pointsLeft -= (newAttributes.speed - newStatePlayer.character.attributes.speed);
            pointsLeft -= (newAttributes.brake - newStatePlayer.character.attributes.brake);
            pointsLeft -= (newAttributes.jump - newStatePlayer.character.attributes.jump);
            if(pointsLeft < 0)
            {
                return newState;
            }
            newStatePlayer.character.attributes = Object.assign(newStatePlayer.character.attributes, newAttributes);
            newStatePlayer.character.points = pointsLeft;
            newState.player = newStatePlayer;
            return newState;
        }

    }
    return state;
}
