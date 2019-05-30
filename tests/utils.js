const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp");

exports.mockFile = function mockFile(prefix, file, content) {
    if(prefix && file.indexOf(prefix) !== 0) {
        file = prefix + file;
    }
    mkdirp.sync(path.dirname(file));
    fs.writeFileSync(file, content);
    return path.resolve(file);
}