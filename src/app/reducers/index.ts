import { combineReducers, Store } from 'redux';

import { default as sound, ISoundState } from './soundReducer';
import { default as player, IPlayerState, IPlayerCharacterAttributesState, IPlayerCharacterState } from './playerReducer';
import { default as map, 
	IGameMapGroundState, 
	IGameMapPlatformState, 
	IGameMapStarState,
	IGameMapSpikeState,
	IGameMapExitState,
	IGameMapState
} from './gameMapReducer';
export default combineReducers({
	player,
	map,
	sound
});

// //
// // Store interfaces
// //
// // The interfaces may be used by reducers to help enforce type safety.
// // They may also be used by components that have state mappers that
// // subscribe to store changes.
// //

export interface IStore {
	player: IPlayerState;
	map: IGameMapState;
	sound: ISoundState;
}
export interface IStoreContext { store: Store }
export { 
	ISoundState,
	IPlayerState, 
	IPlayerCharacterAttributesState, 
	IPlayerCharacterState, 
	IGameMapGroundState, 
	IGameMapPlatformState, 
	IGameMapStarState,
	IGameMapSpikeState,
	IGameMapExitState,
	IGameMapState 
};