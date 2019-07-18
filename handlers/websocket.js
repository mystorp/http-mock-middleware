const url = require("url");
const WebSocket = require("ws");
const MockFileManager = require("../MockFileManager");

module.exports = function(options, rules){
    let server = options.server;
    let websocketOptions = options.websocket;
    options.serverOptions = options.serverOptions || {};
    let serverOptions = {noServer: true};
    let validServerOptions = [
        "verifyClient",
        "handleProtocols",
        "clientTracking",
        "perMessageDeflate",
        "maxPayload"
    ];
    for(let key of validServerOptions) {
        serverOptions[key] = options.serverOptions[key];
    }
    let websocketServers = {};
    rules.forEach(rule => {
        let {url, rootDirectory} = rule;
        websocketServers[url] = new WebSocket.Server(serverOptions);
        websocketServers[url].on("connection", function(ws){
            if(typeof websocketOptions.setupSocket === "function") {
                websocketOptions.setupSocket(ws);
            }
            ws.on("message", function(msg){
                let request = websocketOptions.decodeMessage(msg);
                if(typeof request === "string") {
                    if(request.charAt(0) !== "/") {
                        request = "/" + request;
                    }
                    request = {url: request};
                }
                return onMessageHandler.call(ws, request, rootDirectory, websocketOptions);
            });
            MockFileManager.find("", "/__greeting__", rootDirectory).then(() => {
                onMessageHandler.call(ws, {url: "/__greeting__"}, rootDirectory, websocketOptions);
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

function onMessageHandler(request, rootDirectory, options) {
    let ws = this;
    MockFileManager.findAndMock("", request.url, rootDirectory, {
        websocket: true,
        args: request.args
    }).then(function(value){
        let data = value.data;
        let msg = options.encodeMessage(null, data, request);
        ws.send(msg);
        let notifies = value.notifies;
        if(!(notifies && Array.isArray(notifies))) { return; }
        createNotifies(ws, notifies, rootDirectory, options);
    }, function(error){
        let msg = options.encodeMessage(error, null, request);
        ws.send(msg);
    });
}


function createNotifies(ws, notifies, rootDirectory, options) {
    for(let notify of notifies) {
        setTimeout(function(){
            onMessageHandler.call(ws, notify, notify.dir || rootDirectory, options);
        }, notify.delay);
    }
}
