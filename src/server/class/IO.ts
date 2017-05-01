import { Server } from 'http';
import * as socketIO from 'socket.io';
import { IData } from '../interface/IData';
import { IMail } from '../interface/IMail';
import { IOSession } from './IOSession';

class IO
{
	private io: any;
	private sessions: { [id: string]: IOSession } = {};
	private dataAPI: IData;

	constructor (server: Server, dataAPI: IData, mail: IMail)
	{
		this.dataAPI = dataAPI;
		this.io = socketIO(server, {'transports': ['websocket']});
		this.io.on('connection', (socket: any) => {
			this.sessions[socket.id] = new IOSession(this.io, socket, dataAPI, mail, function(socketID: string) {
				delete this.sessions[socketID];
			}.bind(this));
		});
	}
}

export { IO };