let appId = 76776;
let diaglogsList = []
let newMessages = []
let userList = []
let userId = false;

var init = function (){
    quickbloxInitConfig()
    listenBtns()
    createSession()
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
            listAllUsers(userId)
            getDialogs()
            QB.chat.onMessageListener = listtenMessages;
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
        $('.js-user').on('click', function (){
            let opponentId = $(this).data('id')
            let currentOponentId =  $('.messages-container').data('opponentId')
            if(currentOponentId != opponentId) {
                $('.messages-container').data('opponentId', opponentId)
                handleDialog(opponentId)
            }
            console.log('user selected => ', opponentId)
        })

    } else {
        console.log('something went wrong retrieving the list of users', users)
    }
    });
}

let handleDialog = function (opponentId) {
    let dialogId = null;
    diaglogsList.forEach(function (dialog) {
        if(dialog.type == 3 && dialog.occupants_ids.indexOf(opponentId) != -1) {
            dialogId = dialog._id;
        }
    })
    console.log('handle dialog', dialogId)
    if(dialogId != null) {
        getDialog(dialogId)
    } else {
        createDialog(oponnetId)
    }
}

let getDialog = function (dialogId) {
    var params = {chat_dialog_id: dialogId, sort_desc: 'date_sent', limit: 100, skip: 0};
    QB.chat.message.list(params, function(err, messages) {
    if (messages) {
        messages.items.reverse().forEach(function (element) {
            let type = element.sender_id == userId ? 'send' : 'received';
            renderMessage(type , element.message)
        })
        console.log('chat history', messages)
    }else{
        console.log(err);
    }
    });
}

let createDialog = function (oponnetId) {
    var params = {
        type: 3,
        occupants_ids: [oponnetId]
      };
       
      QB.chat.dialog.create(params, function(err, createdDialog) {
        if (err) {
          console.log(err);
        } else {
            console.log('dialog created', createdDialog);
            getDialogs()
        }
      });
}

let getDialogs = function () {
    var filters = null;
    QB.chat.dialog.list(filters, function(err, resDialogs) {
    if (err) {
        console.log(err);
    } else {
        diaglogsList = resDialogs.items;
        console.log(resDialogs);
    }
    });
}

let sendMessage = function () {
    let message = $('.js-message').val();
    let opponentId = $('.messages-container').data('opponentId');
    console.log('send to user id => ', opponentId, 'message => ', message)
    if(message.length == 0 || !opponentId) {
        return;
    }
    var msg = {
        type: 'chat',
        body: message,
        extension: {
          save_to_history: 1,
        }
      };
      QB.chat.send(opponentId, msg)
      renderMessage('send', message)
      $('.js-message').val('');
}

let renderMessage = function (type, message){
    $('.js-no-messages').hide()
    let template = `<div class="w-100">
        <div class="txt-message message-${type}">
           {{message}}
        </div>
    </div>`;
    template =  template.replace('{{message}}', message);
    $('.messages-container').append(template)
}

let listtenMessages = function (userId, msg){
    console.log('message received ', msg)
    renderMessage('received' ,msg)
}

let renderUsersList = function (users, ignoreId){
    let htmlTemplate = `<li class="js-user" data-id="{{userId}}">
                            {{name}}
                            <span class="status"></span>
                        </li>`;
    if(users.items.length > 0) {
        $('.user-list ul').html('');
        $('.js-loading-users').hide()
    }

    users.items.forEach(element => {
        if(element.user.id != ignoreId) {
            html = htmlTemplate
            html = html.replace('{{name}}', element.user.login);
            html = html.replace('{{userId}}', element.user.id);
            $('.user-list ul').append(html)
        }
    });
}

let listenForUserStatus = function (){
    QB.chat.onContactListListener = function(userId, type) {
        console.log('user status', userId, type)
    }
}

init()