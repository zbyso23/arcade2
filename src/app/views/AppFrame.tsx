import * as React from 'react';
import { Socket } from '../socket/Socket';

let io = new Socket();
declare global {
    interface Document {
        msExitFullscreen: any;
        mozCancelFullScreen: any;
        webkitGetGamepads: any;
    }

    interface Navigator {
        webkitGetGamepads: any;
    }

    interface HTMLElement {
        msRequestFullscreen: any;
        mozRequestFullScreen: any;
    }
}


export default class AppFrame extends React.Component<any, any> 
{
    render() {
        return <div>
            {this.props.children}
        </div>;
    }
}
