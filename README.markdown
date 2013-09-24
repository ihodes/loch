# Loch Down Your API
**Loch** offers a way to enforce your API at a level above your model,
and return sane, helpful errors at the same time.

Specify, using data what you expect to get from the users of your API,
and tell them off when they don't do it right.

#### Simple Usage

For example, you might require the user to give a name with the
current request, but they can choose whether or not to give an age:

```javascript
{ name: true, age: false }
```

Or you might require that they give a username with at least 5 chars,
as well as a sex which may be either male, female, or other.

```javascript
{ username: [true,
             function(val, key) { if (val.length > 4) return true;
                                  else return key + " must be >= 5"}],
  sex: [true, ['male', 'female', 'other']]}
```

Then validate the request parameters like so:

```javascript
validates(validationMap, requestParams)
```

Which returns `true` if the request is valid, or else returns a map of
keys and errors if the request is not valid.

There are many built-in validators, and anything that is not built in
can easily be added (as seen with the username validation above).

You can find extensive documentation below.

There is more documentation to come on auxillary functions, as well as
more funtionality that is currently in the works including
whitelisting response maps, and more flexible built-in validation
functions. TBC.

### Documentation

*This is a copy-paste of the docs included in the source; the source is
meant to be easy-to-read as well.*

`validation(validation, requestBody)`

Takes a validation object, `validation`, which is a map (which may be nested)
of keys to requirements, and a request body (a map of request parameters).

`requestBody` must be in the form of nested (or not) objects. Arrays are not
expected or handled (this is meant for use with HTTP-based APIs, for now).

Returns `true` if the params meet the specification of `validation` otherwise
returns an object containing the parameters which caused errors.


#### Validation Maps

Requirements are tuples (arrays of length 2) of
[required::Boolean, validator::function]. An example `validation` map might
look like the follow.

```javascript
{ name: [true, atLeastOfLength(5)],
  age: false,
  parents: [false, { mother: false, father: false }]
  ssn: [false, function(o) { return containsNDigits(9); }]}
```


#### Validators (validation functions)

A validation function takes in (val, key), and returns true if the value is
valid, else returns an error string (or false, for a default error message).

As an alternative to providing a validation function, you can say with true
or false whether the key is required (above with `age`, `mother`, `father`):

```
{ key: required::Boolean }
```

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

```javascript
{ key: [true, ["true", "false"]] }
```

Which is functionally equivalent to:

```javascript
{ key: [true, function(o) { return _.contains(['true', 'false'], o)}] }
```

However, if the array is instead of an (single) object, `validates` will
expect the request to include an array of objects, and will validate them
against that object.

To validate an array of scalars (that is, not an array of objects), you
might simply provide a custom validation function like so:

```javascript
{ someVals: [true, function(arr) {
                     if(!_.isArray(arr)) return false;
                     return _.every(arr, isScalar); }]}
```

This is a common usage pattern, so we've provided a helper validation
function `isArrayOfScalar` that does just this (but also returns an useful
error message). You may also use `isAllOfArray`, which is a higher-order
validator in that it takes an array of `allowed` values, and returns a
validation function which only accepts an array with values which are in
`allowed`.

#### Errors

The error object which is returned when validation fails will look like the
following:

```javascript
{ errorKey: "error message", ... }
```

For example:

```javascript
{ name: "name is required",
  ssn: "ssn must have exactly 9 digits",
  parents: { sister: "sister is not a valid parameter" } }
```

Or, if the value of parents had been a string instead of an object:

```javascript
{ parents: "parents must be an object" }
```

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
[vows](http://vowsjs.org/). (I use `vows --spec`, because it's helpful).

Tests are also a good source of example usage.

### Contributing
Contributions are much appreciated. Please issue a pull request with a
description of your addition, along with rational behind it, and
ideally some tests. Please make sure the tests pass. Also, you may want
to run readyjs (or, rather, jshint) on the code to check for semicolons
etc. I ignore some of the sillier output; so can you. But, no breaking
lochs, please.

### Deps
**loch** uses [underscore](http://underscorejs.org/). Underscore is lovely.
