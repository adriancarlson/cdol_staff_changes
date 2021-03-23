define(['angular', 'components/shared/index'], function (angular) {
	var cdolStaffApp = angular.module('cdolStaffApp', ['powerSchoolModule']);
	cdolStaffApp.controller('cdolStaffAppCtrl', [
		'$scope',
		'$http',
		'$attrs',
		'$q',
		function ($scope, $http, $attrs, $q) {
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
			//@param {string} dt (mm/dd/yyyy)
			//@return {string} (yyyy-mm-dd)
			$scope.formatDateForApi = function (dt) {
				var dateParts = dt.split('/');
				var m = dateParts[0];
				var d = dateParts[1];
				var y = dateParts[2];
				return y + '-' + m + '-' + d;
			};

			//@param {string} dt (yyyy-dd-mm)
			//@return {string} (mm/dd/yyyy)
			$scope.formatDateFromApi = function (dt) {
				var dateParts = dt.split('-');
				var y = dateParts[0];
				var m = dateParts[1];
				var d = dateParts[2];
				return m + '/' + d + '/' + y;
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

			$scope.sendEmail = function () {
				console.log('sendEmail Function Ran');
			};

			// submitting new staff change record

			$scope.submitStaffChange = function () {
				loadingDialog();

				var newRecord = {
					tables: {
						U_CDOL_STAFF_CHANGES: {
							schoolid: $scope.newStaff.schoolid,
							yearid: $scope.newStaff.yearid,
							title: $scope.newStaff.title,
							first_name: $scope.newStaff.first_name,
							middle_name: $scope.newStaff.middle_name,
							last_name: $scope.newStaff.last_name,
							preferred_name: $scope.newStaff.preferred_name,
							maiden_name: $scope.newStaff.maiden_name,
							gender: $scope.newStaff.gender,
							personal_email: $scope.newStaff.personal_email,
							staff_type: $scope.newStaff.staff_type,
							position: $scope.newStaff.position,
							replacing: $scope.newStaff.replacing,
							start_date: $scope.formatDateForApi($scope.newStaff.start_date),
							previous: $scope.newStaff.previous,
							previous_employer: $scope.newStaff.previous_employer,
							previous_employer_other: $scope.newStaff.previous_employer_other,
							submission_date: formatDateForApi($scope.newStaff.submission_date),
							who_submitted: $scope.newStaff.who_submitted,
							ps_created: $scope.newStaff.ps_created,
							ad_created: $scope.newStaff.ad_created,
						},
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
						console.log(response);
						closeLoading();
						$scope.pageStatus = 'Confirm';
					} else {
						psAlert({ message: 'There was an error submitting the record. Please contact The Ed Tech office', title: 'Staff Change Submission Error' });
						closeLoading();
					}
				});
			};
		},
	]);

	//form directive
	cdolStaffApp.directive('formDirective', function () {
		return {
			restrict: 'E',
			templateUrl: '/admin/cdol/staffchange/templates/form.html',
			// replace: true,
			controller: ('formController', ['$scope', '$http', '$attrs', '$q', function ($scope, $http, $attrs, $q) {}]),
			controllerAs: 'form',
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
