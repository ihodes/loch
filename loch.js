/*jslint node: true */
(function() {
// By Isaac Hodes (isaachodes@gmail.com)
// 2013 MIT License
"use strict";

var _ = require('underscore');


  ////////////////////////////
 //       Validation       //
////////////////////////////
// `validation(validation, requestBody)`

// Takes a validation object, `validation`, which is a map (which may be nested)
// of keys to requirements, and a request body (a map of request parameters).

// `requestBody` must be in the form of nested (or not) objects. Arrays are not
// expected or handled (this is meant for use with HTTP-based APIs, for now).

// Returns `true` if the params meet the specification of `validation` otherwise
// returns an object containing the parameters which caused errors.


// #### Validation Maps

// Requirements are tuples (arrays of length 2) of
// [required::Boolean, validator::function]. An example `validation` map might
// look like the follow.

// ```javascript
// { name: [true, atLeastOfLength(5)],
//   age: false,
//   parents: [false, { mother: false, father: false }]
//   ssn: [false, function(o) { return containsNDigits(9); }]}
// ```


// #### Validators (validation functions)

// A validation function takes in (val, key), and returns true if the value is
// valid, else returns an error string (or false, for a default error message).

// As an alternative to providing a validation function, you can say with true
// or false whether the key is required (above with `age`, `mother`, `father`):

// ```
// { key: required::Boolean }
// ```

// In addition to providing validation function, the second element in the tuple
// may be another `validation` map, to which the rules above will be applied
// recursively (see `parents` key above).

// If the validation map is empty, all parameters will be allowed within it.
// If you have certain requirements inside of *that* map (i.e. properties MUST
// include some key and value, and then may allow whatever others), use a
// helper function or create your own function.

// Instead of a validation function you may use an array of values with which
// the value being validated  will be tested for inclusion within.
// For example, if a value must be either 'true' or 'false', you could use:

// ```javascript
// { key: [true, ["true", "false"]] }
// ```

// Which is functionally equivalent to:

// ```javascript
// { key: [true, function(o) { return _.contains(['true', 'false'], o)}] }
// ```

// However, if the array is instead of an (single) object, `validates` will
// expect the request to include an array of objects, and will validate them
// against that object.

// To validate an array of scalars (that is, not an array of objects), you
// might simply provide a custom validation function like so:

// ```javascript
// { someVals: [true, function(arr) {
//                      if(!_.isArray(arr)) return false;
//                      return _.every(arr, isScalar); }]}
// ```

// This is a common usage pattern, so we've provided a helper validation
// function `isArrayOfScalar` that does just this (but also returns an useful
// error message). You may also use `isAllOfArray`, which is a higher-order
// validator in that it takes an array of `allowed` values, and returns a
// validation function which only accepts an array with values which are in
// `allowed`.

// #### Errors

// The error object which is returned when validation fails will look like the
// following:

// ```javascript
// { errorKey: "error message", ... }
// ```

// For example:

// ```javascript
// { name: "name is required",
//   ssn: "ssn must have exactly 9 digits",
//   parents: { sister: "sister is not a valid parameter" } }
// ```

// Or, if the value of parents had been a string instead of an object:

// ```javascript
// { parents: "parents must be an object" }
// ```

// As you can see, the 'ssn' error is very informative. That is because of the way
// validation function are defined. Validation function must return true if the
// value is valid, else it must return a function which takes a key (the key being
// validated), and returns a string which will be used as the error message.

// `false` may be used instead of a string, but then the default error message listed
// for the param will be "{keyname} is not valid".

// If a key is required and is not provided, the default error message is "{keyname} is
// required".

// If a value is supposed to be found in an array (using the array shortcut notation
// above), the default error message is "{keyname} must be one of {*array}".

// If there is a key in the `requestBody` that does not appear in the validation map,
// it will result in default error message "{keyname} is not accepted".
var validates = function(validation, requestBody) {
    // As we'll be removing permitted keys below to later allow
    // us to detect extraneous keys.
    requestBody = deepCloneJSON(requestBody);
    var errorMaker2000 = function(errors, valid, key) {
        var required;
        if (valid.length === 2) {
            required = valid[0];
            valid = valid[1];
        } else {
            required = valid;
            valid = isScalar;
        }
        if(!_.isBoolean(required)) throw new Error("required must be a boolean");

        // Handle absent keys...
        if (!required && !_.has(requestBody, key))
            return errors;
        else if (required && !_.has(requestBody, key))
            return _.extend(errors, o(key, MISSING(key)));

        var requestVal = requestBody[key];
        delete requestBody[key];

        // Assuming henceforth that the key exists in `requestBody`...
        if (_.isArray(valid)) {
            if(_.isObject(valid[0])) { // need to validate the array of objects
                var subErrs = true;
                for (var idx in requestVal) {
                    subErrs = validates(valid[0], requestVal[idx]);
                    if (_.isObject(subErrs)) break; // short-circuit validation
                }
                if (subErrs === true) return errors;
                else return _.extend(errors, o(key, subErrs));
            }
            else { // then we're testing for containment
                var allowed = valid;
                if (oneOfer(allowed)(requestVal) === true) return errors;
                else return _.extend(errors, o(key, CONTAIN(key, allowed)));
            }
        }
        else if (_.isFunction(valid)) {
            var valResponse = valid(requestVal, key);
            if (valResponse === true)
                return errors;
            else if (valResponse === false)
                return _.extend(errors, o(key, DEFAULT(key)));
            else
                return _.extend(errors, o(key, valResponse));
        }
        else if (_.isObject(valid)) {
            if (!_.isObject(requestVal))
                return _.extend(errors, o(key, OBJECT(key)));
            if (_.isEmpty(valid))
                return errors;

            var recurseErrors = validates(valid, requestVal);
            if (_.isEmpty(recurseErrors)) return errors;
            else return _.extend(errors, o(key, recurseErrors));
        }
    };
    var extraniousKeyFinder = function(errors, val, key) {
        return _.extend(errors, o(key, EXTRA(key)));
    };

    var errors = {};

    _.reduce(validation, errorMaker2000, errors);
    _.reduce(requestBody, extraniousKeyFinder, errors);

    if (_.isEmpty(errors)) return true;
    else return errors;
};
exports.validates = validates;

// Built-in error messages (used above)
var MISSING = function(key) { return key + ' is required'; };
var EXTRA   = function(key) { return key + ' is not accepted'; };
var CONTAIN = function(key, vals) { return key + ' must be one of ' + vals; };
var OBJECT  = function(key) { return key + ' must be an object'; };
var DEFAULT = function(key) { return key + ' is not valid'; };
_.extend(exports, {MISSING: MISSING, CONTAIN: CONTAIN,
                   OBJECT: OBJECT, DEFAULT: DEFAULT, EXTRA: EXTRA});


  /////////////////////////
 // Validator functions //
/////////////////////////

var isScalar = function(o, key) {
    if (!(_.isObject(o) || _.isArray(o) || _.isArguments(o)))
        return true;
    return key + " must be a scalar";
};
exports.isScalar = isScalar;


var TIME_REGEX = /^(0?\d|1\d|2[0123]):[012345]\d$/;
var isTime = function(str, key) {
    if (TIME_REGEX.test(str))
        return true;
    return key + " must be a valid time";
};
exports.isTime = isTime;


var oneOfer = function(list) {
    if(arguments.length > 1) list = _.toArray(arguments);
    return function(el, key) {
        if (_.contains(list, el))
            return true;
        return key + " must be one of " + list;
    };
};
exports.oneOfer = oneOfer;


var isArrayOfScalars = function(arr, key) {
    var errMsg = key + " must be an array of scalars";
    if(!_.isArray(arr)) return errMsg;
    if (_.every(arr, isScalar))
        return true;
    else
        return errMsg;
};
exports.isArrayOfScalars = isArrayOfScalars;


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
exports.isAllOfArray = isAllOfArray;



  ///////////////////////////
 // Response Whitelisting //
///////////////////////////

// # Allower
//
// Returns a function which returns a recursively "cleaned" resource object;
// only allowing through parameters which are on the whitelist.
//
// `allowed` is an object mapping allowed keys to either null (for "allow")
// or subdocuments which need to be cleaned as well, or to functions which are
// applied to the (value, key) to be returned and return an object to be merged
// into the final object.
//
var allower = function(allowed) {
    return function(object) {
        var grabber = function(acc, val, key) {
            if (!_.has(allowed, key))
                return acc;
            if (_.isObject(allowed[key]) && !_.isFunction(allowed[key]))
                return _.extend(acc, o(key, allower(allowed[key])(val)));

            if (_.isNull(allowed[key])) return _.extend(acc, o(key, val));

            return _.extend(acc, allowed[key](val, key));
        };
        return _.reduce(object, grabber, {});
    };
};
exports.allower = allower;


  ///////////////
 // Utilities //
///////////////

// Run-of-the-mill complement function
var complement = function(fn) {
    return function() {
        return !fn.apply(null, _.toArray(arguments));
    };
};
exports.complement = complement;

// Recursively clones a valid JavaScript representation of a JSON object
// and returns the clone.
var deepCloneJSON = function(base) {
    return JSON.parse(JSON.stringify(base)); // trololol.
};
exports.deepCloneJSON = deepCloneJSON;

// Things which I like to have around
var object = function(k,v) { return _.object([k], [v]); };
var existy = function(v) { return (v !== undefined) && (v !== null); };
var falsey = function(v) { return !existy(v) || (v === false); };
var truthy = function(v) { return !falsey(v); };
var o = object;
_.extend(exports, {object: object, existy: existy, falsey: falsey, truthy: truthy});
}());
