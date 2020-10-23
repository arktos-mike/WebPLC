"use strict";
var plcType;
var loadReport;
$(document).ready(function(){
	plcType = "1500";
	$("#main").load("main.html");
	for (let i = 1; i <= 5; i++) { 
			  $("#add"+i).load("motor"+i+".html");
	}
	$.init();
})

$.init = function(){
	$("#main").on("click","#bPage2",function (){
		document.location.href = "page2.html";
	});
	S7Framework.initialize(plcType, "");
	//readData and give it to the functions 
	S7Framework.readData("js/S7_dataGeneral.json","init read data",updateGeneralValues);
	const num = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
	num.forEach(i => {
		S7Framework.readData("js/S7_dataMotor"+i+".json","init read data",window["updateMotor"+i+"Values"]);
	});
	//Setpoint buttons
	var int00,int01; 
	$("#main").on("mousedown","#bMin",function(){
		decrease();
		int00 = setInterval(function() { decrease(); }, 500);
	}).on("mouseup","#bMin",function() {
		int01=0;
		clearInterval(int00);
	}).on("mouseout","#bMin",function() {
		int01=0;
    	clearInterval(int00);
	});
	$("#main").on("touchstart","#bMin",function(){
		decrease();
		int00 = setInterval(function() { decrease(); }, 500);
	}).on("touchend","#bMin",function() {
		int01=0;
		clearInterval(int00);
	}).on("touchmove","#bMin",function() {
		int01=0;
    	clearInterval(int00);
	});
	function decrease() {
		var int = parseInt($("#tSP").prop("textContent"),10)
		if (int>20) int=int-1-int01;
		if (int <20) int=20;
		var data = '"General_Data".invertorSpeedSP' + "=" + int;
		S7Framework.writeData("js/S7_dataToPLC.json", data, "");
		int01++;
	}
	$("#main").on("mousedown","#bMax",function(){
		increase();
    	int00 = setInterval(function() { increase(); }, 500);
	}).on("mouseup","#bMax",function() {
		int01=0;
    	clearInterval(int00);
	}).on("mouseout","#bMax",function() {
		int01=0;
    	clearInterval(int00);
	});
	$("#main").on("touchstart","#bMax",function(){
		increase();
		int00 = setInterval(function() { increase(); }, 500);
	}).on("touchend","#bMax",function() {
		int01=0;
		clearInterval(int00);
	}).on("touchmove","#bMax",function() {
		int01=0;
    	clearInterval(int00);
	});
	function increase() {
		var int = parseInt($("#tSP").prop("textContent"),10)
		if (int<50) int=int+1+int01;
		if (int>50) int=50;
		var data = '"General_Data".invertorSpeedSP' + "=" + int;
		S7Framework.writeData("js/S7_dataToPLC.json", data, "");
		int01++;
	}
	//Control mode SWITCH
	$("#main").on("click","#bMode",function (){
		if ($("#sAuto").attr("visibility")=="visible"){
			var data = '"General_Data".controlMode' + "=false";
		}
		else{
			var data = '"General_Data".controlMode' + "=true";
		}
		S7Framework.writeData("js/S7_dataToPLC.json", data, "");
	});
	//Lighting SWITCH
	$("#main").on("click","#bLight",function (){
		if ($("#sOn").attr("visibility")=="visible"){
			var data = '"General_Data".lightingControl' + "=false";
		}
		else{
			var data = '"General_Data".lightingControl' + "=true";
		}
		S7Framework.writeData("js/S7_dataToPLC.json", data, "");
	});
	//Start-Stop buttons
	num.forEach(i => {
		$("#add"+Math.ceil(i/2)).on("click","#bStart"+i,function (){
			if ($("#tMode").prop("textContent")=="AUTO"){
				var data = '"General_Data".autoStart' + "=true";
			}
			else{
				var data = '"Motor_'+i+'".manualStart' + "=true";
			}
			S7Framework.writeData("js/S7_dataToPLC.json", data, "");
		});
		$("#add"+Math.ceil(i/2)).on("click","#bStop"+i,function(){
			if ($("#tMode").prop("textContent")=="AUTO"){
				var data = '"General_Data".autoStop' + "=true";
			}
			else{
				var data = '"Motor_'+i+'".manualStop' + "=true";
			}
			S7Framework.writeData("js/S7_dataToPLC.json", data, "");
		});
	});
	//Blocks
	num.forEach(i => {
		$("#add"+Math.ceil(i/2)).on("click","#bKC"+i,function (){
			if ($("#lKC"+i).attr("fill")=="#c32d2d"){
				var data = '"Motor_'+i+'".blockKc' + "=false";
			}
			else{
				var data = '"Motor_'+i+'".blockKc' + "=true";
			}
			S7Framework.writeData("js/S7_dataToPLC.json", data, "");
		});
		$("#add"+Math.ceil(i/2)).on("click","#bCL"+i,function (){
			if ($("#lCL"+i).attr("fill")=="#c32d2d"){
				var data = '"Motor_'+i+'".blockCl' + "=false";
			}
			else{
				var data = '"Motor_'+i+'".blockCl' + "=true";
			}
			S7Framework.writeData("js/S7_dataToPLC.json", data, "");
		});
	});
}

