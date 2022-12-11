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
			var n = str.split(/[\\.!?]/)
			var vfinal = ''
			for (i = 0; i < n.length; i++) {
				var spaceput = ''
				var spaceCount = n[i].replace(/^(\s*).*$/, '$1').length
				n[i] = n[i].replace(/^\s+/, '')
				var newstring = n[i].charAt(n[i]).toUpperCase() + n[i].slice(1)
				for (j = 0; j < spaceCount; j++) spaceput = spaceput + ' '
				vfinal = vfinal + spaceput + newstring + '.'
			}
			vfinal = vfinal.substring(0, vfinal.length - 1)
			return vfinal
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
