define(['jquery', 'cordova'], function($) {
	var bound = false;
		called = false,
		listeners = [],
		go = function() {
			called = true;
			for(var i = 0;i < listeners.length;i++) {
				listeners[i]();
			}
			listeners = null;
		};
	
	return function(ready) {
		if(called) {
			ready();
		}
		else {
			if(!bound) {
				bound = true;
				$(document).ready(function() {
					document.addEventListener('deviceready', go, false);
				});
			}		
			listeners.push(ready);
		}
	};
});
