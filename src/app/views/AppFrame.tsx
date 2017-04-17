import * as React from 'react';
import { Socket } from '../socket/Socket';

let io = new Socket();


export default class AppFrame extends React.Component<any, any> 
{
    render() {
        return <div>
            {this.props.children}
        </div>;
    }
}
