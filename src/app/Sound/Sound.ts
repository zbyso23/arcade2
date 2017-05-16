declare global {
    interface Window {
        AudioContext: any;
        webkitAudioContext: any;
    }
}

export default class Sound
{

    private context: AudioContext = null;
    private buffers: { [id: string]: any } = {};
    private loaded: { [id: string]: boolean } = {};
    private playing: { [id: string]: boolean } = {};
    private loop: { [id: string]: boolean } = {};
    // private audioBuffer: any = null;
    // private loaded: boolean = false;
    // private isPlaying: boolean = false;

    constructor()
    {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        this.context = new AudioContext();
    }

    load(id: string): void
    {
        let request = new XMLHttpRequest();
        let url = 'audio/' + id + '.ogg';
console.log('url audio', id);
        this.loaded[id] = false;
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';
        request.onload = () =>
        {
            this.context.decodeAudioData(request.response, (buffer) =>
            {
                this.buffers[id] = buffer;
                this.loaded[id] = true;
                this.playing[id] = false;
                this.loop[id] = false;
            });
        }
        request.send();
    }

    loadList(list: Array<string>): void
    {
        setTimeout(() => {
            for(let i in list) this.load(list[i]);
        }, 3);
    }

    isLoaded(id: string): boolean
    {
        return (this.loaded.hasOwnProperty(id) && this.loaded[id] === true);
    }

    isPlaying(id: string): boolean
    {
        return (this.playing.hasOwnProperty(id) && this.playing[id] === true);
    }

    stop(id: string): void
    {
        this.loop[id] = false;
    }

    play(id: string, loop: boolean): void
    {
        if(!this.isLoaded(id) || (loop && this.isPlaying(id))) return;
        this.loop[id] = loop;
        setTimeout(() => {
            let source = this.context.createBufferSource();
            source.buffer = this.buffers[id];
            source.connect(this.context.destination);
            if(this.loop[id]) 
            {
                source.addEventListener('ended', () => {
                    this.playing[id] = false;
                    if(this.loop[id]) this.play(id, true);
                });
            }
            this.playing[id] = true;
            source.start(0); // play the source now
        }, 1);
    }
}