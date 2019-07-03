const fs = require("fs");
const { load } = require("../options");
const { mockFile } = require("./utils");

afterAll(function(){
    if(fs.existsSync("mockrc.json")) {
        fs.unlinkSync("mockrc.json");
    }
});

describe("test options", function(){
    test("mockrc.json must be a valid json file", function(){
        mockFile("", "mockrc.json", "xx");
        expect(load).toThrow(SyntaxError)
    });
    test("mockrc.json can use json5 syntax", function(){
        mockFile("", "mockrc.json", `{"/": {dir: ".data"}}`);
        expect(load()).toEqual([{url: "/", rootDirectory: ".data"}]);
    });
    test("package.json's mock field must be object", function(){
        if(fs.existsSync("mockrc.json")) {
            fs.unlinkSync("mockrc.json");
        }
        let json = require("../package.json");
        json.mock = 31;
        expect(load).toThrow("package.json's mock field must be object");
    });
    test("mockRules must be object", function(){
        expect(() => load(1)).toThrow("mockRules must be object");
    });
    test("mockRules must not be empty object", function(){
        expect(() => load({})).toThrow("mockRules must not be empty object");
    });
    test("key of mockRules must start with /", function(){
        expect(() => load({xx: 1})).toThrow(/invalid url: .*?, it must start with "\/"/);
    });
    test("value.dir of mockRules must be a valid string", function(){
        expect(() => load({"/a": {dir: 23}})).toThrow(/dir value for .*? must be a valid string/);
    });
    test('value.type of mockRules must be "websocket" or falsy', function(){
        expect(() => load({"/a": {
            websocket: 23, dir: ".data", type: 11
        }})).toThrow('type value can only be either "websocket" or falsy');
    });
});
