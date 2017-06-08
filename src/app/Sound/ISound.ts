interface ISound
{
    load(id: string, ts: string): void;
    loadList(list: Array<string>): Promise<any>;
    mute(): void;
    unmute(): void;
    isLoaded(id: string): boolean;
    isPlaying(id: string): boolean;
    stop(id: string, fade: boolean): void;
    play(id: string, loop: boolean, fade: boolean): void;
    stopPromise (id: string, fade: boolean): Promise<string>;
    playPromise (id: string, loop: boolean, fade: boolean): Promise<string>;
    fadeIn(id: string): void;
    fadeOut(id: string): void;
    playBackground(id: string): void;
}

export { ISound };