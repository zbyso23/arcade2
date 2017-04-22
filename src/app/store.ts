
import { createStore, combineReducers, applyMiddleware, Store } from 'redux';
import rootReducer from './reducers';

let middleware = [  ];
const createStoreWithMiddleware = applyMiddleware(...middleware)(createStore);
const store = createStoreWithMiddleware(rootReducer);

// store.subscribe(() =>
//     console.log('store.subscribe', store.getState())
// );

export interface IStoreContext { store: Store }

export default store;