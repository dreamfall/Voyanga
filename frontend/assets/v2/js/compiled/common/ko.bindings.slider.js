// Generated by CoffeeScript 1.4.0

ko.bindingHandlers.slider = {
  init: function(element, valueAccessor) {
    var selectDiv, value;
    value = ko.utils.unwrapObservable(valueAccessor());
    $(element).selectSlider({});
    selectDiv = $(element).next();
    return selectDiv.find('li').each(function(idx, el) {
      el = $(el);
      if (el.data('option-value') === '' + value) {
        el.addClass('active');
        selectDiv.data('active', el);
        return selectDiv.find('.switch').css('left', selectDiv.data('elementWidth') * el.data('ind') + '%');
      } else {
        el.find('a').css('color', '#2e333b');
        el.find('a').css('text-shadow', '0px 1px 0px #FFF');
        return el.removeClass('active');
      }
    });
  },
  update: function(element, valueAccessor) {}
};
