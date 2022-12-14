define(['angular'], function (angular) {
	angular.module('psApiModule', []).service('psApiService', function ($http, $q) {
		this.psApiCall = (tableName, method, payload) => {
			let deferredResponse = $q.defer()
			let data = {}
			switch (method) {
				case 'GET':
					data = { projection: '*' }
					break
				case 'POST':
					data = { tables: {} }
					data.tables[tableName] = payload
					break
			}

			$http({
				url: `/ws/schema/table/${tableName}`,
				method: method,
				data: data || {},
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json'
				}
			}).then(
				res => {
					deferredResponse.resolve(res.data.record || [])
				},
				res => {
					psAlert({ message: `There was an error ${method}ing the data to ${table}`, title: `${method} Error` })
				}
			)
			console.log('deferredResponse.promise', deferredResponse.promise)
			return deferredResponse.promise
		}
	})
})
