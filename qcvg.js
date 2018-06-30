var console = {
		log: function(a, b) {
			post(a, b ,"\n");
		}
	},
	Voice = require('voice').constructor,
	Scale = require('tuning-scale').constructor,
	Main = require('main').constructor,
	Presets = require('presets').presets,
	Controller = require('controller').constructor,
	media = require('mediamap').media,

	// global obj to store MAX objects in for easy lookup
	GLOBAL = {};


this.preset = Presets[1];
var numberOfVoices = this.preset.voiceParams.length,
	controller = new Controller('beatstep');

inlets = 1;
outlets = 2 * numberOfVoices;

var qcvg = new Main(this.preset, this.patcher, this.box);

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
	var subscribers,
		logChange = true;

	try {
		subscribers = (typeof id === 'undefined') ? GLOB[key] : GLOB[key][id];
	} catch (e) {
		// console.log('no subscribers found for global key:', key);
		return;
	}

	_.forEach(subscribers, function(subscriber) {
		var maxObject = subscriber.maxObject,
			action = subscriber.action;

		maxObject[action](value);
		if (key != 'voiceTrigger' && logChange) {
			console.log('controller: ' + key + ' -> ', value);
		}
	});
}



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

function bangVoice(i) {
	qcvg.bangVoice(i);
}

/*
 * map controller changes to actions
 * var 1 corresponds to knob id, var 2 corresponds to value of encoder
 */
function list(channel, val) {
	var previousVal = controller.getPrevVal(channel);

	// midi controller inputs
	if (channel < controller.length) {
		controller.send(channel, val, qcvg);
	}

	// lfos (one for each voice)
	else {
		var id = channel - controller.length;
		qcvg.voices[id].modulator1 = val;
	}
}
