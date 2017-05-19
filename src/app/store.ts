
import { createStore, combineReducers, applyMiddleware, Store } from 'redux';
import rootReducer from './reducers';
import { soundMiddleware } from './middleware/soundMiddleware';

let middleware = [ soundMiddleware ];
const createStoreWithMiddleware = applyMiddleware(...middleware)(createStore);
const store = createStoreWithMiddleware(rootReducer);

// store.subscribe(() =>
//     console.log('store.subscribe', store.getState())
// );

export interface IStoreContext { store: Store }

export default store;