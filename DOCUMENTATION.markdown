# Validates

`validates(validation, json)`

Validates that a given JSON object, `json`, conforms to the given `validation`
object.

Returns `true` if the params meet the specification of `validation` otherwise
returns an object with keys represending keys with errors and values strings
which are the reported errors.

## Validation Object

A validation object/map is a JavaScript object with keys representing named
values in `json` and values being validation tuples (or a boolean).

```
validationMap := { key: validationTuple | Boolean }
valdationTuple := [Boolean, validator, ...]
validator := Array<Scalar> | Function | [validationMap] | validationMap
```

If a validator is an Array of scalars
(e.g. ['blue', 'red', 'yellow']), `validates` will check that the value
of the corresponding key in `json` is contained in the array.

If a validator is a Function, `validates` will check that the function
applied to the value of the corresponding key in `json` returns
`true`.

You may have as many validation functions in that array. The first error
returned will be reported.

If a validator is an Array of an object, it will check that the value
of the corresponding key in `json` is an array and that all the object
in the array `validates`, with `validation` set to that object.

If a validator is an Object, `validates` will recursively apply to the
value of the corresponding key in `json` with `validation` set to that
object.

Note that any keys in `json` which are not specified in a validation
map will be considered in error and rejected with the **EXTRA** error
(see below). In order to deal with cases where you'd allow any extra
keys, use `expected` provided in this library, or a custom validation
function.

*If the value is a Boolean, it is exactly equivalent to using
a validation tuple of `[true, isScalar]`. This syntaxt is provided as
syntactic sugar to specify if a value is required or not, which is the
most common case.*

## Validators (validation functions)

A validation function is passed `val, key`, and is expected to return
true if the value validates, else it should return an error string (or
false, for the `DEFAULT` error message).

You can create validation functions with `validator`. Just pass it an 
error message (in which "{{key}}" will be replaced with the key being
validated), and the function with which to test the value. Should the
function, when applied to the value, return `true`, the error message
won't be returned (and `true` will); else the error message will be
returned.

For example: 

    isStringValFn = validator("{{key}} must be a String", _.isString)

## Errors

Errors returned by validates will be in the form of nested objects,
with keys representing the keys which did no validate, and values
strings which describe the error that occured. For example:

```javascript
{ name: "name is required", // the `name` key was not found in `json`
  sex: "sex must be one of male,female,other", // incorrect scalar
  otherObject: { someKey: "someKey must be beter" }} // custom validation
```

There are a number of errors built in to `validates`. They are:

**MISSING**: If a key is required and is not provided, the default
error message is "{keyname} is required".

**EXTRA**: If there is a key in `json` that does not appear in the
validation map, it will result in default error message
"{keyname} is not accepted".

**CONTAIN**:If a value is supposed to be found in an array (using the
array shortcut notation above), the default error message is
"{keyname} must be one of {*array}".

**OBJECT**: If there is an object expected in `json`, the default
  error message is "{keyname} must be an object".

**DEFAULT**: If a validation function returns `false` instead of an
  error string, the default error message is "{keyname} is not valid".

## Examples

If we're expecting a JSON object reprsenting a person's demographic
information, we might write the following `validation` map (assuming
the availability of the (underscore)[underscorejs.org] library.

```javascript
{ name: true,
  age: [true, function(v,k) {
                if (_.isNumber(v) && v > 0 && v < 150) return true;
                else return key + " must be a valid age";
              }],
  children: [true, [chidrenValidation]],
  sex: [true, ['male', 'female', 'other']]
}

var childrenValidation = {
  name: true,
  type: [true, ['son', 'daughter']],
  age: false
}
```

See the `test/` directory for more examples of what validates and what
does not.


# Allower

`allower(allowed)`

Returns a function which accepts `allowed`, a JSON object,  and return
a JSON object with only the `allowed` keys in it.

`allowed` may be nested, with keys representing allowed keys, and
values either being sub-object which are treated recursively or
`null`, which indicates that the key should be allowed, or a function
which is passed `val, key` and returned an object to be merged into
the final object to be returned.

## Example

```javascript
var allowed = { name: null, _id: function(val, key) { return { id: val }; } }
var o = { name: "Tim", _id: 1234, secret: "NEVER TELL"}

allower(allowed)(o)
 => { name: "Tim", id: 1234 }
```
