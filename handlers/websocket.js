const fs = require("fs");
const url = require("url");
const WebSocket = require("ws");
const MockFileManager = require("../MockFileManager");

module.exports = function(options, rules){
    let websocketServers = {};
    rules.forEach(rule => {
        let {url, rootDirectory} = rule;
        websocketServers[url] = new WebSocket.Server({ noServer: true });
        websocketServers[url].on("connection", function(ws){
            // TODO: mock file, response
            ws.on("message", onMessageHandler.bind(ws, options));
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

function onMessageHandler(options, event) {
    let ws = this;
    let localUrl = options.decodeMessage(event.data);
    MockFileManager.find("", localUrl, rootDirectory).then(file => {
        if(/\.json5?$/i.test(file)) {
            MockFileManager.mock(file).then(data => {
                let delay = data["#delay#"];
                delete data["#delay#"];
                let msg = options.decodeMessage(data);
                setTimeout(() => ws.send(msg), delay || 0);
            });
        } else {
            fs.readFile(file, function(error, data){
                if(error) {
                    return console.error(`read file ${file} error: ${error.message}`);
                }
                ws.send(options.decodeMessage(data));
            });
        }
    });
}