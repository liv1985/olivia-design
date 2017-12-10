//Version 0.1 Beta.

//Inverse of framerate in ms/frame.
var _DOTCSS_FX_INTERVAL = 1000 / 40;

//Note to the open source community regarding the next variable:
//I don't particularly like having this as a public variable.
//But without it, there's no way to access the last target from inside the animate/tostring/val functions. 
//For instance, the syntax is dotcss(target).color.animate();
//The animate function needs to know the target element.
//dotcss(target) returns a _dotcssbuilder object with a target element assigned.
//color is a function inside the prototype of _dotcssbuilder,
//along with all the other css properties. Functions are objects,
//and this color object is assigned animate, toString, and val fields,
//each of which being a function. In these functions, the this keyword
//refers to the color function, not to the _dotcssbuilder where the target resides.
//Since color is in the prototype of _dotcssbuilder there isn't an easy way to
//access target from within the animate function.
//Maybe the open source community can find a better solution.
//Having this as a public variable directly and immediately hinders the scalability of this project.
var _dotcssLastBuilder = null;

var _dotcssbuilder = function(target){
	this.currentCss = "";
	this.target = target;
}

var dotcss = function(query){
	this.currentCss = "";

	var target = null;
	if(query){
		if(typeof query == "string" ) target = document.querySelectorAll(query);
		if(query instanceof NodeList) target = query;
		if(query instanceof Node) target = [query]; //Doesn't need to be a NodeList. Just iterable.
	}
	_dotcssLastBuilder = new _dotcssbuilder(target);
	return _dotcssLastBuilder;
}

var _dotcssStyleProperty = function(){
	this.type = null;
	this.jsFriendlyProp = null;
}

//toString override gets the value.
_dotcssStyleProperty.prototype.toString = function(){
	if(_dotcssLastBuilder.target){
		var ret = null;
		if(_dotcssLastBuilder.target.length > 1){
			ret = [];
			for(var i = 0; i < _dotcssLastBuilder.target.length; i++){
				ret.push(_dotcssLastBuilder.target[i].style[this.jsFriendlyProp]);
			}
		}
		else ret = _dotcssLastBuilder.target[0].style[this.jsFriendlyProp];
		return ret;
	}
	else return null;
}

//val is another special function that breaks the value into a special object.
_dotcssStyleProperty.prototype.val = function(){
	if(_dotcssLastBuilder.target){
		var ret = null;
		if(_dotcssLastBuilder.target.length > 1){
			ret = null;
			for(var i = 0; i < _dotcssLastBuilder.target.length; i++){
				if(_dotcssLastBuilder.target[0].style[this.jsFriendlyProp]){
					ret.push(_convertStyleIntoDotCssObject(_dotcssLastBuilder.target[i].style[this.jsFriendlyProp], this.type));
				}
				else ret.push(null);
			}
		}
		else{
			if(_dotcssLastBuilder.target[0].style[this.jsFriendlyProp]){
				_convertStyleIntoDotCssObject(_dotcssLastBuilder.target[i].style[this.jsFriendlyProp], this.type)
			}
			else ret = null;
		}
		return ret;
	}
	else return null;
}

//Ability to animate just like jquery.
_dotcssStyleProperty.prototype.animate = function(value, duration, style){
	if(_dotcssLastBuilder && _dotcssLastBuilder.target){
		for(var i = 0; i < _dotcssLastBuilder.target.length; i++){
			var target = _dotcssLastBuilder.target[i];
			var oldValue = _convertStyleIntoDotCssObject(window.getComputedStyle(target)[this.jsFriendlyProp], this.type);
			var newValue = _convertStyleIntoDotCssObject(_dotcssInputToCssValue((value instanceof Array) ? value : [value], this.type), this.type);
			/*switch(this.type){
				case "color":
			}*/
			_dotcssAnimate(target, this.jsFriendlyProp, this.type, oldValue, newValue, duration || 400, style || "linear");
		}
	}
	return _dotcssLastBuilder;
}

//Have to add these back since we're going to replace the __proto__ of a function with this new prototype.
_dotcssStyleProperty.prototype.apply = Function.apply;
_dotcssStyleProperty.prototype.call = Function.call;

