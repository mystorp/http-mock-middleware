/// <reference path="../declarations/index.d.ts"/>
const fs = require("fs");
const path = require("path");
const Promise = require("bluebird");
const inquirer = require("inquirer");

const existsAsync = (file) => new Promise((res) => fs.exists(file, res));
const writeFileAsync = Promise.promisify(fs.writeFile);
const renameAsync = Promise.promisify(fs.rename);
const readdirAsync = Promise.promisify(fs.readdir);
const mkdirpAsync = Promise.promisify(require("mkdirp"));

class SourceConverter {
    constructor(options){
        /**
         * @type {SourceConverterOption}
         */
        this.options = Object.assign({
            saveAction: "none",
            dryRun: false,
            rootDirectory: null
        }, options || {});
    }
    convert(file){
        throw new Error("this method must be override!");
    }
    /**
     * @param {SourceItem} item
     * @returns {Promise}
     */
    saveSourceItem(item) {
        let action = this.options.saveAction;
        let userAction = this.userAction;
        if(userAction === "override-all") {
            return this.doOverride(item);
        } else if(userAction === "rename-all") {
            return this.doRename(item);
        } else if(userAction === "skip-all") {
            return this.doSkip(item);
        } else if(userAction === "cancel") {
            return this.doCancel();
        }
        return existsAsync(item.filepath).then(exists => {
            if(exists) {
                return this.readSaveAction(item).then(result => {
                    this.userAction = result.action;
                    return result.action;
                });
            } else {
                return "override";
            }
        }).then(action => {
            if(action === "override" || action === "override-all") {
                return this.doOverride(item);
            } else if(action === "rename" || action === "rename-all") {
                return this.doRename(item);
            } else if(action === "skip" || action === "skip-all") {
                return this.doSkip(item);
            } else if(action === "cancel") {
                return this.doCancel();
            }
        });
    }
    /**
     * @param {SourceItem} item
     * @returns {Promise}
     */
    readSaveAction(item){
        let rfile = path.relative(process.cwd(), item.filepath);
        return inquirer.prompt([{
            type: "list",
            name: "action",
            message: `file '${rfile}' already exists!`,
            default: "override",
            choices: [{
                name: "Override old file",
                value: "override"
            }, {
                name: "Always override old file",
                value: "override-all"
            }, {
                name: "Rename old file",
                value: "rename"
            }, {
                name: "Always rename old file",
                value: "rename-all"
            }, {
                name: "Skip",
                value: "skip"
            }, {
                name: "Always skip",
                value: "skip-all"
            }, {
                name: "Cancel",
                value: "cancel"
            }]
        }]);
    }
    /**
     * @param {SourceItem} item
     * @returns {Promise}
     */
    doOverride(item) {
        let {dryRun} = this.options;
        let {filepath, content} = item;
        let dirname = path.dirname(filepath);
        return existsAsync(dirname).then(exists => {
            if(!exists) {
                if(dryRun) {
                    console.log("mkdir -p", dirname);
                }
                return mkdirpAsync(dirname);
            }
        }).then(() => {
            if(dryRun) {
                console.log("write file:", filepath);
                return;
            }
            return writeFileAsync(filepath, content);
        });
    }
    /**
     * @param {SourceItem} item
     * @returns {Promise}
     */
    doRename(item){
        let dirname = path.dirname(item.filepath);
        let filename = path.basename(item.filepath);
        return readdirAsync(dirname).then(names => {
            let newName = filename + ".bak";
            let c = 1;
            while(!names.includes(newName)) {
                newName = filename + ".bak." + c;
            }
            return path.resolve(dirname, newName);
        }).then(newPath => {
            console.log(`rename old ${item.filepath} to ${newPath}`);
            if(this.options.dryRun) {
                return;
            }
            return renameAsync(item.filepath, newPath);
        }).then(() => {
            this.doOverride(item);
        });
    }
    /**
     * @param {SourceItem} item
     * @returns {Promise}
     */
    doSkip(item){}
    /**
     * @param {SourceItem} item
     * @returns {Promise}
     */
    doCancel(item){
        throw new Error("user cancel");
    }
}

module.exports = SourceConverter;
