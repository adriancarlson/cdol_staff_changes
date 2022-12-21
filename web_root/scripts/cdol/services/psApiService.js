define(['angular'], function (angular) {
	angular.module('psApiModule', ['formatService']).service('psApiService', function ($http, $q, formatService) {
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

			const keysToIterate = ['_date', 'dob', 'deadline']
			// Unique Headers
			switch (method) {
				//Create
				case 'POST':
					payload = formatService.objIterator(payload, keysToIterate, 'formatDateForApi')
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
										resData[keyName] = formatService.formatDateFromApi(resData[keyName])
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
