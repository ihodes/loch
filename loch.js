/*jslint node: true */
// By Isaac Hodes (isaachodes@gmail.com)
// 2013 MIT License

(function() {
"use strict";

var _ = require('underscore');

// See DOCUMENTATION.markdow for detailed documentation about exports

var validates = function(validation, json) {
    // We create a copy of the json object so that we can non-destructively
    // delete keys from it in order to track key presence:
    var params = deepCloneJSON(json);
    // This function will be reduced over the validation map.
    var errorMaker2000 = function(errors, valid, key) {
        var required;
        if (valid.length === 2) {
            required = valid[0];
            valid    = valid[1];
        } else if (valid.length > 2) {
            required = valid[0];
            valid    = juxt.apply(null, valid.slice(1));
        } else {
            required = valid;
            valid    = isScalar;
        }
        if(!_.isBoolean(required)) throw new Error("required must be a boolean");

        // Handle absent keys...
        if (!required && !_.has(params, key))
            return errors;
        else if (required && !_.has(params, key))
            return _.extend(errors, o(key, MISSING(key)));

        var paramVal = params[key];
        delete params[key];

        var subErrs;
        // Assuming henceforth that the key exists in `params`...
        if (_.isArray(valid)) {
            if(_.isObject(valid[0])) { // need to validate the array of objects
                subErrs = true;
                for (var idx in paramVal) {
                    subErrs = validates(valid[0], paramVal[idx]);
                    if (_.isObject(subErrs)) break; // short-circuit validation
                }
                if (subErrs === true) return errors;
                else return _.extend(errors, o(key, subErrs));
            }
            else { // then we're testing for containment
                var allowed = valid;
                if (oneOfer(allowed)(paramVal) === true) return errors;
                else return _.extend(errors, o(key, CONTAIN(key, allowed)));
            }
        }
        else if (_.isFunction(valid)) {
            var valResponse = valid(paramVal, key);
            if (_.isArray(valResponse)) { // then we were passed a list of validation functions, so we need to check for any errors from any of them
                subErrs = _.filter(valResponse, function(val) { return falsey(val) || _.isString(val); });
                if (_.isEmpty(subErrs)) return errors;
                else return _.extend(errors, o(key, _.first(subErrs)));
            } else if (valResponse === true) {
                return errors;
            } else if (valResponse === false) {
                return _.extend(errors, o(key, DEFAULT(key)));
            } else {
                return _.extend(errors, o(key, valResponse));
            }
        }
        else if (_.isObject(valid)) {
            if (!_.isObject(paramVal))
                return _.extend(errors, o(key, OBJECT(key)));
            if (_.isEmpty(valid))
                return errors;

            var recurseErrors = validates(valid, paramVal);
            if (_.isEmpty(recurseErrors)) return errors;
            else return _.extend(errors, o(key, recurseErrors));
        }
    };
    var extraniousKeyFinder = function(errors, val, key) {
        return _.extend(errors, o(key, EXTRA(key)));
    };

    var errors = {};

    _.reduce(validation, errorMaker2000, errors);
    _.reduce(params, extraniousKeyFinder, errors);

    if (_.isEmpty(errors)) return true;
    else return errors;
};

// Built-in error messages (used above)
var MISSING = function(key) { return key + ' is required'; };
var EXTRA   = function(key) { return key + ' is not accepted'; };
var CONTAIN = function(key, vals) { return key + ' must be one of ' + vals; };
var OBJECT  = function(key) { return key + ' must be an object'; };
var DEFAULT = function(key) { return key + ' is not valid'; };


var allower = function(allowed) {
    return function(object) {
        var grabber = function(acc, val, key) {
            if (!_.has(allowed, key))
                return acc;
            else if (_.isObject(allowed[key]) && !_.isFunction(allowed[key]))
                return _.extend(acc, o(key, allower(allowed[key])(val)));
            else if (_.isNull(allowed[key]))
                return _.extend(acc, o(key, val));
            else
                return _.extend(acc, allowed[key](val, key));
        };
        return _.reduce(object, grabber, {});
    };
};



  //////////////////////////////////
 // Built-in validator functions //
//////////////////////////////////

/// Creats a validator function from a fn which returns true/false.
// err is a string; if {{key}} is in the string, it will be replaced by the key
var validator = function(err, fn)  {
    return function(val, key) {
        if (truthy(fn(val))) return true;
        else return err.replace('{{key}}', key);
    };
};


var isScalar = validator("{{key}} must be a scalar", function(val) {
    return !_.some(juxt(_.isObject, _.isArray, _.isArguments)(val));
});


var TIME_REGEX = /^(0?\d|1\d|2[0123]):[012345]\d$/;
var isTime = validator("{{key}} must be a valid time", _.partial(invoke, TIME_REGEX, 'test'));


var oneOfer = function(list) {
    if(arguments.length > 1) list = _.toArray(arguments);
    return validator("{{key}} must be one of"+list, _.partial(_.contains, list));
};


var isArrayOfScalars = validator("{{key}} must be an array of scalars", function(val) {
    if (!_.isArray(arr)) return false;
    return _.every(arr, _.compose(function(v) { return v === true; }, isScalar));
});


var isAllOfArray = function(allowed) {
    return function(arr, key) {
        var errMsg = key + " may only be any of " + allowed;
        if(!_.isArray(arr)) return errMsg + ", and must be an array";
        if (_.every(arr, function(el) { return _.contains(allowed, el); }))
            return true;
        else
            return errMsg;
    };
};



  ///////////////////////
 // My Little Helpers //
///////////////////////

var complement = function(fn) {
    return function() { return !fn.apply(null, _.toArray(arguments)); };
};

var juxt = function(/* fns */) {
    var fns = _.toArray(arguments);
    return function(/* args */) {
        var args = _.toArray(arguments);
        return _.map(fns, function(fn) {
            return fn.apply(fn, args);
        });
    };
};

var drop = function(n, arr) { return arr.slice(n); };

var invoke = function(obj, methodname /* args */) {
    var args = drop(2, _.toArray(arguments));
    if (existy(obj[methodname])) return obj[methodname].apply(obj, args);
};

var deepCloneJSON = function(base) {
    return JSON.parse(JSON.stringify(base)); // trololol.
};

var object = function(k,v) { return _.object([k], [v]); };
var existy = function(v) { return (v !== undefined) && (v !== null); };
var falsey = function(v) { return !existy(v) || (v === false); };
var truthy = function(v) { return !falsey(v); };
var o = object;



  /////////////////
 //   Exports   //
/////////////////

exports.allower = allower;
exports.validates = validates;
exports.isScalar = isScalar;
exports.isTime = isTime;
exports.oneOfer = oneOfer;
exports.isArrayOfScalars = isArrayOfScalars;
exports.isAllOfArray = isAllOfArray;
_.extend(exports, {MISSING: MISSING, CONTAIN: CONTAIN,
                   OBJECT: OBJECT, DEFAULT: DEFAULT, EXTRA: EXTRA});


}()); // Module ends.
