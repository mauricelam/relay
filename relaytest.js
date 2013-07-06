function RelayTestController ($scope) {
    angular.extend($scope, ngr);
    $scope.a = 10;
    $scope.define('a');

    $scope.define('b', {
        relation: function (s) { s.b = +s.a + 1; },
        inverse: function (s) { s.a = +s.b - 1; }
    }, ['a']);
    $scope.define('c', {
        relation: function (s) { s.c = +s.b * 2; },
        inverse: function (s) { s.b = +s.c / 2; }
    }, ['b']);
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
    }, ['a', 'b', 'c', 'd'], 'm');

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
    }, ['firstName', 'lastName'], 'm');

    $scope.gender = 'male';
    $scope.define('gender');

    $scope.define('prefix', {
        relation: function (s) { s.prefix = s.gender === 'male' ? 'Mr. ' : 'Ms. '; },
        inverse: function (s) { s.gender = s.prefix === 'Mr. ' ? 'male' : 'female'; }
    }, ['gender']);

    $scope.define('title', {
        relation: function (s) {
            s.title = s.prefix + s.fullName;
        },
        inverse: function (s) { s.fullName = s.title.substr(4); }
    }, ['fullName', 'prefix'], 'm');

    $scope.define('validTitle', {
        relation: function (s) {
            s.validTitle = s.title.indexOf(s.prefix) === 0;
        }
    }, ['title', 'prefix']);


    window.s = $scope;
    setInterval(function () {
        $scope.$apply();
    }, 100);
}

// var r = Relay.create();
//     r.define('a');
//     r.a = 10;
//     r.define('b', {
//         relation: function (r) { r.b = r.a + 1; },
//         inverse: function (r) { r.a = r.b - 1; }
//     }, ['a']);
//     r.define('d', {
//         relation: function (r) { r.d = Math.pow(r.a, 2); },
//         inverse: function (r) { r.a = Math.sqrt(r.d); }
//     }, ['a']);
//     r.define('c', {
//         relation: function (r) { r.c = r.b * 2; },
//         inverse: function (r) { r.b = r.c / 2; }
//     }, ['b']);

//     r.define('sum', {
//         relation: function (r) { r.sum = r.a + r.d; }
//     }, ['a', 'd']);

//     r.define('obj', {
//         relation: function (r) { r.obj = { a: r.a, b: r.b, c: r.c, d: r.d }; },
//         inverse: function (r) {
//             r.a = r.obj.a;
//             r.b = r.obj.b;
//             r.c = r.obj.c;
//             r.d = r.obj.d;
//         }
//     }, ['a', 'b', 'c', 'd']);