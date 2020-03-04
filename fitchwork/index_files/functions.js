 /***************************************************************************
	*
	*	Helper functions that are not in a class
	*
	*	These are one off functions that do something, but are not tied
	*	to any particular class
	*
 **************************************************************************/

/**
 *	Replication of the php in_array function
 *	http://phpjs.org/functions/in_array/
 */
function in_array (needle, haystack, argStrict) {
		var key = '',
				strict = !! argStrict;

		if (strict) {
				for (key in haystack) {
						if (haystack[key] === needle) {
								return true;
						}
				}
		} else {
				for (key in haystack) {
						if (haystack[key] == needle) {
								return true;
						}
				}
		}

		return false;
}

/**
 *  Replication of the php strip_tags function
 *  http://locutus.io/php/strings/strip_tags/
 */
function strip_tags (input, allowed) { 
	// making sure the allowed arg is a string containing only tags in lowercase (<a><b><c>)
	allowed = (((allowed || '') + '').toLowerCase().match(/<[a-z][a-z0-9]*>/g) || []).join('')

	var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi
	var commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi

	return input.replace(commentsAndPhpTags, '').replace(tags, function ($0, $1) {
		return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : ''
	})
}

/**
 *  quicker replacement for jquery $.closest using filter function
 *	@param {Node} el  DOM node to be tested
 *	@param {function} fn function which returns true on condition
 */
function closest(el, fn) {

	var r = el && (fn(el) ? el : closest(el.parentNode, fn));

	if(!r) {
		return null
	}

	return r;

};

/**
 * An underscore partial rendering engine
 * @param  {HTML} tmpl Template html
 * @param  {Obj} data  Model
 * @return {String}       Rendered template
 */
window.partial = function(tmpl, data) {
		return _.template(tmpl)(data);
};

/**
 *  Return the first letter of a word capitalized 
 */
function ucFirst(str) {
	return (str) ? str.charAt(0).toUpperCase() + str.slice(1) : str;
}

/**
 * Make a dashed or underscore string camel case
 * @param  {Boolean} first_upper Should the first letter be upper case or not
 * @return {String}             Camel case string
 */
String.prototype.toCamel = function(first_upper){
	var camel = this.replace(/((\_|\-)[a-z])/g, function($1){return $1.toUpperCase().replace(/(\_|\-)/g,'');});
	return (first_upper) ? camel.substr(0,1).toUpperCase() + camel.substr(1) : camel;
};

/**
* linearly interpolate between two numbers
* when t == 1 , return == secondNum
*
* @param {number} firstNum 
* @param {number} secondNum
* @param {number} t - blend between first and second numbers clamped to 0-1
* @return {number}
*/
function lerp(firstNum, secondNum, t){
	var percent = Math.max(Math.min(t, 1), 0)
	return (1-percent)*firstNum + (percent*secondNum)
}



/**
 *  Legacy function
 *  Smothly scroll
 */
var lastT = 0;
var timer = null;
function doscroll(targetYPos,y,t) {
	var speed = 6;
	var diff = targetYPos - y;
	var steps = diff/(speed*speed);
	t += (t+steps)/diff;
	newY = (t==1) ? y+diff : y + (diff * (-Math.pow(2, -20 * t/1) + 1));
	if(t) window.scrollTo(0, newY);
	
	if(t >= 1 || lastT == t || !t) clearTimeout(timer);
	else timer=setTimeout("doscroll("+targetYPos+","+y+","+t+")",1);
	
	lastT = t;
	
	return false;
}

/**
 * Replicate PHPs number format method
 * http://phpjs.org/functions/number_format
 */
function number_format(number, decimals, dec_point, thousands_sep) {
	number = (number + '')
		.replace(/[^0-9+\-Ee.]/g, '');
	var n = !isFinite(+number) ? 0 : +number,
		prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
		sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
		dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
		s = '',
		toFixedFix = function(n, prec) {
			var k = Math.pow(10, prec);
			return '' + (Math.round(n * k) / k)
				.toFixed(prec);
		};
	// Fix for IE parseFloat(0.55).toFixed(0) = 0;
	s = (prec ? toFixedFix(n, prec) : '' + Math.round(n))
		.split('.');
	if (s[0].length > 3) {
		s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
	}
	if ((s[1] || '')
		.length < prec) {
		s[1] = s[1] || '';
		s[1] += new Array(prec - s[1].length + 1)
			.join('0');
	}
	return s.join(dec);
}

/**
 * Get a parameter out of a query string
 * @param  {string} name the paramater you want
 * @return {string}
 * https://davidwalsh.name/query-string-javascript
 */
function getQueryStringParam(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

// Error states
$.fn.toggleInputError = function(erred) {
	this.parent().toggleClass('error', erred);
	return this;
};

// Global loading animation for use with underscore templates
window.loading_animation = function(extra_class) {
	var tmpl = _.template($('#loading_animation').html());
	var render = tmpl({ extra_class : extra_class });
	return render.replace("{{ extra_class }}", "");
};
