var mysql = require('mysql2');


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

var watcher = (queue,client,btn)=>{
    queue.forEach((obj,index)=>{
        var action = obj.action;
        
        if (action == 'snt') {
            if (obj.additional && obj.userID) {
                connection.query(`CALL set_new_task(?,?)`,[obj.userID, obj.additional],(err,results,fields)=>{
                    if (err) console.log(err)

                    if (!results?.[0]?.[0]?.['@tid']) {
                        client.sendMessage(obj.userID,'new task added')
                        client.sendMessage(obj.userID,btn)
                        queue.splice(index,1)
                    }
                    else {
                        client.sendMessage(obj.userID,'can\'t add this task, it already exist')
                        client.sendMessage(obj.userID,btn)
                        queue.splice(index,1)
                    }
                })
            } 
        }
        else if (action == 'prg') {
            if (obj.additional && obj.progress) {
                connection.query(`CALL progress(?,?,?)`,[obj.userID,obj.additional,obj.progress],(err,results,fields)=>{                   
                    if (err){
                        console.log(err)
                    }
                    else {
                        client.sendMessage(obj.userID,'porgress rating updated')
                        client.sendMessage(obj.userID,btn)
                        queue.splice(index,1)
                    }
                })
            }
        }
        else if (action == 'rmt') {
            
                connection.query(`CALL remove_task(?,?)`,[obj.userID,obj.additional],(err,results,fields)=>{
                  
                    if (err){
                        console.log(err)
                    }
                    else  {
                       
                        client.sendMessage(obj.userID,'task removed')
                        client.sendMessage(obj.userID,btn)
                        queue.splice(index,1)
                    }
                })
                  
        }
    })
}

module.exports.watcher = watcher;
module.exports.connection = connection;