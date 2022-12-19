define(['angular'], function (angular) {
	angular.module('psApiModule', []).service('psApiService', function ($http, $q) {
		this.psApiCall = (tableName, method, payload) => {
			let deferredResponse = $q.defer()
			tableName = tableName.toLowerCase()
			const service = this
			service.headers = {
				Accept: 'application/json',
				'Content-Type': 'application/json'
			}
			// CRUD
			switch (method) {
				//Create
				case 'POST':
					const data = { tables: {} }
					data.tables[tableName] = payload

					$http({
						url: `/ws/schema/table/${tableName}`,
						method: method,
						data: data || {},
						headers: service.headers
					}).then(
						res => {
							deferredResponse.resolve(res.data.record || [])
						},
						res => {
							psAlert({ message: `There was an error ${method}ing the data to ${table}`, title: `${method} Error` })
						}
					)
					return deferredResponse.promise
					break
				//READ
				case 'GET':
					$http({
						url: `/ws/schema/table/${tableName}/${payload}`,
						method: method,
						params: {
							projection: '*'
						}
					}).then(
						res => {
							deferredResponse.resolve(res.data.tables[tableName])
						},
						res => {
							psAlert({ message: `There was an error ${method}ing the data from ${table}`, title: `${method} Error` })
						}
					)
					return deferredResponse.promise
					break
				//UPDATE
				// DELETE
				case 'DELETE':
					$http({
						url: `/ws/schema/table/${tableName}/${payload}`,
						method: method,
						headers: service.headers
					}).then(
						res => {
							deferredResponse.resolve(res)
						},
						res => {
							psAlert({ message: `There was an error ${method}ing the data from ${table}`, title: `${method} Error` })
						}
					)
					return deferredResponse.promise
					break
			}
		}
	})
})
