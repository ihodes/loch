var vows   = require('vows'),
    assert = require('assert'),
    should = require('should'),
    loch   = require('../loch'),
    _      = require('underscore');

var validates = loch.validates;


vows.describe('Validating a valid request').addBatch({
    'when req = val = {}': {
        topic: function() {
            var validation = {};
            var requestBody = {};

            return validates(validation, requestBody);
        },

        'it validates (returns true)': function(topic) {
            topic.should.be.true;
        }
    },
    'when the request must include keys with certain values, and does': {
        topic: function() {
            var validation = {requiredKey: [true, ['a', 'b']]};
            var requestBody = {requiredKey: 'b'};

            return validates(validation, requestBody);
        },

        'the request validates (returns true)': function(topic) {
            topic.should.be.true;
        }
    },
    'when the validator has multiple validation functions for a single key': {
        topic: function() {
            var validation = {requiredKey: [true, loch.isScalar, function(v, k) { return v === 'b'; } ]};
            var requestBody = {requiredKey: 'b'};

            return validates(validation, requestBody);
        },

        'the request validates (returns true)': function(topic) {
            topic.should.be.true;
        }
    },
    'when the request included all required keys, but not all possible keys': {
        topic: function() {
            var validation = {requiredKey: true, maybeKey: false};
            var requestBody = {requiredKey: 'applePie'};

            return validates(validation, requestBody);
        },

        'the request validates (returns true)': function(topic) {
            topic.should.be.true;
        }
    },
    'when the request included all required keys, but not all possible keys, and the validation is complex as all hell': {
        topic: function() {
            var validation = {requiredKey: true,
                              meh: false,
                              notRequired: [false, function(){return false;}],
                              subValidation: [true, {requiredKey: true,
                                                     anotherReq: [true,
                                                                  function(val, key){
                                                                      if(val == 'apple')
                                                                          return true;
                                                                      else
                                                                          return key + " is not tasty";
                                                                  }]}],
                              specificString: [true, ['true', 'false', 'maybe']]};
            var requestBody = {requiredKey: 'applePie', meh: 'overachiever',
                               subValidation: {requiredKey: 'present',
                                               anotherReq: 'apple'},
                               specificString: 'true'};

            return validates(validation, requestBody);
        },

        'the request validates (returns true)': function(topic) {
            topic.should.be.true;
        }
    },
    'when the request includes an array of subvalidations': {
        topic: function() {
            var validation = {messages: [true, [{name: true, text: true}]],
                              lols: [true, [{funny: true}]],
                              parents: [false, [{name: true,
                                                 type: [true, ['mother', 'father']]}]],
                              colors: [true, loch.isAllOfArray(['blue','red'])]};
            var requestBody = {messages: [{name: 'yo', text: 'hello all'},
                                          {name: 'hey', text: 'hey, people'}],
                               lols:     [{funny: true}, {funny: false}],
                               parents: [{name: "Daddy", type: 'father'}],
                               colors: ['blue', 'red', 'red']};

            return validates(validation, requestBody);
        },

        'the request validates (returns true)': function(topic) {
            topic.should.be.true;
        }
    }
}).export(module);


