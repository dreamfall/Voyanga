// Generated by CoffeeScript 1.3.3
var SearchParams;

SearchParams = (function() {

  function SearchParams() {
    this.date = ko.observable('');
    this.adults = ko.observable(1).extend({
      integerOnly: 'adult'
    });
    this.children = ko.observable(0).extend({
      integerOnly: true
    });
    this.infants = ko.observable(0).extend({
      integerOnly: 'infant'
    });
  }

  return SearchParams;

})();