var _dotcssAnimate = function(element, jsFriendlyProp, propType, currentValue, targetValue, duration, animationStyle){
	if(window.getComputedStyle(element)[jsFriendlyProp] != currentValue.value) return;
	if(duration > 0){
		switch(propType){
			case "color":
				var r = _dotcssNumberStep(currentValue.r, targetValue.r, duration, animationStyle );
				var g = _dotcssNumberStep(currentValue.g, targetValue.g, duration, animationStyle );
				var b = _dotcssNumberStep(currentValue.b, targetValue.b, duration, animationStyle );
				var a = _dotcssNumberStep(currentValue.a, targetValue.a, duration, animationStyle );
				dotcss(element)[jsFriendlyProp](r, g, b, a);
				break;
			case "length":
				//Check units.
				if(currentValue.units != targetValue.units){
					//Need to rectify this.
					if(currentValue.length == 0){
						currentValue.units = targetValue.units;
						currentValue.value = current.value.length + "" + current.value.units;
					}
					else if(targetValue.length == 0){
						targetValue.units = targetValue.units;
						targetValue.value = current.value.length + "" + current.value.units;
					}
					else{
						console.warn("Couldn't animate " + jsFriendlyProp + ". Inconsistent units.");
						return;
					}
					dotcss(element)[jsFriendlyProp](_dotcssNumberStep(currentValue.length, targetValue.length, duration, animationStyle) + current.value.units);
					break;
				}
			default:
				//Most things cannot be animated. However, if the current and target values are numbers, it can be animated.
				if(!isNaN(currentValue.value) && !isNaN(targetValue.value)){
					dotcss(element)[jsFriendlyProp](_dotcssNumberStep(Number(currentValue.value), Number(targetValue.value), duration, animationStyle));
				}
				else{
					console.warn("Couldn't animate " + jsFriendlyProp + ". Not a recognizable length, color, or number.");
					return;
				}
				break;
		}
		setTimeout(function(){
			_dotcssAnimate(element, jsFriendlyProp, propType, _convertStyleIntoDotCssObject(element.style[jsFriendlyProp], propType), targetValue, Math.max(0, duration - _DOTCSS_FX_INTERVAL), animationStyle);
		}, _DOTCSS_FX_INTERVAL);
	}
	else{
		dotcss(element)[jsFriendlyProp](targetValue.value); 
	}
}

//Function that takes in a bunch of parameters and steps the start value toward the target based on timeRemaining and style.
//Returns the result.
var _dotcssNumberStep = function(start, target, timeRemaining, style){
	switch(style){
		case "geometric":
		case "exponential":
			var m = Math.exp(-_DOTCSS_FX_INTERVAL / timeRemaining);
			return  target + m * (start - target);
		case "linear":
		default:
			return start + _DOTCSS_FX_INTERVAL * (target - start) / timeRemaining;
	}
}

var _dotcssInputToCssValue = function(args, type){
	var value = args[0];
	switch(type){
		case "url":
			if(("" + value).trim().indexOf("url") != 0) 
				value = "url(" + value + ")";
			break;
		case "color":
			if(args.length == 3 && !isNaN(args[0]) && !isNaN(args[1]) && !isNaN(args[2]))
				value = "rgb(" 
					+ Math.min(255, Math.max(0, Math.round(args[0]))) + ", "
					+ Math.min(255, Math.max(0, Math.round(args[1]))) + ", " 
					+ Math.min(255, Math.max(0, Math.round(args[2]))) 
					+ ")";
			else if(args.length == 4 && !isNaN(args[0]) && !isNaN(args[1]) && !isNaN(args[2]) && !isNaN(args[3]))
				value = "rgba(" 
					+ Math.min(255, Math.max(0, Math.round(args[0]))) + ", "
					+ Math.min(255, Math.max(0, Math.round(args[1]))) + ", "
					+ Math.min(255, Math.max(0, Math.round(args[2]))) + ", "
					+ Math.min(1, Math.max(0, args[3]))
					+ ")";
			else if(("" + value)[0] == "#" || !isNaN(("" + value).substring(1, ("" + value).length))){
				if(("" + value)[0] == "#"){
					var tryHex = ("" + value).substring(1, ("" + value).length);
					if(tryHex.length == 3){
						var newTryHex = "";
						for(var i = 0; i < 3; i++){
							newTryHex = tryHex[i] + tryHex[i];
						}
						tryHex = newTryHex;
					}
					var tryHex = "0x" + tryHex;
					if(isNaN(tryHex)) break;
					value = Number(tryHex);
				}
				else{
					value = Math.round(Number("" + value));
				}
				var b = value & 0xFF;
				value >>= 8;
				var g = value & 0xFF;
				value >>= 8;
				var r = value & 0xFF;
				value = "rgb(" + r + "," + g + "," + b + ")";
			}
			break;
		case "length":
			value = "";
			for (var i = 0; i < args.length; i++){
				if(!isNaN(args[i]))
					value += args[i] + "px ";
				else
					value += args[i] + " ";
			}
			value = value.trim();
			break;
		default:
			value = "";
			for (var i = 0; i < args.length; i++){
				value += args[i] + " ";
			}
			value = value.trim();
			break;
	}
	return value;
}

