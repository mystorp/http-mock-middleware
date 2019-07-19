const url = require("url");
const WebSocket = require("ws");
const MockFileManager = require("../MockFileManager");
const { copyKeys } = require("../utils");

module.exports = function(options, rules){
    let serverOptions = copyKeys({}, [
        "verifyClient",
        "handleProtocols",
        "clientTracking",
        "perMessageDeflate",
        "maxPayload",
        "noServer"
    ], options.serverOptions || {}, {noServer: true});
    let websocketServers = {};
    rules.forEach(rule => {
        let {url, rootDirectory} = rule;
        websocketServers[url] = new WebSocket.Server(serverOptions);
        websocketServers[url].on("connection", function(ws){
            if(typeof options.setupSocket === "function") {
                options.setupSocket(ws);
            }
            ws.on("message", function(msg){
                let request = options.decodeMessage(msg);
                if(typeof request === "string") {
                    if(request.charAt(0) !== "/") {
                        request = "/" + request;
                    }
                    request = {url: request};
                }
                return onMessageHandler.call(ws, request, rootDirectory, options);
            });
            MockFileManager.find("", "/__greeting__", rootDirectory).then(() => {
                onMessageHandler.call(ws, {url: "/__greeting__"}, rootDirectory, options);
            }, () => {/* ignore */});
        });
    });
    const bindServer = (server) => {
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
    let server = options.server;
    // webpack-dev-server 2, 3 has those methods
    if(typeof server._watch === "function" && typeof server.invalidate === "function") {
        // webpack-dev-server apply middlewares earlier than creating http server
        process.nextTick(() => bindServer(server.listeningApp));
    } else {
        bindServer(server);
    }
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
