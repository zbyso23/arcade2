import { Promise } from 'es6-promise';
import { IMailerMessage } from './IMailerMessage';

interface IMailer 
{
	send (message: IMailerMessage): Promise<string>;
}

export { IMailer };