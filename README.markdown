# Loch Down Your API
**Loch** offers a way to enforce your API at a level above your model,
and return sane, helpful errors at the same time. 

Specify what you expect to get from the users of your API, and tell
them off when they don't do it right. 

The primary functionality of this library is with the function
`validates`. You can find comprehensive documentation of the function
below.

There is more documentation to come on auxillary functions, as well as
more funtionality that is currently in the works. TBC.

### Documentation 

*This is a copy-paste of the docs included in the source; the source is
meant to be easy-to-read as well.*

`validation(validation, requestBody)`

Takes a validation object, `validation`, which is a map (which may be nested)
of keys to requirements, and a request body (a map of request parameters).

Returns `true` if the params meet the specification of `validation` otherwise
returns an object containing the parameters which caused errors.


#### Validation Maps

Requirements are tuples (arrays of length 2) of
[required::Boolean, validator::function]. An example `validation` map might
look like the follow.

```javascriptjson
{name: [true, atLeastOfLength(5)],
 age: false,
 parents: [false, { mother: false, father: false }]
 ssn: [false, function(o) { return containsNDigits(9); }]}
```javascript


#### Validators (validation functions)

A validation function takes in (val, key), and returns true if the value is
valid, else returns an error string (or false, for a default error message).

As an alternative to providing a validation function, you can say with true
or false whether the key is required (above with `age`, `mother`, `father`):

```javascriptjson
{ key: required::Boolean }
```javascript

In addition to providing validation function, the second element in the tuple
may be another `validation` map, to which the rules above will be applied
recursively (see `parents` key above).

If the validation map is empty, all parameters will be allowed within it.
If you have certain requirements inside of *that* map (i.e. properties MUST
include some key and value, and then may allow whatever others), use a
helper function or create your own function.

Instead of a validation function you may use an array of values with which
the value being validated  will be tested for inclusion within.
For example, if a value must be either 'true' or 'false', you could use:

```javascriptjson
{ key: [true, ["true", "false"]] }
```javascript

Which is functionally equivalent to:

```javascript
   {key: [true, function(o) { return _.contains(['true', 'false'], o)}]}
```javascript

#### Errors

The error object which is returned when validation fails will look like the
following:

```javascript
{errorKey: "error message", ...}
```javascript

For example:

```javascript
{name: "name is required",
 ssn: "ssn must have exactly 9 digits",
 parents: {sister: "sister is not a valid parameter."}}
```javascript

Or, if the value of parents had been a string instead of an object:

```javascript
{ parents: 'parents must be an object.'}
```javascript

As you can see, the 'ssn' error is very informative. That is because of the way
validation function are defined. Validation function must return true if the
value is valid, else it must return a function which takes a key (the key being
validated), and returns a string which will be used as the error message.

`false` may be used instead of a string, but then the default error message listed
for the param will be "{keyname} is not valid".

If a key is required and is not provided, the default error message is "{keyname} is
required".

If a value is supposed to be found in an array (using the array shortcut notation
above), the default error message is "{keyname} must be one of {*array}".

If there is a key in the `requestBody` that does not appear in the validation map,
it will result in default error message "{keyname} is not accepted".



### Tests
A test suite may be found in tests. It should be run with
[`vows`](http://vowsjs.org/)`--spec`.

### Contributing
Contributions are much appreciated. Please issue a pull request with a
description of your addition, along with rational behind it, and
ideally some tests. Please make sure the tests pass. No breaking
lochs, please.

