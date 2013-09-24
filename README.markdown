# Loch Down Your API

**Loch offers a way to enforce your API** at a level above your model,
and return sane, helpful errors at the same time. The functions included
operate on JSON objects, validating and sanitizing them for use for and
by your API users.

Specify, using data what you expect to get from the users of your API,
and tell them off when they don't do it right.


#### Sample Usage

For example, you might require the user to give a name with the
current request, but they can choose whether or not to give an age:

```javascript
{ name: true, age: false }
```

Or you might require that they give a username with at least 5 chars,
as well as a sex which may be either male, female, or other.

```javascript
{ username: [true,
             function(val, key) {
                   if (val.length > 4) return true;
                   else return key + " must be >= 5";
                 }
             ],
  sex: [true, ['male', 'female', 'other']] }
```

Then validate the request parameters (a JSON object) like so:

```javascript
validates(validation, params)
```

Which returns `true` if the request is valid, or else returns a map of
keys and errors if the request is not valid.

You can find extensive documentation in DOCUMENTATION.markdown. There
is more documentation to come on auxillary functions.


### Tests

A test suite may be found in tests. It should be run with
[vows](http://vowsjs.org/). (I use `vows --spec`, because it's helpful).

Tests are also a good source of example usage.


### Contributing

Contributions are much appreciated. Please issue a pull request with a
description of your addition, along with rational behind it, and
ideally some tests. Please make sure the tests pass. Also, you may want
to run jshint on the code.


### Dependences

**loch** uses [underscore](http://underscorejs.org/). Underscore is lovely.
