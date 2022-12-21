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
			if (payload.dateKeys) {
				const dateKeys = payload.dateKeys
				delete payload.dateKeys
			}
			// Unique Headers
			switch (method) {
				//Create
				case 'POST':
					payload = formatService.objIterator(payload, dateKeys, 'formatDateForApi')
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
							resData = formatService.objIterator(resData, dateKeys, 'formatDateFromApi')
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
