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
			// global variables passed in by gpvs assigned to attributes on the screen then passed in to angular by the $attrs and assigned to a global user context object.
			$scope.userContext = {
				newStaffTempName: 'The New Staff Member',
				pageStatus: $attrs.ngStatus,
				curSchoolId: $attrs.ngCurSchoolId,
				curYearId: $attrs.ngCurYearId,
				curDate: $attrs.ngCurDate,
				curTime: $attrs.ngCurTime,
				curUserId: $attrs.ngCurUserId,
				curStaffId: $attrs.ngStaffChangeId,
			};

			$scope.dupSearchParams = {
				lastName: '',
				maidenName: '',
				firstNameSubString: '',
			};

			//initializing blank staff record for use in submissions
			$scope.newStaff = {
				schoolid: $scope.userContext.curSchoolId,
				yearid: $scope.userContext.curYearId,
				name_change: '',
				title: '',
				first_name: '',
				middle_name: '',
				last_name: '',
				preferred_name: '',
				gender: '',
				dob: '',
				maiden_name: '',
				religion: '',
				religiousclergylay: '',
				personal_email: '',
				staff_type: '',
				position: '',
				fte: '',
				replacing: '',
				previous: '',
				start_date: '',
				early_setup: '',
				deadline: '',
				previous_employer: '',
				previous_employer_other: '',
				submission_date: dateService.formatDateForApi($scope.userContext.curDate),
				submission_time: $scope.userContext.curTime,
				who_submitted: $scope.userContext.curUserId,
				notes: '',
				ps_created: '',
				ad_created: '',
				lms_created: '',
			};

			//if on edit screen and passing an staff change id then this runs to pull the data for the current staff change record.
			$scope.findStaffChange = function () {
				loadingDialog();
				if ($scope.userContext.curStaffId !== '') {
					$scope.newStaff.id = $scope.userContext.curStaffId;
					//get existing record
					$http({
						url: '/ws/schema/table/U_CDOL_STAFF_CHANGES/' + $scope.newStaff.id,
						method: 'GET',
						params: {
							projection: '*',
						},
					}).then(
						function mySuccess(response) {
							$scope.newStaff = response.data.tables.u_cdol_staff_changes;
							$scope.newStaff.start_date = dateService.formatDateFromApi($scope.newStaff.start_date);
							$scope.newStaff.dob = dateService.formatDateFromApi($scope.newStaff.dob);
							$scope.newStaff.deadline = dateService.formatDateFromApi($scope.newStaff.deadline);
							//setting up params for dup search
							$scope.dupSearchParams.lastName = response.data.tables.u_cdol_staff_changes.last_name;
							$scope.dupSearchParams.maidenName = response.data.tables.u_cdol_staff_changes.maiden_name;
							$scope.dupSearchParams.firstNameSubString = response.data.tables.u_cdol_staff_changes.first_name.substring(0, 3);

							if ($scope.dupSearchParams.maidenName === undefined) {
								$scope.dupSearchParams.maidenName = $scope.dupSearchParams.lastName;
							}
							$scope.searchForDups();
						},
						function myError(response) {
							psAlert({ message: 'Staff Change Data could not be loaded.', title: 'Error Loading Record' });
						},
					);
				}
				closeLoading();
			};
			$scope.searchForDups = function () {
				$scope
					.getPowerQueryResults('net.cdolinc.staffChanges.staff.duplicates', {
						lastName: $scope.dupSearchParams.lastName.toLowerCase(),
						maidenName: $scope.dupSearchParams.maidenName.toLowerCase(),
						firstNameSubString: $scope.dupSearchParams.firstNameSubString.toLowerCase(),
					})
					.then(function (dupData) {
						$scope.dupList = dupData;
					});
			};

			//submitting New Staff change record
			$scope.submitStaffChange = function () {
				$scope.newStaff.start_date = dateService.formatDateForApi($scope.newStaff.start_date);
				$scope.newStaff.dob = dateService.formatDateForApi($scope.newStaff.dob);
				$scope.newStaff.deadline = dateService.formatDateForApi($scope.newStaff.deadline);
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
					} else {
						psAlert({ message: 'There was an error submitting the record. Changes were not saved', title: 'Error Submitting Record' });
					}
				});
				$window.location.href = redirectPath;
			};

			//updating staff record
			$scope.submitStaffUpdate = function () {
				if ($scope.userContext.curStaffId !== '') {
					$scope.newStaff.start_date = dateService.formatDateForApi($scope.newStaff.start_date);
					$scope.newStaff.dob = dateService.formatDateForApi($scope.newStaff.dob);
					$scope.newStaff.deadline = dateService.formatDateForApi($scope.newStaff.deadline);
					let redirectPath = '/admin/cdol/staffchange/cdol_staff_change_list.html';
					let updateRecord = {
						tables: {
							U_CDOL_STAFF_CHANGES: $scope.newStaff,
						},
					};
					$http({
						url: '/ws/schema/table/U_CDOL_STAFF_CHANGES/' + $scope.userContext.curStaffId,
						method: 'PUT',
						data: updateRecord,
						headers: {
							Accept: 'application/json',
							'Content-Type': 'application/json',
						},
					}).then(function (response) {
						if (response.data.result[0].status == 'SUCCESS') {
						} else {
							psAlert({ message: 'There was an error updating the record. Changes were not saved', title: 'Error Updating Data' });
						}
					});
					$window.location.href = redirectPath;
				}
			};

			//Deleteing staff Record
			$scope.deleteStaffChange = function () {
				if ($scope.userContext.curStaffId !== '') {
					let redirectPath = '/admin/cdol/staffchange/cdol_staff_change_list.html';
					$http({
						url: '/ws/schema/table/U_CDOL_STAFF_CHANGES/' + $scope.userContext.curStaffId,
						method: 'DELETE',
						headers: {
							Accept: 'application/json',
							'Content-Type': 'application/json',
						},
					});
					$window.location.href = redirectPath;
				}
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
						psAlert({ message: 'There was an error loading the Staff Change Data', title: 'Error Loading Data' });
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
