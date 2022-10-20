define(['angular'], function (angular) {
	angular.module('psApiModule', []).service('psApiService', function ($http, $q) {
		this.psApiCall = (table, method, data) => {
			var deferredResponse = $q.defer();
			$http({
				url: `/ws/schema/table/${table}`,
				method: method,
				data: data || {},
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json',
				},
			}).then(
				(res) => {
					deferredResponse.resolve(res.data.record || []);
				},
				(res) => {
					psAlert({ message: `There was an error ${method}ing the data to ${table}`, title: `${method} Error` });
				},
			);
			return deferredResponse.promise;
		};
	});
});