function updateGeneralValues(generalValues){
	//check screen elements not empty
	$("#main").unbind('load');
	if ($("#main").is(':empty')) {
		$("#main").load("main.html");
	}
	for (let i = 1; i <= 5; i++) {  
		$("#add"+i).unbind('load');
		if ($("#add"+i).is(':empty')) {
			$("#add"+i).load("motor"+i+".html");
		}
	}
	//Start condition
	const cond = [ ["Key",5], ["Emer",6], ["Alarm",7], ["Pow",8], ["Cir",9], ["Safe",10] ];
	cond.forEach(e => {
		if (generalValues[e[1] ] == true){
			$("#bg"+e[0]).attr("fill","#444444");
		}
		else{
			$("#bg"+e[0]).attr("fill","#c32d2d");
		}
	  });
	//Emergency buttons
	const emer = [ ["01",2], ["02",3], ["03",4] ];
	emer.forEach(e => {
		if (generalValues[e[1] ] == true){
			$("#lS"+e[0]).attr("fill","#c32d2d");
		}
		else{
			$("#lS"+e[0]).attr("fill","#2e3c47");
		}
	  });
	//Analog Values
	$("#tSpeed").html(generalValues[14]);
	$("#tTrips").html(Math.floor(generalValues[15]));
	//Setpoint 
	$("#tSP").html(generalValues[11]);
	//Control mode
	switch (generalValues[13]) {
		case 0:
			$("#tMode").css({fill:"#c32d2d"});
			$("#tMode").html("LOCAL");
		  	break;
		case 1:
			$("#tMode").css({fill:"#ff8000"});
			$("#tMode").html("MANUAL");
		  	break;
		case 2:
			$("#tMode").css({fill:"#00d900"});
			$("#tMode").html("AUTO");
		  	break;
	  }
	//Manual mode ready
	if (generalValues[16] == true){
		$("#tManR").css({fill:"#00d900"});
		$("#tManR").html("READY");
	}
	else{
		$("#tManR").css({fill:"#ff8000"});
		$("#tManR").html("NOT READY");
	}
	//Control mode SWITCH
	if (generalValues[0] == true){
		$("#bgMode").attr("stroke","#23a0d1");
		$("#sMan").attr("visibility","hidden");
		$("#sAuto").attr("visibility","visible");
	}
	else{
		$("#bgMode").attr("stroke","#ff8000");
		$("#sAuto").attr("visibility","hidden")
		$("#sMan").attr("visibility","visible")
	}
	//Lighting SWITCH
	if (generalValues[12] == true){
		$("#bgLight").attr("stroke","#23a0d1");
		$("#sOff").attr("visibility","hidden");
		$("#sOn").attr("visibility","visible");
	}
	else{
		$("#bgLight").attr("stroke","#444444");
		$("#sOn").attr("visibility","hidden")
		$("#sOff").attr("visibility","visible")
	}
	//AUTO mode
	if ($("#tMode").prop("textContent")=="AUTO"){
		for (let i = 2; i <= 10; i++) { 
			$("#bStart"+i).attr("visibility","hidden");
			$("#bStop"+i).attr("visibility","hidden");
			$("#tM"+i).css({fill:"#444444"});
		}
		$("#tM1").html("ALL"); 
	}
	else{
		for (let i = 2; i <= 10; i++) { 
			$("#bStart"+i).attr("visibility","visible");
			$("#bStop"+i).attr("visibility","visible");
			$("#tM"+i).css({fill:"#ffffff"});
		}
		$("#tM1").html("M1"); 
	}
	//=> cyclic reading
	setTimeout(function(){S7Framework.readData("js/S7_dataGeneral.json","cyclic read data",updateGeneralValues)}, 500);
}

const num = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
num.forEach(i => {
	window["updateMotor"+i+"Values"] = function (motorValues) {
		//Condition
		if (motorValues[4] == true){
			$("#tCond"+i).css({fill:"#00d900"});
			$("#tCond"+i).html("ON");
		}
		else{
			$("#tCond"+i).css({fill:"#ffffff"});
			$("#tCond"+i).html("OFF");
		}
		//Ready
		if (motorValues[5] == true){
			$("#tReady"+i).css({fill:"#00d900"});
			$("#tReady"+i).html("YES");
		}
		else{
			$("#tReady"+i).css({fill:"#ffffff"});
			$("#tReady"+i).html("NO");
		}
		//Faults
		const fault = [ ["Belt",6], ["Cover",7], ["Cable",8], ["Speed",9], ["Safety",10] ];
		fault.forEach(e => {
			if (motorValues[e[1] ] == true){
				$("#l"+e[0]+i).attr("fill","#c32d2d");
			}
			else{
				$("#l"+e[0]+i).attr("fill","#2e3c47");
			}
	  	});
		//Blocks
		if (motorValues[2] == true){
			$("#lKC"+i).attr("fill","#c32d2d");
		}
		else{
			$("#lKC"+i).attr("fill","#d2d2d2");
		}
		if (motorValues[3] == true){
			$("#lCL"+i).attr("fill","#c32d2d");
		}
		else{
			$("#lCL"+i).attr("fill","#d2d2d2");
		}
		//=> cyclic reading
		setTimeout(function(){S7Framework.readData("js/S7_dataMotor"+i+".json","cyclic read data",window["updateMotor"+i+"Values"])}, 500);
	}
});