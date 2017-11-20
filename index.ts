// Imports
import * as express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';
import { URL } from 'url';
import * as amqp from 'amqplib/callback_api';


// Message
let msg = "";


// Init Express

const app = express();


// Init HTTP Server
const server = http.createServer(app);
let url = URL;


// Init WebSocket Server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws: WebSocket) => {

    // Connection is up, let's add a simple simple event
    ws.on('message', (message: string) => {

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
};

function RapidConnect() {
    amqp.connect('amqp://1doFhxuC:WGgk9kXy_wFIFEO0gwB_JiDuZm2-PrlO@black-ragwort-810.bigwig.lshift.net:10802/SDU53lDhKShK', function (err, conn) {
        conn.createChannel(function (err, ch) {
            let ex = 'Rapid';
            ch.assertExchange(ex, 'direct', { durable: false });
            ch.publish(ex, 'PDF', new Buffer(msg));
        });

        setTimeout(function () {
            conn.close();
            process.exit(0);
        }, 500);
    })
};


// Listens to connections
wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.on('close', () => console.log('Client disconnected'));
});


// Start our server
server.listen(process.env.PORT || 3000, () => {
    console.log(`Server started on port ${server.address().port} :)`);
});