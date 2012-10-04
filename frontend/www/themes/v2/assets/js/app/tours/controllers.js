// Generated by CoffeeScript 1.3.3
/*
SEARCH controller, should be splitted once we will get more actions here
*/

var ToursController,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __slice = [].slice;

ToursController = (function() {

  function ToursController(searchParams) {
    this.searchParams = searchParams;
    this.handleResults = __bind(this.handleResults, this);

    this.searchAction = __bind(this.searchAction, this);

    this.indexAction = __bind(this.indexAction, this);

    this.api = new ToursAPI;
    this.routes = {
      '/search': this.searchAction,
      '': this.indexAction
    };
    this.key = "tours_10";
    _.extend(this, Backbone.Events);
  }

  ToursController.prototype.indexAction = function() {
    var args, eventSet, events;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    window.voyanga_debug("TOURS: Invoking indexAction", args);
    events = [];
    $.each(window.eventsRaw, function(i, el) {
      return events.push(new Event(el));
    });
    eventSet = new EventSet(events);
    console.log("EVENT: eventset = ", eventSet);
    this.render('index', eventSet);
    return ResizeAvia();
  };

  ToursController.prototype.searchAction = function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    window.voyanga_debug("TOURS: Invoking searchAction", args);
    if (sessionStorage.getItem(this.key) && (window.location.host !== 'test.voyanga.com')) {
      window.voyanga_debug("TOURS: Getting result from cache");
      return this.handleResults(JSON.parse(sessionStorage.getItem(this.key)));
    } else {
      return this.api.search(this.handleResults);
    }
  };

  ToursController.prototype.handleResults = function(data) {
    var stacked;
    window.voyanga_debug("searchAction: handling results", data);
    sessionStorage.setItem(this.key, JSON.stringify(data));
    stacked = new ToursResultSet(data);
    this.trigger("results", stacked);
    this.render('results', stacked);
    return ko.processAllDeferredBindingUpdates();
  };

  ToursController.prototype.render = function(view, data) {
    return this.trigger("viewChanged", view, data);
  };

  return ToursController;

})();
