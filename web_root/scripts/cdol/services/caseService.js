define(['angular'], function (angular) {
	var myApp = angular.module('caseModule', [])

	myApp.service('caseService', function () {
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
			return clean(str)
				.replace(/[a-z]/i, function (letter) {
					return letter.toUpperCase()
				})
				.trim()
		}

		this.titleCase = function (str) {
			return str
				.toLowerCase()
				.split(' ')
				.map(function (word) {
					return word.charAt(0).toUpperCase() + word.slice(1)
				})
				.join(' ')
				.trim()
		}
	})
})
