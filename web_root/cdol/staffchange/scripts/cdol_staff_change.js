define(['angular', 'components/shared/index'], function (angular) {
	var cdolStaffApp = angular.module('cdolStaffApp', ['powerSchoolModule']);
	cdolStaffApp.controller('cdolStaffAppCtrl', [
		'$scope',
		'$http',
		'$attrs',
		function ($scope, $http, $attrs) {
			$scope.newStaffTempName = 'the New Staff Member';
			// $scope.newStaffTitle = '';
			// $scope.newStaffFirstName = '';
			// $scope.newStaffLastName = '';
			// $scope.curSchoolId = $attrs.ngCurSchoolId;
			// $scope.curYearId = $attrs.ngCurYearId;
			// $scope.curUserID = $attrs.ngCurUserID;
			// $scope.curDate = $attrs.ngCurDateID;
			$scope.pageStatus = $attrs.ngStatus;

			$scope.newStaff = {
				iid: '-1',
				schoolid: $attrs.ngCurSchoolId,
				yearid: $attrs.ngCurYearId,
				title: '',
				first_name: '',
				middle_name: '',
				last_name: '',
				preferred_name: '',
				gender: '',
				maiden_name: '',
				personal_email: '',
				staff_type: '',
				position: '',
				replacing: '',
				previous: '',
				start_date: '',
				previous_employer: '',
				previous_employer_other: '',
				submission_date: $attrs.ngCurDateID,
				who_submitted: $attrs.ngCurUserID,
				ps_created: '',
				ad_created: '',
			};

			// ajax call to list records in staff U_CDOL_STAFF_CHANGES table
			$scope.getStaffResults = function () {
				loadingDialog();
				$http({
					url: '/admin/cdol/staffchange/data/getStaffChanges.json',
					method: 'GET',
					params: { curSchoolId: $attrs.ngCurSchoolId, curYearId: $attrs.ngCurYearId },
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

			// submitting new staff change record
			$scope.submitStaffChange = function () {
				loadingDialog();
				$http({
					url: '/admin/cdol/staffchange/data/staffchangerec.html',
					method: 'POST',
					headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
					transformRequest: function (obj) {
						var str = [];
						for (var p in obj) str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]));
						return str.join('&');
					},
					data: $scope.newStaff,
				}).then(
					function successCallback(response) {
						closeLoading();
						$scope.pageStatus = 'Confirm';
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
	//edit directive
	cdolStaffApp.directive('editDirective', function () {
		return {
			restrict: 'E',
			templateUrl: '/admin/cdol/staffchange/templates/edit.html',
			// replace: true,
		};
	});
	//confirm directive
	cdolStaffApp.directive('confirmDirective', function () {
		return {
			restrict: 'E',
			templateUrl: '/admin/cdol/staffchange/templates/confirm.html',
			// replace: true,
		};
	});

	angular.bootstrap($j('#cdolStaffAppDiv'), ['cdolStaffApp']);
});
