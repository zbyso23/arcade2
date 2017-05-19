interface ISound
{
    load(id: string, ts: string): void;
    loadList(list: Array<string>): Promise<any>;
    isLoaded(id: string): boolean;
    isPlaying(id: string): boolean;
    stop(id: string, fade: boolean): void;
    play(id: string, loop: boolean, fade: boolean): void;
    fadeIn(id: string): void;
    fadeOut(id: string): void;
    playBackground(id: string): void;
}

export { ISound };