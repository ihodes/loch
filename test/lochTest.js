var vows   = require('vows'),
    assert = require('assert'),
    should = require('should'),
    loch   = require('../loch');

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
                                                    anotherReq: function(val, key){
                                                        if(val == 'apple')
                                                            return true;
                                                        else
                                                            return key + " is not tasty";
                                                    }}],
                              specificString: [true, ['true', 'false', 'maybe']]}
            var requestBody = {requiredKey: 'applePie', meh: 'overachiever',
                               subValidation: {requiredKey: 'present',
                                               anotherReq: 'apple'},
                               specificString: 'true'};

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
                              specificString: [true, ['true', 'false', 'maybe']]}
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
    }
}).export(module);
