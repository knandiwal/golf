require.config({
	"paths": {
		"cordova": "libs/cordova/cordova",
		"ready": "libs/cordova/ready",
		"hogan": "libs/hogan/hogan",
		"hgn": "libs/hogan/hgn",
		"json2": "libs/json2/json2",
		"jquery": "libs/jquery/jquery",
		"jqueryCookie": "libs/jquery.cookie/jquery.cookie",
		"jqueryCouch": "libs/jquery.couch/jquery.couch",
		"jqueryFlot": "libs/jquery.flot/jquery.flot",
		"jqueryFlotPie": "libs/jquery.flot/jquery.flot.pie",
		"jqueryHashchange": "libs/jquery.hashchange/jquery.hashchange",
		"lscache": "libs/lscache/lscache",
		"text": "libs/text/text",
		"lodash": "libs/lodash/lodash",
		"bootstrapAffix": "libs/bootstrap/bootstrap-affix",
		"bootstrapAlert": "libs/bootstrap/bootstrap-alert",
		"bootstrapButton": "libs/bootstrap/bootstrap-button",
		"bootstrapCarousel": "libs/bootstrap/bootstrap-carousel",
		"bootstrapCollapse": "libs/bootstrap/bootstrap-collapse",
		"bootstrapDropdown": "libs/bootstrap/bootstrap-dropdown",
		"bootstrapModal": "libs/bootstrap/bootstrap-modal",
		"bootstrapPopover": "libs/bootstrap/bootstrap-popover",
		"bootstrapScrollspy": "libs/bootstrap/bootstrap-scrollspy",
		"bootstrapTab": "libs/bootstrap/bootstrap-tab",
		"bootstrapTooltip": "libs/bootstrap/bootstrap-tooltip",
		"bootstrapTransition": "libs/bootstrap/bootstrap-transition",
		"bootstrapTypeahead": "libs/bootstrap/bootstrap-typeahead",
		"routie": "libs/routie/routie"
	},
	"shim": {
		"cordova": {
			"exports": "cordova"
		},
		"jquery": {
			"deps": [
				"json2"
			],
			"exports": "jQuery"
		},
		"jqueryHashchange": {
			"deps": [
				"jquery"
			]
		},
		"jqueryCookie": {
			"deps": [
				"jquery"
			]
		},
		"jqueryCouch": {
			"deps": [
				"jquery"
			]
		},
		'jqueryFlot': {
			'deps': [
				'jquery'
			]
		},
		'jqueryFlotPie': {
			'deps': [
				'jqueryFlot'
			]
		},
		"bootstrapAffix": {
			"deps": [
				"jquery"
			]
		},
		"bootstrapAlert": {
			"deps": [
				"jquery"
			]
		},
		"bootstrapButton": {
			"deps": [
				"jquery"
			]
		},
		"bootstrapCarousel": {
			"deps": [
				"jquery"
			]
		},
		"bootstrapCollapse": {
			"deps": [
				"jquery",
				"bootstrapTransition"
			]
		},
		"bootstrapDropdown": {
			"deps": [
				"jquery"
			]
		},
		"bootstrapModal": {
			"deps": [
				"jquery"
			]
		},
		"bootstrapPopover": {
			"deps": [
				"jquery"
			]
		},
		"bootstrapScrollspy": {
			"deps": [
				"jquery"
			]
		},
		"bootstrapTab": {
			"deps": [
				"jquery"
			]
		},
		"bootstrapTooltip": {
			"deps": [
				"jquery"
			]
		},
		"bootstrapTransition": {
			"deps": [
				"jquery"
			]
		},
		"bootstrapTypeahead": {
			"deps": [
				"jquery"
			]
		},
		"routie": {
			"exports": "routie"
		}
	}
});

require(['ready', 'home', 'start'], function(ready, home, start) {
	ready(function() {
		if (window.screen.height==568) { // iPhone 4"
			document.querySelector("meta[name=viewport]").content="width=320.1";
		}
		start();
		home();
	});
});
