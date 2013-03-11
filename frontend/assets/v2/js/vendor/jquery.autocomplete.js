/**
*  Ajax Autocomplete for jQuery, version 1.1.5
*  (c) 2010 Tomas Kirda, Vytautas Pranskunas
*
*  Ajax Autocomplete for jQuery is freely distributable under the terms of an MIT-style license.
*  For details, see the web site: http://www.devbridge.com/projects/autocomplete/jquery/
*
*  Last Review: 07/24/2012
*/

/*jslint onevar: true, evil: true, nomen: true, eqeqeq: true, bitwise: true, regexp: true, newcap: true, immed: true */
/*global window: true, document: true, clearInterval: true, setInterval: true, jQuery: true */

(function ($) {

	var reEscape = new RegExp('(\\' + ['/', '.', '*', '+', '?', '|', '(', ')', '[', ']', '{', '}', '\\'].join('|\\') + ')', 'g');

	function fnFormatResult(value, data, currentValue, showCode) {
		var pattern = '(' + currentValue.replace(reEscape, '\\$1') + ')',
		    newValue = data.name.replace(new RegExp(pattern, 'gi'), '<strong>$1<\/strong>'),
            result = '<span class="city">' + data.name + ', </span><span class="country">'+ data.country +'</span>';
        if (showCode)
            result += '<span class="code">' + data.code + '</span>';
        return result;
	}

	function Autocomplete(el, options) {
		this.el = $(el);
		this.el.attr('autocomplete', 'off');
		this.suggestions = [];
		this.data = [];
		this.badQueries = [];
		this.selectedIndex = -1;
		this.currentValue = this.el.val();
		this.intervalId = 0;
		this.cachedResponse = [];
		this.onChangeInterval = null;
		this.onChange = null;
		this.ignoreValueChange = false;
		this.serviceUrl = options.serviceUrl;
		this.isLocal = false;
		this.options = {
            showCode: true,
			autoSubmit: false,
			minChars: 1,
			maxHeight: 300,
			deferRequestBy: 0,
			width: 0,
			highlight: true,
			params: {},
			fnFormatResult: fnFormatResult,
			delimiter: null,
			zIndex: 9999
		};
		this.initialize();
		this.setOptions(options);
		this.el.data('autocomplete', this);
	}

	$.fn.autocomplete = function (options, optionName) {

		var autocompleteControl;

		if (typeof options == 'string') {
			autocompleteControl = this.data('autocomplete');
			if (typeof autocompleteControl[options] == 'function') {
				autocompleteControl[options](optionName);
			}
		} else {
			autocompleteControl = new Autocomplete(this.get(0) || $('<input />'), options);
		}
		return autocompleteControl;
	};


	Autocomplete.prototype = {

		killerFn: null,

		initialize: function () {

			var me, uid, autocompleteElId;
			me = this;
			uid = Math.floor(Math.random() * 0x100000).toString(16);
			autocompleteElId = 'Autocomplete_' + uid;

			this.killerFn = function (e) {
				if ($(e.target).parents('.autocomplete').size() === 0) {
					me.killSuggestions();
					me.disableKillerFn();
				}
			};

			if (!this.options.width) { this.options.width = this.el.innerWidth()-1; }
			this.mainContainerId = 'AutocompleteContainter_' + uid;

			$('<div id="' + this.mainContainerId + '" style="position:absolute;z-index:9999;"><div class="autocomplete-w1"><div class="left"></div><div class="center"></div><div class="right"></div><div class="autocomplete" id="' + autocompleteElId + '" style="display:none;"></div></div></div>').appendTo('body');

			this.container = $('#' + autocompleteElId);
			this.fixPosition();
			if (window.opera) {
				this.el.keypress(function (e) { me.onKeyPress(e); });
			} else {
				this.el.keydown(function (e) { me.onKeyPress(e); });
			}
			this.el.keyup(function (e) { me.onKeyUp(e); });
			this.el.blur(function () { me.enableKillerFn(); });
			this.el.focus(function () { me.fixPosition(); });
			this.el.change(function () { me.onValueChanged(); });
		},

		extendOptions: function (options) {
			$.extend(this.options, options);
		},

		setOptions: function (options) {
			var o = this.options;
			this.extendOptions(options);
			if (o.lookup || o.isLocal) {
				this.isLocal = true;
				if ($.isArray(o.lookup)) { o.lookup = { suggestions: o.lookup, data: [] }; }
			}
			$('#' + this.mainContainerId).css({ zIndex: o.zIndex });
			this.container.css({/* maxHeight: o.maxHeight + 'px',*/ width: o.width + 1 });
		},

		clearCache: function () {
			this.cachedResponse = [];
			this.badQueries = [];
		},

		disable: function () {
			this.disabled = true;
		},

		enable: function () {
			this.disabled = false;
		},

		fixPosition: function () {
            var offset = this.el.offset();
			$('#' + this.mainContainerId).css({ top: (offset.top + this.el.innerHeight()) + 'px', left: offset.left + 'px' });
		},

		enableKillerFn: function () {
			var me = this;
            me.select(me.selectedIndex);
			$(document).bind('click', me.killerFn);
		},

		disableKillerFn: function () {
			var me = this;
			$(document).unbind('click', me.killerFn);
		},

		killSuggestions: function () {
			var me = this;
			this.stopKillSuggestions();
			this.intervalId = window.setInterval(function () { me.hide(); me.stopKillSuggestions(); }, 300);
		},

		stopKillSuggestions: function () {
			window.clearInterval(this.intervalId);
		},

		onValueChanged: function () {
			this.change(this.selectedIndex);
		},

		onKeyPress: function (e) {
			if (this.disabled || !this.enabled) { return; }
			// return will exit the function
			// and event will not be prevented
			switch (e.keyCode) {
				case 27: //KEY_ESC:
					this.el.val(this.currentValue);
					this.hide();
					break;
				case 9: //KEY_TAB:
				case 13: //KEY_RETURN:
					if (this.selectedIndex === -1) {
						this.hide();
						return;
					}
					this.select(this.selectedIndex);
					if (e.keyCode === 9) { return; }
					break;
				case 38: //KEY_UP:
					this.moveUp();
					break;
				case 40: //KEY_DOWN:
					this.moveDown();
					break;
				default:
					return;
			}
			e.stopImmediatePropagation();
			e.preventDefault();
		},

		onKeyUp: function (e) {
			if (this.disabled) { return; }
			switch (e.keyCode) {
				case 38: //KEY_UP:
				case 40: //KEY_DOWN:
					return;
			}
			clearInterval(this.onChangeInterval);
			if (this.currentValue !== this.el.val()) {
				if (this.options.deferRequestBy > 0) {
					// Defer lookup in case when value changes very quickly:
					var me = this;
					this.onChangeInterval = setInterval(function () { me.onValueChange(e); }, this.options.deferRequestBy);
				} else {
					this.onValueChange(e);
				}
			}
		},

		onValueChange: function (e) {
			clearInterval(this.onChangeInterval);
			this.currentValue = this.el.val();
			var q = this.getQuery(this.currentValue);
			this.selectedIndex = -1;
			if (this.ignoreValueChange) {
				this.ignoreValueChange = false;
				return;
			}
			if (q === '' || q.length < this.options.minChars) {
				this.hide();
			} else {
				this.getSuggestions(q, e);
			}
		},

		getQuery: function (val) {
			var d, arr;
			d = this.options.delimiter;
			if (!d) { return $.trim(val); }
			arr = val.split(d);
			return $.trim(arr[arr.length - 1]);
		},

		getSuggestionsLocal: function (q) {
			var ret, arr, len, val, i;
			arr = this.options.lookup;
			len = arr.suggestions.length;
			ret = { suggestions: [], data: [] };
			q = q.toLowerCase();
			for (i = 0; i < len; i++) {
				val = arr.suggestions[i];
				if (val.toLowerCase().indexOf(q) === 0) {
					ret.suggestions.push(val);
					ret.data.push(arr.data[i]);
				}
			}
			return ret;
		},

		getSuggestions: function (q, e) {

			var cr, me;
			cr = this.isLocal ? this.getSuggestionsLocal(q) : this.cachedResponse[q]; //dadeta this.options.isLocal ||
			if (cr && $.isArray(cr.suggestions)) {
				this.suggestions = cr.suggestions;
				this.data = cr.data;
				this.suggest(e);
			} else if (!this.isBadQuery(q)) {
				me = this;
				me.options.params.query = q;
				$.get(this.serviceUrl, me.options.params, function (txt) { me.processResponse(txt); }, 'json');
			}
		},

		isBadQuery: function (q) {
			var i = this.badQueries.length;
			while (i--) {
				if (q.indexOf(this.badQueries[i]) === 0) { return true; }
			}
			return false;
		},

		hide: function () {
			this.enabled = false;
			this.selectedIndex = -1;
			this.container.hide();
		},

		suggest: function (e) {

			if (this.suggestions.length === 0) {
				this.hide();
				return;
			}

			var me, len, div, f, v, i, s, mOver, mClick;
			me = this;
			len = this.suggestions.length;
			f = this.options.fnFormatResult;
			v = this.getQuery(this.currentValue);
			mOver = function (xi) { return function () { me.activate(xi); }; };
			mClick = function (xi) { return function () { me.select(xi); }; };
			this.container.hide().empty();
			for (i = 0; i < len; i++) {
				s = this.suggestions[i];
				div = $((me.selectedIndex === i ? '<div class="selected"' : '<div') + ' title="' + s + '">' + f(s, this.data[i], v, this.options.showCode) + '</div>');
				div.mouseover(mOver(i));
				div.click(mClick(i));
				this.container.append(div);
			}
            if (len==1)
            {
                if (!((e) && (e.type =='keyup') && (e.keyCode==8)))
                    this.select(0);
            }
            else
            {
                this.enabled = true;
                this.container.show();
               /* if (!((e) && (e.type =='keyup') && (e.keyCode==8)))
                    this.activate(0);*/
            }
		},

		processResponse: function (text) {
			var response = text
			if (!$.isArray(response.data)) { response.data = []; }
			if (!this.options.noCache) {
				this.cachedResponse[response.query] = response;
				if (response && response.suggestions && response.suggestions.length === 0)
                {
                    this.badQueries.push(response.query);
                }
			}
			if (response.query === this.getQuery(this.currentValue)) {
				this.suggestions = response.suggestions;
				this.data = response.data;
                var e = $.Event('processRespond');
				this.suggest(e);
			}
		},

		activate: function (index) {
			var divs, activeItem;
			divs = this.container.children();
			// Clear previous selection:
			if (this.selectedIndex !== -1 && divs.length > this.selectedIndex) {
				$(divs.get(this.selectedIndex)).removeClass();
			}
			this.selectedIndex = index;
			if (this.selectedIndex !== -1 && divs.length > this.selectedIndex) {
				activeItem = divs.get(this.selectedIndex);
				$(activeItem).addClass('selected');
                this.onActivate(this.selectedIndex);
			}
			return activeItem;
		},

		deactivate: function (div, index) {
			div.className = '';
			if (this.selectedIndex === index) { this.selectedIndex = -1; }
		},

		select: function (i) {
			var selectedValue, f;
			selectedValue = this.suggestions[i];
			if (selectedValue) {
				this.el.val(selectedValue);
				if (this.options.autoSubmit) {
					f = this.el.parents('form');
					if (f.length > 0) { f.get(0).submit(); }
				}
				this.ignoreValueChange = true;
				this.hide();
				this.onSelect(i);
			}
            this.el.trigger('autocompleted');
		},

		change: function (i) {
			var selectedValue, fn, me;
			me = this;
			selectedValue = this.suggestions[i];
			if (selectedValue) {
				var s, d;
				s = me.suggestions[i];
				d = me.data[i];
				me.el.val(me.getValue(s));
			}
			else {
				s = '';
				d = -1;
			}

			fn = me.options.onChange;
			if ($.isFunction(fn)) { fn(s, d, me.el); }
		},

		moveUp: function () {
			if (this.selectedIndex === -1) { return; }
			if (this.selectedIndex === 0) {
				this.container.children().get(0).className = '';
				this.selectedIndex = -1;
                this.el.val('');
                this.el.trigger('change');
				this.el.val(this.currentValue);
				return;
			}
			this.adjustScroll(this.selectedIndex - 1);
		},

		moveDown: function () {
			if (this.selectedIndex === (this.suggestions.length - 1)) { return; }
			this.adjustScroll(this.selectedIndex + 1);
		},

		adjustScroll: function (i) {
			var activeItem, offsetTop, upperBound, lowerBound;
			activeItem = this.activate(i);
			offsetTop = activeItem.offsetTop;
			upperBound = this.container.scrollTop();
			lowerBound = upperBound + this.options.maxHeight - 25;
			if (offsetTop < upperBound) {
				this.container.scrollTop(offsetTop);
			} else if (offsetTop > lowerBound) {
				this.container.scrollTop(offsetTop - this.options.maxHeight + 25);
			}
		},

		onSelect: function (i) {
			var me, fn, s, d;
			me = this;
			fn = me.options.onSelect;
			s = me.suggestions[i];
			d = me.data[i];
			me.el.val(me.getValue(s));
			if ($.isFunction(fn)) { fn(s, d, me.el); }
		},

        onActivate: function (i) {
            var me, fn, s, d;
            me = this;
            fn = me.options.onActivate;
            s = me.suggestions[i];
            d = me.data[i];
            me.el.val(me.getValue(s));
            if ($.isFunction(fn)) { fn(s, d, me.el); }
        },

		getValue: function (value) {
			var del, currVal, arr, me;
			me = this;
			del = me.options.delimiter;
			if (!del) { return value; }
			currVal = me.currentValue;
			arr = currVal.split(del);
			if (arr.length === 1) { return value; }
			return currVal.substr(0, currVal.length - arr[arr.length - 1].length) + value;
		}

	};

} (jQuery));
