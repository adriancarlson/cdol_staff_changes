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

		// function to switch forms
		$scope.formDipslay = (pageContext) => {
			$scope.userContext.pageContext = pageContext;
			const camelPageContext = camelService.camelize(pageContext);
			$scope[camelPageContext] = {};
		};

		// pulls existing staff records and sets them to attributes on current page/from context scope
		$scope.getExistingStaff = async (pageContext, userDcid) => {
			const camelPageContext = camelService.camelize(pageContext);
			console.log(camelPageContext);
			console.log(userDcid);

			const pqData = { userDcid: userDcid };

			// // getting staff List for current change type
			const res = await pqService.getPQResults('net.cdolinc.staffChanges.staff.existingstaff', pqData);
			console.log(res[0].first_name);
			$scope[camelPageContext].title = res[0].title;
			$scope[camelPageContext].first_name = res[0].first_name;
			$scope[camelPageContext].middle_name = res[0].middle_name;
			$scope[camelPageContext].last_name = res[0].last_name;

			// $scope[camelPageContext] = res[0];

			$scope.$digest();
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
