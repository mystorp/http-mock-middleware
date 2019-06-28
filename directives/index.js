/**
 * mock file can have spectial keys which know as directive
 * to archieve more functions
 *
 */
const directives = [
    require("./headers"),
    require("./if"),
    require("./delay"),
    require("./status-code"),
    require("./mock")
];
exports.parse = parseDirectives;

/**
 *
 * @param {context} context object, directive may
 * read values from it
 * @returns {Promise}
 */
function parseDirectives(context) {
    context.next = true;
    let value = Promise.resolve(context);
    for(let directive of directives) {
        value = value.then(v => v.next ? directive.parse(v) : v);
    }
    return value;
};
