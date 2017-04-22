import { combineReducers, Store } from 'redux';

import { IPlayerState } from './IPlayerState';
import { IGameMapState } from './IGameMapState';
import player from './playerReducer';
import map from './gameMapReducer';
export default combineReducers({
	player,
	map
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
}
export interface IStoreContext { store: Store }
export { IPlayerState, IGameMapState };