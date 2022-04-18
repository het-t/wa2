var pdf = require('html-pdf');
var con = require('./db.js').connection;
var sendPdf = require('./sendRec.js').sendPdf;
var htmlAbove = `<!DOCTYPE html><html lang="en"><head><link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap" rel="stylesheet"><style>th{padding-bottom:8px;}table thead th { border-bottom: 1px solid #c2c2c2; } table {border-collapse:collapse;width:80%;font-family: 'Lato', sans-serif;font-size:24px;text-align:right;margin-left:auto;margin-right:auto;} th, td {text-align:right;} td{color:#5c5c5c;font-weight:400;font-size:18px;} th {font-weight:bold;color:#4a4a4a;margin-bottom:12px;}tbody+tr>td {line-height:4px;margin-top:12px;}</style><meta charset="UTF-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>report</title></head><body><table><thead><tr><th>Date</th><th>Description</th><th>Progress</th></tr></thead>`
var htmlBelow = `</tbody></table></body></html>`
const { job } = require('cron');
const { client } = require('./allModules.js');

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



var u = getAllUsers();

u.then(async (user_id_array)=>{
    await user_id_array.forEach((uidObj)=>{
        getProgressData(uidObj.user).then((obj)=>{
            createReport(obj.res,obj.uid)
        })
    })
})

var shceduleSending = new job('00 00 22 * * 0 ',()=>{
    try {
        u.then(async (user_id_array)=>{
            await user_id_array.forEach((uidObj)=>{
                getProgressData(uidObj.user).then((obj)=>{
                    createReport(obj.res,obj.uid)
                })
            })
        })
    }
    finally{
        sendPdf()
    }
    
})
shceduleSending.start();