"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Imports
var express = require("express");
var http = require("http");
var WebSocket = require("ws");
var url_1 = require("url");
var amqp = require("amqplib/callback_api");
// RabbitMQ URL
var rabbitMQURL = "" + process.env.RabbitMQURL;
// Message
var msg = "";
// Init Express
var app = express();
// Init HTTP Server
var server = http.createServer(app);
var url = url_1.URL;
// Init WebSocket Server
var wss = new WebSocket.Server({ server: server });
wss.on('connection', function (ws) {
    // Connection is up, let's add a simple simple event
    ws.on('message', function (message) {
        // Log the received message and send it back to the client
        msg = message;
        //console.log('received: %s', message);
        RapidConnect();
        printMess();
    });
    // Send immediatly a feedback to the incoming connection   
    ws.send('Hi there, I am a WebSocket server, hosted by Team Smoker');
});
function printMess() {
    console.log("Client has send: " + msg + "This message is a single console.log");
}
;
function RapidConnect() {
    amqp.connect(rabbitMQURL, function (err, conn) {
        conn.createChannel(function (err, ch) {
            var ex = 'Rapid';
            ch.assertExchange(ex, 'direct', { durable: false });
            ch.publish(ex, 'PDF', new Buffer(msg));
        });
        setTimeout(function () {
            conn.close();
            process.exit(0);
        }, 500);
    });
}
;
// Listens to connections
wss.on('connection', function (ws) {
    console.log('Client connected');
    ws.on('close', function () { return console.log('Client disconnected'); });
});
// Init & Start Server
var port = (process.env.PORT || 3000);
app.listen(port);
console.log("Private Budget Manager WebSocket Server Listening on Port: " + port);
