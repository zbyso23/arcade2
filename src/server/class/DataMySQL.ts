import { IDb } from '../interface/IDb';
import { IDbConfig } from '../interface/IDbConfig';
import { IData } from '../interface/IData';
import { DbMySQL } from './DbMySQL';
import { Promise } from 'es6-promise';

class DataMySQL implements IData
{
	protected db       : IDb;
	protected dbConfig : IDbConfig;

	constructor (dbConfig: IDbConfig)
	{

		this.dbConfig = dbConfig;
		this.db = new DbMySQL(this.dbConfig);
		this.db.connect().catch(error => {
			throw Error('Unable to connect MySQL!');
		});
	}

	userLogin(session: string, email: string, password: string): Promise<string>
	{
		let q = "CALL loginUser('"+session+"', '"+email+"', '"+password+"')";
		return this.q(q);
	}

	userLogout(session: string, hash: string): Promise<string>
	{
		let q = "CALL logoutUser('"+session+"', '"+hash+"')";
		return this.q(q);
	}

	userForgotten(email: string): Promise<string>
	{
		let q = "CALL forgottenUser('"+email+"')";
		return this.q(q);
	}

	userRecoveryPassword(session: string, hash: string, password: string): Promise<string>
	{
		let q = "CALL forgottenUserPassword('"+session+"', '"+hash+"', '"+password+"')";
		return this.q(q);
	}

	userChangePassword(session: string, hash: string, oldPassword: string, newPassword: string, newPasswordRepeat: string): Promise<string>
	{
		let q = "CALL updateUserPassword('"+session+"', '"+hash+"', '"+oldPassword+"', '"+newPassword+"', '"+newPasswordRepeat+"')";
		return this.q(q);
	}
	userAdd(session: string, hash: string, studio: number, role: number, name: string, surname: string, email: string, phone: string, password: string): Promise<string>
	{
		let q = "CALL addUser('"+session+"', '"+hash+"', '"+studio.toString()+"', '"+role.toString()+"', '"+name+"', '"+surname+"', '"+email+"', '"+phone+"', '"+password+"')";
		return this.q(q);
	}

	userUpdate(session: string, hash: string, id: number, role: number, name: string, surname: string, email: string, phone: string): Promise<string>
	{
		let q = "CALL updateUser('"+session+"', '"+hash+"', '"+id.toString()+"', '"+role.toString()+"', '"+name+"', '"+surname+"', '"+email+"', '"+phone+"')";
		return this.q(q);
	}

	userEnable(session: string, hash: string, id: number): Promise<string>
	{
		let q = "CALL enableUser('"+session+"', '"+hash+"', '"+id.toString()+"')";
		return this.q(q);
	}

	userDisable(session: string, hash: string, id: number): Promise<string>
	{
		let q = "CALL disableUser('"+session+"', '"+hash+"', '"+id.toString()+"')";
		return this.q(q);
	}

	userList(session: string, hash: string, studioId: number): Promise<string>
	{
		let q = "CALL getUserListByStudioId('"+session+"', '"+hash+"', '"+studioId.toString()+"')";
		return this.q(q);
	}

	eventsList(): Promise<string>
	{
		let q = "CALL getEvents()";
		return this.q(q);
	}

	protected q(query: string): Promise<string>
	{
		console.log('query', query);
		return this.db.query(query);
	}
}

export { DataMySQL };