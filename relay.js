/*jshint es5:true */

var ngr = ngr || {};

(function () {

var WatchedBox = {
        addProperty: function (name) {
            Object.defineProperty(this, name, {
                get: function () {
                    return this['_' + name];
                },
                set: function (value) {
                    if (this._watchers && this._watchers[name]) {
                        this._watchers[name].forEach(function (watcher) {
                            watcher(value, this['_' + name]);
                        }.bind(this));
                    }
                    this['_' + name] = value;
                }
            });
        },
        watch: function (name, watcher) {
            this._watchers = this._watchers || {};
            this._watchers[name] = this._watchers[name] || [];
            this._watchers[name].push(watcher);
        }
    };

    ngr.define = function (name, mapping, deps, flags) {
        var self = this;
        self._ngr_changeSource = self._ngr_changeSource || Object.create(WatchedBox);
        self._ngr_values = self._ngr_values || {};
        self._ngr_visited = self._ngr_visited || {};
        self._ngr_assigner = self._ngr_assigner || {};

        self._ngr_changeSource.addProperty(name);

        var initialValue = self[name];
        Object.defineProperty(self, name, {
            get: function () {
                var source = self._ngr_changeSource[name];
                source && source(self._ngr_assigner);
                return self._ngr_values[name];
            },
            set: function (value) {
                if (mapping && !mapping.inverse) {
                    throw 'Do not change read only property';
                }
                self._ngr_visited = {};
                self._ngr_visited[name] = 1;
                self._ngr_changeSource[name] = function (s) { s[name] = value; };
            }
        });

        Object.defineProperty(self._ngr_assigner, name, {
            get: function () {
                return self[name];
            },
            set: function (value) {
                self._ngr_changeSource[name] = null;
                self._ngr_values[name] = value;
            }
        });
        if (initialValue) {
            self[name] = initialValue;
            return;
        }
        self._ngr_changeSource[name] = mapping.relation;

        var depsChange = function (dep, newvalue, oldvalue) {
            if (newvalue === oldvalue) return;
            if (!(name in self._ngr_visited)) {
                console.log(dep, '--dep-->', name);
                self._ngr_visited[name] = 3;
                self._ngr_changeSource[name] = mapping.relation;
            }
        };
        var selfChange = function (newvalue, oldvalue) {
            if (newvalue === oldvalue) return;
            // If update from one dependent, do not propagate change to other dependents
            if (self._ngr_visited[name] === 3) return;
            if (mapping.inverse) {
                deps.forEach(function (dep) {
                    if (!(dep in self._ngr_visited)) {
                        console.log(name, '--self-->', dep);
                        self._ngr_visited[dep] = 2;
                        self._ngr_changeSource[dep] = mapping.inverse;
                    }
                });
            }
        };

        deps.forEach(function (dep) {
            self._ngr_changeSource.watch(dep, depsChange.bind(this, dep));
        });

        self._ngr_changeSource.watch(name, selfChange);

    };

})();
