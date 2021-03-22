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
				ac: 'prim',
			};
			// function to get PQ results
			function getPowerQueryResults(endpoint, data) {
				var deferredResponse = $q.defer();
				$http({
					url: '/ws/schema/query/' + endpoint,
					method: 'POST',
					data: data || {},
					params: { pagesize: 0 },
					headers: {
						Accept: 'application/json',
						'Content-Type': 'application/json',
					},
				}).then(
					function successCallback(response) {
						deferredResponse.resolve(response.data.record || []);
					},
					function errorCallback(response) {
						alert('Error Loading Data');
						closeLoading();
					},
				);
				return deferredResponse.promise;
			}

			// ajax call to list records in staff U_CDOL_STAFF_CHANGES table
			$scope.getStaffResults = function () {
				loadingDialog();
				getPowerQueryResults('net.cdolinc.staffChanges.staff.changes', { curSchoolId: $attrs.ngCurSchoolId, curYearId: $attrs.ngCurYearId }).then(function (staffChangeData) {
					console.log(staffChangeData);
					$scope.activityList = staffChangeData;
				});
				closeLoading();
			};

			$scope.sendEmail = function () {
				console.log('sendEmail Function Ran');
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
