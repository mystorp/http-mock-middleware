let express = require("express");
let mkdirp = require("mkdirp");
let localHttpMock = require("../");
let app = express();
let server = require("http").createServer();
mkdirp.sync("tests/.data");
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
    },
    proxy: {
        autoSave: true,
        saveDirectory: "tests/.data/app",
        overrideSameFile: "rename"
    }
}));
server.on("request", app);
server.listen(3459);