const fs = require("fs");
const path = require("path");
const escapeStringRegexp = require('escape-string-regexp');
const Promise = require("bluebird");
const json5 = require("json5");
const MagicNameMatcher = require("./MagicNameMatcher");
const parseDirectives = require("./directives").parse;

const readdirAsync = Promise.promisify(fs.readdir);
const statAsync = Promise.promisify(fs.stat);
const readFileAsync = Promise.promisify(fs.readFile);

class MockFileFinder {
    /**
     * @param {string} method
     * @param {string} url 
     * @param {string} rootDirectory
     * @returns {Promise<string|null>} 返回根据 url 找到的文件列表
     */
    find(method, url, rootDirectory){
        let filename = path.basename(url);
        let dirname = path.dirname(url);
        let dir = rootDirectory;
        let dirnames = dirname === "/" ? [] : dirname.substring(1).split("/");
        method = method.toLowerCase();
        // 逐级目录匹配
        return Promise.each(dirnames, (name) => {
            return this._matchDirectory(dir, name).then(ndir => (dir = ndir));
        }).then(() => readdirAsync(dir)).filter(function(name){
            let file = dir + path.sep + name;
            // 仅仅选择 dir 下面文件列表
            return statAsync(file).then(s => s.isFile()).catch(() => false);
        }, {concurrency: 20}).then((files) => {
            let file = this._matchFile(filename, method, files);
            if(file) {
                return path.resolve(dir, file);
            } else {
                throw new Error("can't find mock file");
            }
        });
    }
    /**
     * 在指定的文件列表里面查找名称为 [method-]filename[.ext] 格式的文件
     * 如果找不到，使用模糊名称重新查找一次
     * @param {string} filename 文件名
     * @param {string} method http 请求方法
     * @param {Array<string>} files 文件列表
     */
    _matchFile(filename, method, files){
        let filenameRegExp = new RegExp(`^(?:${method}-)?${escapeStringRegexp(filename)}(?:\..*)?$`);
        let matchedFiles = files.filter(name => filenameRegExp.test(name));
        if(matchedFiles.length === 0) {
            let magicName = MagicNameMatcher.match(filename);
            if(magicName !== filename) {
                filenameRegExp = new RegExp(`^(?:${method}-)?${escapeStringRegexp(magicName)}(?:\..*)?$`);
                matchedFiles = files.filter(name => filenameRegExp.test(name));
            }
        }
        if(method) {
            return matchedFiles.filter(name => name.indexOf(method) === 0)[0] || matchedFiles[0];
        } else {
            return matchedFiles[0];
        }
    }
    /**
     * 检查 `${pdir}/${name}` 是否是目录，如果不是，尝试对 name 做模糊替换后再检查
     * @param {string} pdir 父目录
     * @param {string} name 子目录名字
     */
    _matchDirectory(pdir, name) {
        let cdir = pdir + path.sep + name;
        return statAsync(cdir).then(s => {
            if(s.isDirectory()) {
                return cdir;
            } else {
                throw new Error(`directory ${cdir} not exists!`);
            }
        }).catch((e) => {
            let magicName = MagicNameMatcher.match(name)
            if(magicName === name) {
                throw e;
            }
            let mcdir = pdir + path.sep + magicName;
            return statAsync(mcdir).then(s => {
                if(s.isDirectory()) {
                    return mcdir;
                } else {
                    throw new Error(`directory ${mcdir} not exists!`);
                }
            });
        });
    }
    mock(file, context) {
        if(!context) {
            context = {};
        }
        context.mockFile = file;
        return readFileAsync(file).then((buf) => {
            if(/\.json5?(\.[a-z0-9]+)?/i.test(file)) {
                return json5.parse(buf.toString());
            } else {
                return buf;
            }
        }).then(data => {
            context.data = data;
            return Buffer.isBuffer(data) ? context : parseDirectives(context);
        });
    }
    findAndMock(method, url, directory, context) {
        return this.find(method, url, directory).then((file) => {
            return this.mock(file, context);
        }, function(e){
            let response = context.response;
            if(response) {
                response.status(404);
            }
            return Promise.reject(e);
        });
    }
}

module.exports = new MockFileFinder();
