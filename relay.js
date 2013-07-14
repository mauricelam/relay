/*jshint es5:true */

var ngr = ngr || {};

(function () {

  /**
   * WatchedBox lets you add observers to particular properties inside the watch box. addProperty
   * must be first called to initialize the variables. Also note that this workes by using setters,
   * so changes inside mutable objects will not fire the observers.
   */
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
        },
        configurable: true,
        enumerable: true
      });
    },
    watch: function (name, watcher) {
      this._watchers = this._watchers || {};
      this._watchers[name] = this._watchers[name] || [];
      this._watchers[name].push(watcher);
    }
  };

  /**
   * RBox is a data storage for the variable's metadata.
   */
  var rboxes = {};

  function RBox() {
    this.changeSource = Object.create(WatchedBox);
    this.values = {};
    this.visited = {};
    this.assigner = {};
    this.readonly = {};
    return this;
  }

  RBox.get = function(id) {
    if (!rboxes[id])
      rboxes[id] = new RBox();
    return rboxes[id];
  };

  /**
   * Define a new variable to be within this relay system. In order for changes to be automatically
   * propagated, a variable must be "defined", even if it is not defined by a relation.
   *
   * To define a new variable with value (usually the first variable):
   *   $scope.a = 10;
   *   $scope.define('a');
   *
   * To define a new variable based on relation:
   *   $scope.define(varName, {
   *     relation: function (s) { <forward relation> },
   *     inverse: function (s) { <inverse relation> }
   *   }, ['dep1', 'dep2']);
   *
   * @param  name    Name of the defining variable
   * @param  mapping A function containing the forward relation and the inverse relation. Both of
   *                 these functions should only get and set from the first argument `s` instead of
   *                 the scope (unless it's a constant).
   * @param  deps    List of dependencies, as strings.
   * @param  flags   Not used
   */
  ngr.define = function (name, mapping, deps, flags) {
    var self = this;
    var rbox = RBox.get(self.$id);

    rbox.changeSource.addProperty(name);

    var initialValue = self[name];
    Object.defineProperty(self, name, {
      get: function () {
        var source = rbox.changeSource[name];
        source && source(rbox.assigner);
        return rbox.values[name];
      },
      set: function (value) {
        if (rbox.readonly[name]) {
          throw 'Do not change read only property';
        }
        rbox.visited = {};
        rbox.visited[name] = 1;
        rbox.changeSource[name] = function (s) { s[name] = value; };
      },
      configurable: true,
      enumerable: true
    });

    Object.defineProperty(rbox.assigner, name, {
      get: function () {
        return self[name];
      },
      set: function (value) {
        rbox.changeSource[name] = null;
        rbox.values[name] = value;
      },
      configurable: true,
      enumerable: true
    });
    if (!mapping) {
      self[name] = initialValue;
      return;
    }
    rbox.changeSource[name] = mapping.relation;

    var depsChange = function (dep, newvalue, oldvalue) {
      if (newvalue === oldvalue) return;
      if (!(name in rbox.visited)) {
        console.log(dep, '--dep-->', name);
        rbox.visited[name] = 3;
        rbox.changeSource[name] = mapping.relation;
      }
    };
    var selfChange = function (newvalue, oldvalue) {
      if (newvalue === oldvalue) return;
      // If update from one dependent, do not propagate change to other dependents
      if (rbox.visited[name] === 3) return;
      if (mapping.inverse) {
        deps.forEach(function (dep) {
          if (!(dep in rbox.visited)) {
            console.log(name, '--self-->', dep);
            rbox.visited[dep] = 2;
            rbox.changeSource[dep] = mapping.inverse;
          }
        });
      }
    };

    rbox.readonly[name] = mapping && !mapping.inverse;
    deps.forEach(function (dep) {
      rbox.changeSource.watch(dep, depsChange.bind(this, dep));
      rbox.readonly[name] = rbox.readonly[name] || rbox.readonly[dep];
    });

    rbox.changeSource.watch(name, selfChange);
  };

  ngr.readonly = function (name) {
    var id = this.$id;
    return !rboxes[id] || rboxes[id].readonly[name];
  };

})();
