define(['angular'], function (angular) {
	var myApp = angular.module('checkboxModule', []);

	myApp.service('checkboxService', function () {
		
        this.formatChecksForApi = function (val) {
					val = val.toString();
					return val;
				};

		this.formatChecksFromApi = function (val) {
					if (val == 'true') {
						val = true;
					} else {
						val = false;
					}
					return val;
				};
    
	});
});
