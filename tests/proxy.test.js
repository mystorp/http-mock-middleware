const fs = require("fs");
const path = require("path");
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

describe("http mock test", function(){
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

    test("proxy request to 百度 if has http header 'X-Mock-Proxy: http://www.baidu.com'", function(){
        return expect(axios.get(`${currentBaseUrl}/`, {
            headers: {
                "X-Mock-Proxy": "http://www.baidu.com"
            }
        }).then(resp => resp.data)).resolves.toMatch(/百度一下，你就知道/);
    });
});

function mockFile(file, content) {
    if(file.indexOf(mockDirectoryPrefix) !== 0) {
        file = mockDirectoryPrefix + file;
    }
    fs.mkdirSync(path.dirname(file), {recursive: true});
    fs.writeFileSync(file, content);
}