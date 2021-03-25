define(['angular', 'components/shared/index', '/mbaReportCreator/scripts/dateService.js'], function (angular) {
	var cdolStaffApp = angular.module('cdolStaffApp', ['powerSchoolModule', 'dateService']);
	cdolStaffApp.controller('cdolStaffAppCtrl', [
		'$scope',
		'$http',
		'$attrs',
		'$q',
		'$window',
		'dateService',
		function ($scope, $http, $attrs, $q, $window, dateService) {
			$scope.userContext = {
				newStaffTempName: 'the New Staff Member',
				pageStatus: $attrs.ngStatus,
				curSchoolId: $attrs.ngCurSchoolId,
				curYearId: $attrs.ngCurYearId,
				curDate: $attrs.ngCurDate,
				curUserId: $attrs.ngCurUserId,
				curStaffId: $attrs.ngStaffChangeId,
			};

			$scope.newStaff = {
				schoolid: $scope.userContext.curSchoolId,
				yearid: $scope.userContext.curYearId,
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
				submission_date: dateService.formatDateForApi($scope.userContext.curDate),
				who_submitted: $scope.userContext.curUserId,
				ps_created: '',
				ad_created: '',
			};

			$scope.findStaffChange = function () {
				if ($scope.userContext.curStaffId !== '') {
					$scope.newStaff.id = $scope.userContext.curStaffId;
					//get existing record
					$http({
						url: '/ws/schema/table/U_CDOL_STAFF_CHANGES/' + $scope.newStaff.id,
						method: 'GET',
						params: {
							projection:
								'id,schoolid,yearid,title,first_name,middle_name,last_name,preferred_name,gender,maiden_name,personal_email,staff_type,position,replacing,previous,start_date,previous_employer,previous_employer_other,submission_date,who_submitted,ps_created,ad_created',
						},
					}).then(
						function mySuccess(response) {
							$scope.newStaff = response.data.tables.u_cdol_staff_changes;
							$scope.newStaff.start_date = dateService.formatDateFromApi($scope.newStaff.start_date);
							if ($scope.newStaff.previous === 'true') {
								$scope.newStaff.previous = 1;
								Boolean($scope.newStaff.previous);
							} else {
								$scope.newStaff.previous = 0;
							}
						},
						function myError(response) {
							//Handle Error
						},
					);
				}
			};

			$scope.submitStaffChange = function () {
				$scope.newStaff.start_date = dateService.formatDateForApi($scope.newStaff.start_date);
				let redirectPath =
					'/admin/cdol/staffchange/cdol_staff_change.html?status=Confirm&title=' + $scope.newStaff.title + '&fname=' + $scope.newStaff.first_name + '&lname=' + $scope.newStaff.last_name;
				let newRecord = {
					tables: {
						U_CDOL_STAFF_CHANGES: $scope.newStaff,
					},
				};
				$http({
					url: '/ws/schema/table/U_CDOL_STAFF_CHANGES',
					method: 'POST',
					data: newRecord,
					headers: {
						Accept: 'application/json',
						'Content-Type': 'application/json',
					},
				}).then(function (response) {
					if (response.data.result[0].status == 'SUCCESS') {
						console.log(response.data.result[0].status);
					} else {
						console.log(response.data.result[0].status);
					}
				});
				$window.location.href = redirectPath;
			};
			// function to get PQ results
			$scope.getPowerQueryResults = function (endpoint, data) {
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
			};

			// ajax call to list records in staff U_CDOL_STAFF_CHANGES table
			$scope.getStaffResults = function () {
				loadingDialog();
				$scope.getPowerQueryResults('net.cdolinc.staffChanges.staff.changes', { curSchoolID: $attrs.ngCurSchoolId, curYearID: $attrs.ngCurYearId }).then(function (staffChangeData) {
					$scope.staffList = staffChangeData;
				});
				closeLoading();
			};
		},
	]);
});
