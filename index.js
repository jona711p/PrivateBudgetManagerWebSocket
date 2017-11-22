"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Imports
var amqp = require("amqplib/callback_api");
var express = require("express");
var expressWs = require("express-ws"); // Dossent have a '@types version' for 'devDependencies', so ignore the evil red lines ;)
var http = require("http");
// RabbitMQ
var ex = 'Rapid';
var RABBIT_SEND = 'amqp://1doFhxuC:WGgk9kXy_wFIFEO0gwB_JiDuZm2-PrlO@black-ragwort-810.bigwig.lshift.net:10802/SDU53lDhKShK';
var RABBIT_RECEIVE = 'amqp://1doFhxuC:WGgk9kXy_wFIFEO0gwB_JiDuZm2-PrlO@black-ragwort-810.bigwig.lshift.net:10803/SDU53lDhKShK';
var generatedPDFUrl = '';
// Init Express & HTTP Server
var app = express();
var server = http.createServer(app);
var eWs = expressWs(app, server);
// WebSocket Server & Routing
// 'app.ws' uses 'express-ws', so ignore the evil red lines ;)
app.ws('/generatePDF', function (ws, req) {
    ws.on('message', function (msg) {
        sendToRapid('generatePDF', JSON.stringify(msg));
        recieveFromRapid(['generatedPDFUrl']);
        setTimeout(function () {
            ws.send(generatedPDFUrl);
        }, 2000);
    });
});
// 'app.ws' uses 'express-ws', so ignore the evil red lines ;)
app.ws('/generateLOG', function (ws, req) {
    ws.on('message', function (msg) {
        sendToRapid('generateLOG', JSON.stringify(msg));
    });
});
// RabbitMQ Send
function sendToRapid(routing, msg, mode, durable) {
    if (mode === void 0) { mode = 'direct'; }
    if (durable === void 0) { durable = false; }
    amqp.connect(RABBIT_SEND, function (err, conn) {
        conn.createChannel(function (err, ch) {
            ch.assertExchange(ex, mode, { durable: durable });
            ch.publish(ex, routing, new Buffer(msg));
            console.log('Routing: ' + routing + '\nMessage Send: ' + msg);
            setTimeout(function () {
                conn.close();
            }, 500);
        });
    });
}
// RabbitMQ Recieve
function recieveFromRapid(severity, mode, durable, noAck) {
    if (mode === void 0) { mode = 'direct'; }
    if (durable === void 0) { durable = false; }
    if (noAck === void 0) { noAck = true; }
    amqp.connect(RABBIT_RECEIVE, function (err, conn) {
        conn.createChannel(function (err, ch) {
            ch.assertExchange(ex, mode, { durable: durable });
            ch.assertQueue('', { exclusive: true }, function (err, q) {
                severity.forEach(function (severityArg) {
                    ch.bindQueue(q.queue, ex, severityArg);
                });
                ch.consume(q.queue, function (msg) {
                    console.log('Message Recieved: ' + msg.content.toString());
                    conn.close();
                    generatedPDFUrl = msg.content.toString();
                }, { noAck: noAck });
            });
        });
    });
}
// Init & Start Server
var port = (process.env.PORT || 3000);
server.listen(port);
console.log("Private Budget Manager WebSocket Server Listening on Port: " + port);
