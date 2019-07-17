#!/usr/bin/env node

const argv = require("yargs").usage("http-mock-import [Options] <file1>[, <file2>, ...]").options({
    from: {
        alias: "f",
        demandOption: true,
        describe: "data format",
        choices: ["har"]
    },
    dir: {
        alias: "d",
        demandOption: true,
        describe: "directory where mock file will be saved"
    },
    dryRun: {
        alias: "t",
        boolean: true,
        describe: "process import, but do not write anything"
    }
}).argv;

processOptions();


function processOptions(){
    let Converter = require("../converters/" + argv.from);
    let options = {
        rootDirectory: argv.dir,
        dryRun: argv.dryRun
    };
    for(let file of argv._) {
        new Converter(options).convert(file).catch(e => {
            if(e.message !== "user cancel") {
                throw e;
            }
        });
    }
}