define(function() {
	return function(err, ignorable) {
		if(err) {
			console.log(err, ignorable);
			if(!ignorable) {
				debugger;
			}
			return true;
		}
		return false;
	}
});
