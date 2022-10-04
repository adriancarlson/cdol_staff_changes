define(['angular', 'components/shared/index'], function (angular) {
	var cdolStaffListApp = angular.module('cdolStaffListMod', ['powerSchoolModule']);

	cdolStaffListApp.controller('cdolStaffListCtrl', function ($scope, $http, $attrs, $q) {
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

		// function to get PQ results
		$scope.getPowerQueryResults = (endpoint, data) => {
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
				(res) => {
					deferredResponse.resolve(res.data.record || []);
				},
				(res) => {
					psAlert({ message: 'There was an error loading the Staff Change Data', title: 'Error Loading Data' });
				},
			);

			return deferredResponse.promise;
		};

		$scope.loadData = async () => {
			loadingDialog();
			// updating left nav count
			$j.ajax({
				url: '/admin/cdol/staffchange/data/newstaffcount.txt',
				success: (result) => {
					$j('#staffCounterLink').innerHTML = "Staff Changes ('+result+')";
				},
			});

			const pqData = { curSchoolID: $scope.curSchoolId, curYearID: $scope.adjustedYearId };

			// getting counts
			const countRes = await $scope.getPowerQueryResults('net.cdolinc.staffChanges.staff.counts', pqData);
			$scope.staffChangeCount = countRes[0];

			// getting new staff
			const newStaffRes = await $scope.getPowerQueryResults('net.cdolinc.staffChanges.staff.changes', { curSchoolID: $scope.curSchoolId, curYearID: $scope.adjustedYearId, changeType: 'New Staff' });
			$scope.newStaffList = newStaffRes;

			// getting transfer staff
			const transferStaffRes = await $scope.getPowerQueryResults('net.cdolinc.staffChanges.staff.changes', {
				curSchoolID: $scope.curSchoolId,
				curYearID: $scope.adjustedYearId,
				changeType: 'Transferring Staff',
			});
			$scope.transferStaffList = transferStaffRes;

			// getting job change staff
			const jobChangeRes = await $scope.getPowerQueryResults('net.cdolinc.staffChanges.staff.changes', {
				curSchoolID: $scope.curSchoolId,
				curYearID: $scope.adjustedYearId,
				changeType: 'Job Change',
			});
			$scope.jobChangeList = jobChangeRes;

			// getting name change staff
			const nameChangeRes = await $scope.getPowerQueryResults('net.cdolinc.staffChanges.staff.changes', {
				curSchoolID: $scope.curSchoolId,
				curYearID: $scope.adjustedYearId,
				changeType: 'Name Change',
			});
			$scope.nameChangeList = nameChangeRes;

			// getting exiting staff
			const exitStaffRes = await $scope.getPowerQueryResults('net.cdolinc.staffChanges.staff.changes', {
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
});
