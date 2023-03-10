import { ISound } from './ISound';
import { Promise } from 'es6-promise';

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
    private volumeMax: number = 1.0;

    private audio: { [id: string]: any } = {};
    private audioEvent: { [id: string]: any } = {};
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
            let base64 =  "data:audio/ogg;base64,"+btoa(
              new Uint8Array(request.response)
                .reduce((data, byte) => data + String.fromCharCode(byte), '')
            );
            let audio = new Audio(); 
            audio.src = base64;
            audio.loop = false;
            this.audioEvent[id] = () => {
                this.playing[id] = false;
                this.play(id, true, false);
            };
            this.audioEvent[id] = this.audioEvent[id].bind(this);
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

    mute(): void
    {
        this.volumeMax = 0;
    }

    unmute(): void
    {
        this.volumeMax = 1.0;
    }

    loadList(list: Array<string>): Promise<any>
    {
        let dateNow = Date.now();
        let ts     = Math.floor(dateNow / 1000).toString() + Math.floor((Math.random() * 1000)).toString();
        return new Promise((resolve, reject) => {
            this.loadRequests[ts] = [list.length, resolve, reject];
            setTimeout(() => {
                for(let i in list) this.load(list[i], ts);
            }, 5);
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

    stop(id: string, fade: boolean): void
    {
        if(!this.audio.hasOwnProperty(id)) return;
        if(!this.isLoaded(id) || !this.isPlaying(id)) return;
        this.playing[id] = false;
        if(fade) 
        {
            this.fadeOut(id);
            return;
        }
        this.audio[id].removeEventListener('ended', this.audioEvent[id]);
        this.audio[id].pause();
    }

    play(id: string, loop: boolean, fade: boolean): any
    {
        if(!this.audio.hasOwnProperty(id)) return;
        if(!this.isLoaded(id) || (loop && this.isPlaying(id))) return;
        this.audio[id].src = this.data[id];
        this.audio[id].loop = loop;
        if(loop) this.audio[id].addEventListener('ended', this.audioEvent[id]);
        // this.audio[id].currentTime = 0;
        this.audio[id].play().then(() => {
            this.playing[id] = true;
            this.playing[id] = loop;
        });
        return this.audio[id];
    }

    stopPromise (id: string, fade: boolean): Promise<string>
    {
        console.log('stopPromise', id, fade);
        return new Promise(
            (resolve, reject) =>
            {
                if(false === this.audio.hasOwnProperty(id))
                {
                    let error = `Unable to stop ${id} - not available!`;
                    reject(error);
                }

                if(false === this.isLoaded(id))
                {
                    let error = `Unable to stop ${id} - not loaded!`;
                    reject(error);
                }

                if(false === this.isPlaying(id))
                {
                    let error = `Unable to stop ${id} - is not playing currently!`;
                    // reject(error);
                    resolve(error);
                }

                if(fade) 
                {
                    this.fadeOut(id);
                    let error = `Unable to stop ${id} - fading out in progress!`;
                    reject(error);
                }

                // let volume = this.audio[id].volume;
                // while(volume > 0.05)
                // {
                //     volume -= 0.0001;
                //     this.audio[id].volume = volume;
                // }
                this.audio[id].removeEventListener('ended', this.audioEvent[id]);
                this.audio[id].volume = 0;
                this.audio[id].pause();
                this.playing[id] = false;
                let success = `${id} stopped successfully`;
                resolve(success);
            }
        );
    }


    playPromise (id: string, loop: boolean, fade: boolean): Promise<string>
    {
        console.log('playPromise', id, loop, fade);
        return new Promise(
            (resolve, reject) =>
            {
                if(false === this.audio.hasOwnProperty(id))
                {
                    let error = `Unable to play ${id} - not available!`;
                    reject(error);
                }

                if(false === this.isLoaded(id))
                {
                    let error = `Unable to play ${id} - not loaded!`;
                    reject(error);
                }

                if(loop && this.isPlaying(id))
                {
                    let error = `Unable to play ${id} - is playing currently!`;
                    reject(error);
                }

                this.audio[id].src = this.data[id];
                this.audio[id].loop = loop;
                if(loop) this.audio[id].addEventListener('ended', this.audioEvent[id]);
                // this.audio[id].currentTime = 0;
                this.audio[id].volume = this.volumeMax;
                // let volume = 0;
                // while(volume < this.volumeMax)
                // {
                //     volume += 0.0001;
                //     if(volume > 1) break;
                //     this.audio[id].volume = volume;
                // }
                this.audio[id].play().then(() => {
                    this.playing[id] = true;
                    this.playing[id] = loop;
                    let error = `${id} played successfully`;
                    resolve('play success');
                }).catch((errorMsg: string) => {
                    let error = `Unable to play ${id} - ${errorMsg}!`;
                    reject(error);
                });
            }
        );
    }

    fadeIn (id)
    {
        setTimeout(() => {
            if(this.audio[id].volume >= this.volumeMax * .95)
            {
                this.audio[id].volume = this.volumeMax;
                return;
            }
            this.audio[id].volume += this.volumeMax * .05;
            this.fadeIn(id);
        }, 30);
    }

    fadeOut (id)
    {
        setTimeout(() => {
            if(this.audio[id].volume <= this.volumeMax * .95)
            {
                this.audio[id].volume = 0;
                this.audio[id].pause();
                return;
            }
            this.audio[id].volume -= this.volumeMax * .05;
            this.fadeOut(id);
        }, 30);
    }

    playBackground(id: string): void
    {
        this.stop(this.background, true);
        this.play(id, true, true);
        this.background = id;
    }
}