let appId = 76776;
let diaglogsList = []
let diaglogHistory = []
let userList = []
let userId = false;
let currentOpponentId = false;

var init = function (){
    quickbloxInitConfig()
    listenBtns()
    createSession()
    forceSignUp()
}

let forceSignUp = function () {
    let token = localStorage.getItem('token')
    if(!token) {
        $('#modal-signUp').modal('show');
    }
}

let quickbloxInitConfig = function () {
    var CONFIG = {
        //endpoints: {
        //  api: "apicustomdomain.quickblox.com", // set custom API endpoint
        //  chat: "chatcustomdomain.quickblox.com" // set custom Chat endpoint
        //},
        chatProtocol: {
          active: 2 // set 1 to use BOSH, set 2 to use WebSockets (default)
        },
        debug: {mode: 0} // set DEBUG mode
      };
      QB.init(appId, 'hPBXX8eKAYKSAL3', 'H77vfdXfK33kqdN', CONFIG);
}

let createSession = async function(){
    await QB.createSession(function(err, result) {
        console.log('token requested', result)
        token = result.token
        localStorage.setItem('token', result.token);
        //listenForUserStatus()
      //console.log('session created', result)
    });
}

var listenBtns = function (){
    $('.js-create-user-btn').on('click', function(){
        createUser()
    })
    $('.js-login-user-btn').on('click', function(){
        login()
    })
    $('.js-update-user-btn').on('click', function(){
        updateUserInfo()
    })
    $('.js-onSign').on('click', function (){
       let action = $(this).data('action');
        $(`#modal-${action}`).modal('show')   
    })
    $('.js-send').on('click', function (){
        sendMessage()
    })
}

let startPrivateChat = function(){
    var params = {
        type: 3,
        occupants_ids: [91295961]
      };
       
      QB.chat.dialog.create(params, function(err, createdDialog) {
        if (err) {
          console.log(err);
        } else {

        }
      });
}

let connectChat = function (userId, userPass) {

    QB.chat.connect({userId: userId, password: userPass}, function(err, roster) {
        if (err) {
            console.log('error connecting chat, user => ',user,   err);
        } else {
            console.log('chat connected', roster)
            $('.js-spinner-users').addClass('d-none')
            getDialogs()
            QB.chat.onMessageListener = listenMessages;
         /*
         *  (Object) roster - The user contact list
         *  roster = {
         *    '1126541': {subscription: 'both', ask: null},        // you and user with ID 1126541 subscribed to each other.
         *    '1126542': {subscription: 'none', ask: null},        // you don't have subscription but user maybe has
         *    '1126543': {subscription: 'none', ask: 'subscribe'}, // you haven't had subscription earlier but now you asked for it
         *  }; 
         */
   
        }
    });
}

let login = function() {
    $('.js-txt-login').addClass('d-none')
    $('.js-spinner-login-btn').removeClass('d-none')
    var params = {
        login: $('#txtEmailSignIn').val(),
        password: $('#txtPassSignIn').val(),
    };
 
    // or through email
    // var params = {email: 'garry@gmail.com', password: 'garry5santos'};
    
    // or through social networks (Facebook / Twitter)
    // var params = {provider: 'facebook', keys: {token: 'AM46dxjhisdffgry26282352fdusdfusdfgsdf'}};
    
    QB.login(params, function(err, result) {
        if(result){
            $('.js-txt-login').removeClass('d-none')
            $('.js-spinner-login-btn').addClass('d-none')
            $('.js-spinner-users').removeClass('d-none')
            $('.js-loading-users').hide();
            connectChat(result.id, params.password)
            $('#modal-signIn').modal('hide')
            userId = result.id;
            console.log('login successful', result)
            
        }
    });
}

let updateUserInfo = function() {
    let userInfo = localStorage.getItem('userInfo');
    var userId = userInfo.id; 
 
    QB.users.update(userId, {
            full_name: "Doomsday kal-el", 
            email: "doomsday@gmail.com"
        }, function(err, user){
            if (user) {
                console.log('info updated successful')  
            } else  {
                console.log('something went wrong') 
            }
    });
}

