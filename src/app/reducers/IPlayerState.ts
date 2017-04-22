import { IGameMapPlatformState } from './IGameMapPlatformState';

interface IPlayerState 
{
	lives: number;
	score: number;
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
	floor: IGameMapPlatformState;
}

export { IPlayerState };