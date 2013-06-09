define([
	'jquery',
	'underscore',
	'hgn!templates/location-chooser',
	'gmapskey',
	'error'
], function($, _, locationChooserT, gmapsKey, ERR) {
	var gmapsLoader = false,
		mapsLoaderCBs = [];
	$.fn.locationChooser = function(position) {
		var ops = {
				map: this.find('[data-map]'),
				info: this.find('[data-info]'),
				position: position || {lat: 51.500755, lng: -0.125785},
				geo: !!navigator.geolocation,
				geoOnLoad: !position
			};
		if(ops.geo) {
			this.find('[data-find]').on('click', function() {
				getLocation(ops);
			});
		}
		else {
			this.find('[data-find]').attr('disabled','disabled');
			ops.info.html('Geolocation is not supported on your device');
		}
		showGMap(ops);
	
		return function() {
			var gpos;
			if(ops.marker) {
				gpos = ops.marker.getPosition();
				return {
					lat: gpos.lat(),
					lng: gpos.lng()
				};
			}
			if(ops.latestPosition) {
				return {
					lat: ops.latestPosition.coords.latitude,
					lng: ops.latestPosition.coords.longitude
				};
			}
			return position;
		};
	};
	
	function getLocation(ops) {
		if(ops.geo) {
			navigator.geolocation.getCurrentPosition(function(position) {
				var gLatLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
				ops.latestPosition = position;
				if(ops.marker) {
					ops.marker.setPosition(gLatLng);
					ops.map.setZoom(17);
					ops.map.setCenter(gLatLng);
				}
				else {
					ops.info.html('lat: ' + position.coords.latitude + ' lng:' + position.coords.longitude);
				}
			}, function(err) {
				ERR(err, true);
			});
		}
	}
	
	function showGMap(ops) {
		if(gmapsLoader == false) {
			mapsLoaderCBs.push(function() {
				gmap(ops);
			});
			loadGMapsScript(ops);
		}
		else if(gmapsLoader == 'loading') {
			mapsLoaderCBs.push(function() {
				gmap(ops);
			});
		}
		else {
			gmap(ops);
		}
	}
	
	function gmap(ops) {
		var gpos = new google.maps.LatLng(ops.position.lat, ops.position.lng);
		ops.map = new google.maps.Map(ops.map[0], {
			zoom: 5,
			center: gpos,
			mapTypeId: google.maps.MapTypeId.SATELLITE,
			overviewMapControl: false,
			panControl: false,
			rotateControl: false,
			streetViewControl: false,
			zoomControl: true
		});
		ops.marker = new google.maps.Marker({
			position: gpos,
			map: ops.map,
			draggable: true
		});
		if(ops.geoOnLoad) {
			getLocation(ops);
		}
	}
	
	function loadGMapsScript(ops) {
		var script = document.createElement("script");
		script.type = "text/javascript";
		script.src = "http://maps.googleapis.com/maps/api/js?key=" + gmapsKey + "&sensor=" + (ops.geo ? 'true' : 'false') + "&callback=loadedGMaps";
		script.onerror = function() {
			gmapsLoader = false;
		};
		gmapsLoader = 'loading';
		document.body.appendChild(script);
	}
	
	window.loadedGMaps = function() {
		gmapsLoader = true;
		google.maps.visualRefresh = true;
		_.each(mapsLoaderCBs, function(cb) {
			cb();
		});
		mapsLoaderCBs = [];
	}
	
	return {
		locationChooser: locationChooserT.template
	};
});

