// functions to build colours
function byte2Hex(n){
	var nybHexString = "0123456789ABCDEF";
	return String(nybHexString.substr((n >> 4) & 0x0F,1)) + nybHexString.substr(n & 0x0F,1);
}
function RGB2Color(r,g,b){
	return '#' + byte2Hex(r) + byte2Hex(g) + byte2Hex(b);
}

// set global variables
var transferBorder = 3;
var bodyBG = "";
var stationBG = "#c7cbcc";

// set flag to indicate if a line is shown
var isShownFlag = false;
// setup array for all line classes
var lineClasses = [];

// build a div element for one station
function station(obj){
	
	var year = 2014;
	$("#map").attr( "year" , year );

	this.nlc = obj["nlc"];
	this.name = obj["station"];

	this.EnE = obj[ year ];

	this.posX = obj["x"];
	this.posY = obj["y"];

	var maxWidth = $("#map").innerWidth();
	var maxHeight = $("#map").innerHeight();

	var dot = '<div id="nlc' + this.nlc + '" class="station"></div>'
	$("#map").append( dot );

	var left = this.posX  + "%";
	var top = ( this.posY / 60 ) * 100 + "%";


	var eneOp = (this.EnE / 98.51) * 0.85 + 0.15;
	var size = eneOp * 50;

	if( this.EnE == 0 ){
		$("#nlc" + this.nlc).css("background","none").css("border","solid 1px #95a5a6");
	} 

	$("#nlc" + this.nlc).css({
		"left" 	: left,
		"top"	: top,
		"width"	: size,
		"height": size,
		"margin-left"	: -1 * size/2,
		"margin-top"	: -1 * size/2

	// Give attributes to elements to save them for later
	}).attr("ene",this.EnE).attr("x",this.posX).attr("y",this.posY).attr("nlc",this.nlc).attr("name",this.name);

}


// position stations in order of line
function linePosition( obj , lineName ){

	$(".transfer").each( function(){
		hideTransferOptions( $(this) );
	} );

	console.log( "Annual EnE in " + $("#map").attr("year") + " for " + obj.attr("name") + " station (NLC " + obj.attr("nlc") + "): " + obj.attr("ene") + " milion" );

	isShownFlag = true;

	var lineDB = window[ lineName ];

	$(".station").each(function(){
		if ( $(this).hasClass( lineName ) == false ){
			$(this).addClass("inactive");
			$(this).removeClass("active");
		}
	});

	$(".inactive").css("opacity",0);

	$(".inactive").css("display","none");

	if ( obj.hasClass( lineName ) ) {

		console.log("You chose the " + lineName + " line");

		// get colour of line for background
		var bgColour = $("."+lineName).css("color");

		$("#map").attr( "currentLine" , lineName );
		$("#canvas").css("background", bgColour );

		// get maximum value of position
		var allPosiitons = [];
		for( i=0 ; i < lineDB.length ; i++ ){

			var actual = lineDB[i];
			var position = actual["position"];
			allPosiitons.push(position);
		}
		var all = Math.max.apply( Math , allPosiitons ) - 1;

		// Set new position, colour and size for each station
		$(".station").each(function(){

			if ( $(this).hasClass( lineName ) ) {

				$(this).addClass("active");

				var NLC = $(this).attr("nlc");

				var result = $.grep(lineDB, function(e){ return e.nlc == NLC; });

				result = result[0];

				var en = result["en_week"];
				var ex = result["ex_week"];

				var size = ( ( ( en + ex ) / 144764 ) * 0.85 + 0.15 ) * 50;

				var modulator;
				var bigger;
				var smaller;

				var colourValue = 255;

				
				// If more people get in -> become white
				if( en > ex ){
					modulator = 0.1 * en;
					newValue = en - ex;
					var thing = newValue / modulator;
					colourValue = 128 + 128 * thing;

				// If more people get out -> become black
				} else if ( en < ex ) {
					modulator = 0.1 * ex;
					newValue = ex - en;
					var thing = newValue / modulator;
					colourValue = 128 - 128 * thing;
				}	
				
				if( colourValue > 255 ){
					colourValue = 255;
				}else if ( colourValue < 0 ) {
					colourValue = 0;
				}

				var colour = RGB2Color(colourValue,colourValue,colourValue);

				// Set position by line
				var fromLeft = parseFloat( $(this).attr(lineName + "-position") ) - 1;
				var layer = parseFloat( $(this).attr(lineName + "-layer") );
				if( layer == "" ){
					layer = 3;
				}
				var ofTop = ((layer - 2) * 10) + 40 + '%';

				var margin = -1 * size/2;

				if ( $(this).hasClass("transfer") ) {
					margin = margin - transferBorder;
				}

				$(this).css({
					"left" 	: (fromLeft / all) * 100 + "%",
					"top"	: ofTop,
					"width"	: size,
					"height": size,
					"margin-left": margin,
					"margin-top" : margin,
					"background" : colour
				});

			}

		});

		// Show hidden stations
		$(".transfered").animate({
			opacity: 0.6
		}, 500).removeClass("transfered");
	}

}

