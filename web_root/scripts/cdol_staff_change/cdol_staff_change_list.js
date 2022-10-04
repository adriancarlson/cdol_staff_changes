define(['angular', 'components/shared/index', '/scripts/cdol/services/pqService.js'], function (angular) {
	var cdolStaffListApp = angular.module('cdolStaffListMod', ['powerSchoolModule', 'pqModule']);

	cdolStaffListApp.controller('cdolStaffListCtrl', function ($scope, $http, $attrs, pqService) {
		$scope.staffChangeCount = 0;
		$scope.newStaffList = [];
		$scope.transferStaffList = [];
		$scope.jobChangeList = [];
		$scope.nameChangeList = [];
		$scope.exitStaffList = [];
		$scope.curSchoolId = $attrs.ngCurSchoolId;
		$scope.curYearId = $attrs.ngCurYearId;
		$scope.curDate = $attrs.ngCurDate;
		$scope.adjustedYearId = new Date($attrs.ngCurDate).getFullYear() - 1991;

		$scope.loadData = async () => {
			loadingDialog();

			const pqData = { curSchoolID: $scope.curSchoolId, curYearID: $scope.adjustedYearId };

			// getting counts
			const countRes = await pqService.getPQResults('net.cdolinc.staffChanges.staff.counts', pqData);
			$scope.staffChangeCount = countRes[0];
			$j('#cdol-staff-count').innerHTML = "Staff Changes ('+$scope.staffChangeCount.total_remaining+')";

			// getting new staff
			const newStaffRes = await pqService.getPQResults('net.cdolinc.staffChanges.staff.changes', { curSchoolID: $scope.curSchoolId, curYearID: $scope.adjustedYearId, changeType: 'New Staff' });
			$scope.newStaffList = newStaffRes;

			// getting transfer staff
			const transferStaffRes = await pqService.getPQResults('net.cdolinc.staffChanges.staff.changes', {
				curSchoolID: $scope.curSchoolId,
				curYearID: $scope.adjustedYearId,
				changeType: 'Transferring Staff',
			});
			$scope.transferStaffList = transferStaffRes;

			// getting job change staff
			const jobChangeRes = await pqService.getPQResults('net.cdolinc.staffChanges.staff.changes', {
				curSchoolID: $scope.curSchoolId,
				curYearID: $scope.adjustedYearId,
				changeType: 'Job Change',
			});
			$scope.jobChangeList = jobChangeRes;

			// getting name change staff
			const nameChangeRes = await pqService.getPQResults('net.cdolinc.staffChanges.staff.changes', {
				curSchoolID: $scope.curSchoolId,
				curYearID: $scope.adjustedYearId,
				changeType: 'Name Change',
			});
			$scope.nameChangeList = nameChangeRes;

			// getting exiting staff
			const exitStaffRes = await pqService.getPQResults('net.cdolinc.staffChanges.staff.changes', {
				curSchoolID: $scope.curSchoolId,
				curYearID: $scope.adjustedYearId,
				changeType: 'Exiting Staff',
			});
			$scope.exitStaffList = exitStaffRes;

			closeLoading();
		};

		// fire the function to load the data
		$scope.loadData();
	});
	cdolStaffListApp.directive('newStaffList', () => ({ templateUrl: '/admin/cdol/staff_change/directives/tabs/new_staff_list.html' }));
	cdolStaffListApp.directive('transferStaffList', () => ({ templateUrl: '/admin/cdol/staff_change/directives/tabs/transfer_staff_list.html' }));
	cdolStaffListApp.directive('jobChangeList', () => ({ templateUrl: '/admin/cdol/staff_change/directives/tabs/job_change_list.html' }));
	cdolStaffListApp.directive('nameChangeList', () => ({ templateUrl: '/admin/cdol/staff_change/directives/tabs/name_change_list.html' }));
	cdolStaffListApp.directive('exitStaffList', () => ({ templateUrl: '/admin/cdol/staff_change/directives/tabs/exit_staff_list.html' }));
});
