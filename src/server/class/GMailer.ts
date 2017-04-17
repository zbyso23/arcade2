const nodemailer = require('nodemailer');
import { Promise } from 'es6-promise';
import { IMailer } from '../interface/IMailer';
import { IMailerMessage } from '../interface/IMailerMessage';

class GMailer implements IMailer
{
    private transporter: any;
    private senderName: string;
    private senderEmail: string;

    constructor (email: string, password: string, name: string)
    {
        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: email,
                pass: password
            }
        });
        this.transporter = transporter;
        this.senderEmail = email;
        this.senderName  = name;
    }

    //send (emails: Array<string>, subject: string, text: string, html: string): Promise<string>
    send (message: IMailerMessage): Promise<string>
    {
        // setup email data with unicode symbols
        let mail = {
            from: '"'+this.senderName+'" <'+this.senderEmail+'>', // sender address
            to: message.emails.join(', '), // list of receivers
            subject: message.subject, // Subject line
            text: message.text, // plain text body
            html: message.html // html body
        };

        return new Promise((resolve, reject) => {
            // send mail with defined transport object
            this.transporter.sendMail(mail, (error: any, info: any) => {
                if (error) {
                    reject('{"error":"Unable to send email"}');
                }
                resolve('{"result":"Sended"}');
            });
        });
    }
}

export { GMailer };