require(['angular', 'components/shared/index'], function (angular) {
	var cdolStaffListApp = angular.module('cdolStaffListMod', ['powerSchoolModule']);
	cdolStaffListApp.controller('cdolStaffListCtrl', function ($scope, $http, $attrs, $q) {
		$scope.spinnerActive = true;
		$scope.staffChangeCount = 0;
		$scope.newStaffList = [];
		$scope.transferStaffList = [];
		$scope.jobChangeList = [];
		$scope.nameChangeList = [];
		$scope.exitStaffList = [];

		$scope.curYearId = $attrs.ngCurYearId;
		$scope.curDate = $attrs.ngCurDate;
		$scope.adjustedYearId = new Date($attrs.ngCurDate).getFullYear() - 1991;

		$scope.loadingData = () => {
			loadingDialog();
			$j.ajax({
				url: '/admin/cdol/staffchange/data/newstaffcount.txt',
				success: function (result) {
					$j('#staffCounterLink').innerHTML = "Staff Changes ('+result+')";
				},
			});

			$scope.getPowerQueryResults('net.cdolinc.staffChanges.staff.counts', { curSchoolID: $scope.curYearId, curYearID: $scope.adjustedYearId }).then((staffCountData) => {
				$scope.staffChangeCount = staffCountData[0];
			});

			alert($scope.staffChangeCount);

			closeLoading();
		};

		// fire the function to load the data
		$scope.loadData();
	});
});
