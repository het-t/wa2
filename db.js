var mysql = require('mysql2');
const { client } = require('./allModules');

var connection = mysql.createConnection({
    host:'localhost',
    user:'het',
    password:'het161967',
    database:'db2'
})

connection.connect((err)=>{
    if (err) console.log(err)
    else console.log("db connected")
});

var sendReport = () => {
    
    // cron to send report everymidnight
    // cron.schedule('0 0 0 1/1 * ? *', () => {
    //     console.log('running a task every minute');
    //     connection.query(`CALL sendReport()`,[],(err,results,fields)=>{
    //         if (err) {
    //             console.log(err)
    //         }
    //         else if (results) {
    //             createReports();
    //         }
    //     })
    // });
    cron.schedule('* * * * *', () => {
        console.log('running a task every minute');
    });
}
var set_new_task = (user, task,client)=>{
    return new Promise(
        (resolve,reject)=>(
            connection.query(`CALL set_new_task(?,?)`,[user, task],(err,results,fields)=>{
            if (err) {
                console.log(err)
                reject(client)
            }
            else if (results) {
                resolve(client)
            }
        }))
    )
    
}

var remove_task = (user, taskID) => {
    taskID = user+taskID;
    connection.query(`CALL remove_task(?)`,[taskID],(err,results,fields)=>{
        if (err) {
            console.log(err)
        }
        else if (results) {

        }
    })
}

var progress = (user,taskID,rating) => {
    taskID = user+taskID;
    connection.query(`CALL progress(?,?)`,[taskID,rating],(err,results,fields)=>{
        if (err){
            console.log(err)
        }
        else if (results) {

        }
    })
}

var getProgressData = (user)=>{
    return new Promise((resolve,reject)=>{
        connection.query(`CALL get_data_for_report(?)`,[user],(err,results,fields)=>{
        if (err) {
            reject()
        }
        else {
            resolve(results)
        }
    })}
)}

var watcher = (queue,client,btn)=>{
    queue.forEach((obj)=>{
        var action = obj.action;
        
        if (action == 'snt') {
            if (obj.additional && obj.userID) {
                connection.query(`CALL set_new_task(?,?)`,[obj.userID, obj.additional],(err,results,fields)=>{
                    if (err) console.log(err)
                    else {
                        client.sendMessage(obj.userID,'new task added')
                        client.sendMessage('919879034832@c.us',btn)
                    }
                })
            } 
        }
        else if (action == 'prg') {
            if (obj.additional && obj.progress) {
                connection.query(`CALL progress(?,?)`,[obj.userID,obj.progress],(err,results,fields)=>{
                    if (err){
                        console.log(err)
                    }
                    else  {
                        client.sendMessage(obj.userID,'porgress rating updated')
                        client.sendMessage('919879034832@c.us',btn)
                    }
                })
            }
        }
        else if (action == 'rmt') {
            
                connection.query(`CALL remove_task(?,?)`,[obj.userID,obj.additional],(err,results,fields)=>{
                    if (err) {
                        console.log(err)
                    }
                    else {
                        client.sendMessage(obj.userID,'task deleted')
                        client.sendMessage('919879034832@c.us',btn)
                    }
                })
                  
        }
    })
}

module.exports.set_new_task = set_new_task;
module.exports.watcher = watcher;
module.exports.connection = connection;