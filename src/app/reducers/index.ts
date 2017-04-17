import { combineReducers, Store } from 'redux';
export default combineReducers({

});

// //
// // Store interfaces
// //
// // The interfaces may be used by reducers to help enforce type safety.
// // They may also be used by components that have state mappers that
// // subscribe to store changes.
// //

export interface IStore {

}
export interface IStoreContext { store: Store }
