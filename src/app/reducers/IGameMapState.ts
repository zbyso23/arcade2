import { IGameMapPlatformState } from './IGameMapPlatformState';
import { IGameMapGroundState } from './IGameMapGroundState';

interface IGameMapState
{
    length?: number;
    size?: number;
    offset?: number;
    tileX?: number;
    tileY?: number;
    ground?: Array<IGameMapGroundState>;
    floor?: Array<IGameMapPlatformState>;
    height?: number;
    floorHeight?: Array<IGameMapPlatformState>;
    groundFall?: Array<boolean>;
}

export { IGameMapState };