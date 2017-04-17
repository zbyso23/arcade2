import * as React from 'react';
import { Socket } from '../socket/Socket';

let io = new Socket();


export default class AppFrame extends React.Component<any, any> 
{
    render() {
        return <div>
            <h1>Header</h1>
            {this.props.children}
        </div>;
    }
}
