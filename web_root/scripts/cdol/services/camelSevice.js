define(['angular'], function (angular) {
	var myApp = angular.module('camelModule', []);

	myApp.service('camelService', function () {
		this.camelize = function (str) {
			return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match, index) {
				if (+match === 0) return '';
				return index === 0 ? match.toLowerCase() : match.toUpperCase();
			});
		};
	});
});
