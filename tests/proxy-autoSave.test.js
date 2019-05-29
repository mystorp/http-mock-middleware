const fs = require("fs");
const express = require("express");
const axios = require("axios");
const localHttpMock = require("../");
const rimraf = require("rimraf");

const mockDirectoryPrefix = "tests/.data/proxy-autoSave";
const mockFile = require("./utils").mockFile.bind(this, mockDirectoryPrefix);

beforeAll(function(){
    fs.writeFileSync("mockrc.json", JSON.stringify({
        "/": mockDirectoryPrefix
    }));
});
afterAll(function(){
    // rimraf.sync(mockDirectoryPrefix);
    fs.unlinkSync("mockrc.json");
});

describe("proxy with autoSave mock test", function(){
    let currentApp, currentServer, currentBaseUrl;
    beforeEach(function(done){
        currentApp = express();
        currentApp.use(localHttpMock({
            proxy: {
                autoSave: true,
                saveDirectory: mockDirectoryPrefix,
                overrideSameFile: "rename"
            }
        }));
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

    test("auto save proxy data to local disk", function(){
        return expect(axios.get(`${currentBaseUrl}/package/local-http-mock`, {
            headers: {
                "X-Mock-Proxy": "https://npm.taobao.org"
            }
        }).then(resp => resp.data)).resolves.toBe(fs.readFileSync(mockDirectoryPrefix + "/package/get-local-http-mock", "utf-8"));
    });
    test("rename exists file when save proxy data to local disk", function(){
        mockFile("/package/get-axios", "test");
        return expect(axios.get(`${currentBaseUrl}/package/axios`, {
            headers: {
                "X-Mock-Proxy": "https://npm.taobao.org"
            }
        }).then(resp => {
            let content = fs.readFileSync(mockDirectoryPrefix + "/package/get-axios.1", "utf-8");
            return "test" === content && fs.existsSync(mockDirectoryPrefix + "/package/get-axios");
        })).resolves.toBe(true);
    });
});