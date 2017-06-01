export interface IEnvironment 
{
    id: string;
    animated: boolean;
    frames: number;
    width: number;
    height: number;
}

export interface IEnvironmentBlock
{
    animated: boolean;
    frames: number;
    offset: number;
    width: number;
    height: number;
}

class Environment
{
    private tileX: number;
    private tileY: number;

    private environment: { [id: string]: IEnvironmentBlock } = {};
    private environmentList: Array<IEnvironment> = [];

    constructor(tileX: number, tileY: number)
    {
        this.tileX = tileX;
        this.tileY = tileY;
        this.generate();
    }

    generate()
    {
        console.log('generateEnvironment()');
        let environment: Array<IEnvironment> = [];
        let environmentCount = 0;
        environment.push({id: 'environment-house', animated: false, frames: 1, width: 3, height: 2});
        environment.push({id: 'environment-house-white', animated: false, frames: 1, width: 3, height: 3});
        environment.push({id: 'environment-cave', animated: false, frames: 1, width: 3, height: 2});
        this.environmentList = environment;
        for(let i in environment)
        {
            let environmentItem = environment[i];
            this.environment[environmentItem.id] = {
                animated: environmentItem.animated,
                frames: environmentItem.frames, 
                offset: environmentCount,
                width: environmentItem.width,
                height: environmentItem.height
            };
            let factor = environmentItem.width;
            environmentCount += (environmentItem.frames * factor);
        }
// console.log('this.environment', this.environment);
    }

    getFrames(id: string): number
    {
        if(!this.environment.hasOwnProperty(id)) return -1;
        return this.environment[id].frames;
    }

    getFrame(id: string, frame: number): number
    {
        if(!this.environment.hasOwnProperty(id)) return -1;
        let environmentItem = this.environment[id];
        let offset = environmentItem.offset * this.tileX;
        if(frame === 1 || (frame > environmentItem.frames)) return offset;
        let factor = environmentItem.width;
        offset += ((frame - 1) * this.tileX) * factor;
        return offset;
    }

    setFrame(id: string, frame: number, sourceCanvas: HTMLCanvasElement, targetContext: CanvasRenderingContext2D, xTo: number, yTo: number): void
    {
        let offset = this.getFrame(id, frame);

        if(offset === -1) return;
        let environmentItem = this.environment[id];
        let factor = environmentItem.width;
        let factorY = environmentItem.height;
        targetContext.drawImage(sourceCanvas, offset, 0, this.tileX * factor, this.tileY * factorY, xTo, yTo, this.tileX * factor, this.tileY * factorY);
    }

    getEnvironment(): Array<IEnvironment>
    {
        return this.environmentList;
    }
}

export { Environment };