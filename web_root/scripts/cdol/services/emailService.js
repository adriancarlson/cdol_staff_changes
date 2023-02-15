define(['angular', 'components/shared/index', '/scripts/cdol/services/formatService.js'], function (angular) {
	angular.module('emailModule', ['powerSchoolModule', 'formatService']).service('emailService', function ($http, $httpParamSerializer, formatService) {
		this.emailSubmission = (helperPath, data) => {
			console.log('helperPath', helperPath)
			console.log('data', data)
			let readableChangeType = formatService.decamelize(data.change_type)
			let header = {
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
			}
			const emailData = {
				curDate: data.curDate,
				curTime: data.curTime,
				emailFrom: data.curUserEmail,
				emailTo: 'ps-support@cdolinc.net',
				emailSubject: `${readableChangeType} Submission from ${data.curUserName} (${data.curUserSchoolAbbr}) | ${data.curUserEmail}`,
				emailBody: `${readableChangeType} Name: ${data.old_name_placeholder ? `${data.old_name_placeholder}` : `${data.title} ${data.first_name} ${data.last_name}`}`
			}

			console.log('emailData', emailData)

			$http.get(helperPath, { params: emailData }).then(function (response) {
				console.log(response.data)
				let data = $j(response.data)
				let getData = { ac: 'prim' }
				data.each(function (element) {
					getData[$j(this).attr('name')] = $j(this).attr('value')
				})
				console.log(getData)
				let postData = $httpParamSerializer(getData)

				$http.post(helperPath, postData, header).then(function (response) {
					if (response.status == 200) {
						console.log('post success')
					} else {
						//FAIL
						console.log('post failed')
					}
					// end of post function
				})
			})
		}
	})
})
