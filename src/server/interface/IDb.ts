import { Promise } from 'es6-promise';

interface IDb
{
	connect(): Promise<string>;
	query(query: string): Promise<string>;
}

export { IDb };