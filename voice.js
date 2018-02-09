const sequence = require('sequence').constructor,
	Rules = require('rules').rules,
	Chords = require('chords').chords;

var	voices = [],
	shiftRegister;

function swap(Sequence, iteration , NumberOfBells) {
// Swap members of Sequence according to the 'plain bob' method, which is the simplest instance of method ringing.
// In method ringing, the goal is to play each possible permutation of a sequence of notes rung on bells.
// For reference, see http://plus.maths.org/content/ringing-changes
	var pos;
	if (iteration % 2 == 0) {pos = 0;}
	else {pos = 1;}

	// after NumberOfBells*2, an extra increment on pos is imposed
	if ( (iteration+1) % NumberOfBells * 2 == 0 ) {
		pos++;
	}

	// starting with pos, swap adjacent members of sequence
	while ( pos < (NumberOfBells-1) ) {
		var storage = Sequence[pos];
		Sequence[pos] = Sequence[pos+1];
		Sequence[pos+1] = storage;
		pos = pos+2;
	}

	return Sequence;
}

function Voice(opts, params) {
	this.id = voices.length;
	// import voiceParams to this.params
	_.forEach(params.voiceParams[this.id], function(value, key){
		this[key] = value;
	}.bind(this));

	this.params = params;
	this.sequenceType = this.sequenceType || params.sequenceType;
	this.length = opts.length;
	this.hits = _.clamp(opts.hits, 0, this.length);

	// hacky, but this needs to happen first
	this.processSubdivision();

	this.noteDuration = 15;
	this.pitchOutlet = opts.pitchOutlet;
	this.triggerOutlet = opts.triggerOutlet;

	// track number of iterations
	this.index = 0;

	this.currentPosition = 0; // not always the same as index?

	// used in different ways by different rules
	this.intervalIndex = 0;

	this.scale = opts.scale;
	this.repetitions = preset.repetitions;
	// this.rule = opts.rule || 'S';
	this.timeFactor = 1;
	// this.twill = params.voiceParams[this.id].twill;
	// this.strata = opts.strata;
	// this.register = params.voiceParams[this.id].register;

	// needed for managing sequences of different lengths
	this.main = opts.main;
	this.bangDivider = this.main.lcm / this.length;
	console.log('bangDivider', this.bangDivider);

	// if (this.bangDivider == 1) {
	// 	this.bangDivider = this.main.lcm;
	// }
	this.rule = this.rule || params.rule;

	// initialize shift register
	shiftRegister = shiftRegister || _.times(this.main.numberOfVoices, function(){return 1.0});
	console.log('shiftReg', shiftRegister);

	this.setRegister(params.voiceParams[this.id].register);
	this.init();

	voices.push(this);
}