var createUser = function (){
    var params = { 
        'login': $('#txtEmailSignUp').val(), 
        'password': $('#txtPassSignUp').val(), 
        'tag': "demo"
    };
 
    QB.users.create(params, function(err, user){
    if (user) {
        console.log('user created')
        $('#modal-signUp').modal('hide')
    } else  {
        console.log('something went wrong')
    }
    });
}

let listAllUsers = function(ignoreId) {
    var params = { page: '1', per_page: '100'};
 
    QB.users.listUsers(params, function(err, users){
    if (users) {
        console.log('list of users', users)
        userList = users;
        renderUsersList(users, ignoreId)
        listenSelectUserEvent()
    } else {
        console.log('something went wrong retrieving the list of users', users)
    }
    });
}

let listenSelectUserEvent = function (){
    $('.js-user').on('click', function (){
        $('.js-user').removeClass('user-selected')
        $(this).addClass('user-selected')
        let opponentId = $(this).data('id')
        if(currentOpponentId != opponentId) {
            currentOpponentId = opponentId
            handleDialog(opponentId)
        }
        console.log('user selected => ', opponentId)
    })
}

let handleDialog = function (opponentId) {
    cleanChat()
    let dialogId = null;
    for (let i = 0; i < diaglogsList.length; i++) {
        let dialog = diaglogsList[i];
        if(dialog.type == 3 && dialog.occupants_ids.indexOf(opponentId) != -1) {
            dialogId = dialog._id;
        }
    }
    console.log('handle dialog', dialogId, diaglogHistory)
    if(!diaglogHistory[dialogId] && dialogId) {
        getDialog(dialogId)
    }else if(dialogId){
        getDialogFromMemory(dialogId)
    }
    updateUserBadge(opponentId, true)
}

let scrollTobottom = function (smooth = false) {
    console.log('scrolling')
    $('.messages-container').animate({
        scrollTop: $('.messages-container .messages-list').height()
    }, smooth ? 400 : 0);
}

let cleanChat = function (showNoMessage = false) {
    $('.messages-container .messages-list').html('')
    if(showNoMessage) {
        $('.js-no-messages').show()
    }
}

let getDialogFromMemory = async function (dialogId) {
    cleanChat()
    await diaglogHistory[dialogId].items.reverse().forEach(function (element) {
        let type = element.sender_id == userId ? 'send' : 'received';
        renderMessage(type , element.message)
    })
    scrollTobottom()
}

let getDialog = async function (dialogId) {
    var params = {chat_dialog_id: dialogId, sort_desc: 'date_sent', limit: 100, skip: 0};
    await QB.chat.message.list(params, function(err, messages) {
        if (messages) {
            cleanChat()
            diaglogHistory[dialogId] = messages;
            let arrayItems = messages.items.reverse();
            for (let i = 0; i < arrayItems.length; i++) {
                let element = arrayItems[i];
                let type = element.sender_id == userId ? 'send' : 'received';
                renderMessage(type , element.message)
            }
            scrollTobottom()
            console.log('chat history', messages)
        }else{
            console.log(err);
        }
    });
}

let  createDialog = async function (oponnetId) {
    var params = {
        type: 3,
        occupants_ids: [oponnetId]
      };
       
      await QB.chat.dialog.create(params, function(err, createdDialog) {
        if (err) {
          console.log(err);
        } else {
            console.log('dialog created', createdDialog);
            getDialogs()
            return createdDialog
        }
      });
      return 0;
}

let getDialogs = async function () {
    var filters = null;
    await QB.chat.dialog.list(filters, function(err, resDialogs) {
        if (err) {
            console.log(err);
        } else {
            diaglogsList = resDialogs.items;
            listAllUsers(userId)
            console.log('list of dialogs', resDialogs);
            return;
        }
    });
}

let sendMessage = function () {
    let message = $('.js-message').val();
    console.log('send to user id => ', currentOpponentId, 'message => ', message)
    if(message.length == 0 || !currentOpponentId) {
        return;
    }
    var msg = {
        type: 'chat',
        body: message,
        extension: {
          save_to_history: 1,
        }
      };
    QB.chat.send(currentOpponentId, msg)
    renderMessage('send', message)
    let dialogId = verifyIfDialogExist(currentOpponentId)
    console.log('verify if exist dialog id', dialogId)
    if(dialogId) {
        removeDialogFromList(dialogId)
    }else {
        getDialogs()
    }
    scrollTobottom(true)
    $('.js-message').val('');
}

