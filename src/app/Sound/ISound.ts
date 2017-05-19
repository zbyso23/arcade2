interface ISound
{
    load(id: string, ts: string): void;
    loadList(list: Array<string>): Promise<any>;
    isLoaded(id: string): boolean;
    isPlaying(id: string): boolean;
    stop(id: string): void;
    play(id: string, loop: boolean): void;
    playBackground(id: string): void;
}

export { ISound };