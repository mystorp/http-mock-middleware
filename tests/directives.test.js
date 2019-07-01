const ifDirective = require("../directives/if");
const notifyDirective = require("../directives/ws-notify");
const rimraf = require("rimraf");

const mockDirectoryPrefix = "tests/.data/directives";
const mockFile = require("./utils").mockFile.bind(this, mockDirectoryPrefix);

afterAll(function(){
    rimraf.sync(mockDirectoryPrefix);
});
describe("test if directives", function(){
    let context = {
        "#if:query.x == 'a'#": {
            "result": "a"
        },
        "#if:query.x == 'b'#": {
            "result": "b"
        },
        "#default#": {
            "result": "none"
        }
    };
    test("#if:query.x == 'a'# wins", function(){
        expect(ifDirective.parse({
            data: context,
            request: {
                query: {x: "a"}
            }
        }).data.result).toBe("a");
    });
    test("#if:query.x == 'b'# wins", function(){
        expect(ifDirective.parse({
            data: context,
            request: {
                query: {x: "b"}
            }
        }).data.result).toBe("b");
    });
    test("#default# wins", function(){
        expect(ifDirective.parse({
            data: context,
            request: {
                query: {x: "c"}
            }
        }).data.result).toBe("none");
    });
    test("missing #default# will throw", function(){
        let mycontext = JSON.parse(JSON.stringify(context));
        delete mycontext["#default#"];
        expect(() => ifDirective.parse({
            data: mycontext,
            request: {
                query: {x: "c"}
            }
        })).toThrow('missing "#default#" directive!');
    });
    test("useless #default# will removed", function(){
        expect(ifDirective.parse({
            data: {
                "#default#": 33
            },
            request: {
                query: {x: "c"}
            }
        }).data).toEqual({});
    });
    test("#args# will work", function(){
        let mycontext = {
            data: {
                "#args#": 3,
                "#if:args > 2#": {
                    "result": "gt"
                },
                "#default#": {
                    "result": "lt or eq"
                }
            },
            request: {
                query: {x: "c"}
            }
        };
        expect(ifDirective.parse(mycontext).data.result).toBe("gt");
        mycontext = {
            data: {
                "#args#": {"args": 2},
                "#if:args > 2#": {
                    "result": "gt"
                },
                "#default#": {
                    "result": "lt or eq"
                }
            },
            request: {
                query: {x: "c"}
            }
        };
        expect(ifDirective.parse(mycontext).data.result).toBe("lt or eq");
    });
});

describe("test notify directive", function(){
    expect(notifyDirective.parse({
        websocket: true,
        data: {"#notify#": "/url"}
    }).notifies).toEqual([{delay: 0, url: "/url"}]);

    expect(notifyDirective.parse({
        websocket: true,
        data: {"#notify#": {
            delay: 1,
            url: "/url"
        }}
    }).notifies).toEqual([{delay: 1, url: "/url"}]);
});
