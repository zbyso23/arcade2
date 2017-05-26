import { Promise } from 'es6-promise';
import { IDbConfig } from './IDbConfig';

interface IData
{
	userLogin(session: string, email: string, password: string): Promise<string>;
	userLogout(session: string, hash: string): Promise<string>;
	userForgotten(email: string): Promise<string>;
	userRecoveryPassword(session: string, hash: string, password: string): Promise<string>;
	userChangePassword(session: string, hash: string, oldPassword: string, newPassword: string, newPasswordRepeat: string): Promise<string>;
	userUpdate(session: string, hash: string, id: number, role: number, name: string, surname: string, email: string, phone: string): Promise<string>;
	userEnable(session: string, hash: string, id: number): Promise<string>;
	userDisable(session: string, hash: string, id: number): Promise<string>;
}

export { IData };