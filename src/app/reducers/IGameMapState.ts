import { IGameMapPlatformState } from './IGameMapPlatformState';
import { IGameMapGroundState } from './IGameMapGroundState';

interface IGameMapState
{
    length?: number;
    offset?: number;
    ground?: Array<IGameMapGroundState>;
    floor?: Array<IGameMapPlatformState>;
    height?: number;
    floorHeight?: Array<number>;
    groundFall?: Array<boolean>;
}

export { IGameMapState };