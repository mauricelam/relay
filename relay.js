var ngr = ngr || {};

(function () {

  /**
   * WatchedBox lets you add observers to particular properties inside the watch box. addProperty
   * must be first called to initialize the variables. Also note that this workes by using setters,
   * so changes inside mutable objects will not fire the observers.
   */
  var WatchedBox = {
    get: function (name) {
      return this['_' + name];
    },
    set: function (name, value) {
      if (this._watchers && this._watchers[name]) {
        this._watchers[name].forEach(function (watcher) {
          watcher(value, this['_' + name]);
        }, this);
      }
      this['_' + name] = value;
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
    this.watchers = {};
    return this;
  }

  RBox.get = function(id) {
    if (!rboxes[id])
      rboxes[id] = new RBox();
    return rboxes[id];
  };

  RBox.prototype.resolve = function(name) {
    var source = this.changeSource.get(name);
    source && source(this.assigner);
    return this.values[name];
  };

  RBox.prototype.change = function(name, source, type) {
    this.visited[name] = type;
    this.changeSource.set(name, source);
    window.clearTimeout(this._timer);
    this._timer = window.setTimeout(this.resolveWatchers.bind(this), 0);
  };

  RBox.prototype.resolveWatchers = function() {
    for (var name in this.watchers) {
      this.watchers[name](this.resolve(name));
    }
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

    var initialValue = self[name];
    Object.defineProperty(self, name, {
      get: function () {
        return rbox.resolve(name);
      },
      set: function (value) {
        if (rbox.readonly[name]) {
          throw 'Do not change read only property';
        }
        rbox.visited = {};
        rbox.visited[name] = 1;
        rbox.changeSource.set(name, function (s) { s[name] = value; });
      },
      enumerable: true
    });

    Object.defineProperty(rbox.assigner, name, {
      get: function () {
        return self[name];
      },
      set: function (value) {
        rbox.changeSource.set(name, null);
        rbox.values[name] = value;
      },
      enumerable: true
    });
    if (!mapping) {
      self[name] = initialValue;
      return;
    }
    rbox.changeSource.set(name, mapping.relation);

    var depsChange = function (dep, newvalue, oldvalue) {
      if (newvalue === oldvalue) return;
      if (!(name in rbox.visited)) {
        console.log(dep, '--dep-->', name);
        rbox.change(name, mapping.relation, 3);
      }
    };
    var selfChange = function (newvalue, oldvalue) {
      if (newvalue === oldvalue) return;
      // If update from one dependent, do not propagate change to other dependents
      if (rbox.visited[name] === 3) return;
      if (mapping.inverse) {
        for (var i = 0, count = deps.length; i < count; i++) {
          if (!(deps[i] in rbox.visited))
            rbox.change(deps[i], mapping.inverse, 2);
        }
      }
    };

    rbox.readonly[name] = mapping && !mapping.inverse;
    for (var i = 0, count = deps.length; i < count; i++) {
      var dep = deps[i];
      rbox.changeSource.watch(dep, depsChange.bind(this, dep));
      rbox.readonly[name] = rbox.readonly[name] || rbox.readonly[dep];
    }

    rbox.changeSource.watch(name, selfChange);
  };

  ngr.watchRelation = function (name, func) {
    var rbox = RBox.get(this.$id);
    rbox.watchers[name] = func;
  };

  ngr.readonly = function (name) {
    var id = this.$id;
    return !rboxes[id] || rboxes[id].readonly[name];
  };

})();