// add line classes to matching stations 
function addLine( lineClass ){

	var lineDB = window[ lineClass ];
	
	for( i=0 ; i < lineDB.length ; i++ ){

		var actual = lineDB[i];
		var NLC = actual["nlc"];
		var divObj = $("#nlc" + NLC);

		divObj.addClass( lineClass );

		divObj.attr( lineClass + "-position",actual['position']);
		divObj.attr( lineClass + "-layer",actual['layer']);

	}
}

// build CSS classes for a line including its colour
function setupLine(obj){

	this.id = obj["id"];
	this.name = obj["name"];

	this.className = obj["class"];
	this.colour = obj["colour"];

	var style = '';

	style += '.' + this.className + '{color: #' + this.colour + ';} ';	

	addLine( this.className );
	
	lineClasses.push( this.className );

	$('#colourPreset').append('<div class="'+this.className+'"></div>');

	return style;	
}

// call line function for each line
function setupLines(){
	
	var style = '<style>';

	for( l=0 ; l < lines.length ; l++ ){
		
		var actual = lines[l];

		style += setupLine(actual);

	}

	style += "</style>";
	$('html > head').append(style);
}

// setup everything
function setupMap(){

	$("#map").attr( "currentLine" , "");

	console.log( "Stations in total: " + stations.length );

	for( i=0 ; i < stations.length ; i++ ){
		
		var actual = stations[i];
		station( actual );

	}
	
	// build all lines
	setupLines();

	$(".station").each(function(){

		// check if station has multiple lines
		var classList = $(this).attr('class').split(/\s+/);
		var commonClasses = $.grep(lineClasses, function(element) {
		    return $.inArray(element, classList ) !== -1;
		});

		if( commonClasses.length > 1 ){

			$(this).addClass("transfer");
			
			// reposition because of border
			var x = parseFloat( $(this).attr("x") );
			var y = parseFloat( $(this).attr("y") );
			
			var left = x  + "%";
			var top = ( y / 60 ) * 100 + "%";

			var margin = parseFloat($(this).css("margin-left"), 10);

			$(this).css({
				"margin-left" : margin - transferBorder,
				"margin-top" : margin - transferBorder
			});
		}
	});
}

function showTransferOptions( obj ){

	$(".isShowingTransferOptions").each( function(){
		hideTransferOptions( $(this) );
	} );

	obj.css("z-index",5);

	var nlc = obj.attr("nlc");

	var allLines = getLinesOfStation( obj );

	var size = obj.outerHeight();

	// check if transfer option has been built already
	if( obj.hasClass("transfersBuilt") != true ){
		
		var option = '<div class="transferOptions" id="TO-' + nlc + '"></div>';
		$("#map").append( option );

		for( i=0 ; i < allLines.length ; i++ ){

			var lineName = allLines[i];
			var bgColour = $("#colourPreset").find($("."+lineName)).css("color");

			var option = '<div class="transferOption ' + lineName +'"></div>';
			$("#TO-" + nlc ).append( option );

			var tOption = $("#TO-" + nlc ).find("." + lineName );

			tOption.css("background", bgColour);

		}

		obj.addClass("transfersBuilt");
	
	}	


	$(".transferOption").css({
		"display"	:"block",
		"opacity"	: 1,
		"transition": "all 0.5s"
	});

	var to = $("#TO-" + nlc );
	to.attr("forNlc",nlc);
	
	var left = 0;
	var bottom = 0;
	var size = obj.outerHeight();

	// If line is shown
	if ( obj.hasClass("active") ){

		var currentLine = $("#map").attr( "currentLine");

		var pos = parseInt( obj.attr( currentLine + "-position") );
		var lay = parseFloat( obj.attr( currentLine + "-layer") );
		if( lay == "" ){
			lay = 3;
		}

		// get the right position
		var lineDB = window[ currentLine ];
		var allPosiitons = [];
		for( i=0 ; i < lineDB.length ; i++ ){

			var actual = lineDB[i];
			var position = actual["position"];
			allPosiitons.push(position);
		}
		var all = Math.max.apply( Math , allPosiitons ) - 1;

		left = ((pos - 1 ) / all) * 100 + "%";
		bottom = 100 - ( ((lay - 2) * 10) + 40 ) + '%';

	// If map is shown
	}else{

		var x = obj.attr("x");
		var y = obj.attr("y");

		left = x  + "%";
		bottom = ( 1 - ( y / 60 ) ) * 100 + "%";		
	}

	to.css({
		"left" 			: left,
		"bottom"		: bottom,
		"padding-bottom": size / 2,
		"display"		: "block",
		"opacity"		: 1,
		"transition"	: "all 0.5s"
	});

	obj.addClass("isShowingTransferOptions");

	var tSize = $(".transferOption").outerHeight();

	var n = 0;

	for( i=0 ; i < allLines.length ; i++ ){

		var lineName = allLines[i];

		if( lineName == $("#map").attr("currentLine") ){

			// hide the one, that is not needed
			to.find("." + currentLine ).css("display","none");

		}else{

			var tOption = to.find("." + lineName );

			tOption.css({
				"bottom" : ( tSize + 8 ) * n + size / 2 + 6
			});

			n++;
		}
	}	

	to.css({
		"height" : ( tSize + 8 ) * n
	});

}

