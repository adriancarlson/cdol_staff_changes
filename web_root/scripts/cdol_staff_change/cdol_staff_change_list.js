define(['angular', 'components/shared/index', '/scripts/cdol/services/pqService.js'], function (angular) {
	var cdolStaffListApp = angular.module('cdolStaffListMod', ['powerSchoolModule', 'pqModule']);

	cdolStaffListApp.controller('cdolStaffListCtrl', function ($scope, $attrs, pqService) {
		$scope.staffChangeCounts = [];
		$scope.newStaffList = [];
		$scope.transferStaffList = [];
		$scope.jobChangeList = [];
		$scope.nameChangeList = [];
		$scope.exitStaffList = [];
		$scope.curSchoolId = $attrs.ngCurSchoolId;
		$scope.curYearId = $attrs.ngCurYearId;
		$scope.curDate = $attrs.ngCurDate;
		$scope.adjustedYearId = new Date($attrs.ngCurDate).getFullYear() - 1991;

		console.log('new staff length', $scope.newStaffList.length);

		$scope.loadData = async (changeType) => {
			loadingDialog();

			const pqData = { curSchoolID: $scope.curSchoolId, curYearID: $scope.adjustedYearId };

			// getting staff counts
			const countRes = await pqService.getPQResults('net.cdolinc.staffChanges.staff.counts', pqData);
			$scope.staffChangeCounts = countRes[0];

			// adding new new change type key/value pair for PQ call to staff list
			pqData.changeType = changeType;

			// getting staff List
			const staffList = await pqService.getPQResults('net.cdolinc.staffChanges.staff.changes', pqData);

			$scope.newStaffList = staffList;

			console.log('new staff length after PQ Ran', $scope.newStaffList.length);
			// // getting transfer staff
			// const transferStaffRes = await pqService.getPQResults('net.cdolinc.staffChanges.staff.changes', {
			// 	curSchoolID: $scope.curSchoolId,
			// 	curYearID: $scope.adjustedYearId,
			// 	changeType: 'Transferring Staff',
			// });
			// $scope.transferStaffList = transferStaffRes;

			// // getting job change staff
			// const jobChangeRes = await pqService.getPQResults('net.cdolinc.staffChanges.staff.changes', {
			// 	curSchoolID: $scope.curSchoolId,
			// 	curYearID: $scope.adjustedYearId,
			// 	changeType: 'Job Change',
			// });
			// $scope.jobChangeList = jobChangeRes;

			// // getting name change staff
			// const nameChangeRes = await pqService.getPQResults('net.cdolinc.staffChanges.staff.changes', {
			// 	curSchoolID: $scope.curSchoolId,
			// 	curYearID: $scope.adjustedYearId,
			// 	changeType: 'Name Change',
			// });
			// $scope.nameChangeList = nameChangeRes;

			// // getting exiting staff
			// const exitStaffRes = await pqService.getPQResults('net.cdolinc.staffChanges.staff.changes', {
			// 	curSchoolID: $scope.curSchoolId,
			// 	curYearID: $scope.adjustedYearId,
			// 	changeType: 'Exiting Staff',
			// });
			// $scope.exitStaffList = exitStaffRes;

			$j('#cdol-staff-count').text(`Staff Changes (${$scope.staffChangeCounts.total_remaining})`);

			closeLoading();
		};

		// fire the function to load the data
		$scope.loadData('New Staff');
	});
	cdolStaffListApp.directive('newStaffList', () => ({ templateUrl: '/admin/cdol/staff_change/directives/tabs/new_staff_list.html' }));
	cdolStaffListApp.directive('transferStaffList', () => ({ templateUrl: '/admin/cdol/staff_change/directives/tabs/transfer_staff_list.html' }));
	cdolStaffListApp.directive('jobChangeList', () => ({ templateUrl: '/admin/cdol/staff_change/directives/tabs/job_change_list.html' }));
	cdolStaffListApp.directive('nameChangeList', () => ({ templateUrl: '/admin/cdol/staff_change/directives/tabs/name_change_list.html' }));
	cdolStaffListApp.directive('exitStaffList', () => ({ templateUrl: '/admin/cdol/staff_change/directives/tabs/exit_staff_list.html' }));
});
