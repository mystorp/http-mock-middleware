let express = require("express");
let localHttpMock = require("../");
let app = express();
let server = require("http").createServer();
app.use(localHttpMock({
    server: server,
    websocket: {
        // send base64
        encodeMessage: function(msg){
            return Buffer.from(msg).toString("base64");
        },
        // receive json
        decodeMessage: function(msg){
            msg = JSON.parse(msg);
            return `/${msg.type}/${msg.method}`;
        }
    }
}));
server.on("request", app);
server.listen(3459);