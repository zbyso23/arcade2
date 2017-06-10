import * as socketIO from 'socket.io-client';
import { 
	GAME_WORLD_IMPORT,
	GAME_WORLD_EXPORT
} from '../actions/gameWorldActions';

let socketSingle = null;

class SocketInstance
{
	private socket: any;
	private ioRequests: any = {};

	constructor(url: string)
	{
		this.socket = socketIO.connect(`${url}`, {transports: ['websocket']});
		this.socket.on('message', this.receive.bind(this));
	}

    send (data: any): Promise<any>
    {
        let action = data['action'];
        let ts     = Math.floor(Date.now() / 1000).toString();
        data["ts"] = ts;
        let key    = data['action']+ts;
        return new Promise((resolve, reject) => {
            this.ioRequests[key] = [resolve, reject];
            this.socket.emit('message', data);
        });
    }

    private receive(data: any)
    {
		let action = data['result']['action'];
		// console.log('receive', data);
		let result = data['result'];
		// console.log('receive', result);
		// console.log('action', action);
		let isError = result.hasOwnProperty('error');
		if([GAME_WORLD_IMPORT, GAME_WORLD_EXPORT, 'user-login', 'user-logout', 'user-forgotten-password', 'user-recovery-password', 'user-change-password', 'settings-profile-update', 'settings-user-list'].indexOf(action) >= 0 && this.ioRequests.hasOwnProperty(action + data['result']['ts']))
		{
			console.log('ioReceive', data);
			let key     = action + data['result']['ts'];
			let resolve = this.ioRequests[key][0];
			let reject  = this.ioRequests[key][1];
			delete this.ioRequests[key];
			if(isError)
			{
				reject(result);
				return;
			}
			resolve(result);
			return;
		}
    }
}

class Socket
{
    constructor()
    {
    	let url = 'http://localhost:3000'; //@todo: i know, i know - move to config ... :D
    	// let url = 'http://arcade2.slimetribe.com'; //@todo: i know, i know - move to config ... :D
        return socketSingle || (socketSingle = new SocketInstance(url));
    }

    send (data: any): Promise<any>
    {
    	// console.log('Socket.send: ', data);
    	return socketSingle.send(data);
    }
}

export { Socket };