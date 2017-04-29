import { IGameMapPlatformState } from './IGameMapPlatformState';
import { IPlayerCharacterState } from './IPlayerCharacterState';

interface IPlayerState 
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

export { IPlayerState };