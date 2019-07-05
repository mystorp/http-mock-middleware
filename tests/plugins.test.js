const ifPlugin = require("../plugins/if");
const notifyPlugin = require("../plugins/ws-notify");
const varExpansionPlugin = require("../plugins/var-expansion");
const cookiePlugin = require("../plugins/cookies");
const headerPlugin = require("../plugins/headers");
const rimraf = require("rimraf");

const mockDirectoryPrefix = "tests/.data/plugins";
const mockFile = require("./utils").mockFile.bind(this, mockDirectoryPrefix);

afterAll(function(){
    rimraf.sync(mockDirectoryPrefix);
});
describe("test if plugin", function(){
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
        expect(ifPlugin.parse({
            data: context,
            request: {
                query: {x: "a"}
            }
        }).data.result).toBe("a");
    });
    test("#if:query.x == 'b'# wins", function(){
        expect(ifPlugin.parse({
            data: context,
            request: {
                query: {x: "b"}
            }
        }).data.result).toBe("b");
    });
    test("#default# wins", function(){
        expect(ifPlugin.parse({
            data: context,
            request: {
                query: {x: "c"}
            }
        }).data.result).toBe("none");
    });
    test("missing #default# will throw", function(){
        let mycontext = JSON.parse(JSON.stringify(context));
        delete mycontext["#default#"];
        expect(() => ifPlugin.parse({
            data: mycontext,
            request: {
                query: {x: "c"}
            }
        })).toThrow('missing "#default#" directive!');
    });
    test("useless #default# will removed", function(){
        expect(ifPlugin.parse({
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
        expect(ifPlugin.parse(mycontext).data.result).toBe("gt");
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
        expect(ifPlugin.parse(mycontext).data.result).toBe("lt or eq");
    });
});

describe("test notify plugin", function(){
    test("#notify# is string", function(){
        expect(notifyPlugin.parse({
            websocket: true,
            data: {"#notify#": "/url"}
        }).notifies).toEqual([{delay: 0, url: "/url"}]);
    });
    test("#notify# is object", function(){
        expect(notifyPlugin.parse({
            websocket: true,
            data: {"#notify#": {
                delay: 1,
                args: {from: 1},
                url: "/url"
            }}
        }).notifies).toEqual([{delay: 1, url: "/url", args: {from: 1}}]);
    });
});

describe("test var-expansion plugin", function(){
    let request = {
        query: {a: 3},
        body: {b: [1,2,3]},
        cookies: {c: [{x:1}]},
        signedCookies: {d: 6},
        headers: {"Content-Type": "text/html"}
    };
    Object.keys(request).forEach(key => {
        let value = request[key];
        let key2 = Object.keys(value)[0];
        test(`"#$${key}#" will expand to "${JSON.stringify(value)}"`, function(){
            expect(varExpansionPlugin.parse({
                request, data: `#$${key}#`
            }).data).toEqual(value);
        }); 
        test(`"#$${key}.${key2}#" will expand to "${value[key2]}"`, function(){
            expect(varExpansionPlugin.parse({
                request, data: `#$${key}.${key2}#`
            }).data).toEqual(value[key2]);
        });
    });
    let values = [];
    let data = Object.keys(request).map(x => {
        let value = request[x];
        let key2 = Object.keys(value)[0];
        values.push(value[key2]);
        return [x, key2];
    }).map(x => `#$${x[0]}.${x[1]}#`).join(", ");
    test(`"${data}" will expand to "${values.join(", ")}"`, function(){
        expect(varExpansionPlugin.parse({request, data}).data).toEqual(values.join(", "));
    });
});

describe("test cookies plugin", function(){
    let cookies1 = {
        a: 3,
        b: 4
    };
    let cookies2 = [{
        name: "a",
        value: "b",
        options: {path: "/xx"}
    }];
    test("set cookie via object", function(){
        let count = 0;
        cookiePlugin.parse({
            response: {
                cookie(){ count++; }
            },
            data: {
                "#cookies#": cookies1
            }
        });
        expect(count).toBe(2);
    });
    test("set cookie via array", function(){
        let count = 0;
        cookiePlugin.parse({
            response: {
                cookie(){ count++; }
            },
            data: {
                "#cookies#": cookies2
            }
        });
        expect(count).toBe(1);
    });
});

describe("test headers plugin", function(){
    test("set header via object", function(){
        let count = 0;
        headerPlugin.parse({
            mockFile: "/x.json",
            response: {
                set: function(){ count++; }
            },
            data: {
                "#headers#": {
                    a: 3,
                    b: 4
                }
            }
        });
        expect(count).toBe(4);
    });
});
