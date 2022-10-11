define(['angular'], function (angular) {
	angular.module('dateService', []).service('dateService', function () {
		var dateSvc = this;
		dateSvc.dateFormat = 'mm/dd/yyyy';
		dateSvc.monthIndex = 0;
		dateSvc.dayIndex = 1;
		dateSvc.yearIndex = 2;
		dateSvc.delimiter = '/';

		this.setDateFormat = function (dateString) {
			dateString = dateString.toLowerCase();
			var dateParts = dateString.split(/[.,\/ -]/);
			if (dateParts.length != 3) return;
			if (!dateParts.includes('mm') || !dateParts.includes('dd') || !dateParts.includes('yyyy')) return;
			dateSvc.dateFormat = dateString;
			dateSvc.monthIndex = dateParts.indexOf('mm');
			dateSvc.dayIndex = dateParts.indexOf('dd');
			dateSvc.yearIndex = dateParts.indexOf('yyyy');
			if (dateString.indexOf('/') > 0) dateSvc.delimiter = '/';
			else if (dateString.indexOf(',') > 0) dateSvc.delimiter = ',';
			else if (dateString.indexOf('.') > 0) dateSvc.delimiter = '.';
			else if (dateString.indexOf('-') > 0) dateSvc.delimiter = '-';
		};

		//dt - date string (PS date format ~[dateformat])
		//return date string (yyyy-mm-dd)
		this.formatDateForApi = function (dt) {
			if (!dt) return '';
			var dateParts = dt.split(dateSvc.delimiter);
			if (dateParts.length != 3) return '';
			var m = dateParts[dateSvc.monthIndex];
			var d = dateParts[dateSvc.dayIndex];
			var y = dateParts[dateSvc.yearIndex];
			return y + '-' + m + '-' + d;
		};

		//dt - date string (yyyy-dd-mm)
		//return date string (PS date format ~[dateformat])
		this.formatDateFromApi = function (dt) {
			if (!dt) return '';
			var dateParts = dt.split('-');
			if (dateParts.length != 3) return '';
			var y = dateParts[0];
			var m = dateParts[1];
			var d = dateParts[2];
			return dateSvc.getPsDateString(m, d, y);
		};

		//dt - javascript date object
		//return date string format PS date format ~[dateformat]
		this.dateToString = function (dt) {
			var d = dt.getDate();
			var m = dt.getMonth() + 1; //January is 0!
			var y = dt.getFullYear();
			if (d < 10) d = '0' + d;
			if (m < 10) m = '0' + m;
			if (isNaN(m)) return '';
			return dateSvc.getPsDateString(m, d, y);
		};

		this.getPsDateString = function (m, d, y) {
			returnVal = '';
			for (var i = 0; i < 3; i++) {
				if (dateSvc.monthIndex == i) returnVal += m;
				else if (dateSvc.dayIndex == i) returnVal += d;
				else returnVal += y;
				if (i < 2) returnVal += dateSvc.delimiter;
			}
			return returnVal;
		};

		//accept a string date (PS date format ~[dateformat])
		//return string representation of date plus increment days
		this.addDays = function (dateString, increment) {
			var dateParts = dateString.split(dateSvc.delimiter);
			var m = dateParts[dateSvc.monthIndex];
			var d = dateParts[dateSvc.dayIndex];
			var y = dateParts[dateSvc.yearIndex];
			var dateVal = new Date();
			dateVal.setMonth(0);
			dateVal.setDate(d);
			dateVal.setYear(y);
			dateVal.setMonth(m - 1);
			dateVal.setDate(dateVal.getDate() + increment);
			return this.dateToString(dateVal);
		};
	}); // End dateService
}); // End define
