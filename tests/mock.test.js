const express = require("express");
const axios = require("axios");
const localHttpMock = require("../");

describe("http mock test", function(){
    let currentApp, currentServer;
    beforeEach(function(){
        currentApp = express();
        currentApp.use(localHttpMock());
        currentServer = currentApp.listen(function(){
            // TODO: generate url prefix
        });
    });
    
    afterEach(function(){
        currentServer.close();
        currentApp = currentServer = null;
    });
});
describe("websocket mock test", function(){
    let currentApp, currentServer;
    beforeEach(function(){
        currentApp = express();
        currentApp.use(localHttpMock({}));
        currentServer = currentApp.listen(function(){
            // TODO: generate url prefix
        });
    });
    
    afterEach(function(){
        currentServer.close();
        currentApp = currentServer = null;
    });
});
describe("proxy mock test", function(){});