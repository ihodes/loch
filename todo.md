1) provide a function to require some keys, but allow any additional keys freely (should be a validation fn for use in validates)
   
    e.g.
   
    requires({a: true, b: [false, isString]}) // allows {a: 123, b: "asd", anotherOne: 222}
    
    
