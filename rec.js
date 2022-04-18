var pdf = require('html-pdf');
var con = require('./db.js').connection;
var cron = require('cron').CronJob;
var {Client, MessageMedia} = require('whatsapp-web.js');
let sessionData;

var fs = require('fs');
const { resolve } = require('path');
const SESSION_FILE_PATH = './session.json';
var qrcode = require('qrcode-terminal');
const { job } = require('cron');


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

var htmlAbove = `<!DOCTYPE html><html lang="en"><head><link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap" rel="stylesheet"><style>th{padding-bottom:8px;}table thead th { border-bottom: 1px solid #c2c2c2; } table {border-collapse:collapse;width:80%;font-family: 'Lato', sans-serif;font-size:24px;text-align:right;margin-left:auto;margin-right:auto;} th, td {text-align:right;} td{color:#5c5c5c;font-weight:400;font-size:18px;} th {font-weight:bold;color:#4a4a4a;margin-bottom:12px;}tbody+tr>td {line-height:4px;margin-top:12px;}</style><meta charset="UTF-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>report</title></head><body><table><thead><tr><th>Date</th><th>Description</th><th>Progress</th></tr></thead>`
var htmlBelow = `</tbody></table></body></html>`

var date = new Date().getDate();
var userIdArray = [];
var pdfArray = [];


var makePdf = async (html,userID)=>{   

    var fileName = `./${userID.replace('.','')}${date}.pdf`;
    pdf.create(html).toFile(fileName,(err)=>{
        if (err) console.log(err)
        else {
            pdfArray.push(fileName)


        }

    });
}

var createReport = async (dataForPdf,userID)=>{
    var htmlReportData = '';
    dataForPdf.forEach(obj => {
        var m = obj.date.getMonth()+1;
        var y = obj.date.getFullYear();
        var d = obj.date.getDate();
        var date = new String(d+'-'+m+'-'+y)
        htmlReportData += `<tbody><tr><td>${date}</td><td>${obj.description}</td><td>${obj.progress}</td></tr>`
    })
    var html = htmlAbove + htmlReportData + htmlBelow;    
    await makePdf(html,userID)
}
var getProgressData =  (userID)=>{
    
    return new Promise((resolve,reject)=>{
        con.query(`CALL get_data_for_report(?)`,userID,(err,results,fields)=>{
            if (err) {
                console.log(err)
                reject()
            }
            else {
                var resAndUid = {
                    res:results[0],
                    uid:userID
                }
                resolve(resAndUid)
            }
    })
}
)}
var getAllUsers = ()=>{

    return new Promise ((resolve,reject)=>{

        con.query(`CALL get_all_user()`,(err,results)=>{
            if (err) {
                console.log(err)
                reject()
            }else {
                userIdArray = results[0];
                resolve(userIdArray)
            }
        })
    })
}

var p = async () => {
    await clientini()
    pdfArray.forEach( (pdfelem)=>{
        var media = MessageMedia.fromFilePath(pdfelem)
        var user = pdfelem.substr(2,16)
        user = user.replace('c','c.')
    if (user== '919879034832@c.us') client.sendMessage('919879034832@c.us',media)
    })
} 
var clientini = async ()=> {
    await client.initialize()
}
var u = getAllUsers();

u.then(async (user_id_array)=>{
    await user_id_array.forEach((uidObj)=>{
        getProgressData(uidObj.user).then((obj)=>{
            createReport(obj.res,obj.uid)
        })
    })
})


setTimeout(() => {
    p()
}, 600);

// var shecudleSending = new job('*/10 * * * * *',()=>{
//     console.log('------job----------')
//     p()
// })
// shecudleSending.start();