var Voice = require('voice').constructor,
	Scale = require('tuning-scale').constructor,
	Main = require('main').constructor,
	Presets = require('presets').presets,
	Controller = require('controller').controller,
	controllerName = 'beatstep',
	controller = Controller[controllerName],
	media = require('mediamap').media,

	// global obj to store MAX objects in for easy lookup
	GLOBAL = {},
	saveToGlobal = function (obj, id) {
	  var keys = Object.keys(obj);

	  _.forEach(keys, function(key){
	    GLOBAL[key] = GLOBAL[key] || {};
	    GLOBAL[key][id] = obj[key];
	  });
	},

	console = {
		log: function(a, b) {
			post(a, b ,"\n");
		}
	};

function registerObject(key, obj) {
	GLOBAL[key] = obj;
}

function retrieveObject(key) {
	return GLOBAL[key];
}

GLOB = {};
function subscribeToChange(key, object, action, id) {
	var object = {
		maxObject: object,
		action: action
	};

	if (typeof id === 'undefined') {
		GLOB[key] = GLOB[key] || [];
		GLOB[key].push(object);
	} else {
		GLOB[key] = GLOB[key] || {};
		GLOB[key][id] = GLOB[key][id] || [];
		GLOB[key][id].push(object);
	}
}
function propagateChange(key, value, id) {
	var subscribers;

	try {
		subscribers = (typeof id === 'undefined') ? GLOB[key] : GLOB[key][id];
	} catch (e) {
		console.log('no subscribers found for global key:', key);
		return;
	}

	_.forEach(subscribers, function(subscriber) {
		subscriber.maxObject[subscriber.action](value);
	});
}

this.preset = Presets[0];
var numberOfVoices = this.preset.voiceParams.length;

inlets = 1;
outlets = 2 * numberOfVoices;

var qcvg = new Main(this.preset, this.patcher, this.box);

function loadbang() {
	var obj = this.patcher.firstobject;

	while (obj) {
		var nextObject = obj.nextobject;
		if (obj.varname) {
			if (!obj.varname.match(/pan/) && !obj.varname.match(/thejs/) && !obj.varname.match(/bp./)) {
				this.patcher.remove(obj);
			}
		}
		obj = nextObject;
	}

	qcvg.init();
	this.patcher.apply(actualBang);
}

function actualBang(obj) {
	if (obj.maxclass.match(/dial/)) {
		return false
	}
	if (obj.bang) {
		obj.bang();
	}

}

function bang() {
	qcvg.bang();
}

/*
 * map controller movement to actions
 * var 1 corresponds to knob id, var 2 corresponds to value of encoder
 */
function list(var1, var2) {
	var fn = controller[var1] && controller[var1].fn,
		previousVal = Controller.getPrevVal(var1);

	// lfos (one for each voice)
	var lfoIndex = 18;
	if (var1 >= 18) {
		var id = var1 - lfoIndex;
		qcvg.voices[id].modulator1 = var2;
		// console.log('var2', var2);
	}

	// ignore if previousVal hasn't already been set
	// (this helps with ctlin values defaulting to zero on load)
	// (no longer needed if i figure out a way to output MIDI cc from controller on load)
	// note: this is only helpful for knobs, not triggers
	if (var1 > 16 || previousVal > -1) {
		fn && fn.call(qcvg, var2, previousVal);
	}

	// save new value to prevState
	Controller.saveToPrevState(var1, var2);
}
