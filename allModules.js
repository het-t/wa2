var {Client, Buttons} = require('whatsapp-web.js');
var fs = require('fs');
var qrcode = require('qrcode-terminal');

const SESSION_FILE_PATH = './session.json'

let sessionData;
if(fs.existsSync(SESSION_FILE_PATH)) {
    sessionData = require(SESSION_FILE_PATH);
}

var client =  new Client({
    session: sessionData
})

client.on('qr', (qr) => {
    qrcode.generate(qr,{small:true})
    console.log('QR RECEIVED', qr);
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('authenticated', (session) => {
    sessionData = session;
    fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), (err) => {
        if (err) {
            console.error(err);
        }
    });
});

module.exports.client = client;
module.exports.Buttons = Buttons;