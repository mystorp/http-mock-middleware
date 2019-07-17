const fs = require("fs");
const path = require("path");
const parseUrl = require("url").parse;
const json5 = require("json5");
const mime = require("mime");
const Promise = require("bluebird");

const SourceConverter = require("./base");

class HarSourceConverter extends SourceConverter {
    convert(file){
        let rootDirectory = this.options.rootDirectory;
        return Promise.promisify(fs.readFile)(file, "utf-8").then(text => {
            let data = json5.parse(text);
            return data.log.entries;
        }).then(entries => entries.map(entry => {
            let method = entry.request.method.toLowerCase();
            let pathname = parseUrl(entry.request.url).pathname;
            let dirname = path.dirname(pathname);
            let extname = /json/.test(entry.response.content.mimeType) ? ".json" : "";
            let filename = method + "-" + path.basename(pathname) + extname;
            let filepath = path.resolve(rootDirectory + dirname + path.sep + filename);
            let content = entry.response.content.text;
            if(entry.response.content.encoding) {
                content = Buffer.from(content, entry.response.content.encoding);
            }
            if(/\.json$/i.test(filepath)) {
                content = json5.parse(content);
                content["#code#"] = entry.response.status;
                content["#headers#"] = entry.response.headers;
                content["#cookies#"] = entry.response.cookies;
            }
            return {filepath, content};
        })).then(items => {
            return Promise.each(items, item => {
                return this.saveSourceItem(item);
            });
        });
    }
}

module.exports = HarSourceConverter;
