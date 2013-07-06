function match(target, pairs, def) {
    for (var key in pairs) {
        if (target === key) return pairs[key];
    }
    return def;
}

function RelayTestController ($scope) {
    angular.extend($scope, ngr);
    $scope.a = 10;
    $scope.define('a');

    $scope.relate('b', Relations.add('a', 1)); // b = a + 1
    $scope.relate('sub', Relations.subtract('a', 3)); // sub = a - 3
    $scope.relate('c', Relations.multiply('b', 2)); // c = b * 2
    $scope.define('d', {
        relation: function (s) { s.d = Math.pow(+s.a, 2); },
        inverse: function (s) { s.a = Math.sqrt(+s.d); }
    }, ['a']);
    $scope.define('sum', {
        relation: function (s) { s.sum = +s.a + +s.d; }
    }, ['a', 'd']);
    $scope.define('obj', {
        relation: function (s) { s.obj = { a: +s.a, b: +s.b, c: +s.c, d: +s.d }; },
        inverse: function (s) {
            s.a = s.obj.a;
            s.b = s.obj.b;
            s.c = s.obj.c;
            s.d = s.obj.d;
        }
    }, ['a', 'b', 'c', 'd']);

    $scope.firstName = 'Steve';
    $scope.define('firstName');
    $scope.lastName = 'Jobs';
    $scope.define('lastName');

    $scope.define('fullName', {
        relation: function (s) { s.fullName = s.firstName + ' ' + s.lastName; },
        inverse: function (s) {
            var names = s.fullName.split(' ');
            s.firstName = names[0];
            s.lastName = names[1];
        }
    }, ['firstName', 'lastName']);

    $scope.gender = 'male';
    $scope.define('gender');

    $scope.define('prefix', {
        relation: function (s) {
            s.prefix = match(s.gender, {'male': 'Mr.', 'female': 'Ms.'}, '');
        },
        inverse: function (s) {
            s.gender = match(s.prefix, {'Mr.': 'male', 'Ms.': 'female'}, 'Invalid');
        }
    }, ['gender']);

    $scope.define('title', {
        relation: function (s) {
            s.title = s.prefix + ' ' + s.fullName;
        },
        inverse: function (s) {
            s.fullName = s.title.substr(4);
            s.prefix = s.title.substr(0, 3);
        }
    }, ['fullName', 'prefix']);

    $scope.define('validTitle', {
        relation: function (s) {
            s.validTitle = s.gender !== 'Invalid';
        }
    }, ['gender']);

    $scope.color = '#F00';

    window.s = $scope;
}
