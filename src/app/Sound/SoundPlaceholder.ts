import { ISound } from './ISound';
export default class SoundPlaceholder implements ISound
{
    private loadResolve: any;
    private loadReject: any;

    constructor()
    {
    }

    load(id: string): void
    {
    }

    loadList(list: Array<string>): Promise<any>
    {
        return new Promise((resolve, reject) => {
            reject();
        });
    }

    mute(): void
    {
    }

    unmute(): void
    {
    }

    isLoaded(id: string): boolean
    {
        return false;
    }

    isPlaying(id: string): boolean
    {
        return false;
    }

    stop(id: string, fade: boolean): void
    {
    }

    play(id: string, loop: boolean): void
    {
    }

    stopPromise (id: string, fade: boolean): Promise<string>
    {
        return new Promise(
            function(resolve, reject) 
            {
                let success = `${id} NULL stopped successfully`;
                resolve(success);
            }
        );
    }
    playPromise (id: string, loop: boolean, fade: boolean): Promise<string>
    {
        return new Promise(
            function(resolve, reject) 
            {
                let success = `${id} NULL play successfully`;
                resolve(success);
            }
        );

    }


    playBackground(id: string): void
    {
    }

    fadeIn(id: string): void
    {
    }

    fadeOut(id: string): void
    {
    }

}