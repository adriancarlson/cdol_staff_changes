define([
	'angular',
	'components/shared/index',
	'/scripts/cdol/services/dateService.js',
	'/scripts/cdol/services/checkboxService.js',
	'/scripts/cdol/services/camelService.js',
	'/scripts/cdol/services/pqService.js',
], function (angular) {
	var cdolStaffApp = angular.module('cdolStaffAppMod', ['powerSchoolModule', 'dateService', 'checkboxModule', 'camelModule', 'pqModule']);
	cdolStaffApp.controller('cdolStaffAppCtrl', function ($scope, $http, $attrs, $q, $window, dateService, checkboxService, camelService, pqService) {
		//initializing overall form data
		$scope.userContext = {
			pageStatus: $attrs.ngStatus,
			curSchoolId: $attrs.ngCurSchoolId,
			curYearId: $attrs.ngCurYearId,
			curDate: $attrs.ngCurDate,
			curTime: $attrs.ngCurTime,
			staffChangeId: $attrs.ngStaffChangeId,
			curUserId: $attrs.ngCurUserId,
			curStaffId: $attrs.ngCurUserId,
			curUserName: $attrs.ngCurUserName,
			curUserEmail: $attrs.ngCurUserEmail,
			curUserSchoolAbbr: $attrs.ngCurUserSchoolAbbr,
			pageContext: 'start',
		};

		$scope.submitPayload = {};

		const todayBeforeJuly = () => {
			const curYear = new Date().getFullYear();
			const firstDay = new Date(`01/01/${curYear}`);
			const lastDay = new Date(`06/30/${curYear}`);
			const today = new Date();
			$scope.userContext.isTodayBeforeJuly = today >= firstDay && today < lastDay;
		};
		todayBeforeJuly();

		// function to switch forms and set scope to hold form data
		$scope.formDipslay = (pageContext) => {
			$scope.userContext.pageContext = pageContext;
			if ($scope.submitPayload[pageContext] === undefined) {
				$scope.submitPayload[pageContext] = {};
			}
		};

		// pulls existing staff records and sets them to attributes on current page/from context scope
		$scope.getExistingStaff = async (pageContext, userDcid) => {
			$scope.submitPayload[pageContext] = { users_dcid: userDcid };

			//arguments for the PowerQuery
			const pqData = { userDcid: userDcid };

			// // getting staff List for current change type
			if (userDcid && userDcid !== -1) {
				const res = await pqService.getPQResults('net.cdolinc.staffChanges.staff.existingstaff', pqData);
				$scope.submitPayload[pageContext] = Object.assign($scope.submitPayload[pageContext], res[0]);
				$scope.$digest();
			}
		};

		$scope.submitStaffChange = async () => {
			//adding generic fields and values needed for any payload
			const commonPayload = {
				schoolid: $scope.userContext.curSchoolId,
				calendar_year: new Date().getFullYear(),
				change_type: $scope.userContext.pageContext,
				submission_date: dateService.formatDateForApi($scope.userContext.curDate),
				submission_time: $scope.userContext.curTime,
				who_submitted: $scope.userContext.curUserId,
			};
			//loop though submitPayload object
			Object.keys($scope.submitPayload).forEach((key, index) => {
				let formPayload = $scope.submitPayload[key];

				//add commonPayload to each object in submitPayload
				formPayload = Object.assign(formPayload, commonPayload);

				// constructing deadline
				if (formPayload.hasOwnProperty('date_radio')) {
					if (formPayload.date_radio === 'today') {
						formPayload.deadline = new Date();
					} else if (formPayload.date_radio === 'june30') {
						formPayload.deadline = new Date(`06/30/${formPayload.calendar_year}`);
					}
				}
				// get all date fields ready for API call
			});

			console.log('exitingStaff Payload', $scope.submitPayload);
		};
	});
	cdolStaffApp.directive('start', () => ({ templateUrl: '/admin/cdol/staff_change/directives/forms/start.html' }));
	cdolStaffApp.directive('newStaff', () => ({ templateUrl: '/admin/cdol/staff_change/directives/forms/new_staff.html' }));
	cdolStaffApp.directive('transferStaff', () => ({ templateUrl: '/admin/cdol/staff_change/directives/forms/transfer_staff.html' }));
	cdolStaffApp.directive('jobChange', () => ({ templateUrl: '/admin/cdol/staff_change/directives/forms/job_change.html' }));
	cdolStaffApp.directive('nameChange', () => ({ templateUrl: '/admin/cdol/staff_change/directives/forms/name_change.html' }));
	cdolStaffApp.directive('exitStaff', () => ({ templateUrl: '/admin/cdol/staff_change/directives/forms/exit_staff.html' }));
	cdolStaffApp.directive('confirm', () => ({ templateUrl: '/admin/cdol/staff_change/directives/forms/confirm.html' }));
});
