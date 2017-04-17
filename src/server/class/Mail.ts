import { Promise } from 'es6-promise';
import { IMailer } from '../interface/IMailer';
import { IMailerMessage } from '../interface/IMailerMessage';
import { IMail } from '../interface/IMail';

class Mail implements IMail
{
	private mailer: IMailer;

	constructor (mailer: IMailer)
	{
		this.mailer = mailer;
	}

	userForgottenPassword (email: string, url: string): Promise<string>
	{
		let message: IMailerMessage = {
			emails: [email],
			subject: 'arcade2 - zapomenute heslo',
			text: 'Na zaklade vaseho pozadavku zasilame odkaz pro obnovu hesla - '+url,
			html: 'Na zaklade vaseho pozadavku zasilame odkaz pro obnovu hesla - <a href="'+url+'">'+url+'</a>'
		};
		return this.mailer.send(message);
	}
}

export { Mail };