const fs = require("fs");
const express = require("express");
const axios = require("axios");
const localHttpMock = require("../");
const rimraf = require("rimraf");

const mockDirectoryPrefix = "tests/.data/proxy";

beforeAll(function(){
    fs.writeFileSync("mockrc.json", JSON.stringify({
        "/": mockDirectoryPrefix
    }));
});
afterAll(function(){
    rimraf.sync(mockDirectoryPrefix);
    fs.unlinkSync("mockrc.json");
});

describe("proxy mock test", function(){
    let currentApp, currentServer, currentBaseUrl;
    beforeEach(function(done){
        currentApp = express();
        currentApp.use(localHttpMock());
        currentServer = currentApp.listen(function(){
            let addr = currentServer.address();
            currentBaseUrl = "http://127.0.0.1:" + addr.port;
            done();
        });
    });
    
    afterEach(function(){
        currentServer.close();
        currentApp = currentServer = currentBaseUrl = null;
    });

    test("proxy request to npmjs if has http header 'X-Mock-Proxy: https://www.npmjs.com'", function(){
        return expect(axios.get(`${currentBaseUrl}/package/local-http-mock`, {
            headers: {
                "X-Mock-Proxy": "https://www.npmjs.com"
            }
        }).then(resp => resp.data)).resolves.toMatch(/local-http-mock  -  npm<\/title>/);
    });
});