import { IPlayerState } from './IPlayerState';
import { PLAYER_UPDATE, PLAYER_CLEAR } from '../actions/playerActions';
function getDefaultState(): IPlayerState
{
	return {
		lives: 0,
		score: 0,
		death: false,
		x: 50,
		y: 220,
		jump: 0,
		jumpFrom: 0,
		speed: 0,
		right: true,
		frame: 1,
		falling: false,
		fall: 0,
		floor: null,
		started: false
	};
}

export default function reducer(state: IPlayerState = getDefaultState(), action): IPlayerState
{
	switch (action.type)
	{
		case PLAYER_UPDATE: {
			return Object.assign({}, state, action.response);
		}

		case PLAYER_CLEAR: {
			return Object.assign({}, getDefaultState());
		}

	}
	return state;
}
