import { IPlayerCharacterAttributesState } from './IPlayerCharacterAttributesState';
interface IPlayerCharacterState
{
	level: number;
	experience: number;
	stars: number;
	points: number;
	attributes: IPlayerCharacterAttributesState;
}

export { IPlayerCharacterState };