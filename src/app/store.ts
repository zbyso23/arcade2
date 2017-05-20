
import { createStore, combineReducers, applyMiddleware, Store } from 'redux';
import rootReducer from './reducers';
import { soundMiddleware } from './middleware/soundMiddleware';
import { gameMapMiddleware } from './middleware/gameMapMiddleware';

let middleware = [ soundMiddleware, gameMapMiddleware ];
const createStoreWithMiddleware = applyMiddleware(...middleware)(createStore);
const store = createStoreWithMiddleware(rootReducer);

// store.subscribe(() =>
//     console.log('store.subscribe', store.getState())
// );

export interface IStoreContext { store: Store }

export default store;