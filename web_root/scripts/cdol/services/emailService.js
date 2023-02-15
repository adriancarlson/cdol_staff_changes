define(['angular', 'components/shared/index'], function (angular) {
	angular.module('emailModule', ['powerSchoolModule']).service('emailService', function ($http, $httpParamSerializer) {
		this.emailSubmission = (helperPath, data) => {
			console.log('helperPath', helperPath)
			console.log('data', data)

			// const emailData = {
			// 	curDate: $scope.userContext.CurDate,
			// 	curTime: $scope.userContext.CurTime,
			// 	emailFrom: $scope.userContext.curUserEmail,
			// 	emailTo: 'ps-support@cdolinc.net',
			// 	emailSubject: $scope.newStaff.name_change + ' Submission from ' + $scope.userContext.curUserName + ' (' + $scope.userContext.curUserSchoolAbbr + ') | ' + $scope.userContext.curUserEmail,
			// 	emailBody: $scope.emailBody
			// }

			// $j.ajax({
			// 	url: '/admin/cdol/staff_change/data/emailfields.html',
			// 	method: 'POST',
			// 	contentType: 'application/x-www-form-urlencoded',
			// 	data: {
			// 		curDate: $scope.userContext.CurDate,
			// 		curTime: $scope.userContext.CurTime,
			// 		emailFrom: $scope.userContext.curUserEmail,
			// 		emailTo: 'ps-support@cdolinc.net',
			// 		emailSubject: 'Exiting Staff Submission from ' + $scope.userContext.curUserName + ' (' + $scope.userContext.curUserSchoolAbbr + ') | ' + $scope.userContext.curUserEmail,
			// 		emailBody: 'Exiting Staff Name: ' + $scope.exitingRecord.first_name + ' ' + $scope.exitingRecord.last_name
			// 	},
			// 	success: function (result) {
			// 		$j('#exitHoldingDiv').append(result)
			// 	},
			// 	complete: function () {
			// 		var data = {
			// 			ac: 'prim'
			// 		}
			// 		$j('#exitHoldingDiv')
			// 			.find('.fireaway')
			// 			.each(function () {
			// 				data[$j(this).attr('name')] = $j(this).val()
			// 			})
			// 		$j.ajax({
			// 			method: 'POST',
			// 			data: data,
			// 			complete: function () {
			// 				$j('#exitHoldingDiv').html('')
			// 			}
			// 		})
			// 	}
			// })
		}
	})
})