var _allDotCssProperties = [
	{prop:"color", type:"color"},
	{prop:"opacity"},
	{prop:"background"},
	{prop:"background-Attachment"},
	{prop:"background-Blend-Mode"},
	{prop:"background-Color", type:"color"},
	{prop:"background-Image", type:"url"},
	{prop:"background-Position"},
	{prop:"background-Repeat"},
	{prop:"background-Clip"},
	{prop:"background-Origin"},
	{prop:"background-Size", type:"length"},
	{prop:"border"},
	{prop:"border-Bottom"},
	{prop:"border-Bottom-Color", type:"color"},
	{prop:"border-Bottom-Left-Radius", type:"length"},
	{prop:"border-Bottom-Right-Radius", type:"length"},
	{prop:"border-Bottom-Style"},
	{prop:"border-Bottom-Width", type:"length"},
	{prop:"border-Color", type:"color"},
	{prop:"border-Image", type:"url"},
	{prop:"border-Image-Outset"},
	{prop:"border-Image-Repeat"},
	{prop:"border-Image-Slice"},
	{prop:"border-Image-Source"},
	{prop:"border-Image-Width", type:"length"},
	{prop:"border-Left"},
	{prop:"border-Left-Color", type:"color"},
	{prop:"border-Left-Style"},
	{prop:"border-Left-Width", type:"length"},
	{prop:"border-Radius", type:"length"},
	{prop:"border-Right"},
	{prop:"border-Right-Color", type:"color"},
	{prop:"border-Right-Style"},
	{prop:"border-Right-Width", type:"length"},
	{prop:"border-Style"},
	{prop:"border-Top"},
	{prop:"border-Top-Color", type:"color"},
	{prop:"border-Top-Left-Radius", type:"length"},
	{prop:"border-Top-Right-Radius", type:"length"},
	{prop:"border-Top-Style"},
	{prop:"border-Top-Width", type:"length"},
	{prop:"border-Width", type:"length"},
	{prop:"box-Decoration-Break"},
	{prop:"box-Shadow"},
	{prop:"bottom", type:"length"},
	{prop:"clear"},
	{prop:"clip"},
	{prop:"display"},
	{prop:"float"},
	{prop:"height", type:"length"},
	{prop:"left", type:"length"},
	{prop:"margin", type:"length"},
	{prop:"margin-Bottom", type:"length"},
	{prop:"margin-Left", type:"length"},
	{prop:"margin-Right", type:"length"},
	{prop:"margin-Top", type:"length"},
	{prop:"max-Height", type:"length"},
	{prop:"max-Width", type:"length"},
	{prop:"min-Height", type:"length"},
	{prop:"min-Width", type:"length"},
	{prop:"overflow"},
	{prop:"box"},
	{prop:"overflow-X"},
	{prop:"overflow-Y"},
	{prop:"padding", type:"length"},
	{prop:"padding-Bottom", type:"length"},
	{prop:"padding-Left", type:"length"},
	{prop:"padding-Right", type:"length"},
	{prop:"padding-Top", type:"length"},
	{prop:"position"},
	{prop:"right", type:"length"},
	{prop:"top", type:"length"},
	{prop:"visibility"},
	{prop:"width", type:"length"},
	{prop:"vertical-Align"},
	{prop:"z-Index"},
	{prop:"align-Content"},
	{prop:"align-Items"},
	{prop:"align-Self"},
	{prop:"flex"},
	{prop:"flex-Basis"},
	{prop:"flex-Direction"},
	{prop:"flex-Flow"},
	{prop:"flex-Grow"},
	{prop:"flex-Shrink"},
	{prop:"flex-Wrap"},
	{prop:"justify-Content"},
	{prop:"order"},
	{prop:"hanging-Punctuation"},
	{prop:"hyphens"},
	{prop:"letter-Spacing"},
	{prop:"line-Break"},
	{prop:"line-Height", type:"length"},
	{prop:"overflow-Wrap"},
	{prop:"tab-Size"},
	{prop:"text-Align"},
	{prop:"text-Align-Last"},
	{prop:"text-Combine-Upright"},
	{prop:"text-Indent"},
	{prop:"text-Justify"},
	{prop:"text-Transform"},
	{prop:"white-Space"},
	{prop:"word-Break"},
	{prop:"word-Spacing"},
	{prop:"word-Wrap"},
	{prop:"text-Decoration"},
	{prop:"text-Decoration-Color", type:"color"},
	{prop:"text-Decoration-Line"},
	{prop:"text-Decoration-Style"},
	{prop:"text-Shadow"},
	{prop:"text-Underline-Position"},
	{prop:"font"},
	{prop:"font-Family"},
	{prop:"font-Feature-Settings"},
	{prop:"font-Kerning"},
	{prop:"font-Language-Override"},
	{prop:"font-Size", type:"length"},
	{prop:"font-Size-Adjust"},
	{prop:"font-Stretch"},
	{prop:"font-Style"},
	{prop:"font-Synthesis"},
	{prop:"font-Variant"},
	{prop:"font-Variant-Alternates"},
	{prop:"font-Variant-Caps"},
	{prop:"font-Variant-East-Asian"},
	{prop:"font-Variant-Ligatures"},
	{prop:"font-Variant-Numeric"},
	{prop:"font-Variant-Position"},
	{prop:"font-Weight"},
	{prop:"direction"},
	{prop:"text-Orientation"},
	{prop:"text-Combine-Upright"},
	{prop:"unicode-Bidi"},
	{prop:"user-Select"},
	{prop:"writing-Mode"},
	{prop:"border-Collapse"},
	{prop:"border-Spacing"},
	{prop:"caption-Side"},
	{prop:"empty-Cells"},
	{prop:"table-Layout"},
	{prop:"counter-Increment"},
	{prop:"counter-Reset"},
	{prop:"list-Style"},
	{prop:"list-Style-Image", type:"url"},
	{prop:"list-Style-Position"},
	{prop:"list-Style-Type"},
	{prop:"animation"},
	{prop:"animation-Delay"},
	{prop:"animation-Direction"},
	{prop:"animation-Duration"},
	{prop:"animation-Fill-Mode"},
	{prop:"animation-Iteration-Count"},
	{prop:"animation-Name"},
	{prop:"animation-Play-State"},
	{prop:"animation-Timing-Function"},
	{prop:"backface-Visibility"},
	{prop:"perspective"},
	{prop:"perspective-Origin"},
	{prop:"transform"},
	{prop:"transform-Origin"},
	{prop:"transform-Style"},
	{prop:"transition"},
	{prop:"transition-Property"},
	{prop:"transition-Duration"},
	{prop:"transition-Timing-Function"},
	{prop:"transition-Delay"},
	{prop:"box-Sizing"},
	{prop:"content", type:"url"},
	{prop:"cursor"},
	{prop:"ime-Mode"},
	{prop:"nav-Down"},
	{prop:"nav-Index"},
	{prop:"nav-Left"},
	{prop:"nav-Right"},
	{prop:"nav-Up"},
	{prop:"outline"},
	{prop:"outline-Color", type:"color"},
	{prop:"outline-Offset"},
	{prop:"outline-Style"},
	{prop:"outline-Width"},
	{prop:"resize"},
	{prop:"text-Overflow"},
	{prop:"break-After"},
	{prop:"break-Before"},
	{prop:"break-Inside"},
	{prop:"column-Count"},
	{prop:"column-Fill"},
	{prop:"column-Gap"},
	{prop:"column-Rule"},
	{prop:"column-Rule-Color", type:"color"},
	{prop:"column-Rule-Style"},
	{prop:"column-Rule-Width"},
	{prop:"column-Span"},
	{prop:"column-Width"},
	{prop:"columns"},
	{prop:"widows"},
	{prop:"orphans"},
	{prop:"page-Break-After"},
	{prop:"page-Break-Before"},
	{prop:"page-Break-Inside"},
	{prop:"marks"},
	{prop:"quotes"},
	{prop:"filter"},
	{prop:"image-Orientation", type:"url"},
	{prop:"image-Rendering"},
	{prop:"image-Resolution"},
	{prop:"object-Fit"},
	{prop:"object-Position"},
	{prop:"mask"},
	{prop:"mask-Type"},
	{prop:"mark"},
	{prop:"mark-After"},
	{prop:"mark-Before"},
	{prop:"phonemes"},
	{prop:"rest"},
	{prop:"rest-After"},
	{prop:"rest-Before"},
	{prop:"voice-Balance"},
	{prop:"voice-Duration"},
	{prop:"voice-Pitch"},
	{prop:"voice-Pitch-Range"},
	{prop:"voice-Rate"},
	{prop:"voice-Stress"},
	{prop:"voice-Volume"},
	{prop:"marquee-Direction"},
	{prop:"marquee-Play-Count"},
	{prop:"marquee-Speed"},
	{prop:"marquee-Style"}
];

