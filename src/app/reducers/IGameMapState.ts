import { IGameMapPlatformState } from './IGameMapPlatformState';

interface IGameMapState
{
    length?: number;
    offset?: number;
    floor?: Array<IGameMapPlatformState>;
    height?: number;
    fall?: Array<boolean>;
}

export { IGameMapState };