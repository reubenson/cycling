var ExpertSleepers = require('expert-sleepers').expertSleepers,
	expertSleepers = new ExpertSleepers();
var	generate = require('subpatches').generate;

var outputMode = 'expert-sleepers'; // temporary


// dumb iterator for now
function calculateLCM(arr) {
	var lcm = _.max(arr),
		lcmFound = false;

	var iterations = 500;

	while (!lcmFound && iterations > 0) {
		lcmFound = true;

		_.forEach(arr, function(num) {
			if (Math.round(lcm / num) != lcm / num ) {
				lcmFound = false;
			}
		});

		if (lcmFound) {
			return lcm;
		} else {
			iterations--;
			lcm++;
		}
	}
}

function lcm_two_numbers(x, y) {
   if ((typeof x !== 'number') || (typeof y !== 'number'))
    return false;
  return (!x || !y) ? 0 : Math.abs((x * y) / gcd_two_numbers(x, y));
}

function gcd_two_numbers(x, y) {
  x = Math.abs(x);
  y = Math.abs(y);
  while(y) {
    var t = y;
    y = x % y;
    x = t;
  }
  return x;
}

// resolve issues with connecting to dynamic outlets by wrapping in task
function connectByTask(patcher, obj1, o, obj2, i) {

	function connect(patcher, obj1, o, obj2, i) {
		patcher.connect(obj1, o, obj2, i);
	}

	var tsk = new Task( connect, this, patcher, obj1, o, obj2, i );
	// tsk.schedule(10);
	tsk.execute();
}

function removeObjects(objectNames, suffix) {
	_.forEach(objectNames, function(objectName) {
		var name = objectName + suffix;
		var object = this.patcher.getnamed(name)
		this.patcher.remove(object);
	}.bind(this));
}

function QCVG(preset, patcher) {
	this.numberOfVoices = preset.voiceParams.length;
  this.clock = preset.clock;
  this.baseFrequency = preset.baseFrequency;
  this.rule = preset.rule;
	// deprecating trigOrder?
  this.trigOrder = _.times(this.numberOfVoices, function(i){return i;});
  this.ET = preset.ET;
	this.twill = preset.twill || [1];
  this.quantize = preset.quantize;
  this.chordIndex = preset.chordIndex;

	this.sequenceParams = preset.sequenceParams;
	this.voiceParams = preset.voiceParams;

	this.attack = preset.attack;
	this.decay = preset.decay;
	this.sustain = preset.sustain;
	this.release = preset.release;

	this.soundSource = preset.soundSource;

  // PITCH MODES
  this.shiftRegisterMode = preset.shiftRegisterMode;
  this.ringChanges = preset.ringChanges;
  this.singleVoice = preset.singleVoice;

  // TEMPORAL MODES
  this.offsetVoiceMode = preset.offsetVoiceMode;
	// this.repetitions = preset.repetitions || 1;

  this.scale = new Scale(preset.scale);

  this.preset = preset;

	this.patcher = patcher;
  this.box = box;
	this.voices = [];

  this.seqcounter = 0;
	this.barCount = 0;

	// frequency of pitch LFO
	this.frequency = preset.frequency || 2;

	// output to channels 5 and 6 (Virtual 1 and 2) on apollo twin
	// this.mainOut = this.patcher.newdefault(300, 500, 'dac~', [21, 22]);

	this.mainOut = generate.stereoOutput.call(this, 300, 500, this.patcher);
	var message = this.patcher.newdefault(100, 500, 'message');
	var toggle = this.patcher.newdefault(200, 500, 'toggle');
	var filename = '' + Date.now() + '.aiff';
	toggle.bang();
	message.set('open ' + filename);
	// filename.toggle();
	this.patcher.connect(toggle, 0, this.mainOut, 2);
	this.patcher.connect(message, 0, this.mainOut, 2);

}

