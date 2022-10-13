define(['angular', 'components/shared/index', '/scripts/cdol/services/dateService.js', '/scripts/cdol/services/checkboxService.js'], function (angular) {
	var cdolStaffApp = angular.module('cdolStaffAppMod', ['powerSchoolModule', 'dateService', 'checkboxModule']);
	cdolStaffApp.controller('cdolStaffAppCtrl', [
		'$scope',
		'$http',
		'$attrs',
		'$q',
		'$window',
		'dateService',
		'checkboxService',
		function ($scope, $http, $attrs, $q, $window, dateService, checkboxService) {
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
				step: 'start',
			};

			$scope.formDipslay = (step) => {
				$scope.step = step;
			}
		},
	]);
	cdolStaffApp.directive('start', () => ({ templateUrl: '/admin/cdol/staff_change/directives/forms/start.html' }));
	cdolStaffApp.directive('newStaff', () => ({ templateUrl: '/admin/cdol/staff_change/directives/forms/new_staff.html' }));
	cdolStaffApp.directive('transferStaff', () => ({ templateUrl: '/admin/cdol/staff_change/directives/forms/transfer_staff.html' }));
	cdolStaffApp.directive('jobChange', () => ({ templateUrl: '/admin/cdol/staff_change/directives/forms/job_change.html' }));
	cdolStaffApp.directive('nameChange', () => ({ templateUrl: '/admin/cdol/staff_change/directives/forms/name_change.html' }));
	cdolStaffApp.directive('exitStaff', () => ({ templateUrl: '/admin/cdol/staff_change/directives/forms/exit_staff.html' }));
	cdolStaffApp.directive('confirm', () => ({ templateUrl: '/admin/cdol/staff_change/directives/forms/confirm.html' }));
});
