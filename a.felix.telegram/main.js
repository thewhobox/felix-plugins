//651307733:AAGBMbwcbJOc86p6XFaPygnEbqk9dwgTITs

const TelegramBot = require('node-telegram-bot-api');

var adapter;
var bot;


function startAdapter(base) {
    adapter = base;
    base.subscribe("*");
    base.onStateChanged(changed);
    base.onMessage(message);



    if (adapter.settings.token && adapter.settings.token != "") {
        adapter.setState("connection", true, true);
        bot = new TelegramBot(adapter.settings.token, { polling: true });
        bot.on('message', te_message);
        bot.on('callback_query', te_callbackquery);

        adapter.addState("message", "Nachricht", "string", "text", 3, "");
        adapter.addState("chatId", "Chat ID", "number", "number", 3, 0);
    } else {
        adapter.setState("connection", false, true);
        adapter.log.warn("Kein Token angegeben. Bot kann nicht erstellt werden.")
    }

    return base;
}

function message(cmd, data, callback) {
    switch (cmd) {
        case "sendMessage":
            bot.sendMessage(data.chatid, data.text, data.options);
            break;
    }
}

function te_callbackquery(callbackQuery) {
    const action = callbackQuery.data;
    const msg = callbackQuery.message;
    const opts = {
        chat_id: msg.chat.id,
        message_id: msg.message_id,
    };
    let text;

    if (action === 'yes') {
        text = 'I love you too';
    } else {
        text = 'That\'s  okay';
    }

    bot.editMessageText(text, opts);
}

function te_message(msg) {
    //const opts = {
    //    reply_markup: {
    //      inline_keyboard: [
    //        [
    //          {
    //            text: 'Yes',
    //            callback_data: 'yes'
    //          },
    //          {
    //            text: 'No',
    //            callback_data: 'no'
    //          }
    //        ]
    //      ]
    //    }
    //};
    //bot.sendMessage(msg.chat.id, 'Do you love me?', opts);
    adapter.setState("message", msg.text, true);
    adapter.setState("chatId", msg.chat.id, true);
}


function changed(data) {
    if (data.ack)
        return;

    switch (data.state) {
        case "message": {
            var chatid = adapter.getState("chatId");
            bot.sendMessage(chatid.value, data.value);
            adapter.setState("message", data.value, true);
            break;
        }
    }

}



module.exports = startAdapter