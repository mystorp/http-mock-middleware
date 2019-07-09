const url = require("url");
const WebSocket = require("ws");
const MockFileManager = require("../MockFileManager");

module.exports = function(options, rules){
    let server = options.server;
    let websocketOptions = options.websocket;
    let websocketServers = {};
    rules.forEach(rule => {
        let {url, rootDirectory} = rule;
        websocketServers[url] = new WebSocket.Server({ noServer: true });
        websocketServers[url].on("connection", function(ws){
            ws.on("message", function(msg){
                let localUrl = websocketOptions.decodeMessage(msg);
                if(localUrl.charAt(0) !== "/") {
                    localUrl = "/" + localUrl;
                }
                return onMessageHandler.call(ws, localUrl, rootDirectory, websocketOptions);
            });
            MockFileManager.find("", "/__greeting__", rootDirectory).then(() => {
                onMessageHandler.call(ws, "/__greeting__", rootDirectory, websocketOptions);
            }, () => {/* ignore */});
        });
    });
    server.on("upgrade", function(request, socket, head){
        const pathname = url.parse(request.url).pathname;
        let wsServer = websocketServers[pathname];
        if(wsServer) {
            wsServer.handleUpgrade(request, socket, head, function(ws){
                wsServer.emit("connection", ws, request);
            });
        } else {
            socket.destroy();
        }
    });
};

function onMessageHandler(url, rootDirectory, options, extraArgs) {
    let ws = this;
    MockFileManager.findAndMock("", url, rootDirectory, {
        websocket: true,
        args: extraArgs
    }).then(function(value){
        let data = value.data;
        let msg = options.encodeMessage(null, data);
        ws.send(msg);
        let notifies = value.notifies;
        if(!(notifies && Array.isArray(notifies))) { return; }
        createNotifies(ws, notifies, rootDirectory, options);
    }, function(error){
        let msg = options.encodeMessage(error);
        ws.send(msg);
    });
}


function createNotifies(ws, notifies, rootDirectory, options) {
    for(let notify of notifies) {
        setTimeout(function(){
            onMessageHandler.call(ws, notify.url, notify.dir || rootDirectory, options, notify.args);
        }, notify.delay);
    }
}
