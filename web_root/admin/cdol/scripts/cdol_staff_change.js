require(['angular', 'components/shared/index'], function (angular) {
	var myApp = angular.module('cdolStaffApp', ['powerSchoolModule']);
	myApp.controller('cdolStaffAppCtrl', [
		'$scope',
		'$http',
		'$attrs',
		function ($scope, $http, $attrs) {
			$scope.newStaffTempName = 'the New Staff Member';
			$scope.newStaffTitle = '';
			$scope.newStaffFirstName = '';
			$scope.newStaffLastName = '';

			$scope.getStaffResults = function () {
				console.log('getStaffResults ran');
			};
		},
	]);
	angular.bootstrap($j('#cdolStaffAppDiv'), ['cdolStaffApp']);
});
