define(['angular', 'components/shared/index'], function (angular) {
	//Begin Module

	var staffChangeListApp = angular.module('staffChangeListApp', ['powerSchoolModule']);
	staffChangeListApp.controller('staffChangeListCtrl', ['$scope', '$http','$attrs', function ($scope, $http, $attrs) {
        $scope.curSchoolId = $attrs.ngCurSchoolId;
        $scope.curYearId = $attrs.ngCurYearId;
	loadingDialog();
    $http({
        url: '/admin/cdol/scripts/getStaffChanges.json',
        method: 'GET',
        params: { schoolid: $scope.curSchoolId, yearid: $scope.curYearId },
    }).then(function (response) {
        $scope.staffChangeList = response.data;
        $scope.staffChangeList.pop();
        closeLoading();
    });
};
    }]); //End Controller
}); //End Module
