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

// var exlist = new List('something','button text',[{'title':'sectionTitle','rows':[{'rowId':'customId','title':'ListItem1','description':'desc'},{'rowId':'oGSRoD','title':'ListItem2','description':''}]}],'','')

var ratingList = `[{"title":"Rating","rows":[{"rowId":"1","title":"1","description":""},{"rowId":"2","title":"2","description":""},{"rowId":"3","title":"3","description":""},{"rowId":"4","title":"4","description":""},{"rowId":"5","title":"5","description":""}]}]`
ratingList = JSON.parse(ratingList)
ratingList = new List('set progress','rating',ratingList,'','')

var showList = async (user, client, flag) => {
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
        if (flag == 'p')  var l = new List('set progress','list of task',list,'','')
        else if (flag == 'r') var l = new List('remove task','list of task',list,'','') 
        client.sendMessage('919879034832@c.us',l)
    })
    .catch ((err)=>{
        console.log(err)
    });
}

client.on('message',(msg)=>{
    var s_msg = formatMessage(msg.body)
  
    if (s_msg === 'HI') {
        client.sendMessage('919879034832@c.us','hi');
        client.sendMessage('919879034832@c.us',btn)
        // client.sendMessage('919879034832@c.us',btn);

    }

    else if (msg?._data?.type === 'buttons_response') {
        actionQadd(msg.from, msg.selectedButtonId)
        if (msg.selectedButtonId == 'prg') {
            showList(msg.from, client, 'p')
        }
        else if (msg.selectedButtonId == 'snt') {
            client.sendMessage('919879034832@c.us','enter description for new task')
        }
        else if (msg.selectedButtonId == 'rmt') {
            showList(msg.from, client, 'r')
        }
    }

    else if(msg?._data?.type === 'list_response') {
        var listType = msg?._data?.quotedMsg?.list?.buttonText
        
        if (listType == 'list of task') {
            for (i=0;i<=actionQ.length;i++){
                if (actionQ[i].userID == msg.from && actionQ[i].additional == '') {
                    var res = actionQ[i];
                    res.additional = msg.body;
                    if (actionQ[i].action == 'prg'){
                        res.progress = '';
                        client.sendMessage('919879034832@c.us',ratingList)
                    }
                    
                    watcher(actionQ,client,btn)
                    return;
                }
            }
        }
        else if ( listType == 'rating') {
            for (i=0;i<=actionQ.length;i++){
                if (actionQ[i].userID == msg.from) {
                    if (actionQ[i].action == 'prg' && actionQ[i].additional != '' ) {
                              
                        var res = actionQ[i];
                        res.progress = msg.body;
                    }                  
                    watcher(actionQ,client,btn)
                    return;
                }
            }
        }
    }
    else {
        for (i=0;i<=actionQ.length;i++){
            if (actionQ[i].additional == ''){
                var res = actionQ[i];
                res.additional = msg.body;
            }  
            watcher(actionQ,client,btn)
            return;
        }
    }
    
})

client.initialize();