/// <reference path="../typings/index.d.ts"/>

require('./polyfills/Object.assign');

import express = require('express');
import http = require('http');
import path = require('path');
import React = require('react');
import * as ReactDOMServer from 'react-dom/server';
import { Provider } from 'react-redux';
import { match, RouterContext } from 'react-router'
import * as history from 'history';
import * as socketIO from 'socket.io';

import { DbMySQL } from './server/class/DbMySQL';
import { DataMySQL } from './server/class/DataMySQL';
import { IO } from './server/class/IO';
import { GMailer } from './server/class/GMailer';
import { Mail } from './server/class/Mail';

import routes from './app/routes';
import store from './app/store';

let mailerConfig = {
    name: 'Pavel Nevidel',
    email: 'nevidel.jsem@gmail.com',
    pass: 'nevideljsem23'
}
let mailer = new GMailer(mailerConfig.email, mailerConfig.pass, mailerConfig.name);
let mail   = new Mail(mailer);

var port = 8080;
let dbConfig = {
  host     : 'localhost',
  user     : 'root',
  password : '23',
  database : 'arcade2'
};
let dataAPI = new DataMySQL(dbConfig);

var app = express();
var server = http.createServer(app);
var io = new IO(server, dataAPI, mail);

var memoryHistory = history.createMemoryHistory();
process.env.NODE_ENV = 'production';

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'vash');

var min = '';

// development only
if ('development' == app.get('env')) {
    //app.use(express.errorHandler());
}

app.use(express.static(path.join(__dirname, '.')));

app.get('/help/:hash', function (req, res) {
    res.render('help', { title: 'Help ' + req.params.hash, min: min });
})

// app.get('/export', (req, res) => {
//   console.log('export', req.query.data);
//   let fs = require('fs');
//   fs.writeFile("world.json", req.query.data, (err) => {
//     res.setHeader('Content-Type', 'application/json');
//     if(err) {
//       res.send(JSON.stringify({ result: false }));
//       return console.log(err);
//     }
//     res.send(JSON.stringify({ result: true }));
//     console.log("The file was saved!");
//   }); 
// });


// app.get('/import', (req, res) => {
//   console.log('import');
//   let fs = require('fs');
//   fs.readFile("world.json", "utf8", (err, dataJSON) => {
//     let data = JSON.parse(dataJSON);
//     if(err || data === null) {
//       res.send(JSON.stringify({ result: false, data: null }));
//       return console.log(err);
//     }
//     res.send(JSON.stringify({ result: true, data: data }));
//   });
// });


app.use(function(req, res, next) {
    const location = memoryHistory.createLocation(req.url);
    
    match({ routes, location }, (error, redirectLocation, renderProps: any) => {
        var html = ReactDOMServer.renderToString(<Provider store={store}>
            <RouterContext {...renderProps} />
        </Provider>)
        return res.render('main', { content: html, title: 'Project: Arcade II', min: min });
    });
});

server.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});
