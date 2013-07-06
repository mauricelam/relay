var ngr = ngr || {};

ngr.relate = function (name, relation) {
    this.define(name, relation[0](name), relation[1]);
};

var Relations = {
    $inverse: function (relation) {
        // Note: 1 dependency only
        return function (dep1, constant) {
            return [function (name) {
                var rel = relation(name, constant)[0](dep1);
                return {
                    relation: rel.inverse,
                    inverse: rel.relation
                };
            }, [dep1]];
        };
    }
};

Relations.add = function (dep1, constant) {
    return [function (name) {
        return {
            relation: function (s) { s[name] = +s[dep1] + +constant; },
            inverse: function (s) { s[dep1] = +s[name] - +constant; }
        };
    }, [dep1]];
};

Relations.subtract = Relations.$inverse(Relations.add);

Relations.multiply = function (dep1, constant) {
    return [function (name) {
        return {
            relation: function (s) { s[name] = +s[dep1] * +constant; },
            inverse: function (s) { s[dep1] = +s[name] / +constant; }
        };
    }, [dep1]];
};

Relations.divide = Relations.$inverse(Relations.multiply);
