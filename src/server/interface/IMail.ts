import { Promise } from 'es6-promise';

interface IMail
{
	userForgottenPassword (email: string, hash: string): Promise<string>;
}

export { IMail };