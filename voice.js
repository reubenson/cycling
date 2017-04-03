const sequence = require('sequence').constructor,
	Rules = require('rules').rules,
	Chords = require('chords').chords;

var	voices = [],
	shiftRegister = [1.0, 1.0, 1.0, 1.0];

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

function Voice(opts) {
	this.id = voices.length;
	this.noteDuration = 15;
	this.pitchOutlet = opts.pitchOutlet;
	this.triggerOutlet = opts.triggerOutlet;

	// track number of iterations
	this.index = 0;

	this.currentPosition = 0; // not always the same as index?

	// used in different ways by different rules
	this.intervalIndex = 0;

	this.length = opts.length;
	this.hits = _.clamp(opts.hits, 0, this.length);
	this.scale = opts.scale;
	this.repetitions = 1;
	this.rule = opts.rule || 'S';
	this.timeFactor = 1;
	// this.ringChanges = opts.ringChanges || false;

	// this.floor and this.roof define the bounds of each voice's pitch
  if (strata) {
    // each voice sits in its own octave register
    this.floor = Math.pow(2, this.id);
    this.roof  = Math.pow(2, this.id + 1);
  }
  else {
    // each voice spans entire four octaves
    this.floor = Math.pow(2, 0);
    this.roof  = Math.pow(2, 4);
  }

	this.init();
	voices.push(this);
}

Voice.prototype = {
	bang: function() {
		if (this.shouldTrigger()) {
			// var midiVal = Math.round(Math.random() * 8) * 12,

			this.advance();
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
	},

	// Return the previous voice in TrigOrder
	previousVoice: function() {
    var i = 0;

    while (this.id != trigOrder[i]) {
      i++;
    }

    return voices[ trigOrder[(i+3)%4] ];
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

		var PopulateSequenceOnce = ringChanges;
		var SingleVoiceModes = singleVoice || shiftRegisterMode || ET;
		if ( (((!SingleVoiceModes) || this.id == 0) && !PopulateSequenceOnce) || (PopulateSequenceOnce && _counter < this.length)){

			// determine new note according to this.rule
			newInterval = Rules[this.rule].call(this);

			// quantize to nearest note in Scale
			if (quantize) {
				newInterval = this.scale.quantizeNote(newInterval);
			}

			updateSequence = true;
		}

		else if (ringChanges && _counter % this.length == 0) {
			var iteration = Math.floor( this.index / this.length );

			this.sequence.pitchArray = swap(this.sequence.pitchArray, iteration, this.length);
			newInterval = this.sequence.pitchArray[this.index];
		}

		else if (ET) {
			switch (this.id) {
				case 1: newInterval = Voices[0].getPitchRatio()*2.; break;
				case 2: newInterval = Voices[0].getPitchRatio(this.length-1-this.currentPosition); break;
				case 3: newInterval = Voices[0].getPitchRatio(this.length-1-this.currentPosition)*2; break;
			}
		}

		else if (singleVoice){
			// Voices 2-4 pitch fixed with respect to by Voice1
			newInterval = this.id == 0 ? newInterval : voices[0].currentInterval;
			newInterval *= this.intervalMultiplier;

			updateSequence = true;
		}

		else if (shiftRegisterMode) {
			newInterval = shiftRegister[this.id];
			updateSequence = true;
		}

		// apply Root Shift (Root = 1.0 if !ChangeRootMode)
		// root shift will be applied to baseFrequency instead?
		// newInterval *= this.main.root;

		// make sure newInterval is between 1 and 16
		// re-evaluating ...
		// this.fixInterval(newInterval);

		// update sequence with new note
		if (updateSequence) {
			this.sequence.updateIntervalSequence(this.index, newInterval);
			this.currentInterval = newInterval;
		}

		// enforce temporal cohesion in SingleVoice mode
		if (this.id != 0 && singleVoice) { this.timeFactor = voices[0].timeFactor; }
		// this.timeFactor = 1./pow(newInterval,0.5);
		// this.timeFactor = random(1,2);

		// update shift register
		if (this.id == trigOrder[0]) {
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
	},

	shouldTrigger: function() {
		return this.sequence.shouldTrigger(this.index);
	},

	tick: function() {
		this.index++;
	},

	sendNote: function() {
		var interval = this.sequence.getInterval(this.index);
			pitch = baseFrequency * interval;

		outlet(this.pitchOutlet, pitch);
	},

	sendTrigger: function() {
		function removeTrigger() {
			outlet(this.triggerOutlet, 0);
		}
		var t = new Task(removeTrigger.bind(this));
		outlet(this.triggerOutlet, 1);
		t.schedule(this.noteDuration);

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

	init: function() {
		this.sequence = new sequence(this.length, this.hits);
		if (singleVoice) {
			this.setupSingleVoice(chordIndex);
		}
	}
}

exports.constructor = Voice;
