define(['angular', 'components/shared/index'], function (angular) {
	angular.module('emailModule', ['powerSchoolModule']).service('emailService', function ($http, $httpParamSerializer) {
		this.emailSubmission = (helperPath, data) => {
			let header = {
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
			}
			const emailData = {
				curDate: data.curDate,
				curTime: data.curTime,
				emailFrom: data.emailFrom,
				emailTo: 'ps-support@cdolinc.net',
				emailSubject: data.emailSubject,
				emailBody: data.emailBody
			}

			$http.get(helperPath, { params: emailData }).then(res => {
				let data = $j(res.data)
				let getData = { ac: 'prim' }
				data.each(function (element) {
					getData[$j(this).attr('name')] = $j(this).attr('value')
				})
				let postData = $httpParamSerializer(getData)

				$http.post(helperPath, postData, header).then(
					res => {},
					res => {
						psAlert({
							message: `There was an error sending you email to the Education Technology Office. Please take a screenshot of this page and email it to ps-support@cdolinc.net with a description of the issue`,
							title: 'Email Did Not Send!'
						})
					}
				)
			})
		}
	})
})
