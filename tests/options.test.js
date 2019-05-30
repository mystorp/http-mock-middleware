const fs = require("fs");
const { load } = require("../options");
const { mockFile } = require("./utils");

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
        let json = JSON.parse(fs.readFileSync("package.json", "utf-8"));
        json.mock = 31;
        fs.writeFileSync("package.json", JSON.stringify(json, null, 2));
        expect(load).toThrow("package.json's mock field must be object");
        // TODO: remove this ugly code
        delete json.mock;
        fs.writeFileSync("package.json", JSON.stringify(json, null, 2));
    });
    test("options must not be {}", function(){
        mockFile("", "mockrc.json", "{}");
        expect(load).toThrow("mock config can't be {}");
    });
    test("key of options must start with /", function(){
        mockFile("", "mockrc.json", '{"a": ".data"}');
        expect(load).toThrow(/invalid url: .*?, it must start with "\/"!/);
    });
    test("value.dir of options must be a valid string", function(){
        mockFile("", "mockrc.json", '{"/a": {dir: 23}}');
        expect(load).toThrow(/dir value for .*? must be a valid string/);
    });
    test("value.type of options must be \"websocket\" or falsy", function(){
        mockFile("", "mockrc.json", '{"/a": {websocket: 23, dir: ".data", type: 11}}');
        expect(load).toThrow("type value can only be either \"websocket\" or falsy!");
    });
});