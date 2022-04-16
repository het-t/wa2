const { List } = require('whatsapp-web.js');
var {client, Buttons} = require('./allModules.js')
var {watcher, connection, set_new_task} = require('./db.js')

var formatMessage = (str)=> {
    str = str.toUpperCase();
    str = str.replace(/ /g, '');
    return str;
}

var list_task = (user) => {
    
    return new Promise ((resolve,reject)=>{
        connection.query(`CALL list_task(?)`,[user],(err,results,fields)=>{
            if (err) {
                console.log(err)
                reject ()
            }
            else {
                results = results[0]
                resolve(results);
            }
        })
    })
}
var actionQ = [];
var loopOverQueue = (uID)=>{
    for (var i = 0;i<actionQ.length;i++){
        if (actionQ[i].userID == uID) {
            actionQ.splice(i-1,1)
        }
    }
}
var actionQadd =  (uID , act)=> {
    
    loopOverQueue(uID)

    actionQ.push({
        userID: uID,
        action: act,
        additional:''
    })
}

var btn = new Buttons('buttons : ',[
    {
        id:'prg',
        body:'set progress'    
    },{
        id:'snt',
        body:'set new task'
    },{
        id:'rmt',
        body:'delete task'
    }],'','')

var exlist = new List('something','button text',[{'title':'sectionTitle','rows':[{'rowId':'customId','title':'ListItem1','description':'desc'},{'rowId':'oGSRoD','title':'ListItem2','description':''}]}],'','')

var showList = async (user, client) => {
    var listJSON1 = `[{"title":"List Of Task","rows":[`;
    var listJSON3 = ']}]';
    var listJSON2 = '';
    
    var listData = new Array();
    listData = await list_task(user)
 
    new Promise ((resolve,reject)=>{
            listData.forEach(obj => {
                if (listJSON2 !== '') {listJSON2+=','}
                var taskID = obj.taskID;
                var taskDesc = obj.description;
                listJSON2+=`{"rowId":"${taskID}","title":"${taskDesc}","description":""}`;
            })
            resolve(listJSON1+listJSON2+listJSON3);
        })

    .then((list)=>{
        list = JSON.parse(list)
// var exlist = new List('set progress','list of task',[{'title':'sectionTitle','rows':[{'rowId':'customId','title':'ListItem1','description':'desc'},{'rowId':'oGSRoD','title':'ListItem2','description':''}]}],'','')

        var l = new List('set progress','list of task',list,'','')
        client.sendMessage('919879034832@c.us',l)
    }).catch ((err)=>{
        console.log(err)
    });
}

client.on('message',(msg)=>{
    console.log(msg.body)
    var s_msg = formatMessage(msg.body)
    
    if (s_msg === 'HI') {
        client.sendMessage('919879034832@c.us','hi');
        client.sendMessage('919879034832@c.us',btn)
        // client.sendMessage('919879034832@c.us',btn);

    }

    else if (msg?._data?.type === 'buttons_response') {
        actionQadd(msg.from, msg.selectedButtonId)
        if (msg.selectedButtonId == 'prg') {
            // list_task(msg.from,client);
            showList(msg.from, client)
        }
    }
    else if (msg?.type == 'list_response') {
        for (i=0;i<=actionQ.length;i++){
            if (actionQ[i].userID == msg.from && actionQ[i].additional == '') {
                var res = actionQ[i];
                res.additional = msg.body;
                res.progress = '';
                console.log(actionQ)
                // trigger event 
                watcher(actionQ)
                return;
            }
        }
    }

    else if (s_msg !== 'HI') {
        for (i=0;i<=actionQ.length;i++){
            if (actionQ[i].userID == msg.from) {
                if (actionQ[i].action == 'prg' && actionQ[i].additional != '' ) {
                    console.log(actionQ)       
                    var res = actionQ[i];
                    res.progress = msg.body;
                }
                
                else if (actionQ[i].additional == ''){
                    var res = actionQ[i];
                    res.additional = msg.body;
                }
                
                // trigger event 
                watcher(actionQ)
                return;
            }
        }
    }
    
})

client.initialize();