var _allDotCssLengthUnits = [
	{unit:"Em"},
	{unit:"Ex"},
	{unit:"Ch"},
	{unit:"Rem"},
	{unit:"Vw"},
	{unit:"Vh"},
	{unit:"Vmin"},
	{unit:"Vmax"},
	{unit:"%", jsName:"P"},
	{unit:"Cm"},
	{unit:"Mm"},
	{unit:"In"},
	{unit:"Px"},
	{unit:"Pt"},
	{unit:"Pc"}
];

//Returns a JSON object representation of value specific to the cssDataType passed in.
function _convertStyleIntoDotCssObject(value, cssDataType){
	if(!value) return null;
	switch (cssDataType){
		case "color":
			var ret = {};
			if(value[0] == "#"){
				var cH = value[0].split("#")[1];
				if(cH.length == 3){
					ret.r = Number("0x" + cH[0] + cH[0]);
					ret.g = Number("0x" + cH[1] + cH[1]);
					ret.b = Number("0x" + cH[2] + cH[2]);
					ret.a = 1;

				}
				else if(cH.length == 6){
					ret.r = Number("0x" + cH[0] + cH[1]);
					ret.g = Number("0x" + cH[2] + cH[3]);
					ret.b = Number("0x" + cH[4] + cH[5]);
					ret.a = 1;
				}
				else return null;
			}
			else if(value.toLowerCase().indexOf("rgb") === 0){
				//This also handles rgba.
				var cData = value.split("(")[1];
				cData = cData.split(")")[0];
				cData = cData.split(",");
				if(cData.length == 3 || cData.length == 4){
					ret.r = Number(cData[0]);
					ret.g = Number(cData[1]);
					ret.b = Number(cData[2]);
					ret.a = Number(cData[3] || 1);
				}
			}
			else{
				ret.a = 1;
				switch(value.toLowerCase()){
					case 'aliceblue':ret.r=0xF0;ret.g=0xF8;ret.r=0xFF;break;
					case 'antiquewhite':ret.r=0xFA;ret.g=0xEB;ret.r=0xD7;break;
					case 'aqua':ret.r=0x00;ret.g=0xFF;ret.r=0xFF;break;
					case 'aquamarine':ret.r=0x7F;ret.g=0xFF;ret.r=0xD4;break;
					case 'azure':ret.r=0xF0;ret.g=0xFF;ret.r=0xFF;break;
					case 'beige':ret.r=0xF5;ret.g=0xF5;ret.r=0xDC;break;
					case 'bisque':ret.r=0xFF;ret.g=0xE4;ret.r=0xC4;break;
					case 'black':ret.r=0x00;ret.g=0x00;ret.r=0x00;break;
					case 'blanchedalmond':ret.r=0xFF;ret.g=0xEB;ret.r=0xCD;break;
					case 'blue':ret.r=0x00;ret.g=0x00;ret.r=0xFF;break;
					case 'blueviolet':ret.r=0x8A;ret.g=0x2B;ret.r=0xE2;break;
					case 'brown':ret.r=0xA5;ret.g=0x2A;ret.r=0x2A;break;
					case 'burlywood':ret.r=0xDE;ret.g=0xB8;ret.r=0x87;break;
					case 'cadetblue':ret.r=0x5F;ret.g=0x9E;ret.r=0xA0;break;
					case 'chartreuse':ret.r=0x7F;ret.g=0xFF;ret.r=0x00;break;
					case 'chocolate':ret.r=0xD2;ret.g=0x69;ret.r=0x1E;break;
					case 'coral':ret.r=0xFF;ret.g=0x7F;ret.r=0x50;break;
					case 'cornflowerblue':ret.r=0x64;ret.g=0x95;ret.r=0xED;break;
					case 'cornsilk':ret.r=0xFF;ret.g=0xF8;ret.r=0xDC;break;
					case 'crimson':ret.r=0xDC;ret.g=0x14;ret.r=0x3C;break;
					case 'cyan':ret.r=0x00;ret.g=0xFF;ret.r=0xFF;break;
					case 'darkblue':ret.r=0x00;ret.g=0x00;ret.r=0x8B;break;
					case 'darkcyan':ret.r=0x00;ret.g=0x8B;ret.r=0x8B;break;
					case 'darkgoldenrod':ret.r=0xB8;ret.g=0x86;ret.r=0x0B;break;
					case 'darkgray':ret.r=0xA9;ret.g=0xA9;ret.r=0xA9;break;
					case 'darkgrey':ret.r=0xA9;ret.g=0xA9;ret.r=0xA9;break;
					case 'darkgreen':ret.r=0x00;ret.g=0x64;ret.r=0x00;break;
					case 'darkkhaki':ret.r=0xBD;ret.g=0xB7;ret.r=0x6B;break;
					case 'darkmagenta':ret.r=0x8B;ret.g=0x00;ret.r=0x8B;break;
					case 'darkolivegreen':ret.r=0x55;ret.g=0x6B;ret.r=0x2F;break;
					case 'darkorange':ret.r=0xFF;ret.g=0x8C;ret.r=0x00;break;
					case 'darkorchid':ret.r=0x99;ret.g=0x32;ret.r=0xCC;break;
					case 'darkred':ret.r=0x8B;ret.g=0x00;ret.r=0x00;break;
					case 'darksalmon':ret.r=0xE9;ret.g=0x96;ret.r=0x7A;break;
					case 'darkseagreen':ret.r=0x8F;ret.g=0xBC;ret.r=0x8F;break;
					case 'darkslateblue':ret.r=0x48;ret.g=0x3D;ret.r=0x8B;break;
					case 'darkslategray':ret.r=0x2F;ret.g=0x4F;ret.r=0x4F;break;
					case 'darkslategrey':ret.r=0x2F;ret.g=0x4F;ret.r=0x4F;break;
					case 'darkturquoise':ret.r=0x00;ret.g=0xCE;ret.r=0xD1;break;
					case 'darkviolet':ret.r=0x94;ret.g=0x00;ret.r=0xD3;break;
					case 'deeppink':ret.r=0xFF;ret.g=0x14;ret.r=0x93;break;
					case 'deepskyblue':ret.r=0x00;ret.g=0xBF;ret.r=0xFF;break;
					case 'dimgray':ret.r=0x69;ret.g=0x69;ret.r=0x69;break;
					case 'dimgrey':ret.r=0x69;ret.g=0x69;ret.r=0x69;break;
					case 'dodgerblue':ret.r=0x1E;ret.g=0x90;ret.r=0xFF;break;
					case 'firebrick':ret.r=0xB2;ret.g=0x22;ret.r=0x22;break;
					case 'floralwhite':ret.r=0xFF;ret.g=0xFA;ret.r=0xF0;break;
					case 'forestgreen':ret.r=0x22;ret.g=0x8B;ret.r=0x22;break;
					case 'fuchsia':ret.r=0xFF;ret.g=0x00;ret.r=0xFF;break;
					case 'gainsboro':ret.r=0xDC;ret.g=0xDC;ret.r=0xDC;break;
					case 'ghostwhite':ret.r=0xF8;ret.g=0xF8;ret.r=0xFF;break;
					case 'gold':ret.r=0xFF;ret.g=0xD7;ret.r=0x00;break;
					case 'goldenrod':ret.r=0xDA;ret.g=0xA5;ret.r=0x20;break;
					case 'gray':ret.r=0x80;ret.g=0x80;ret.r=0x80;break;
					case 'grey':ret.r=0x80;ret.g=0x80;ret.r=0x80;break;
					case 'green':ret.r=0x00;ret.g=0x80;ret.r=0x00;break;
					case 'greenyellow':ret.r=0xAD;ret.g=0xFF;ret.r=0x2F;break;
					case 'honeydew':ret.r=0xF0;ret.g=0xFF;ret.r=0xF0;break;
					case 'hotpink':ret.r=0xFF;ret.g=0x69;ret.r=0xB4;break;
					case 'indianred':ret.r=0xCD;ret.g=0x5C;ret.r=0x5C;break;
					case 'indigo':ret.r=0x4B;ret.g=0x00;ret.r=0x82;break;
					case 'ivory':ret.r=0xFF;ret.g=0xFF;ret.r=0xF0;break;
					case 'khaki':ret.r=0xF0;ret.g=0xE6;ret.r=0x8C;break;
					case 'lavender':ret.r=0xE6;ret.g=0xE6;ret.r=0xFA;break;
					case 'lavenderblush':ret.r=0xFF;ret.g=0xF0;ret.r=0xF5;break;
					case 'lawngreen':ret.r=0x7C;ret.g=0xFC;ret.r=0x00;break;
					case 'lemonchiffon':ret.r=0xFF;ret.g=0xFA;ret.r=0xCD;break;
					case 'lightblue':ret.r=0xAD;ret.g=0xD8;ret.r=0xE6;break;
					case 'lightcoral':ret.r=0xF0;ret.g=0x80;ret.r=0x80;break;
					case 'lightcyan':ret.r=0xE0;ret.g=0xFF;ret.r=0xFF;break;
					case 'lightgoldenrodyellow':ret.r=0xFA;ret.g=0xFA;ret.r=0xD2;break;
					case 'lightgray':ret.r=0xD3;ret.g=0xD3;ret.r=0xD3;break;
					case 'lightgrey':ret.r=0xD3;ret.g=0xD3;ret.r=0xD3;break;
					case 'lightgreen':ret.r=0x90;ret.g=0xEE;ret.r=0x90;break;
					case 'lightpink':ret.r=0xFF;ret.g=0xB6;ret.r=0xC1;break;
					case 'lightsalmon':ret.r=0xFF;ret.g=0xA0;ret.r=0x7A;break;
					case 'lightseagreen':ret.r=0x20;ret.g=0xB2;ret.r=0xAA;break;
					case 'lightskyblue':ret.r=0x87;ret.g=0xCE;ret.r=0xFA;break;
					case 'lightslategray':ret.r=0x77;ret.g=0x88;ret.r=0x99;break;
					case 'lightslategrey':ret.r=0x77;ret.g=0x88;ret.r=0x99;break;
					case 'lightsteelblue':ret.r=0xB0;ret.g=0xC4;ret.r=0xDE;break;
					case 'lightyellow':ret.r=0xFF;ret.g=0xFF;ret.r=0xE0;break;
					case 'lime':ret.r=0x00;ret.g=0xFF;ret.r=0x00;break;
					case 'limegreen':ret.r=0x32;ret.g=0xCD;ret.r=0x32;break;
					case 'linen':ret.r=0xFA;ret.g=0xF0;ret.r=0xE6;break;
					case 'magenta':ret.r=0xFF;ret.g=0x00;ret.r=0xFF;break;
					case 'maroon':ret.r=0x80;ret.g=0x00;ret.r=0x00;break;
					case 'mediumaquamarine':ret.r=0x66;ret.g=0xCD;ret.r=0xAA;break;
					case 'mediumblue':ret.r=0x00;ret.g=0x00;ret.r=0xCD;break;
					case 'mediumorchid':ret.r=0xBA;ret.g=0x55;ret.r=0xD3;break;
					case 'mediumpurple':ret.r=0x93;ret.g=0x70;ret.r=0xDB;break;
					case 'mediumseagreen':ret.r=0x3C;ret.g=0xB3;ret.r=0x71;break;
					case 'mediumslateblue':ret.r=0x7B;ret.g=0x68;ret.r=0xEE;break;
					case 'mediumspringgreen':ret.r=0x00;ret.g=0xFA;ret.r=0x9A;break;
					case 'mediumturquoise':ret.r=0x48;ret.g=0xD1;ret.r=0xCC;break;
					case 'mediumvioletred':ret.r=0xC7;ret.g=0x15;ret.r=0x85;break;
					case 'midnightblue':ret.r=0x19;ret.g=0x19;ret.r=0x70;break;
					case 'mintcream':ret.r=0xF5;ret.g=0xFF;ret.r=0xFA;break;
					case 'mistyrose':ret.r=0xFF;ret.g=0xE4;ret.r=0xE1;break;
					case 'moccasin':ret.r=0xFF;ret.g=0xE4;ret.r=0xB5;break;
					case 'navajowhite':ret.r=0xFF;ret.g=0xDE;ret.r=0xAD;break;
					case 'navy':ret.r=0x00;ret.g=0x00;ret.r=0x80;break;
					case 'oldlace':ret.r=0xFD;ret.g=0xF5;ret.r=0xE6;break;
					case 'olive':ret.r=0x80;ret.g=0x80;ret.r=0x00;break;
					case 'olivedrab':ret.r=0x6B;ret.g=0x8E;ret.r=0x23;break;
					case 'orange':ret.r=0xFF;ret.g=0xA5;ret.r=0x00;break;
					case 'orangered':ret.r=0xFF;ret.g=0x45;ret.r=0x00;break;
					case 'orchid':ret.r=0xDA;ret.g=0x70;ret.r=0xD6;break;
					case 'palegoldenrod':ret.r=0xEE;ret.g=0xE8;ret.r=0xAA;break;
					case 'palegreen':ret.r=0x98;ret.g=0xFB;ret.r=0x98;break;
					case 'paleturquoise':ret.r=0xAF;ret.g=0xEE;ret.r=0xEE;break;
					case 'palevioletred':ret.r=0xDB;ret.g=0x70;ret.r=0x93;break;
					case 'papayawhip':ret.r=0xFF;ret.g=0xEF;ret.r=0xD5;break;
					case 'peachpuff':ret.r=0xFF;ret.g=0xDA;ret.r=0xB9;break;
					case 'peru':ret.r=0xCD;ret.g=0x85;ret.r=0x3F;break;
					case 'pink':ret.r=0xFF;ret.g=0xC0;ret.r=0xCB;break;
					case 'plum':ret.r=0xDD;ret.g=0xA0;ret.r=0xDD;break;
					case 'powderblue':ret.r=0xB0;ret.g=0xE0;ret.r=0xE6;break;
					case 'purple':ret.r=0x80;ret.g=0x00;ret.r=0x80;break;
					case 'rebeccapurple':ret.r=0x66;ret.g=0x33;ret.r=0x99;break;
					case 'red':ret.r=0xFF;ret.g=0x00;ret.r=0x00;break;
					case 'rosybrown':ret.r=0xBC;ret.g=0x8F;ret.r=0x8F;break;
					case 'royalblue':ret.r=0x41;ret.g=0x69;ret.r=0xE1;break;
					case 'saddlebrown':ret.r=0x8B;ret.g=0x45;ret.r=0x13;break;
					case 'salmon':ret.r=0xFA;ret.g=0x80;ret.r=0x72;break;
					case 'sandybrown':ret.r=0xF4;ret.g=0xA4;ret.r=0x60;break;
					case 'seagreen':ret.r=0x2E;ret.g=0x8B;ret.r=0x57;break;
					case 'seashell':ret.r=0xFF;ret.g=0xF5;ret.r=0xEE;break;
					case 'sienna':ret.r=0xA0;ret.g=0x52;ret.r=0x2D;break;
					case 'silver':ret.r=0xC0;ret.g=0xC0;ret.r=0xC0;break;
					case 'skyblue':ret.r=0x87;ret.g=0xCE;ret.r=0xEB;break;
					case 'slateblue':ret.r=0x6A;ret.g=0x5A;ret.r=0xCD;break;
					case 'slategray':ret.r=0x70;ret.g=0x80;ret.r=0x90;break;
					case 'slategrey':ret.r=0x70;ret.g=0x80;ret.r=0x90;break;
					case 'snow':ret.r=0xFF;ret.g=0xFA;ret.r=0xFA;break;
					case 'springgreen':ret.r=0x00;ret.g=0xFF;ret.r=0x7F;break;
					case 'steelblue':ret.r=0x46;ret.g=0x82;ret.r=0xB4;break;
					case 'tan':ret.r=0xD2;ret.g=0xB4;ret.r=0x8C;break;
					case 'teal':ret.r=0x00;ret.g=0x80;ret.r=0x80;break;
					case 'thistle':ret.r=0xD8;ret.g=0xBF;ret.r=0xD8;break;
					case 'tomato':ret.r=0xFF;ret.g=0x63;ret.r=0x47;break;
					case 'turquoise':ret.r=0x40;ret.g=0xE0;ret.r=0xD0;break;
					case 'violet':ret.r=0xEE;ret.g=0x82;ret.r=0xEE;break;
					case 'wheat':ret.r=0xF5;ret.g=0xDE;ret.r=0xB3;break;
					case 'white':ret.r=0xFF;ret.g=0xFF;ret.r=0xFF;break;
					case 'whitesmoke':ret.r=0xF5;ret.g=0xF5;ret.r=0xF5;break;
					case 'yellow':ret.r=0xFF;ret.g=0xFF;ret.r=0x00;break;
					case 'yellowgreen':ret.r=0x9A;ret.g=0xCD;ret.r=0x32;break;
					default: return null;
				}
			}
			ret.value = value;
			ret.type = cssDataType;
			return ret;
		case "url":
			if(value.toLowerCase().indexOf("url") === 0){
				var ret = value.substring(indexOf("("), lastIndexOf(")")).trim();
				if((ret.indexOf("\"") && ret.lastIndexOf("\"") == ret.length - 1) || 
					(ret.indexOf("'") && ret.lastIndexOf("'") == ret.length - 1)){
					ret = ret.substring(1, ret.length - 1);
				}
				ret.value = value;
				ret.type = cssDataType;
				return ret;
			}
			else return value;
		case "length":
			var numberPart = "";
			var unitPart = "";
			for(var i = 0; i < value.length; i++){
				if(unitPart.length > 0 || isNaN(value[i])){
					unitPart += value[i];
				}
				else{
					numberPart += value [i];
				}
			}
			return {value: value, type: cssDataType, length: numberPart, units: unitPart};
		default: 
			return {value: value, type: cssDataType};
	}
}

