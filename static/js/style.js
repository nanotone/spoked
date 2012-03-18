function getStyleSheetById(id) {
	for (var i = 0; i < document.styleSheets.length; i++) {
		if (document.styleSheets[i].ownerNode.id == id) {
			return document.styleSheets[i];
		}
	}
}

function updateStyles(css, filters) {
	var rules = (css.cssRules || css.rules);
	for (var i = 0; i < filters.length; i++) {
		filters[i][0] = new RegExp('\\.' + filters[i][0] + '[^-\\w]');
	}
	for (var i = 0; i < rules.length; i++) {
		var rule = rules[i];
		var selector = rule.selectorText;
		for (var j = 0; j < filters.length; j++) {
			var filter = filters[j];
			classNameIndex = (selector + ' ').search(filter[0]);
			if (classNameIndex != -1 && selector.indexOf(' ', classNameIndex) == -1) {
				rule.style[filter[1]] = filter[2];
				console.log(i + " " + selector);
			}
		}
	}
}