function hideTransferOptions( obj ){

	var nlc = obj.attr("nlc");

	$("#TO-" + nlc ).css({
		"height"	: 0,
		"opacity"	: 0,
		"transition": "all 0.3s"
	});
	$(".transferOption").css({
		"bottom"	: 0,
		"opacity"	: 0,
		"transition": "all 0.3s"
	});

	setTimeout(function() {
		
		$("#TO-" + nlc ).css({
			"display"	: "none",
			"transition": "none"
	 	});

		obj.css("z-index","inherit");

	}, 300);
	
	$(".isShowingTransferOptions").removeClass("isShowingTransferOptions");
	
}

function getLinesOfStation( obj ){
	var classList = obj.attr('class').split(/\s+/);
	var classesInCommom = $.grep(lineClasses, function(element) {
	    return $.inArray(element, classList ) !== -1;
	});
	return classesInCommom;
}

function showStation(){


	$(".station").click(function(){

    	// check which lines the nlc has
		var commonClasses = getLinesOfStation( $(this) );

		if( $(this).hasClass("isShowingTransferOptions") ){

			hideTransferOptions( $(this) );

		} else {

			// if just one, show the line
			if( commonClasses.length == 1 ){

				// check if a tOption is open
				if( $(".isShowingTransferOptions").length > 0 ){

					var nlcObj = $(this);

					setTimeout(function() {

						linePosition( nlcObj , commonClasses[0] );
					
					}, 250);

				// else just run it
				}else{

					linePosition( $(this) , commonClasses[0] );

				}

				isShownFlag = true;

			// if has more lines, show transfer options
			}else if( commonClasses.length > 1){

				showTransferOptions( $(this) );

			}
		}
	});

	// Dynamic elements!!
	$(document).on("click", ".transferOption", function() {		

		var nlc = $(this).parent().attr("forNlc");
		var nlcObj = $("#nlc" + nlc);

		var chosenLine = getLinesOfStation( $(this) );
        chosenLine = chosenLine[0];

		hideTransferOptions( nlcObj );

		if( $("#map").attr("currentLine") != "" ){

			$(".inactive").each(function(){
				
				if( $(this).hasClass(chosenLine) ){
					
					$(this).css({
						"opacity"	: 0,
						"display"	: "block"
					});
					$(this).removeClass("inactive").addClass("transfered");

				}
			});

			$(".active").each(function(){
				
				if( $(this).hasClass(chosenLine) == false ){
					$(this).addClass("getOff");
				}
			});

			$(".getOff").animate({
				opacity: 0
			}, 500).removeClass("getOff");

		}

		setTimeout(function() {

			linePosition( nlcObj , chosenLine );
		
		}, 250);

		isShownFlag = true;
	
	});

	// show all stations in same line by using its colour
	var regularBG = $(".station").css("background");

	$(".station").mouseenter(function(){

		if( $("#map").attr("currentLine") == "" ){

			var commonClasses = getLinesOfStation( $(this) );
			for( i=0 ; i < commonClasses.length ; i++ ){
		
				var lineName = commonClasses[i];
				var bgColour = $("."+lineName).css("color");

				$("." + lineName).css("background",bgColour);
			
			}
		}
	});

	$(".station").mouseout(function(){
		if( $("#map").attr("currentLine") == "" ){
			$(".station").css("background",regularBG);
		}
	});

	// dynamic elements!!
	$(document).on("mouseenter", ".transferOption", function() {

		if( $("#map").attr("currentLine") == "" ){

			var commonClasses = getLinesOfStation( $(this) );
	        var lineName = commonClasses[0];

			var bgColour = $("."+lineName).css("color");

			$("." + lineName).css("background",bgColour);	

		}
	});

	$(document).on("mouseout", ".transferOption", function() {
		if( $("#map").attr("currentLine") == "" ){
			$(".station").css("background",regularBG);
		}
	});
	
}

