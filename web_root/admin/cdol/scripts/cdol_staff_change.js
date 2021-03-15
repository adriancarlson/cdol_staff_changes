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
			$scope.curSchoolId = $attrs.ngCurSchoolId;
			$scope.curYearId = $attrs.ngCurYearId;

			$scope.getStaffResults = function () {
				console.log('getStaffResults ran');
				console.log($scope.curSchoolId);
				console.log($scope.curYearId);
			};
		},
	]);
	angular.bootstrap($j('#cdolStaffAppDiv'), ['cdolStaffApp']);
});