QCVG.prototype = {
	init: function() {
		this.setupPatch();
		this.setupController();
	},

	bang: function() {
		// offsetvoicemode needs to be debugged after bangDivider changes
		if (this.offsetVoiceMode) {
			var voiceIndex = this.trigOrder[this.seqcounter % this.voices.length];
			// var voiceIndex = this.seqcounter % this.numberOfVoices;

			this.voices[voiceIndex].bang();
		} else {
			_.forEach(this.voices, function(voice) {
				voice.bang();
			});
		}

		this.seqcounter++; // increment the sequence
		this.barCount = Math.floor(this.seqcounter / this.lcm);
	},

	setupController: function () {
		var posX = 10;

		// handle knobs (1-16)
		_.forEach(controller, function(input, i) {
			var ctlin = this.patcher.newdefault(posX + 60 * i, 10, 'ctlin', input.channel),
				dial = this.patcher.newdefault(posX + 60 * i, 40, 'dial');

			connectByTask(this.patcher, ctlin, 0, dial, 0);
			connectByTask(this.patcher, dial, 0, this.funnel, i);

			ctlin.varname = 'ctlin';
			dial.varname = 'dial';

			// send value to funnel
			// is there a way to manually read the current control value?

		}.bind(this));

		// handle mpc buttons as single input (may need to rework later)
		// just routing the midi channel as the value of channel 17
		// var button = this.patcher.newdefault(posX + 60 * 17, 10, 'notein');
		var button = generate.noteInDetector(140, 110, this.patcher);
		connectByTask(this.patcher, button, 0, this.funnel, 17);
	},

	setupPatch: function() {
		var	sig = this.patcher.newdefault(10, 310, 'sig~'),
			baseFrequency = this.patcher.newdefault(10, 260, 'number', this.baseFrequency);

		sig.varname = 'sig';
		subscribeToChange('baseFrequency', baseFrequency, 'float');
		baseFrequency.int(this.baseFrequency);
		connectByTask(this.patcher, baseFrequency, 0, sig, 0);

		// multiply clock by least common multiplier
		var lengths = _.map(this.voiceParams, function(params) {
			var subdivision = params.subdivision || 1;
			return params.sequence.length * subdivision;
		});
		// console.log('lengths', lengths);
		this.lcm = calculateLCM(lengths);
		// console.log('lcm found:', this.lcm);

		// generate LFO modulators
		var LFO1 = this.patcher.newdefault(760, 110, 'cycle~', 0.05);
		registerObject('LFO1', LFO1);

		_.times(numberOfVoices, function(i) {
			var sequenceParams = this.voiceParams[i].sequence,
				length = sequenceParams.length,
				hits = sequenceParams.hits;

			this.generateVoice(length, hits);
		}.bind(this));

		// generate metro
		var number = this.patcher.newdefault(60, 110, 'number'),
			metro = generate.metronome.call(this, 10, 160, this.patcher);
		connectByTask(this.patcher, number, 0, metro, 1);
		connectByTask(this.patcher, metro, 0, this.box, 0);
		number.int(this.clock);
		number.bang();
		this.objects = {metro: number};
		subscribeToChange('metronome', number, 'float');

		// generate toggle
		var toggle = this.patcher.newdefault(10, 110, 'toggle');
		connectByTask(this.patcher, toggle, 0, metro, 0);

		// define modulators
		var modulators = _.times(this.numberOfVoices, function(i){
			return generate.modulator.call(this, 10, 210, this.patcher, i / this.numberOfVoices, i);
		}.bind(this));

		// generate controller funnel
		this.funnel = this.patcher.newdefault(310, 120, 'funnel', 18 + modulators.length);
		connectByTask(this.patcher, this.funnel, 0, this.box, 0);

		// connect modulators
		for (var i = 0; i < modulators.length; i++) {
			connectByTask(this.patcher, metro, 0, modulators[i], 0);
			connectByTask(this.patcher, modulators[i], 0, this.funnel, i + Object.keys(controller).length);
		}

		// controller presets
		var controllerPresets = this.preset.controller;
		if (controllerPresets) {
			_.forEach(controllerPresets, function(value, key) {
				_.times(this.numberOfVoices, function(i){
					propagateChange(key, value, i);
				})
			}.bind(this));
		}
	},

	generateVoice: function(length, hits) {
		// var id = this.voices.length,
		// 	pitchOutlet = id * 2,
		// 	triggerOutlet = pitchOutlet + 1,
		// 	voice = new Voice({
		// 		main: this,
		// 		length: length,
		// 		hits: hits,
		// 		pitchOutlet: pitchOutlet,
		// 		triggerOutlet: triggerOutlet,
		// 		scale: this.scale,
		// 		rule: this.rule,
		// 		strata: this.strata
		// 	}, this.preset);
		//
		// this.voices.push(voice);

		var voiceSubpatch = generate.voice.call(this, length, hits);

		// connect voice patch to outlet
		this.patcher.connect(voiceSubpatch, 0, this.mainOut, 0);
		this.patcher.connect(voiceSubpatch, 1, this.mainOut, 1);

		// var xPos = 50 + id * 150;
		// var voicePatch = this.patcher.newdefault(xPos, 400, 'patcher'),
		// 	voiceSubpatch = voicePatch.subpatcher(),
		// var pitchInlet = voicePatcher.newdefault(10, 10, 'inlet'),
		// 	trigInlet = voicePatcher.newdefault(50, 10, 'inlet'),
		//
		// 	multiply = voicePatcher.newdefault(10, 140, '*~'),
		// 	out = voicePatcher.newdefault(100, 200, 'outlet'),
		// 	frequencyMultiplier = this.patcher.newdefault(xPos, 300, '*~'),
		// 	sig = this.patcher.getnamed('sig');
		//
		// // hide subpatch window
		// voicePatcher.wind.visible = false;
		//
		//
		// // construct sound source
		// var soundSourceParam = this.voiceParams[id].soundSource;
		// var soundSource = generate.soundSource.call(this, voicePatcher, soundSourceParam, id);
		//
		// // generate routing for voice
		// connectByTask(voicePatcher, pitchInlet, 0, soundSource, 0);
		// connectByTask(voicePatcher, trigInlet, 0, soundSource, 1);
		//
		// // construct sound source modifier and connect
		// var dubArray = this.voiceParams[id].dub;
		// var base = this.clock / length;
		// var voiceDub = generate.voiceDub(voicePatcher, dubArray, base);
		// connectByTask(voicePatcher, soundSource, 0, voiceDub, 0);

		// route through Expert Sleepers
		// if (outputMode === 'expert-sleepers') {
		// 	// var dac = voicePatcher.newdefault(500, 200, 'dac~', )
		// 	var esOutput = expertSleepers.construct({
		// 		patcher: voiceSubpatch,
		// 		inputFrequency: pitchInlet, // actually just inputFrequency for now
		// 		inputAudio: voiceDub
		// 	});
		// 	connectByTask(voiceSubpatch, esOutput, 0, out, 0);
		// } else {
		// 	voiceSubpatch.connect(soundSource, 0, out, 0);
		// 	// connectByTask(voiceSubpatch, multiply, 0, out, 0);
		// }

		// // connect main object to voice sub-patch
		// connectByTask(this.patcher, this.box, pitchOutlet, frequencyMultiplier, 1);
		// connectByTask(this.patcher, this.box, triggerOutlet, voicePatch, 1);
		//
		// // generate multiplier
		// connectByTask(this.patcher, sig, 0, frequencyMultiplier, 0);
		// connectByTask(this.patcher, frequencyMultiplier, 0, voicePatch, 0);
		// frequencyMultiplier.varname = 'multiplier';
		//
		// // connect to delay line
		// // var delay = generate.delay(voiceSubpatch);
		// // connectByTask(this.patcher, voicePatch, 0, delay, 0);
		//
		// // connect to panning object
		// var pan = this.patcher.getnamed('pan' + id);
		// // connectByTask(this.patcher, delay, 0, pan, 0);
		// connectByTask(this.patcher, voicePatch, 0, pan, 0);
		//
		// // connect panning object to main out
		// connectByTask(this.patcher, pan, 0, this.mainOut, 0);
		// connectByTask(this.patcher, pan, 1, this.mainOut, 1);
		//
		// voicePatch.varname = 'voicePatch' + id;
	},

	toggleFreezeAll: function() {
		this.voices.forEach(function(voice){
			voice.toggleFreeze();
		})
	}
}

exports.constructor = QCVG;
