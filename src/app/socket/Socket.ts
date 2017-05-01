import * as socketIO from 'socket.io-client';

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
		var action = data['result']['action'];
		var result = JSON.parse(data['result']['data']);
		// console.log('receive', result);
		// console.log('action', action);
		var isError = result.hasOwnProperty('error');
		if(['user-login', 'user-logout', 'user-forgotten-password', 'user-recovery-password', 'user-change-password', 'settings-profile-update', 'settings-user-list'].indexOf(action) >= 0 && this.ioRequests.hasOwnProperty(action + data['result']['ts']))
		{
			// console.log('ioReq', this.ioRequests);
			let key     = action + data['result']['ts'];
			let resolve = this.ioRequests[key][0];
			let reject  = this.ioRequests[key][1];
			delete this.ioRequests[key];
			if(isError)
			{
				reject(result.error);
				return;
			}
			resolve(result.result);
			return;
		}
    }
}

class Socket
{
    constructor()
    {
    	let url = 'http://localhost:3000'; //@todo: i know, i know - move to config ... :D
        return socketSingle || (socketSingle = new SocketInstance(url));
    }

    send (data: any): Promise<any>
    {
    	// console.log('Socket.send: ', data);
    	return socketSingle.send(data);
    }
}

export { Socket };