function resetStations(){

	$(".transfer").each( function(){
		hideTransferOptions( $(this) );
	} );

	var lineName = $("#map").attr("currentLine");

	$(".station").each(function(){

		var x = parseFloat( $(this).attr("x") );
		var y = parseFloat( $(this).attr("y") );
		
		var left = x  + "%";
		var top = ( y / 60 ) * 100 + "%";

		var eneOp = ( $(this).attr("ene") / 98.51) * 0.85 + 0.15;
		var size = eneOp * 50;
		
		var bgColour = $("."+lineName).css("color");

		var margin = -1 * size/2;

		if ( $(this).hasClass("transfer") ) {
			margin = margin - transferBorder;
		}

		$(this).css({
			"left" 	: left,
			"top"	: top,
			"width"	: size,
			"height": size,
			"margin-left"	: margin,
			"margin-top"	: margin,
			"background"	: stationBG
		});

		if ( $(this).hasClass("active") ){
			$(this).removeClass("active");

			bgColour = $("."+lineName).css("color");
			
			$(this).css("background",bgColour);

			var obj = $(this);
			setTimeout(function() {

				obj.css("background",stationBG);
			
			}, 1000);

		}

		if ( $(this).hasClass("inactive") ){
			$(this).css("display","block");
			$(this).css("opacity",0.6);
			$(this).removeClass("inactive");
		}

	});

	$("#canvas").css("background", bodyBG );
	$("#map").attr( "currentLine" , "");
}

function changeYear( direction ){

	var currentLine = $("#map").attr("currentLine");

	if ( currentLine == "" ){

		var year = $("#map").attr( "year" );

		if ( direction == "up" ){
			if ( year < 2014 ){
				year++;
			}
		}else if ( direction == "down" ){
			if ( year > 2007 ){
				year--;
			}
		}

		console.log( year );

		$(".station").css("transition","all 0.2s, z-index 0s");

		$("#map").attr( "year" , year );

		for( i=0 ; i < stations.length ; i++ ){
			
			var actual = stations[i];
			
			var nlc = actual["nlc"];
			var EnE = actual[ year ];

			var eneOp = (EnE / 98.51) * 0.85 + 0.15;
			var size = eneOp * 50;

			if( EnE == 0 ){
				$("#nlc" + nlc).addClass("closed");
				size = 10;
			} else {
				$("#nlc" + nlc).removeClass("closed");
			}

			var margin = -1 * size/2;

			if ( $("#nlc" + nlc).hasClass("transfer") && $("#nlc" + nlc).hasClass("closed") == false ) {
				margin = margin - transferBorder;
			}

			$("#nlc" + nlc).css({
				"width"	: size,
				"height": size,
				"margin-left"	: margin,
				"margin-top"	: margin

			// Give attributes to elements to save it for later
			}).attr("ene",EnE);

		}

		setTimeout(function() {
		
			$(".station").css("transition","all 1s, z-index 0s");

		}, 300);

		
	}

}

function buildMethods(){

	bodyBG = $("body").css("background");

	// show station on click
	showStation()

	// reset stations
	$("body").click(function( e ){

		var transferOptionsOpen = false;

		if( isShownFlag && $(".isShowingTransferOptions").length > 0 ){
			transferOptionsOpen = true;
		}

		// check if the bg has been clicked
		if(	$(e.target).is('.station') ){
			// do nothing
		// check if click on transfer
		}else if( $(e.target).is('.transferOption') || $(e.target).is('.transferOptions') ){
			// do nothing
		}else{
			if( isShownFlag ){

				if( transferOptionsOpen ){
					
					$(".transfer").each( function(){
						hideTransferOptions( $(this) );
					} );

				}else{
					
					resetStations();
					isShownFlag = false;
				
				}
			}else{
				$(".transfer").each( function(){
					hideTransferOptions( $(this) );
				} );
			}
		}
	});

	var scrollCounter = 0;

	$('#map').bind('mousewheel', function(e){
		
	    if(e.originalEvent.wheelDelta > 5) {
	       scrollCounter++;
	    }
	    else if (e.originalEvent.wheelDelta < -5){
	       scrollCounter--;
	    }

	    if ( scrollCounter >= 5 ){

	    	changeYear('up');
	    	scrollCounter = 0;

	    }else if( scrollCounter <= -5 ){

	    	changeYear('down');
	    	scrollCounter = 0;
	    }
	});


}



// also allow year change with keyboard
$(document).keydown(function(e) {
    switch(e.which) {
        case 38: // up
        	changeYear('up');
        break;
        case 40: // down
        	changeYear('down');
        break;
        // exit this handler for other keys
        default: return; 
    }
    // prevent the default action (scroll / move caret)
    e.preventDefault();
});


$(document).ready(function(){

	setupMap();
	buildMethods();

	// allow transitions
	$("body").removeClass("preload");

});










