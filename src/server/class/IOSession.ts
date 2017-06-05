import * as fs from 'fs';
import { IData } from '../interface/IData';
import { IMail } from '../interface/IMail';

import { 
	GAME_WORLD_IMPORT,
	GAME_WORLD_EXPORT
} from '../../app/actions/gameWorldActions';


class IOSession
{
	private io: any;
	private socket: any;
	private socketID: string;
	private disconnectCallback: any;
	private dataAPI: IData;
	private mail: IMail;

	constructor (io: any, socket: any, dataAPI: IData, mail: IMail, disconnectCallback: any)
	{
		this.io = io;
		this.socket = socket;
		this.socketID = socket.id;
		this.dataAPI = dataAPI;
		this.mail     = mail;
		this.disconnectCallback = disconnectCallback;
		
		console.log('SOCKET', this.socket.id);
		// this.socket.on('join', this.onJoin.bind(this));

		this.socket.on('message', this.onMessage.bind(this));
		this.socket.on('disconnect', this.onDisconnect.bind(this));
	}

	// onJoin (data: any)
	// {
	// 	console.log('[server](join): %s', JSON.stringify(data));
	// 	//this.sessions.push(socket.id);
	// 	this.io.emit('session', this.socketID);
	// }


	onMessage (data: any)
	{
		console.log('[server](message): %s', JSON.stringify(data));
		//processRequest(socket, m);
		try
		{
			console.log('message', this.socketID);
			console.log('message []', data);
			let path = "www/world.json";
			// let path = "world.json";
			let promise: Promise<string>;
			if(!data.hasOwnProperty('action')) throw Error('common.actions.invalidAction');
			switch(data['action'])
			{
				case 'user-login':
					promise = this.actionUserLogin(data);
					break;

				case 'user-logout':
					promise = this.actionUserLogout(data);
					break;

				case 'user-forgotten-password':
					this.actionUserForgotten(data);
					break;

				case 'user-recovery-password':
					promise = this.actionUserRecoveryPassword(data);
					break;

				case 'user-change-password':
					promise = this.actionUserChangePassword(data);
					break;

				case 'settings-profile-update':
					promise = this.actionUserUpdate(data);
					break;

				case 'settings-user-photo':
					this.actionUserPhoto(data);
					break;

				case GAME_WORLD_IMPORT: {
					let fs = require('fs');
					
					// console.log('GAME_WORLD_IMPORT []', data, fs.existsSync(path));
					if(!fs.existsSync(path))
					{
						this.socket.emit('message', {result: {action: data['action'], ts: data["ts"], result: false, data: 'world.import.failed - file not exists!' }});
						return;
					}
					fs.readFile(path, "utf8", (err, dataJSON) => {
						// console.log('file world.json',dataJSON);
						let dataWorld = JSON.parse(dataJSON);
						if(err || dataWorld === null)
						{
							this.socket.emit('message', {result: {action: data['action'], ts: data["ts"], result: false, data: 'world.import.failed' }});
							return;						
						}
						this.socket.emit('message', {result: {action: data['action'], ts: data["ts"], result: true, data: dataJSON}});
						// console.log('GAME_WORLD_IMPORT [emit]', {result: {action: data['action'], ts: data["ts"], result: true, data: dataJSON}});
					});
					break;
				}

				case GAME_WORLD_EXPORT: {
					let fs = require('fs');
					console.log('save', data);
					if(!data.hasOwnProperty('data')) throw Error('world.export.failed');
					// let path = "world.json";
					fs.writeFile(path, data.data, (err) => {
						if(err) {
							this.socket.emit('message', {result: {action: data['action'], ts: data["ts"], result: false, data: 'world.export.failed - '+err }});
							return console.log(err);
						}
						this.socket.emit('message', {result: {action: data['action'], ts: data["ts"], result: true, data: 'world.export.success'}});
						console.log("The file was saved!");
					}); 
					break;
				}

				default:
					throw Error('common.actions.invalidAction');
			}
			if(promise)
			{
				promise.then((result: string) => {
					console.log('socket emit promise', {result: {action: data['action'], ts: data["ts"], data: result}});
					this.socket.emit('message', {result: {action: data['action'], ts: data["ts"], data: result}});
				}).catch((error: string) => {
					let errorJSON = {result: {action: data['action'], ts: data["ts"], data: error }};
					console.log('socket emit promise ERR', errorJSON);
					this.socket.emit('message', errorJSON);
				});
			}
		}
		catch(e)
		{
			let errorJSON = {result: {action: data['action'], data: '{"error": "'+e.message+'"}', ts: data["ts"]}};
			this.socket.emit('message', errorJSON);
		}
	}

