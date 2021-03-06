// const { List } = require('whatsapp-web.js');
var {client, Buttons, List} = require('./allModules.js')
var {watcher, connection} = require('./db.js')
const { job } = require('cron');
var {u, getProgressData, createReport} = require('./rec.js')
var sendPdf = require('./sendRec.js').sendPdf;


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

var btn = new Buttons(' ',[
    {
        id:'prg',
        body:'set progress'    
    },{
        id:'snt',
        body:'set new task'
    },{
        id:'rmt',
        body:'delete task'
    }],'menu','')



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
            if (listData != ''){    
                listData.forEach(obj => {
                    if (listJSON2 !== '') {listJSON2+=','}
                    var taskID = obj.taskID;
                    var taskDesc = obj.description;
                    listJSON2+=`{"rowId":"${taskID}","title":"${taskDesc}","description":""}`;
                })
                resolve(listJSON1+listJSON2+listJSON3);
            }
            else {
                reject()
            }
        })

    .then((list)=>{
        list = JSON.parse(list)
        if (flag == 'p')  var l = new List('set progress','list of task',list,'','')
        else if (flag == 'r') var l = new List('remove task','list of task',list,'','')
        client.sendMessage(user,l)
    },()=>{
        client.sendMessage(user,'invalid operation \nyou don\'t have any task \nfirst add new task')
    })
    .catch ((err)=>{
        console.log(err)
    });
}

client.on('message',(msg)=>{

    var s_msg = formatMessage(msg.body)
    if (s_msg === 'HI') {
        client.sendMessage(msg.from,'hi');
        client.sendMessage(msg.from,btn)
    }
    
    else if (msg?._data?.type === 'buttons_response') {
        if (msg.selectedButtonId == 'prg') {
            showList(msg.from, client, 'p').then(()=>{
                actionQadd(msg.from, msg.selectedButtonId)
            })
        }
        else if (msg.selectedButtonId == 'snt') {
            actionQadd(msg.from, msg.selectedButtonId)
            client.sendMessage(msg.from,'enter description for new task')
        }
        else if (msg.selectedButtonId == 'rmt') {
            showList(msg.from, client, 'r').then(()=>{
                actionQadd(msg.from, msg.selectedButtonId)
            })
        }
    }

    else if(msg?._data?.type === 'list_response' ) {
        // console.log(msg?._data?.quotedMsg?.list?.description)
        var listType = msg?._data?.quotedMsg?.list?.buttonText
        console.log(listType)
        if (listType == 'list of task') {

            for (i=0;i<=actionQ.length;i++){
                if (actionQ[i].userID == msg.from && actionQ[i].additional == '') {
                    var res = actionQ[i];
                    res.additional = msg.body;
                    if (actionQ[i].action == 'prg'){
                        res.progress = '';
                        client.sendMessage(msg.from,ratingList)
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
    // else if (msg?._data?.quotedMsg?.list?.description) {
    //     console.log('------3------')

    //     var action = msg?._data?.quotedMsg?.list?.description;
    //     // console.log(action)
    //     loopOverQueue(msg.from)
    //     if (action == 'set progress' || action == 'delete task'){
    //         actionQ.push({
    //             userID: msg.from,
    //             action: action,
    //             additional:msg.body
    //         })
    //     }
    //     watcher(actionQ,client,btn)
    // }
    else if (s_msg != 'HI'){

        for (i=0;i<=actionQ.length;i++){
            if (actionQ[i].additional == '' && actionQ[i].userID == msg.from){
                var res = actionQ[i];
                res.additional = msg.body;
            }  
            watcher(actionQ,client,btn)
            return;
        }
    }
    
})

var jobString = '00 08 13 * * *'

// '00 00 10 * * *'
var ask = new job (jobString,()=>{
    console.log(ask.running)
    connection.query(`CALL users_without_progress()`,[],(err,results)=>{
        if (err) console.log(err)
        var userIds = results[0];
        console.log('results ------',results)
        userIds.forEach((userId)=>{
            actionQadd(userId.user,'prg')
            client.sendMessage(userId.user,"im working")

            showList(userId.user,client,'p')
        })
    })
})

// '00 00 22 * * 0 '
var shceduleSending = new job(jobString,()=>{
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

client.initialize().then(()=>{
    ask.start()
    shceduleSending.start();
})
