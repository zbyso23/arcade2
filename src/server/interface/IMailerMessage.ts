interface IMailerMessage
{
	emails: Array<string>;
	subject: string;
	text: string;
	html: string;
}

export { IMailerMessage };