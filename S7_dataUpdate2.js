"use strict";
var plcType;
$(document).ready(function(){
	plcType = "1500";
	$.init();
})

$.init = function(){
	S7Framework.initialize(plcType, "");
	$("#bPage1").on("click",function (){
		document.location.href = "index.html";
	});
}