define(['angular'], function (angular) {
	var myApp = angular.module('camelModule', [])

	myApp.service('camelService', function () {
		this.camelize = function (str) {
			return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match, index) {
				if (+match === 0) return ''
				return index === 0 ? match.toLowerCase() : match.toUpperCase()
			})
		}

		this.decamelize = function (str) {
			return str
				.replace(/([A-Z])/g, ' $1')
				.trim()
				.replace(/^./, function (str) {
					return str.toUpperCase()
				})
		}

		this.sentenceCase = function (str) {
			return str.replace(/(?<=(?:^|[.?!])\W*)[a-z]/g).trim()
		}
	})
})
