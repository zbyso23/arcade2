import { IGameMapPlatformState } from './gameMapReducer';

import { 
	PLAYER_UPDATE, 
	PLAYER_CLEAR,
	PLAYER_ADD_EXPERIENCE,
	PLAYER_ADD_STAR,
	PLAYER_ADD_ATTRIBUTES
} from '../actions/playerActions';

export interface IPlayerCharacterAttributesState
{
	speed: number;
	brake: number;
	jump: number;
}

export interface IPlayerCharacterState
{
	level: number;
	experience: number;
	stars: number;
	points: number;
	attributes: IPlayerCharacterAttributesState;
}

export interface IPlayerState 
{
	lives: number;
	character: IPlayerCharacterState;
	death: boolean;
	x: number;
	y: number;
	speed: number;
	right: boolean;
	jump: number;
	jumpFrom: number;
	frame: number;
	falling: boolean;
	fall: number;
	started: boolean;
	isJumping: boolean;
	jumping: number;
	floor: IGameMapPlatformState;
}

function getDefaultState(): IPlayerState
{
	return {
		lives: 0,
		character: {
			level: 1,
			experience: 0,
			stars: 0,
			points: 6,
			attributes: {
				speed: 42,
				brake: 8,
				jump: 15
			}
		},
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
		isJumping: false,
		jumping: 0,
		started: false
	};
}

let levels = [
	0,
	300,
	900,
	1600,
	3500,
	5000,
	8000,
	11000
];

function getLevel(experience: number): number
{
	let level = 1;
	for(var i = 0, len = levels.length; i < len; i++)
	{
		if(experience < levels[i]) 
		{
			break;
		}
		level = i + 1;
	}
	return level;
}

export default function reducer(state: IPlayerState = getDefaultState(), action): IPlayerState
{
	switch (action.type)
	{
		case PLAYER_UPDATE: {
			return Object.assign({}, state, action.response);
		}

		case PLAYER_ADD_EXPERIENCE: {
			let newState = Object.assign({}, state);
			newState.character.experience += action.response;
			let level = getLevel(newState.character.experience);
			if(newState.character.level < level)
			{
				newState.character.points += (level - newState.character.level) * 3;
			}
			newState.character.level = level;
			return newState;
		}

		case PLAYER_ADD_STAR: {
			let newState = Object.assign({}, state);
			newState.character.stars += action.response;
			return newState;
		}

		case PLAYER_ADD_ATTRIBUTES: {
			let newState = Object.assign({}, state);
			let newAttributes = action.response;
			let pointsLeft = newState.character.points;
			if(pointsLeft === 0)
			{
				return newState;	
			}
			pointsLeft -= (newAttributes.speed - state.character.attributes.speed);
			pointsLeft -= (newAttributes.brake - state.character.attributes.brake);
			pointsLeft -= (newAttributes.jump - state.character.attributes.jump);
			if(pointsLeft < 0)
			{
				return newState;	
			}
			newState.character.attributes = Object.assign(newState.character.attributes, newAttributes);
			newState.character.points = pointsLeft;
			return newState;
		}


		case PLAYER_CLEAR: {
			return Object.assign({}, getDefaultState());
		}
	}
	return state;
}
