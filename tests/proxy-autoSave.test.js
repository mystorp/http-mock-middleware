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
    rimraf.sync(mockDirectoryPrefix);
    fs.unlinkSync("mockrc.json");
});

describe("proxy with autoSave mock test", function(){
    let currentApp, currentServer, currentBaseUrl;
    beforeAll(function(done){
        currentApp = express();
        currentApp.use(localHttpMock({
            proxy: {
                autoSave: true,
                saveDirectory: mockDirectoryPrefix,
                overrideSameFile: "rename"
            }
        }));
        axios.interceptors.request.use(function(config){
            if(config.url.indexOf("/") === 0) {
                config.url = currentBaseUrl + config.url;
            }
            return config;
        });
        currentServer = currentApp.listen(function(){
            let addr = currentServer.address();
            currentBaseUrl = "http://127.0.0.1:" + addr.port;
            done();
        });
    });
    
    afterAll(function(){
        currentServer.close();
        currentApp = currentServer = currentBaseUrl = null;
    });

    test("auto save proxy data to local disk", function(){
        let savedFile = mockDirectoryPrefix + "/package/get-local-http-mock";
        if(fs.existsSync(savedFile)) {
            fs.unlinkSync(savedFile);
        }
        return expect(axios.get("/package/local-http-mock", {
            headers: {
                "X-Mock-Proxy": "https://npm.taobao.org"
            }
        }).then(resp => {
            let proxyData = resp.data;
            let savedData = fs.readFileSync(savedFile, "utf-8");
            return proxyData === savedData;
        })).resolves.toBe(true);
    });
    test("rename exists file when save proxy data to local disk", function(){
        mockFile("/package/get-axios", "test");
        return expect(axios.get("/package/axios", {
            headers: {
                "X-Mock-Proxy": "https://npm.taobao.org"
            }
        }).then(resp => {
            let content = fs.readFileSync(mockDirectoryPrefix + "/package/get-axios.1", "utf-8");
            return "test" === content && fs.existsSync(mockDirectoryPrefix + "/package/get-axios");
        })).resolves.toBe(true);
    });
});
