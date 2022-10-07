define(['angular', 'components/shared/index', '/scripts/cdol/services/pqService.js', '/scripts/cdol/services/camelService.js'], function (angular) {
	var cdolStaffListApp = angular.module('cdolStaffListMod', ['powerSchoolModule', 'pqModule', 'camelModule']);

	cdolStaffListApp.controller('cdolStaffListCtrl', function ($scope, $attrs, pqService, camelService) {
		$scope.staffChangeCounts = [];
		$scope.staffList = {};
		$scope.curSchoolId = $attrs.ngCurSchoolId;
		$scope.curYearId = $attrs.ngCurYearId;
		$scope.curDate = $attrs.ngCurDate;
		$scope.adjustedYearId = new Date($attrs.ngCurDate).getFullYear() - 1991;

		$scope.loadData = async (changeType) => {
			loadingDialog();

			// camelize changeType passed in
			const camelChangeType = camelService.camelize(changeType);

			console.log('Before $scope.staffList', $scope.staffList);
			console.log('Before API Calls', $scope.staffList.hasOwnProperty(camelChangeType));

			//only make API call to get the data if
			if (!$scope.staffList.hasOwnProperty(camelChangeType)) {
				console.log(`Running ... API call for ${camelChangeType}`);
				//setting up arguments for PQ call
				const pqData = { curSchoolID: $scope.curSchoolId, curYearID: $scope.adjustedYearId };

				// getting staff counts
				const countRes = await pqService.getPQResults('net.cdolinc.staffChanges.staff.counts', pqData);
				$scope.staffChangeCounts = countRes[0];

				// adding new new change type key/value pair for PQ call to staff list
				pqData.changeType = changeType;

				//setting up function to add key and value staff list to staffList object
				const updateStaffList = (key, value) => ($scope.staffList[key] = value);

				// getting staff List for current change type
				const res = await pqService.getPQResults('net.cdolinc.staffChanges.staff.changes', pqData);

				//updating staffList obj
				updateStaffList(camelChangeType, res);

				$scope.$digest();

				//setting left nav count
				$j('#cdol-staff-count').text(`Staff Changes (${$scope.staffChangeCounts.total_remaining})`);
			}
			console.log('After $scope.staffList', $scope.staffList);
			console.log('After API Calls', $scope.staffList.hasOwnProperty(camelChangeType));
			closeLoading();
		};

		// fire the function to load the data
		$scope.loadData('New Staff');

		// grab selected tab reload data and have the selected tab display data
		$scope.reloadData = () => {
			const selectedTab = document.querySelector('[aria-selected="true"]').getAttribute('data-context');
			$scope.staffChangeCounts = [];
			$scope.staffList = {};
			console.log('Reloading ... $scope.staffChangeCounts', $scope.staffChangeCounts);
			console.log('Reloading ... $scope.staffList', $scope.staffList);
			$scope.loadData(selectedTab);
		};
	});
	cdolStaffListApp.directive('newStaffList', () => ({ templateUrl: '/admin/cdol/staff_change/directives/tabs/new_staff_list.html' }));
	cdolStaffListApp.directive('transferStaffList', () => ({ templateUrl: '/admin/cdol/staff_change/directives/tabs/transfer_staff_list.html' }));
	cdolStaffListApp.directive('jobChangeList', () => ({ templateUrl: '/admin/cdol/staff_change/directives/tabs/job_change_list.html' }));
	cdolStaffListApp.directive('nameChangeList', () => ({ templateUrl: '/admin/cdol/staff_change/directives/tabs/name_change_list.html' }));
	cdolStaffListApp.directive('exitStaffList', () => ({ templateUrl: '/admin/cdol/staff_change/directives/tabs/exit_staff_list.html' }));
});
