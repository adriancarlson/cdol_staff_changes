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

			// Unique Headers
			switch (method) {
				//Create
				case 'POST':
					if (payload.dateKeys) {
						payload = formatService.objIterator(payload, payload.dateKeys, 'formatDateForApi')
					}
					delete payload.dateKeys
					if (payload.titleKeys) {
						payload = formatService.objIterator(payload, payload.titleKeys, 'titleCase')
					}
					delete payload.sentenceKeys
					if (payload.sentenceKeys) {
						console.log(payload.sentenceKeys)
						//if sentenceKeys includes 'position' delete is before passing it into objIterator delete payload.sentenceKeys[position]
						payload = formatService.objIterator(payload, payload.sentenceKeys, 'sentenceCase')
					}
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
							if (payload.dateKeys) {
								resData = formatService.objIterator(resData, payload.dateKeys, 'formatDateFromApi')
							}
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