	onDisconnect (m: any)
	{
		console.log('Client disconnected', m);
		this.disconnectCallback(this.socketID);
	}

	private actionUserLogin(data: any): Promise<string>
	{
		if(!data.hasOwnProperty('email')) throw Error('user.login.missingEmail');
		if(!data.hasOwnProperty('password')) throw Error('user.login.missingPassword');
		return this.dataAPI.userLogin(this.socketID, data["email"], data["password"]);
	}

	private actionUserLogout(data: any): Promise<string>
	{
		if(!data.hasOwnProperty('hash')) throw Error('user.logout.missingHash');
		return this.dataAPI.userLogout(this.socketID, data["hash"])
	}

	private actionUserForgotten(data: any): void
	{
		if(!data.hasOwnProperty('email')) throw Error('user.forgotten.missingEmail');
		let dbResult: string;
		this.dataAPI.userForgotten(data["email"]).then((result: string) => {
			dbResult = result;
			let dbData = JSON.parse(result);
			if(!dbData || dbData.hasOwnProperty('error'))
			{
				let message = dbData.hasOwnProperty('error') ? dbData['error'] : 'user.forgotten.missingEmail';
				throw new Error(message);
			}
			let hash = dbData['result']['hash'];
			let url = 'http://typynavylet.cz/#action=user-forgotten&value='+hash;
			return this.mail.userForgottenPassword(data['email'], url);
		}).then((result: string) => {
			this.socket.emit('message', {result: {action: data['action'], ts: data["ts"], data: dbResult}});
		}).catch((error: any) => {
			let errorJSON = {result: {action: data['action'], data: '{"error": "'+error.message+'"}', ts: data["ts"] }};
			this.socket.emit('message', errorJSON);
		});
	}

	private actionUserRecoveryPassword(data: any): Promise<string>
	{
		if(!data.hasOwnProperty('hash')) throw Error('user.forgottenPassword.missingHash');
		if(!data.hasOwnProperty('password')) throw Error('user.forgottenPassword.missingPassword');
		return this.dataAPI.userRecoveryPassword(this.socketID, data["hash"], data["password"]);
	}

	private actionUserChangePassword(data: any): Promise<string>
	{
		let requiredKeys = ['hash', 'oldPassword', 'newPassword', 'newPasswordRepeat'];
		if(!this.checkKeys(data, requiredKeys)) throw Error('user.changePassword.failed');
		return this.dataAPI.userChangePassword(this.socketID, data["hash"], data["oldPassword"], data["newPassword"], data["newPasswordRepeat"]);
	}

	private actionUserUpdate(data: any): Promise<string>
	{
		if(!data.hasOwnProperty('hash')) throw Error('common.actions.invalidAction');
		if(!data.hasOwnProperty('id')) throw Error('user.update.missingUser');
		if(!data.hasOwnProperty('role')) throw Error('user.form.invalidRole');
		if(!data.hasOwnProperty('name')) throw Error('user.form.invalidName');
		if(!data.hasOwnProperty('surname')) throw Error('user.form.invalidSurname');
		if(!data.hasOwnProperty('email')) throw Error('user.form.invalidEmail');
		if(!data.hasOwnProperty('phone')) throw Error('user.form.invalidPhone');
		return this.dataAPI.userUpdate(this.socketID, data["hash"], data["id"], data["role"], data["name"], data["surname"], data["email"], data["phone"]);
	}

	private actionUserPhoto(data: any): void
	{
		let requiredKeys = ['hash', 'id', 'image'];

		if(!this.checkKeys(data, requiredKeys)) throw Error('user.photo.failed');
		if(data["image"].length > 300000) throw Error('user.photo.limit');
		let imageParts = data["image"].split(';base64,');
		if(imageParts.length !== 2) throw Error('user.photo.failed');
		let imageType = imageParts[0].split('data:image/');
		if(imageType.length !== 2) throw Error('user.photo.failed');
		if(['jpeg', 'png', 'gif'].indexOf(imageType[1]) === -1) throw Error('user.photo.failed');
		fs.writeFile("../bundle/files/user/"+data["id"], data["image"], (err) =>
		{
			if(err)
			{
				let errorJSON = {result: {action: data['action'], data: 'user.photo.failed' }};
				this.socket.emit('message', errorJSON);
				return;
			}
			this.socket.emit('message', {result: {action: data['action'], data: '{"result":{"id":"'+data["id"]+'"}}'}});
		}); 
	}

	private checkKeys(data: any, keys: Array<string>): boolean
	{
		for(let i = 0, len = keys.length; i < len; i++)
		{
			if(!data.hasOwnProperty(keys[i])) return false;
		}
		return true;
	}

}

export { IOSession };