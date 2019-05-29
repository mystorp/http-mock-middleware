const fs = require("fs");
const express = require("express");
const axios = require("axios");
const localHttpMock = require("../");
const rimraf = require("rimraf");

const mockDirectoryPrefix = "tests/.data/http";
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

describe("http mock test", function(){
    let currentApp, currentServer, currentBaseUrl;
    beforeAll(function(done){
        currentApp = express();
        currentApp.use(localHttpMock());
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

    
    test("ignore request if request url is '/'", function(){
        return expect(
            axios.get(`${currentBaseUrl}/`).catch(e => Promise.reject(e.message))
        ).rejects.toMatch(/404/);
    });
    test("tail / in request url is ignored", function(){
        mockFile("/mock/test.json", "{}");
        return expect(
            axios.get(`${currentBaseUrl}/mock/test.json/`).then(resp => JSON.stringify(resp.data))
        ).resolves.toBe("{}");
    });
    test("delay request 1000ms if mock file has '{\"#delay#\": 1000}'", function(){
        mockFile("/directive/delay.json", '{"#delay#":1000}');
        let start = Date.now();
        return expect(
            axios.get(`${currentBaseUrl}/directive/delay`)
            .then(() => (Date.now() - start))
        ).resolves.toBeGreaterThanOrEqual(1000);
    });
    test("kill request if mock file has '{\"#kill#\": true}'", function(){
        mockFile("/directive/kill.json", '{"#kill#":true}');
        return expect(
            axios.get(`${currentBaseUrl}/directive/kill`).catch(e => Promise.reject(e.message))
        ).rejects.toMatch(/Network Error/);
    });
});