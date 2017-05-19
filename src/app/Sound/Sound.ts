import { ISound } from './ISound';

declare global {
    interface Window {
        AudioContext: any;
        webkitAudioContext: any;
    }

    interface HTMLAudioElement {
        crossOrigin: any;
    }
}

export default class Sound implements ISound
{
    private context: AudioContext = null;
    private loaded: { [id: string]: boolean } = {};
    private playing: { [id: string]: boolean } = {};
    private loop: { [id: string]: boolean } = {};

    private audio: { [id: string]: any } = {};
    private data: { [id: string]: any } = {};
    private background: string = '';

    private loadRequests: any = {};

    constructor()
    {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        this.context = new AudioContext();
    }

    load(id: string, ts: string): void
    {
        if(this.audio.hasOwnProperty(id)) 
        {
            if(--this.loadRequests[ts][0] === 0)
            {
                this.loadRequests[ts][1]();
            }
            return;
        }
        let request = new XMLHttpRequest();
        let url = 'audio/' + id + '.ogg';
        this.loaded[id] = false;
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';
        request.onload = () =>
        {
            var base64 =  "data:audio/ogg;base64,"+btoa(
              new Uint8Array(request.response)
                .reduce((data, byte) => data + String.fromCharCode(byte), '')
            );
            let audio = new Audio(); 
            audio.src = base64;
            audio.loop = false;
            audio.autoplay = false;
            audio.muted = false;
            audio.volume = 1.0;
            if(!this.audio.hasOwnProperty(id))
            {
                this.audio[id] = (this.audio.hasOwnProperty(id)) ? this.audio[id] : audio;
                this.data[id] = (this.data.hasOwnProperty(id)) ? this.data[id] : base64;
                this.loaded[id] = true;
                this.playing[id] = false;
                this.loop[id] = false;
            }
            if(--this.loadRequests[ts][0] === 0) 
            {
                this.loadRequests[ts][1]();
            }
        }
        request.send();
    }

    loadList(list: Array<string>): Promise<any>
    {
        let dateNow = Date.now();
        let ts     = Math.floor(dateNow / 1000).toString() + Math.floor((Math.random() * 1000)).toString();
        return new Promise((resolve, reject) => {
            this.loadRequests[ts] = [list.length, resolve, reject];
            setTimeout(() => {
                for(let i in list) this.load(list[i], ts);
            }, 3);
        });
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
        if(!this.audio.hasOwnProperty(id)) return;
        if(!this.isLoaded(id)) return;
        this.playing[id] = false;
        this.audio[id].pause();
    }

    play(id: string, loop: boolean): any
    {
        if(!this.audio.hasOwnProperty(id)) return;
        if(!this.isLoaded(id) || loop && this.isPlaying(id)) return;
        this.audio[id].src = this.data[id];
        this.audio[id].loop = loop;
        this.audio[id].currentTime = 0;
        this.audio[id].addEventListener('ended', () => {
            this.playing[id] = false;
            if(loop)
            {
                this.play(id, true);
                return;
            }
        });
        this.audio[id].play();
        this.playing[id] = loop;
        return this.audio[id];
    }

    playBackground(id: string): void
    {
        this.stop(this.background);
        this.play(id, true);
        this.background = id;
    }
}