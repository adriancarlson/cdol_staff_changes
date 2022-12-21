define(['angular'], function (angular) {
	angular.module('psApiModule', ['dateService']).service('psApiService', function ($http, $q, dateService) {
		this.psApiCall = (tableName, method, payload, recId) => {
			let deferredResponse = $q.defer()
			tableName = tableName.toLowerCase()
			let path = `/ws/schema/table/${tableName}`
			let url = `${path}${recId ? `/${recId}` : ''}`
			headers = {
				Accept: 'application/json',
				'Content-Type': 'application/json'
			}
			let httpObject = {
				url: `${url}`,
				method: method,
				headers: headers
			}
			// Unique Headers
			switch (method) {
				//Create
				case 'POST':
					const payDataKeys = Object.keys(payload)
					const keysToIterate = ['_date', 'dob', 'deadline']
					payDataKeys.forEach(keyName => {
						keysToIterate.forEach(iterKey => {
							if (keyName.indexOf(iterKey) !== -1) {
								payload[keyName] = dateService.formatDateForApi(payload[keyName])
							}
						})
					})
					const data = { tables: {} }
					data.tables[tableName] = payload
					httpObject['data'] = data
					break
				//READ
				case 'GET':
					httpObject['params'] = {
						projection: '*'
					}
					break
			}

			$http(httpObject).then(
				res => {
					switch (method) {
						case 'POST':
							deferredResponse.resolve(res.data.record || [])
							break
						case 'GET':
							resData = res.data.tables[tableName]
							const resDataKeys = Object.keys(resData)
							// WET code for keys rething a way to make it DRY code later
							const keysToIterate = ['_date', 'dob', 'deadline']
							resDataKeys.forEach(keyName => {
								keysToIterate.forEach(iterKey => {
									if (keyName.indexOf(iterKey) !== -1) {
										resData[keyName] = dateService.formatDateFromApi(resData[keyName])
									}
								})
							})
							deferredResponse.resolve(resData)
							break
						case 'DELETE':
							deferredResponse.resolve(res)
							break
					}
				},
				res => {
					psAlert({ message: `There was an error ${method}ing the data to ${tableName}`, title: `${method} Error` })
				}
			)
			return deferredResponse.promise
		}
	})
})