let verifyIfDialogExist = function (opponentId){
    for (let i = 0; i < diaglogsList.length; i++) {
        dialog = diaglogsList[i];
        if(dialog.occupants_ids.indexOf(opponentId) != -1) {
            return dialog._id
        }
    }
    return false;
}

let renderMessage = function (type, message){
    $('.js-no-messages').hide()
    let template = `<div class="w-100">
        <div class="txt-message message-${type}">
           {{message}}
        </div>
    </div>`;
    template =  template.replace('{{message}}', message);
    $('.messages-container .messages-list').append(template)
}

let listenMessages = function (userId, msg) {
    let entryDialogId = msg.extension.dialog_id
    let dialogInMemory = diaglogsList.filter( x => x._id == entryDialogId)
    let dialog = false;
    if(dialogInMemory.length > 0){
        dialog = dialogInMemory[0]
        handleIncomingMessages(dialog, msg)
    } else {
        getDialogs().then(function (){
            let dialogInMemory = diaglogsList.filter( x => x._id == entryDialogId)
            let dialog = false;
            if(dialogInMemory.length > 0){
                dialog = dialogInMemory[0]
                handleIncomingMessages(dialog, msg)
            }
        })
    }
    console.log('message received ', msg)
}

let handleIncomingMessages = function (dialog, msg){
    console.log('dialog xd', dialog)
    if(dialog.occupants_ids.indexOf(currentOpponentId) != -1) {
        renderMessage('received' , msg.body)
        scrollTobottom(true)
        // remove to be able loaded when the user goes back, this way we avoid updating 
        // the chat history in memory for incoming messages
        removeDialogFromList(dialog._id)
    } else {
        let opponentId = dialog.occupants_ids[1];
        updateUserBadge(opponentId) 
    }
}

let removeDialogFromList = function (dialogId){
    diaglogHistory[dialogId] = false;
    console.log('remove index', diaglogsList)
}

let updateUserBadge = function(userId, reset = false) {
    let user = $(`.user-list [data-id='${userId}'] .badge`);
    console.log('update badge ', user, userId)
    if(reset) {
        user.html(0)
        user.addClass('d-none')
    }else {
        user.removeClass('d-none')
        user.html(parseInt(user.html()) + 1)
    }
}

let renderUsersList = function (users, currentUserId){
    let htmlTemplate = `<li class="js-user" data-id="{{userId}}">
                            {{name}}
                            <div class="d-flex align-items-center">
                                <span class="badge badge-primary {{show}}">{{countMessages}}</span>
                                <span class="ml-2 status"></span>
                            </div>
                        </li>`;
    if(users.items.length > 0) {
        $('.user-list ul').html('');
        $('.js-loading-users').hide()
    }

    users.items.forEach(element => {
        let userId = element.user.id;
        if(userId != currentUserId) {
            html = htmlTemplate
            html = html.replace('{{name}}', element.user.login);
            html = html.replace('{{userId}}', userId);
            let countUnReadMessages = lookForUnreadMessages(userId);
            if(countUnReadMessages > 0) {
                html = html.replace('{{show}}', '');
                html = html.replace('{{countMessages}}', countUnReadMessages);
            }else {
                html = html.replace('{{show}}', 'd-none');
                html = html.replace('{{countMessages}}', 0);
            }
            $('.user-list ul').append(html)
        }
    });
}

let lookForUnreadMessages = function (userId) {
    let result = 0
    for (let i = 0; i < diaglogsList.length; i++) {
        if(diaglogsList[i].occupants_ids.indexOf(userId) != -1) {
            return diaglogsList[i].unread_messages_count
        }
    }
    return result;
}

let listenForUserStatus = function (){
    QB.chat.onContactListListener = function(userId, type) {
        console.log('user status', userId, type)
    }
}

init()