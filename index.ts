// Imports
import * as amqp from 'amqplib/callback_api';
import * as express from 'express';
import * as expressWs from 'express-ws'; // Dossent have a '@types version' for 'devDependencies', so ignore the evil red lines ;)
import * as http from 'http';


// RabbitMQ
const ex = 'Rapid';
const RABBIT_SEND = 'amqp://1doFhxuC:WGgk9kXy_wFIFEO0gwB_JiDuZm2-PrlO@black-ragwort-810.bigwig.lshift.net:10802/SDU53lDhKShK';
const RABBIT_RECEIVE = 'amqp://1doFhxuC:WGgk9kXy_wFIFEO0gwB_JiDuZm2-PrlO@black-ragwort-810.bigwig.lshift.net:10803/SDU53lDhKShK';
let generatedPDFUrl: string = '';


// Init Express & HTTP Server
const app = express();
const server = http.createServer(app);
const eWs = expressWs(app, server);


// WebSocket Server & Routing
// 'app.ws' uses 'express-ws', so ignore the evil red lines ;)
app.ws('/generatePDF', function (ws, req) {

    ws.on('message', msg => {

        sendToRapid('generatePDF', JSON.stringify(msg));

        recieveFromRapid(['generatedPDFUrl']);
        
        setTimeout(function () {
            
            ws.send(generatedPDFUrl);
        }, 2000);
    });
});


// 'app.ws' uses 'express-ws', so ignore the evil red lines ;)
app.ws('/generateLOG', function (ws, req) {

    ws.on('message', msg => {

        sendToRapid('generateLOG', JSON.stringify(msg));
    });
});


// RabbitMQ Send
function sendToRapid(routing: string, msg: any, mode: string = 'direct', durable: boolean = false) {
    amqp.connect(RABBIT_SEND, (err, conn) => {

        conn.createChannel((err, ch) => {
            ch.assertExchange(ex, mode, { durable });

            ch.publish(ex, routing, new Buffer(msg));
            console.log('Routing: ' + routing + '\nMessage Send: ' + msg);

            setTimeout(function () {
                conn.close();
            }, 500);
        });
    });
}

// RabbitMQ Recieve
function recieveFromRapid(severity: string[], mode: string = 'direct', durable: boolean = false, noAck: boolean = true) {
    amqp.connect(RABBIT_RECEIVE, function (err: any, conn: any) {
        conn.createChannel(function (err: any, ch: any) {

            ch.assertExchange(ex, mode, { durable });

            ch.assertQueue('', { exclusive: true }, function (err: any, q: any) {

                severity.forEach(function (severityArg) {
                    ch.bindQueue(q.queue, ex, severityArg);
                });
                ch.consume(q.queue, function (msg: any) {
                    console.log('Message Recieved: ' + msg.content.toString());
                    conn.close();

                    generatedPDFUrl = msg.content.toString();
                }, { noAck });
            });
        });
    });
}


// Init & Start Server
let port = (process.env.PORT || 3000);
server.listen(port);
console.log(`Private Budget Manager WebSocket Server Listening on Port: ${port}`);