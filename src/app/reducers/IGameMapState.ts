import { IGameMapPlatformState } from './IGameMapPlatformState';
import { IGameMapGroundState } from './IGameMapGroundState';

interface IGameMapState
{
    length?: number;
    offset?: number;
    ground?: Array<IGameMapGroundState>;
    floor?: Array<IGameMapPlatformState>;
    height?: number;
    floorHeight?: Array<IGameMapPlatformState>;
    groundFall?: Array<boolean>;
}

export { IGameMapState };