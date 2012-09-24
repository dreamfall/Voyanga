var SearchPanel,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

SearchPanel = (function() {

  function SearchPanel() {
    this.minimize = __bind(this.minimize, this);

    var _this = this;
    this.minimized = ko.observable(false);
    this.minimizedCalendar = ko.observable(false);
    this.calendarHidden = ko.observable(false);
    this.oldCalendarState = this.minimizedCalendar();
    this.togglePanel(this.minimized());
    this.toggleCalendar(this.minimizedCalendar());
    this.minimized.subscribe(function(minimized) {
      return _this.togglePanel(minimized);
    });
    this.minimizedCalendar.subscribe(function(minimizedCalendar) {
      return _this.toggleCalendar(minimizedCalendar);
    });
  }

  SearchPanel.prototype.togglePanel = function(minimized) {
    var heightSubHead, speed;
    speed = 300;
    heightSubHead = $('.sub-head').height();
    if (!minimized) {
      return $('.sub-head').animate({
        'margin-top': '0px'
      }, speed);
    } else {
      return $('.sub-head').animate({
        'margin-top': '-' + (heightSubHead - 4) + 'px'
      }, speed);
    }
  };

  SearchPanel.prototype.toggleCalendar = function(minimizedCalendar) {
    var heightCalendar1, heightCalendar2, heightSubHead, speed,
      _this = this;
    speed = 500;
    heightSubHead = $('.sub-head').height();
    heightCalendar1 = $('.calenderWindow').height();
    heightCalendar2 = heightSubHead;
    if (!minimizedCalendar) {
      this.calendarHidden(false);
      return $('.calenderWindow').animate({
        'top': (heightSubHead - 4) + 'px'
      }, speed);
    } else {
      return $('.calenderWindow').animate({
        'top': '-' + heightCalendar1 + 'px'
      }, speed, function() {
        return _this.calendarHidden(true);
      });
    }
  };

  SearchPanel.prototype.minimize = function() {
    if (this.minimized()) {
      this.minimized(false);
      return this.minimizedCalendar(this.oldCalendarState);
    } else {
      this.minimized(true);
      this.oldCalendarState = this.minimizedCalendar();
      if (!this.minimizedCalendar()) {
        return this.minimizedCalendar(true);
      }
    }
  };

  SearchPanel.prototype.minimizeCalendar = function() {
    if (this.minimizedCalendar()) {
      return this.minimizedCalendar(false);
    } else {
      return this.minimizedCalendar(true);
    }
  };

  return SearchPanel;

})();