Voice.prototype = {
	// notes on timing:
	// each note in a sequence can be given equal duration,
	// or sequence can be of equal duration (polyrhythm)
	// the latter will be implemented first
	bang: function() {
		if (this.main.seqcounter % this.bangDivider == 0 ) {

			// if (this.id === 3) {
			// 	console.log('testing trigger', this.main.seqcounter);
			// 	console.log('bang divider', this.bangDivider);
			// }
			if (this.shouldTrigger()) {
				// var midiVal = Math.round(Math.random() * 8) * 12,

				if (this.shouldAdvance()) {
					this.advance();
				}
				this.sendNote();
				this.sendTrigger();

				// if (this.id === 3) {
				// 	post('sequence', this.sequence.pitchArray); post();
				// }

				// if (voice.id == 0) {
				// 	midiVal = ((seqcounter % voice.length) ) * 12;
				// 	// outlet(2, hertzVal);
				// 	outlet(1, seqcounter); // sound out our location in the sequence
				// 	outlet(0, midiVal); // send out the current note
				// }
			}

			this.tick();

		}
	},

	// Return the previous voice in TrigOrder
	previousVoice: function() {
    var i = 0;

    while (this.id != this.trigOrder[i]) {
      i++;
    }

    return voices[ this.trigOrder[(i+this.main.numberOfVoices-1) % this.main.numberOfVoices] ];
  },

	getInterval: function() {
		return this.sequence.getInterval(this.index);
	},

	getPitchRatio: function(i) {
		i = i || this.currentPosition;
		// this.sequence.getPitchRatio[i];
		// this.sequence.getPitchFromScale(i);
		return this.scale.getPitch(i);
	},

	// TODO: clean up
	setRegister: function(register) {
		var registerLow, registerHigh;

		if (typeof register === 'object') {
			registerLow = register[0];
			registerHigh = register[1];
			console.log('register', register);
		} else if (typeof register === 'number') {
			registerLow = register;
			registerHigh = register + 1;
			console.log('register', register);
		} else {
			registerLow = -1;
			reigsterHigh = 4;
		}

		// this.floor and this.roof define the bounds of each voice's pitch
	  if (typeof registerLow === 'number') {
	    // each voice sits in its own octave register
	    this.floor = Math.pow(2, registerLow);
	    this.roof  = Math.pow(2, registerHigh);
			// this.register = register;
	  }
	  else {
			console.log('else??');
	    // each voice spans entire four octaves
	    this.floor = Math.pow(2, -1);
	    this.roof  = Math.pow(2, 4);
	  }
	},

	shouldAdvance: function() {
		return !this.isFrozen;
	},

	advance: function() {
	// Determine the next note in the sequence as determined by program mode and rule

		// number of times a Voice has been advanced
		var _counter = this.index - 1;

		// return early if condition not met
		if (_counter % (this.repetitions * this.length) >= this.length) {
			return;
		}

		// var PrevCV = this.previousVoice().getPitchRatio();
		var newInterval = this.getPitchRatio[this.currentPosition];
		var updateSequence = false;

		var PopulateSequenceOnce = this.params.ringChanges;
		var SingleVoiceModes = this.params.singleVoice || this.params.shiftRegisterMode || this.params.ET;
		if ( (((!SingleVoiceModes) || this.id == 0) && !PopulateSequenceOnce) || (PopulateSequenceOnce && _counter < this.length)){

			// determine new note according to this.rule
			newInterval = Rules[this.rule].call(this);

			// quantize to nearest note in Scale
			if (this.params.quantize) {
				newInterval = this.scale.quantizeNote(newInterval);
			}

			updateSequence = true;
		}

		else if (this.params.ringChanges && _counter % this.length == 0) {
			var iteration = Math.floor( this.index / this.length );

			this.sequence.pitchArray = swap(this.sequence.pitchArray, iteration, this.length);
			newInterval = this.sequence.pitchArray[this.index];
		}

		else if (this.params.ET) {
			switch (this.id) {
				case 1: newInterval = Voices[0].getPitchRatio()*2.; break;
				case 2: newInterval = Voices[0].getPitchRatio(this.length-1-this.currentPosition); break;
				case 3: newInterval = Voices[0].getPitchRatio(this.length-1-this.currentPosition)*2; break;
			}
		}

		else if (this.params.singleVoice){
			// Voices 2-4 pitch fixed with respect to by Voice1
			newInterval = this.id == 0 ? newInterval : voices[0].currentInterval;
			newInterval *= this.intervalMultiplier;

			updateSequence = true;
		}

		else if (this.params.shiftRegisterMode) {
			newInterval = shiftRegister[this.id];
			updateSequence = true;
		}

		// apply Root Shift (Root = 1.0 if !ChangeRootMode)
		// root shift will be applied to baseFrequency instead?
		// newInterval *= this.main.root;

		// make sure newInterval is between 1 and 16
		// re-evaluating ...
		newInterval = this.fixInterval(newInterval);

		// update sequence with new note
		if (updateSequence) {
			this.sequence.updateIntervalSequence(this.index, newInterval);
			this.currentInterval = newInterval;
		}

		// enforce temporal cohesion in SingleVoice mode
		if (this.id != 0 && this.params.singleVoice) { this.timeFactor = voices[0].timeFactor; }
		// this.timeFactor = 1./pow(newInterval,0.5);
		// this.timeFactor = random(1,2);

		// update shift register
		if (this.id == this.main.trigOrder[0]) {
			this.updateShiftRegister(newInterval);
		}
	},

	updateShiftRegister: function(newInterval) {
		var i = voices.length - 1;

		while (i > 0) {
			shiftRegister[i] = shiftRegister[i-1]; i--;
		}
		shiftRegister[0] = newInterval;
	},

	fixInterval: function(Interval) {
	// _.clamp Interval to periodic boundaries defined by this.roof and this.floor
		while (Interval-this.roof>1e-3) {Interval /= this.roof/this.floor;}
		while (this.floor-Interval>1e-3) {Interval *= this.roof/this.floor;}

		return Interval;
	},

	evaluateTwill: function() {
		var barCount = this.main.barCount + this.id,
			twill = this.twill || this.main.twill,
			a = twill[0] || 0,
			b = twill[1] || 0,
			c = twill[2] || 0,
			d = twill[3] || 0;

		// return true
		// console.log('barcount', barCount);
		// console.log('twill', twill);
		// console.log('test', barCount % (a+b+c+d) < a || barCount % (a + b + c + d ) < (a + b + c) && barCount % (a + b + c + d ) >= (a + b));

		return barCount % (a+b+c+d) < a || barCount % (a + b + c + d ) < (a + b + c) && barCount % (a + b + c + d ) >= (a + b);
	},

	shouldTrigger: function() {
		// return this.sequence.shouldTrigger(this.index, this.id);
		if (this.triggerRule === 'LFO') {
			// console.log('mod1', this.modulator1);
			return Math.random() > 0.7;
			// return this.modulator1 >= 0.5;
		} else {
			return this.evaluateTwill() && this.sequence.shouldTrigger(this.index, this.id);
		}
	},

	tick: function() {
		this.index++;
	},

	sendNote: function() {
		var interval = this.sequence.getInterval(this.index);
			pitch = this.params.baseFrequency * interval;

		// interval = 1.0;

		outlet(this.pitchOutlet, interval);

		// modulate sample playback spped
		// bug: update sfplay[] to be an object, not array?
		if (this.params.voiceParams[this.id].soundSource === 'media') {
			// propagateChange('pitchRatio', interval * 0.5, this.id);
		};
	},

	sendTrigger: function() {
		function removeTrigger() {
			outlet(this.triggerOutlet, 0);
		}
		var t = new Task(removeTrigger.bind(this));
		outlet(this.triggerOutlet, "bang");

		// trigger sample playback
		if (this.params.voiceParams[this.id].soundSource === 'media') {
			propagateChange('voiceTrigger', 1, this.id);
		}

	},

	setupSingleVoice: function(i) {
	// Define 4-note chord for use in SingleVoice mode
		this.intervalMultiplier = Chords[i][this.id];
		// update the intervals by which to multiply Voices2-4
		// for (var i = 0; i<4; i++){
		// 	Voices[i]._Interval = chord[i] / chord[0];
		// }

		// restrict pitch of Voice1 such the highest interval of the four-voice chord doesn't exceed 16
		// if (SingleVoice) {
		// 	Voices[0]._roof = 16. * (chord[0] / Math.max(chord));
		// 	Voices[0]._floor = (chord[0] / Math.min(chord));
		// }
	},

	voices: function() {
		return voices;
	},

	processSubdivision: function() {
		var subdivision = this.hasOwnProperty('subdivision') ? this.subdivision : 1;
		if (subdivision > 1) {
			console.log('subdivision', subdivision);
		}
		this.sequence = new sequence(this.sequenceType, this.length, this.hits, subdivision);
		this.length *= subdivision;
	},

	init: function() {
		if (this.params.singleVoice) {
			this.setupSingleVoice(this.params.chordIndex);
		}
	},

	toggleFreeze: function() {
		this.isFrozen = !this.isFrozen;
		console.log('isfrozen', this.isFrozen);
	}
}

exports.constructor = Voice;
