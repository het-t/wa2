var cron = require('cron').CronJob;
var {Client, MessageMedia} = require('whatsapp-web.js');
let sessionData;
var fs = require('fs');
const path = require('path');

const EXTENSION = '.pdf';

const { resolve } = require('path');
const SESSION_FILE_PATH = './session.json';
var qrcode = require('qrcode-terminal');


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
var clientini = async ()=> {
    await client.initialize()
}




var p =async () => {
    await clientini()
    var f = []
    var files = fs.readdirSync(__dirname) 
    var listOfPdf = files.filter(file => {
        if (path.extname(file).toLowerCase() === EXTENSION) {
            var fileUser = file.replace('c','c.').substring(0, 17);
            
            var fileDetails = {
                fileName:file,
                user:fileUser
            }
            console.log(fileDetails)
            f.push(fileDetails) 
        }
        
});
    f.forEach( async (pdfelem)=>{
        try {
            var media = MessageMedia.fromFilePath(pdfelem.fileName)
        }
        finally {

            client.sendMessage(pdfelem.user,media)
        }
    })
} 

module.exports.sendPdf = p;