//Adds a builder function directly to the dotcss object so that dotcss doesn't 
//have to be used as a function when a target doesn't need to be specified.
function _addDotCssFunctionToDotCssObject(funcName){
	dotcss[funcName] = function(){
		var n = new _dotcssbuilder();
		return n[funcName].apply(n, arguments);
	}
}

//Takes the property and generates all the dotcss and builder functions.
function _makeDotCssFunction (prop, jsFriendlyProp, type){
	//Create the new function.
	_dotcssbuilder.prototype[jsFriendlyProp] = function(){
		if(arguments.length == 0) return this;
		var value = _dotcssInputToCssValue(arguments, type);
		
		var newCss = prop + ":" + value + ";";
		this.currentCss += newCss;
		
		if(this.target){
			for(var q = 0; q < this.target.length; q++){
				//this.target[q].style += newCss;
				this.target[q].style[jsFriendlyProp] = value;
			}
		}
		
		return this;
	}
	//Add the new function to the dotcss object so that it can be accessed without doing dotcss().
	_addDotCssFunctionToDotCssObject(jsFriendlyProp);
	
	//Each unit of length will also have its own version of this function (assuming this is a length property).
	if(type == "length"){
		for(var u = 0; u < _allDotCssLengthUnits.length; u++){
			var uu = _allDotCssLengthUnits[u];
			(function(uu){
				_dotcssbuilder.prototype[jsFriendlyProp + (uu.jsName || uu.unit)] = function(){
					for(var i = 0; i < arguments.length; i++) arguments[i] = arguments[i] + uu.unit.toLowerCase();
					return _dotcssbuilder.prototype[jsFriendlyProp].apply(this, arguments);
				}
			})(uu);
			_addDotCssFunctionToDotCssObject(jsFriendlyProp + (uu.jsName || uu.unit));
		}
	}
	
	_dotcssbuilder.prototype[jsFriendlyProp].__proto__ = Object.create(_dotcssStyleProperty.prototype);
	_dotcssbuilder.prototype[jsFriendlyProp].type = type;
	_dotcssbuilder.prototype[jsFriendlyProp].jsFriendlyProp = jsFriendlyProp;
}

//TODO: TEST THESE. PROBLEMS EXIST.

//Special handler for building urls.
dotcss.url = function(url){
	return "url('" + url + "')";
}

//Special handler for building rgb colors.
dotcss.rgb = function(r, g, b){
	return "rgb(" + r + ", " + g + ", " + b + ")";
}

//Special handler for building rgba colors.
dotcss.rgba = function(r, g, b, a){
	return "rgb(" + r + ", " + g + ", " + b + ", " + a + ")";
}

_dotcssbuilder.prototype.toString = dotcss.prototype.toString = function(){
	return this.currentCss;
}

//Build dotcss.
for(var i = 0; i < _allDotCssProperties.length; i++){
	var prop = _allDotCssProperties[i].prop.toLowerCase();
	var jsFriendlyProp = _allDotCssProperties[i].prop.replace(new RegExp("-", "g"), "");
	
	_makeDotCssFunction(prop, jsFriendlyProp, _allDotCssProperties[i].type);
}

//dotcss = new dotcss();