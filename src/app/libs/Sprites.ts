interface ISprite 
{
    id: string;
    animated: boolean;
    frames: number;
}

interface ISpriteBlock
{
    animated: boolean;
    frames: number;
    offset: number;
}

class Sprites
{
    private tileX: number;
    private tileY: number;

    private sprites: { [id: string]: ISpriteBlock } = {};

    constructor(tileX: number, tileY: number)
    {
        this.tileX = tileX;
        this.tileY = tileY;
        this.generate();
    }

    generate()
    {
        console.log('generateSprites()');
        let sprites: Array<ISprite> = [];
        let spritesCount = 0;
        sprites.push({id: 'sonic-right', animated: true, frames: 9});
        sprites.push({id: 'sonic-left', animated: true, frames: 9});
        sprites.push({id: 'sonic-jump', animated: true, frames: 9});
        sprites.push({id: 'enemy-right', animated: true, frames: 9});
        sprites.push({id: 'enemy-left', animated: true, frames: 9});
        sprites.push({id: 'enemy-death-right', animated: true, frames: 9});
        sprites.push({id: 'enemy-death-left', animated: true, frames: 9});
        sprites.push({id: 'item-star', animated: true, frames: 7});
        sprites.push({id: 'item-star-explode', animated: true, frames: 9});
        sprites.push({id: 'exit', animated: true, frames: 20});
        
        for(let i in sprites)
        {
            let sprite = sprites[i];
            this.sprites[sprite.id] = {
                animated: sprite.animated,
                frames: sprite.frames, 
                offset: spritesCount
            };
            spritesCount += sprite.frames;
        }
    }


    getFrame(id: string, frame: number): number
    {
        if(!this.sprites.hasOwnProperty(id)) return -1;
        let sprite = this.sprites[id];
        let offset = sprite.offset * this.tileX;
        if(frame === 1 || (frame > sprite.frames)) return offset;
        offset += (frame - 1) * this.tileX;
        return offset;
    }

    setFrame(id: string, frame: number, sourceCanvas: HTMLCanvasElement, targetContext: CanvasRenderingContext2D, xTo: number, yTo: number): void
    {
        let offset = this.getFrame(id, frame);
        if(offset === -1) return;
        targetContext.drawImage(sourceCanvas, offset, 0, this.tileX, this.tileY, xTo, yTo, this.tileX, this.tileY);
    }
}

export { Sprites, ISprite, ISpriteBlock };