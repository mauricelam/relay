function match(target, pairs, def) {
    for (var key in pairs) {
        if (target === key) return pairs[key];
    }
    return def;
}

function RelayTestController ($scope) {
    window.s = $scope;
    angular.extend($scope, ngr);

    $scope.match = match;

    $scope.variables = [
        {
            name: 'a',
            value: 10,
            saved: true
        },
        {
            name: 'b',
            relation: 's.b = +s.a + 1',
            inverse: 's.a = +s.b - 1',
            deps: 'a',
            saved: true
        },
        {
            name: 'c',
            relation: 's.c = s.b * 2',
            inverse: 's.b = s.c / 2',
            deps: 'b',
            saved: true
        },
        {
            name: 'd',
            relation: 's.d = Math.pow(s.a, 2)',
            inverse: 's.a = Math.sqrt(s.d)',
            deps: 'a',
            saved: true
        },
        {
            name: 'sum',
            relation: 's.sum = s.a + s.d',
            deps: 'a,d',
            saved: true
        },
        {
            name: 'firstName', 
            value: 'Steve',
            saved: true
        },
        {
            name: 'lastName',
            value: 'Jobs',
            saved: true
        },
        {
            name: 'fullName',
            relation: 's.fullName = s.firstName + " " + s.lastName',
            inverse: 'var f = s.fullName.split(" "); s.firstName = f[0]; s.lastName = f[1]',
            deps: 'firstName, lastName',
            saved: true
        },
        {
            name: 'gender',
            value: 'male',
            saved: true
        },
        {
            name: 'prefix',
            relation: 's.prefix = match(s.gender, {"male": "Mr.", "female": "Ms."}, "Hey")',
            inverse: 's.gender = match(s.prefix, {"Mr.": "male", "Ms.": "female"}, "Invalid")',
            deps: 'gender',
            saved: true
        },
        {
            name: 'title',
            relation: 's.title = s.prefix + " " + s.fullName',
            inverse: 's.prefix = s.title.substr(0, 3); s.fullName = s.title.substr(4)',
            deps: 'prefix, fullName',
            saved: true
        }
    ];

    $scope.defineStr = function (variable) {
        if (variable.relation) {
            $scope.define(variable.name, {
                relation: new Function('s', variable.relation),
                inverse: variable.inverse && new Function('s', variable.inverse)
            }, variable.deps.split(',').map(function (d) { return d.trim(); }));
        } else {
            $scope.define(variable.name);
        }
    };

    // initialize
    for (var i in $scope.variables) {
        var v = $scope.variables[i];
        if (v.value) $scope[v.name] = v.value;
        $scope.defineStr($scope.variables[i]);
    }
    
    $scope.watchRelation('title', function(val) {
        console.log('title changed: ', val);
    });

    // $scope.a = 10;
    // $scope.define('a');

    // $scope.relate('b', Relations.add('a', 1)); // b = a + 1
    // $scope.relate('sub', Relations.subtract('a', 3)); // sub = a - 3
    // $scope.relate('c', Relations.multiply('b', 2)); // c = b * 2
}
