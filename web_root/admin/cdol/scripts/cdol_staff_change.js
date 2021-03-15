require(['angular', 'components/shared/index'], function (angular) {
	var myApp = angular.module('cdolStaffApp', ['powerSchoolModule']);
	myApp.controller('cdolStaffAppCtrl', function ($scope, $http) {
		$scope.newStaffTempName = 'the New Staff Member';
		$scope.newStaffTitle = '';
		$scope.newStaffFirstName = '';
		$scope.newStaffLastName = '';

	});
	angular.bootstrap($j('#cdolStaffAppDiv'), ['cdolStaffApp']);
});
