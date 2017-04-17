import { IDb } from '../interface/IDb';
import { IDbConfig } from '../interface/IDbConfig';
import { Promise } from 'es6-promise';

var mysql = require('mysql');

class DbMySQL implements IDb
{
	private config: IDbConfig;
	private connection: any;

	constructor(config: IDbConfig)
	{
		this.connection = mysql.createConnection(config);
	}

	connect(): Promise<string>
	{
		return new Promise((resolve, reject) => {
			this.connection.connect(function (error: any)
			{
				if(error)
				{
					reject('{"error":"Unable to connect MySQL"}');
				}
				resolve('{"result":"Connected"}');
			});
		});
	}

	query (query: string): Promise<string>
	{
		return new Promise((resolve, reject) => {
			this.connection.query(query, function (error: any, results: any, fields: any) 
			{
				try
				{
					if(error !== null) throw Error(error.Error);
					if(typeof results !== 'object') throw Error('Result not found');
					if(!(0 in results) || typeof results[0] !== 'object') throw Error('Result not found');
					if(!(0 in results[0]) || typeof results[0][0] !== 'object') throw Error('Result not found');
					if(!('output' in results[0][0])) throw Error('Result not found');
					var item = results[0][0]['output'];
					if(item === null) throw Error('Result not found');
					resolve(item);
				}
				catch(e)
				{
					reject('{"error":"Result is empty"}');
				}
			});
		});
	}
}

export { DbMySQL };