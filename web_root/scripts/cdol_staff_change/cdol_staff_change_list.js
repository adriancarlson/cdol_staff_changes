define(['angular', 'components/shared/index'], function (angular) {
	var cdolStaffListApp = angular.module('cdolStaffListMod', ['powerSchoolModule']);

	cdolStaffListApp.controller('cdolStaffListCtrl', function ($scope, $http, $attrs, $q) {
		$scope.spinnerActive = true;
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

		$scope.loadData = function () {
			loadingDialog();
			$j.ajax({
				url: '/admin/cdol/staffchange/data/newstaffcount.txt',
				success: function (result) {
					$j('#staffCounterLink').innerHTML = "Staff Changes ('+result+')";
				},
			});

			$scope.getPowerQueryResults('net.cdolinc.staffChanges.staff.counts', { curSchoolID: $scope.curSchoolId, curYearID: $scope.adjustedYearId }).then((staffCountData) => {
				$scope.staffChangeCount = staffCountData[0];
			});
			closeLoading();
		};

		// fire the function to load the data
		$scope.loadData();
	});
});
