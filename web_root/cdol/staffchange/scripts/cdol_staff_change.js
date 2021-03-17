define(['angular', 'components/shared/index'], function (angular) {
	var cdolStaffApp = angular.module('cdolStaffApp', ['powerSchoolModule']);
	cdolStaffApp.controller('cdolStaffAppCtrl', [
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
			$scope.pageStatus = $attrs.ngStatus;

			// list page controller
			$scope.getStaffResults = function () {
				loadingDialog();
				$http({
					url: '/admin/cdol/staffchange/data/getStaffChanges.json',
					method: 'GET',
					params: { curSchoolId: $scope.curSchoolId, curYearId: $scope.curYearId },
				}).then(
					function successCallback(response) {
						$scope.staffList = response.data;
						$scope.staffList.pop();
						closeLoading();
					},
					function errorCallback(response) {
						alert('Error Loading Data');
						closeLoading();
					},
				);
			};
		},
	]);

	//form directive
	cdolStaffApp.directive('formDirective', function () {
		return {
			restrict: 'E',
			templateUrl: '/admin/cdol/staffchange/templates/form.html',
			// replace: true,
		};
	});

	angular.bootstrap($j('#cdolStaffAppDiv'), ['cdolStaffApp']);
});