vows.describe("Validating an invalid request").addBatch({
    'when req does not have a required key': {
        topic: function() {
            var validation = { requiredKey: true };
            var requestBody = {};

            return validates(validation, requestBody);
        },

        'we get a MISSING error': function(topic) {
            should.exist(topic);
            topic.should.be.a('object').and.have.property('requiredKey');
            topic.should.eql({requiredKey: loch.MISSING('requiredKey')});
        }
    },
    'when req has an extranious key in it': {
        topic: function() {
            var validation = {};
            var requestBody = {badKey: "monkey"};

            return validates(validation, requestBody);
        },

        'we get an EXTRA error': function(topic) {
            should.exist(topic);
            topic.should.be.a('object').and.have.property('badKey');
            topic.should.eql({badKey: loch.EXTRA('badKey')});
        }
    },
    'when the validator has multiple validation functions for a single key, but that val doesn\'t pass': {
        topic: function() {
            var validation = {badKey: [true, function(v, k) { if (v !== 'b') return k + " is not b"; else return true; },
                                            loch.isScalar ]};
            var requestBody = {badKey: [1,2,3]};

            return validates(validation, requestBody);
        },

        'the request errors with the first error': function(topic) {
            should.exist(topic);
            topic.should.be.a('object').and.have.property('badKey');
            topic.should.eql({badKey: 'badKey is not b'});
        }
    },
    'when the request must include keys with certain values, and does not': {
        topic: function() {
            var validation = {requiredKey: [true, ['a', 'b']]};
            var requestBody = {requiredKey: 'c'};

            return validates(validation, requestBody);
        },

        'we get a CONTAIN error': function(topic) {
            should.exist(topic);
            topic.should.be.a('object').and.have.property('requiredKey');
            topic.should.eql({requiredKey: loch.CONTAIN('requiredKey', ['a','b'])});
        }
    },
    'when the a request value must be on object but is not': {
        topic: function() {
            var validation = {objectKey: [true, {}]};
            var requestBody = {objectKey: 'skree'};

            return validates(validation, requestBody);
        },

        'we get an OBJECT error': function(topic) {
            should.exist(topic);
            topic.should.be.a('object').and.have.property('objectKey');
            topic.should.eql({ objectKey: loch.OBJECT('objectKey') });
        }
    },
    'when the request value is not valid (but provides no error)': {
        topic: function() {
            var validation = {badKey: [true, function() { return false; }]};
            var requestBody = {badKey: 'skree'};

            return validates(validation, requestBody);
        },

        'we get a DEFAULT error': function(topic) {
            should.exist(topic);
            topic.should.be.a('object').and.have.property('badKey');
            topic.should.eql({ badKey: loch.DEFAULT('badKey') });
        }
    },
    'when the request value is not valid (and returns error)': {
        topic: function() {
            var validation = {badKey: [true, function(val,key) { return key + " is not okay since it's " + val; }]};
            var requestBody = {badKey: 'skree'};

            return validates(validation, requestBody);
        },

        'we get a custom error': function(topic) {
            should.exist(topic);
            topic.should.be.a('object').and.have.property('badKey');
            topic.should.eql({ badKey:  "badKey is not okay since it's skree"});
        }
    },
    'when the request included all required keys, but a key in a subValidation map does not validate': {
        topic: function() {
            var validation = {requiredKey: true,
                              meh: false,
                              notRequired: [false, function(){return false;}],
                              subValidation: [true, {requiredKey: true,
                                                     anotherReq: [true, function(v,k){
                                                        if(v == 'apple')
                                                            return true;
                                                        else
                                                            return k + " isn't tasty";
                                                     }]}
                                             ],
                              specificString: [true, ['true', 'false', 'maybe']]};
            var requestBody = {requiredKey: 'applePie', meh: 'overachiever',
                               subValidation: {requiredKey: 'present',
                                               anotherReq: 'toad'},
                               specificString: 'true'};

            return validates(validation, requestBody);
        },

        'the request returns a custom error (from validation function)': function(topic) {
            should.exist(topic);
            topic.should.be.a('object').and.have.property('subValidation');
            topic.should.eql({ subValidation:
                               { anotherReq:  "anotherReq isn't tasty" }
                             });
        }
    },
    'when the request includes an array of subvalidations, but the request is invalid': {
        topic: function() {
            var validation = {parents: [false, [{name: true,
                                                 type: [true, ['mother', 'father']]}]]};
            var requestBody = { parents: [{name: "Daddy", type: 'unknownOops'},
                                          {name: "Mommy", type: 'mother'}] };

            return validates(validation, requestBody);
        },

        'the request is not valid': function(topic) {
            should.exist(topic);
            topic.should.be.a('object').and.have.property('parents');
            topic.should.eql({parents: {type: "type must be one of mother,father"}});
        }
    }
}).export(module);


vows.describe('Auxiliary function').addBatch({
    'when the validator-created validation function fails': {
        topic: function() {
            var vfn = loch.validator("{{key}} is not dumb", _.isString)
            return vfn(1, 'applePie');
        },

        'the error should have the right information in it': function(topic) {
            should.exist(topic);
            topic.should.be.a('string');
            topic.should.eql("applePie is not dumb");
        }
    },
    'when the validator-created validation function passed': {
        topic: function() {
            var vfn = loch.validator("{{key}} is not dumb", _.isString)
            return vfn('delicious', 'applePie');
        },

        'it should return true': function(topic) {
            topic.should.be.true;
        }
    }
}).export(module);
