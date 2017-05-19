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