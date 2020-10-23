"use strict"; // Defines that JavaScript code should be executed in "strict mode".
// SIMATIC S7 PLC Controller Framework - using jQuery Framework
// bastian.geier@siemens.com , Siemens AG

var S7Framework = (function($, undefined){
	var version = "0.1.23";
	// type of variable - 0=Bool, 1=unsigned INT, 2=signed INT, 3=real, 4=LReal, 5=String, 10=DateAndTime
	var BOOL = 0, UINT = 1, INT = 2, REAL = 3, LREAL = 4, STRING = 5, DATE_AND_TIME = 10;
	var DEBUG = false;
	var initialized = false;
	var initializedRetVal = false;
	// CPU Type for different functions
	var _plcType = null;
	// Diagnostic tags
	var diagElements = {};
	var diagInitialized = false;
	//AlarmTags
	var urlAlarmTable = "";
	var alarmElements = {};
	var alarmInitialized = false;
	var MultiUseToken = "";
	var firstRetVal;
	// state tags for referer
	var prevState;
	var prevTitle;
	var prevUrl;

	// general functions
	function htmlDecodeEntities(value) {
		return (typeof value === 'undefined') ? '' : $('<div/>').html(value).text();
	}

	function strTrim(x) {
		return x.replace(/^\s+|\s+$/gm,'');
	}
	// general functions

	// decode ASCII coded string transfer
	function convString(DATA, LEN, TYPE, STR, ERROR) {
		var i = 0, j = 0;
		var values = [];
		// remove every form of white space
		DATA = htmlDecodeEntities(DATA);
		DATA = DATA.replace(/"|'|\s/g, "")
		LEN  = LEN.replace(/"|'|\s/g, "");
		TYPE = TYPE.replace(/"|'|\s/g, "");
		STR = htmlDecodeEntities(STR);
		STR = STR.replace(/"|'|\s/g, "");
		console.assert(!DEBUG,"CONV Items=", DATA, LEN, TYPE, STR);
		LEN = LEN.split(";");
		TYPE = TYPE.split(";");
		STR = STR.split(";");
		// convert LEN & TYPE to integer
		while(i < LEN.length){
			LEN[i]  = parseInt(LEN[i],10);
			TYPE[i] = parseInt(TYPE[i],10);
			i++;
		}
		i = 0;
		// loop trough string, disassembly and extract content
		while((j < DATA.length) && (i < LEN.length)){
			values[i] = (TYPE[i] != 5 ) ? convAsciiToHex(DATA.substr(j,LEN[i]),LEN[i]) : DATA.substr(j,LEN[i]);
			console.assert(!DEBUG,"Decode string part =", i, values[i], TYPE[i]);
			switch(TYPE[i]){
				case 0: // BOOL
					values[i] = HexToBool(values[i]);
					break;
				case 1: // INT
				case 2: // INT
					values[i] = HexToInt(values[i],TYPE[i],LEN[i]);
					break;
				case 3: // Real
					values[i] = HexToReal(values[i]);
					break;
				case 4: // LReal
					//values[i] = HexToLReal(values[i]);
					values[i] = HexToLongFloat(DATA.substr(j,LEN[i]));
					break;
				case 5: // String
					// nothing to do
					break;
				case 10: // Date and time
					// len == 22 !!! // 24 incl. Weekday, done by javascript :-)
					values[i] = HexToDateAndTime(DATA.substr(j,LEN[i]));
					break;
				default:
					console.error("Type input failure in function -convString()- @ index" + i + "\n" + ERROR);
					break;
			}
			j += LEN[i];
			i++;
		}
		for(var index in STR) {
			values[i] = STR[index];
			i++;
		}
		return values
	}

	function convAsciiToHex(ASCII, N){
		var result = 0;
		var zeichen = 0;
		for(var i=0; i<N; i++){
			if(('0' <= ASCII[i]) && (ASCII[i] <= '9')){
				zeichen = ASCII.charCodeAt(i) - 48;
			}
			else if(('A'<=ASCII[i])&&(ASCII[i]<='F')){
				zeichen = ASCII.charCodeAt(i) - 55;
			}
			else if(('a'<=ASCII[i])&&(ASCII[i]<='f')){
				zeichen = ASCII.charCodeAt(i) - 87;
			}
			else{
				console.error("Character Failure = -" + ASCII + "-, " + N);
				//alert("Character Failure = -" + ASCII + "-, " + N);
				return Math.NaN;
			}
			result += zeichen * Math.pow(16, N-1-i);
		}
		return result;
	}

	function HexToBool(t_Bool){
		return (t_Bool === "1" || t_Bool === 1 || t_Bool === true)? true : false;
	}

	function HexToInt(number,TYPE,LEN){
		var sign = 0;
		switch (TYPE){
			case 1: // UNSigned INT
				//alert("UInt");
				return number;
				break;
			case 2: // Signed INT
				//alert("Int");
				switch(LEN){
					case 2: // 8Bit Signed SINT
						sign = (number & 0x80)? 1 : 0;
						return (number & 0x7F) - sign*128;
					case 4: // 16Bit Signed INT
						sign = (number & 0x8000)? 1 : 0;
						return (number & 0x7FFF) - sign*32768;
					case 8: // 32Bit Signed DINT
						sign = (number & 0x80000000)? 1 : 0;
						return (number & 0x7FFFFFFF) - sign*2147483648;
					case 16: // 64Bit Signed LINT
						sign = (number & 0x8000000000000000)? 1 : 0;
						return (number & 0x7FFFFFFFFFFFFFFF) - sign*9223372036854775808;
					default:
						console.error("Type INT LENGTH input failure, number, type, lenght = ", number, TYPE, LEN);
						//alert("Type INT LENGTH input failure");
						return Number.NaN;
				}
			default:
				console.error("Type input failure number, type, lenght = ", number, TYPE, LEN);
				//alert("Type input failure");
				return Number.NaN;
		}
	}

	function HexToReal(number){ // 32 Bit - single prescision -- just for normalized numbers
		var sign		= (number & 0x80000000);		// sign: 0=positive
		var exponent	= (number & 0x7F800000) >> 23;	// exponent
		var mantissa	= (number & 0x007FFFFF);		// mantissa

		if(exponent == 0x0000){									// special: zero
			if(mantissa != 0)									// positive denormalized
				return Number.NaN;
			else												// normalized numbers
				return sign ? -0.0 : +0.0;
		}
		else if(exponent == 0x00FF){							// 255 - special: ±INF or NaN
			if(mantissa != 0){									// is mantissa non-zero? indicates NaN
				return Number.NaN;
			}
			else{												// otherwise it's ±INF
				return sign ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
			}
		}
		mantissa |= 0x00800000;

		exponent -= 127;										// adjust by BIAS
		var float_val = mantissa * Math.pow(2, exponent-23);			// compute absolute result
		return sign ? -float_val : +float_val;					// and return positive or negative depending on sign
	}

	function HexToLReal(number){ // 64 Bit - double prescision -- just for normalized numbers
		var sign		= (number & 0x8000000000000000);		// sign: 0=positive
		//var exponent	= (number & 0x7FF0000000000000) >> 52;	// exponent
		//var exponent	= (number & 0x7FF0000000000000);	// exponent
		//var exponent	= number / Math.pow(2, 52);	// exponent
		var exponent	= (number) >> 52;	// exponent
		exponent &= 0x7FF;
		var mantissa	= (number & 0x000FFFFFFFFFFFFF);		// mantissa

		if(exponent == 0x0000){									// special: zero
			if(mantissa != 0)									// positive denormalized
				return Number.NaN;
			else												// normalized numbers
				return sign ? -0.0 : +0.0;
		}
		else if(exponent == 0x07FE){							// 2047 - special: ±INF or NaN
			if(mantissa != 0){									// is mantissa non-zero? indicates NaN
				return Number.NaN;
			}
			else{												// otherwise it's ±INF
				return sign ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
			}
		}
		mantissa |= 0x0001000000000000;

		exponent -= 1023;										// adjust exponent by BIAS
		float_val = mantissa * Math.pow(2, exponent-52);				// compute absolute result
		return sign ? -float_val : +float_val;					// and return positive or negative depending on sign
	}

	function HexToLongFloat(longStr){ // 64 Bit - double prescision -- just for normalized numbers
		var buffer = new ArrayBuffer(8);
		var bytes = new Uint8Array(buffer);
		var doubles = new Float64Array(buffer); // not supported in Chrome

		for (var x = 0; x < 8; x++) {
			bytes[7-x] = convAsciiToHex(longStr.substr(x*2,x*2+2),2);
		}
		return doubles[0];
	}

	function floatToReal(number){
		n = +number,
		status = ((n !== n) || n == -Infinity || n == +Infinity) ? n : 0,
		exp = 0,
		len = 281, // 2 * 127 + 1 + 23 + 3,
		bin = new Array(len),
		signal = (n = status !== 0 ? 0 : n) < 0,
		n = Math.abs(n),
		intPart = Math.floor(n),
		floatPart = n - intPart,
		i, lastBit, rounded, j, exponent;

		if(status !== 0){
			if(n !== n){
				return 0x7fc00000;
			}
			if(n === Infinity){
				return 0x7f800000;
			}
			if(n === -Infinity){
				return 0xff800000
			}
		}

		i = len;
		while(i){
			bin[--i] = 0;
		}

		i = 129;
		while(intPart && i){
			bin[--i] = intPart % 2;
			intPart = Math.floor(intPart / 2);
		}

		i = 128;
		while(floatPart > 0 && i){
			(bin[++i] = ((floatPart *= 2) >= 1) - 0) && --floatPart;
		}

		i = -1;
		while(++i < len && !bin[i]);

		if(bin[(lastBit = 22 + (i = (exp = 128 - i) >= -126 && exp <= 127 ? i + 1 : 128 - (exp = -127))) + 1]){
			if(!(rounded = bin[lastBit])){
				j = lastBit + 2;
				while(!rounded && j < len){
					rounded = bin[j++];
				}
			}

			j = lastBit + 1;
			while(rounded && --j >= 0){
				(bin[j] = !bin[j] - 0) && (rounded = 0);
			}
		}
		i = i - 2 < 0 ? -1 : i - 3;
		while(++i < len && !bin[i]);
		((exp = 128 - i) >= -126 && exp <= 127) ? ++i : exp < -126 && (i = 255, exp = -127);
		((intPart || status !== 0) && (exp = 128, i = 129, status == -Infinity) ? signal = 1 : (status !== status) && (bin[i] = 1));

		n = Math.abs(exp + 127);
		exponent = 0;
		j = 0;
		while(j < 8){
			exponent += (n % 2) << j;
			n >>= 1;
			j++;
		}

		var mantissa = 0;
		n = i + 23;
		for(; i < n; i++){
			mantissa = (mantissa << 1) + bin[i];
		}
		return ((signal ? 0x80000000 : 0) + (exponent << 23) + mantissa) | 0;
	}

	function HexToDateAndTime(dateAndTimeLong){
		// Values convert to time  -- from: "2015-09-21 12:15:00.000_000_000" to DATE Object
		var year = HexToInt(convAsciiToHex(dateAndTimeLong.substr( 0,4),4),1,4);
		var month = HexToInt(convAsciiToHex(dateAndTimeLong.substr( 4,2),2),1,2)-1;
		var day = HexToInt(convAsciiToHex(dateAndTimeLong.substr( 6,2),2),1,2);
		var hours = HexToInt(convAsciiToHex(dateAndTimeLong.substr( 8,2),2),1,2);
		var minutes = HexToInt(convAsciiToHex(dateAndTimeLong.substr(10,2),2),1,2);
		var seconds = HexToInt(convAsciiToHex(dateAndTimeLong.substr(12,2),2),1,2);
		var milliseconds = HexToInt(convAsciiToHex(dateAndTimeLong.substr(14,8),8),1,8)/1000000;

		var timeStamp = new Date(
								Date.UTC(
									year,			// year
									month,			// month,
									day,			// day,
									hours,			// hours,
									minutes,		// minutes,
									seconds,		// seconds,
									milliseconds	// milliseconds
									)
								);
		return timeStamp;
		//return timeStamp.getTime();
	}
	// decode ASCII coded string transfer

	// encode variable to ASCII coded string
	function VarToASCIIString(VARIABLE,LEN){
		var t_string = '';
		var t_byte = 0x00;

		while(LEN > 0){
			t_byte = VARIABLE & 0x0F; // select last nibble
			if(t_byte < 10){ // if smaller add '0'
				t_byte += 48;
			}
			else{ // if greater add 'A'
				t_byte += 55;
			}
			t_string = String.fromCharCode(t_byte) + t_string;
			VARIABLE >>= 4; // shift 4 bit right
			LEN--;
		}
		return t_string;
	}
	// encode variable to ASCII coded string

	function readWriteToPLC(URL,DATA,ERROR,CALLBACK_OK,CALLBACK_ERROR){
		$.post(URL, DATA)
		.done(function(returnData){ // .success
			//alert("Write Data return Values: "+returnData);
			if(CALLBACK_OK != undefined && typeof CALLBACK_OK == 'function'){
				var obj = jQuery.parseJSON(returnData.match(/{[^}]*}/gm));
				if(obj.val != undefined){
					var values = convString(obj.val, obj.len, obj.typ, obj.str, ERROR);
					CALLBACK_OK(values);
				}
				else {
					CALLBACK_OK(obj);
				}
			}
		})
		.fail(function(returnData){ // .error
			if(CALLBACK_ERROR != undefined && typeof CALLBACK_ERROR == 'function'){
				CALLBACK_ERROR();
			}
			console.error("Error occurred while readWriteToPLC data\n"+ERROR+"\nData:\n"+returnData);
		});
	}

	function Controller() {
		var self = this;
		// Array für AJAX Requests
		var _xhrPool = [];
		// ID for Load image indicator
		var _loadImageID = null;
		var _loadImage = true;

		// decode Entities
		self.decodeEntities = function(DATA){
			return htmlDecodeEntities(DATA);
		}

		self.writeData = function(URL,DATA,ERROR,CALLBACK_OK,CALLBACK_ERROR){
			// check if logged on or NOT --> if NOT --> can't write DATA
		//	if(log == false && window.location.hostname){
		//		alert("You need to log on in order to write Data!!!\nPlease log in!"); // Alert if not logged in --> can't change values !!!
		//		return false;
		//	}
			readWriteToPLC(URL,DATA,ERROR,CALLBACK_OK,CALLBACK_ERROR);
		}

		self.writeForm = function(URL,ID,ERROR,CALLBACK_OK,CALLBACK_ERROR){
			// check if logged on or NOT --> if NOT --> can't write DATA
		//	if(log == false && window.location.hostname){
		//		alert("You need to log on in order to write Data!!!\nPlease log in!"); // Alert if not logged in --> can't change values !!!
		//		return false;
		//	}
			readWriteToPLC(URL,$(ID).serialize(),ERROR,CALLBACK_OK,CALLBACK_ERROR);
		}

		self.readData = function(URL,ERROR,CALLBACK_OK,CALLBACK_ERROR){ // load data
			readWriteToPLC(URL,'noData',ERROR,CALLBACK_OK,CALLBACK_ERROR);
		}

		// Abort all active AJAX tasks
		self.abortAllAjax = function(){
			for (i = 0; i < _xhrPool.length; i++) {
				_xhrPool[i].abort();
			}
			_xhrPool = [];
		}

		// initialise Framework
		self.initialize = function(plcType, loadImageID){
			if (initialized) {
				return initializedRetVal;
			}
			// Kennzeichen setzen, dass OBJEKT Instanziert wurde
			initialized = true;

			// workaround for IE, because location.orign is not supportet in IE
			if (!window.location.origin) {
				window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: '');
			}

			// define string.trim() if not defined
			if (!String.trim) {
				// String.prototype.trim = function () { return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, ''); };
				String.prototype.trim = function () { return this.replace(/^(\s|\u00A0)+|(\s|\u00A0)+$/g, ''); };
			}
			// workaround for IE, because string.includes is not supportet in IE
			if (!String.prototype.includes)
				String.prototype.includes = function() {
					return String.prototype.indexOf.apply(this, arguments) !== -1;
				};

			// NOOPs for console
			if (window.console == undefined)
				window.console = {};
			if (window.console.log == undefined)
				window.console.log = function () { };
			if (window.console.debug == undefined)
				window.console.debug = function () { };
			if (window.console.info == undefined)
				window.console.info = function () { };
			if (window.console.warn == undefined)
				window.console.warn = function () { };
			if (window.console.error == undefined)
				window.console.error = function () { };
			if (window.console.assert == undefined)
				window.console.assert = function () { };

			// save CPU Typ from arguments to local object storage
			if (arguments.length >= 2) {
				console.info("PLC Type = " + plcType);
				_plcType = plcType;
				self._loadImageID = loadImageID;
			}
			else {
				console.error("Missing Parameter @ S7Framework.initialize(plcType, loadImageID)", "\n", "Initialisation aborted!!!");
				initializedRetVal = false;
			}

			// AJAX Setup
			$.ajaxSetup(
				{
					mimeType: "text/plain", // to supress JSON Failure
					async: true, // set transfermode to asyncronus
					cache : false // avoid caching of JSON Files
					//isLocal: true
				},
				{ // Write alle AJAX Requests in array, and delete if finished
					beforeSend: function(jqXHR) {
						self._xhrPool.push(jqXHR);
					},
					complete: function(jqXHR) {
						var index = self._xhrPool.indexOf(jqXHR);
						if (index > -1) {
							self._xhrPool.splice(index, 1);
						}
					}
				}
			);

			// Loadindicator Event on START or STOP AJAX Call
			$(self._loadImageID).hide();
			// Show the load picture
			$(document).ajaxStart(function(){
				if ( self._loadImage ) $( self._loadImageID ).show();
			});
			// hide the load picture
			$(document).ajaxStop(function(){
				$( self._loadImageID ).hide();
				self._loadImage = true;
			});
			initializedRetVal = true;
			return initializedRetVal;
		}
	} // Controller

	// Controller erzeugen
	var controller = new Controller();
	return controller;
})(jQuery);