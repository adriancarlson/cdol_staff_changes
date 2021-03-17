require(['angular', 'components/shared/index'], function (angular) {
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
			$scope.pageStatus = 'Submit';

			// form directive
			cdolStaffApp.directive('change', function () {
				return {
					restrict: 'E',
					templateUrl: '/admin/cdol/staffchange/templates/form.html',
					replace: true,
				};
			});
			//confirm directive
			cdolStaffApp.directive('confirm', function () {
				return {
					restrict: 'E',
					templateUrl: '/admin/cdol/staffchange/templates/confirm.html',
					replace: true,
				};
			});
			//edit directive
			cdolStaffApp.directive('edit', function () {
				return {
					restrict: 'E',
					templateUrl: '/admin/cdol/staffchange/templates/edit.html',
					replace: true,
				};
			});

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
	angular.bootstrap($j('#cdolStaffAppDiv'), ['cdolStaffApp']);
});
