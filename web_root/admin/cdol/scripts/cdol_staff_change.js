require(['angular', 'components/shared/index'], function (angular) {
	var myApp = angular.module('cdolStaffApp', ['powerSchoolModule']);
	myApp.controller('cdolStaffAppCtrl', function ($scope, $http) {
		$scope.newStaffFirstName = 'New Staff';
		$scope.newStaffLastName = '';
	});
	angular.bootstrap($j('#cdolStaffAppDiv'), ['cdolStaffApp']);
});
