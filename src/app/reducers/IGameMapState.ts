import { IGameMapPlatformState } from './IGameMapPlatformState';
import { IGameMapGroundState } from './IGameMapGroundState';
import { IGameMapStarState } from './IGameMapStarState';

interface IGameMapState
{
    length?: number;
    size?: number;
    offset?: number;
    tileX?: number;
    tileY?: number;
    ground?: Array<IGameMapGroundState>;
    floor?: Array<IGameMapPlatformState>;
    stars?: Array<IGameMapStarState>;
    height?: number;
    exit?: Array<number>;
    floorHeight?: Array<IGameMapPlatformState>;
    groundFall?: Array<boolean>;
}

export { IGameMapState };