'use strict'
define(function (require) {
	var module = require('components/staff_change/module')
	module.factory('pqService', [
		'$q',
		'$http',
		function ($q, $http) {
			return {
				//query - the name of the PowerQuery
				//data - JavaScript Object including any parameters that must be passed to the query
				getPQResults: (query, data) => {
					var deferredResponse = $q.defer()
					$http({
						url: '/ws/schema/query/' + query,
						method: 'POST',
						data: data || {},
						params: { pagesize: 0 },
						headers: {
							Accept: 'application/json',
							'Content-Type': 'application/json'
						}
					}).then(
						res => {
							deferredResponse.resolve(res.data.record || [])
						},
						res => {
							psAlert({ message: `There was an error loading the data from ${query}`, title: 'Error Loading Data' })
						}
					)
					return deferredResponse.promise
				}
			}
		}
	])
})
