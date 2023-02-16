define(['angular', 'components/shared/index', '/scripts/cdol/services/formatService.js'], function (angular) {
	angular.module('emailModule', ['powerSchoolModule']).service('emailService', function ($http, $httpParamSerializer, formatService) {
		this.emailSubmission = (helperPath, data) => {
			console.log('helperPath', helperPath)
			console.log('data', data)
			let header = {
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
			}
			console.log('emailData', data)

			$http.get(helperPath, { params: data }).then(res => {
				console.log(res.data)
				let data = $j(res.data)
				let getData = { ac: 'prim' }
				data.each(e => {
					getData[$j(this).attr('name')] = $j(this).attr('value')
				})
				console.log(getData)
				let postData = $httpParamSerializer(getData)

				$http.post(helperPath, postData, header).then(
					res => {
						if (response.status == 200) {
							res.log('post success')
						} else {
							//FAIL
							console.log('post failed')
						}
						// end of post function
					},
					res => {
						psAlert({
							message: `There was an error sending you email to the Education Technology Office. Please take a screenshot of this page and notify the Education Technology Office though other means.`,
							title: 'Email Did Not Send'
						})
					}
				)
			})
		}
	})
})
