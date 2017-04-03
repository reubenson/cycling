var Voice = require('voice').constructor,
	Scale = require('scale').constructor,
	console = {
		log: function(a, b) {
			post(a, b ,"\n");
		}
	};



// inlets and outlets
inlets = 1;
outlets = 2;

// global variables and arrays
var numberOfVoices = 4;
var numsliders = 0;
var seqcounter = 0;
var thevalues = new Array(numberOfVoices);

// qcvg variables
var scale = new Scale({
	tuning: 'P',
	scaleChoice: '-1',
	numberOfDivisions: 12
});
var baseFrequency = 200;
var rule = 'R';
var trigOrder = [0, 1, 2, 3];
var ET = false;
var strata = false;
var quantize = true;
var chordIndex = 4;

// PITCH MODES
var shiftRegisterMode = true;
var ringChanges = false;
var singleVoice = false;

// TEMPORAL MODES
var offsetVoiceMode = true;

// Maxobj variables for scripting
var controlin = new Array(numberOfVoices);
var thesliders = new Array(numberOfVoices);
var thefunnel;

var voices = [];
var maxObjects = [];

init();

function init() {
	setupPatch();

	var obj = this.patcher.firstobject;
	while (obj) {
		console.log('name', obj.name);
		console.log('class', obj.maxclass);
		if (obj.name) {
			this.patcher.remove(obj);
		}
		obj = obj.nextobject;
	}
}


// resolve issues with connecting to dynamic outlets by wrapping in task
function connectByTask(obj1, o, obj2, i) {

	function connect(obj1, o, obj2, i) {
		this.patcher.connect(obj1, o, obj2, i);
	}

	var tsk = new Task( connect, this, obj1, o, obj2, i );
	// tsk.schedule(10);
	tsk.execute();
}

// sliders(numberOfVoices);

function removeObjects(objectNames, suffix) {
	_.forEach(objectNames, function(objectName) {
		var name = objectName + suffix;
		var object = this.patcher.getnamed(name)
		this.patcher.remove(object);
	}.bind(this));
}

function setupPatch() {
	var baseFrequencyObj = this.patcher.newdefault(10, 10, 'number', baseFrequency);
		baseFrequencyObj.varname = 'BaseFrequency';

	if (!this.patcher.getnamed('cycle0')) {
		_.times(numberOfVoices, function(){
			generateVoice(8,8);
		});
	} else {
		var objects = ['adsr', 'cycle', 'multiply'];

		_.times(numberOfVoices, function(i) {
			// existing objects seem to be unreliable ...
			// remove objects
			removeObjects(objects, i);
			// and generate them again
			generateVoice(8,8);
		}.bind(this));
	}
}

// sliders -- generates and binds the sliders in the max patch
function sliders(val)
{
	setupPatch();
	// if(arguments.length) // bail if no arguments
	// {
	// 	// parse arguments
	// 	var a = arguments[0];
	//
	// 	// safety check for number of sliders
	// 	if(a<0) a = 0; // too few sliders, set to 0
	// 	if(a>128) a = 128; // too many sliders, set to 128
	//
	// 	// out with the old...
	// 	if(numsliders) this.patcher.remove(thefunnel); // if we've done this before, get rid of the funnel
	// 	for(var i=0;i<numsliders;i++) // get rid of the ctlin and uslider objects using the old number of sliders
	// 	{
	// 		this.patcher.remove(controlin[i]);
	// 		this.patcher.remove(thesliders[i]);
	// 	}
	//
	// 	// ...in with the new
	// 	numsliders = a; // update our global number of sliders to the new value
	// 	if(numsliders) thefunnel = this.patcher.newdefault(300, 300, "funnel", a); // make the funnel
	// 	for(var k=0;k<a;k++) // create the new ctlin and uslider objects, connect them to one another and to the funnel
	// 	{
	// 		controlin[k] = this.patcher.newdefault(300+(k*100), 50, "ctlin", k+1);
	// 		thesliders[k] = this.patcher.newdefault(300+(k*100), 100, "uslider");
	// 		this.patcher.connect(controlin[k], 0, thesliders[k], 0);
	// 		this.patcher.connect(thesliders[k], 0, thefunnel, k);
	// 	}
	//
	// 	// connect new objects to this js object's inlet
	// 	ourself = this.box; // assign a Maxobj to our js object
	// 	if (numsliders) this.patcher.connect(thefunnel, 0, ourself, 0); // connect the funnel to us
	// }
	//
	// else // complain about arguments
	// {
	// 	post("sliders message needs arguments");
	// 	post();
	// }
}

function generateVoice(length, hits) {
	var id = voices.length;
	outlets += 2;
	pitchOutlet = outlets - 2;
	triggerOutlet = outlets - 1;
	voices.push( new Voice({
		length: length,
		hits: hits,
		pitchOutlet: pitchOutlet,
		triggerOutlet: triggerOutlet,
		scale: scale,
		rule: rule
	}));
	var xPos = 10 + id * 120;
	var cycle = this.patcher.newdefault(xPos, 300, 'cycle~');
	var adsr = this.patcher.newdefault(xPos, 350, 'adsr~', 5, 50, 0.6, 100);
	var multiply = this.patcher.newdefault(xPos, 400, '*~');

	connectByTask(cycle, 0, multiply, 0);
	connectByTask(adsr, 0, multiply, 1);

	connectByTask(this.box, pitchOutlet, cycle, 0);
	connectByTask(this.box, triggerOutlet, adsr, 0);

	cycle.varname = 'cycle' + id;
	adsr.varname = 'adsr' + id;
	multiply.varname = 'multiply' + id;

	var voicePatcher = this.patcher.newdefault(10, 200, 'patcher').subpatcher();
	voicePatcher.varname = 'voicePatcher';
	var xPos = 10 + id * 120;
	var cycle = voicePatcher.newdefault(xPos, 300, 'cycle~');
	var adsr = voicePatcher.newdefault(xPos, 350, 'adsr~', 5, 50, 0.6, 100);
	var multiply = voicePatcher.newdefault(xPos, 400, '*~');
	var pitchInlet = voicePatcher.newdefault(10, 10, 'inlet');
	var trigInlet = voicePatcher.newdefault(30, 10, 'inlet');
	connectByTask(cycle, 0, multiply, 0);
	connectByTask(adsr, 0, multiply, 1);

	connectByTask(pitchInlet, pitchOutlet, cycle, 0);
	connectByTask(trigInlet, triggerOutlet, adsr, 0);

	cycle.varname = 'cycle' + id;
	adsr.varname = 'adsr' + id;
	multiply.varname = 'multiply' + id;
}

// list -- read from the created funnel object
function list(val)
{
	if(arguments.length==2)
	{
		thevalues[arguments[0]] = arguments[1];
	}
}

// bang -- steps through sequencer
function bang() {
	if (offsetVoiceMode) {
		var voiceIndex = trigOrder[seqcounter % voices.length];
		voices[voiceIndex].bang();
	} else {
		_.forEach(voices, function(voice) {
			voice.bang();
		});
	}

	seqcounter++; // increment the sequence
}
