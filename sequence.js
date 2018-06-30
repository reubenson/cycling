var sequenceList = (function() {
	var arr = [],
		maxLength = 16;

	for (var i = 1; i <= maxLength; i++) {
		for (var j = 1; j <= i; j++) {
			arr.push([j, i]);
		}
	};

	// arr = _.uniqBy(arr, function (item) {
	// 	return (item[0] / item[1]) * (item[1] / maxLength);
	// });
	//
	// console.log('testlength', arr.length);
	//
	// return arr;

	return _.sortBy(arr, function(item) {
		// return (item[0] / item[1]) * (item[1] / maxLength);
		return (maxLength / item[1] * item[0] / maxLength);
	});
}());

// function generateTriggerSequence(type, length, hits, subdivision) {
// // Euclidean sequence generator:
// // Evenly distribute the number of notes over a sequence of given length
// // (only determines timing/triggers, not pitch)
// 	var trigArray;
//
// 	// hits: number of notes in a sequence of the defined length
// 	hits = _.clamp(hits, 0 ,length);
//
// 	// length 8 hits 4 generates incorrect result
// 	// post('trigarray', trigArray);
// 	// post();
//
// 	// obtain Euclidean Sequence
// 	if (type === 'bjorklund') {
// 		trigArray = generateEuclideanSequence(length, hits);
// 	} else if (type === 'bjorklund-inverse') {
// 		trigArray = generateEuclideanSequence(length, length - hits);
// 		trigArray = _.map(trigArray, function(val){
// 			return !val;
// 		});
// 	}
//
// 	// apply subdivisions
// 	if (subdivision > 1) {
// 		var newArr = [];
// 		_.forEach(trigArray, function(val) {
// 			_.times(subdivision, function(){
// 				newArr.push(val);
// 			});
// 		});
//
// 		trigArray = newArr;
// 	}
//
// 	return trigArray;
// }

// Generate trigger sequences based on weaving patterns
// Voices are the weft, and intersections of weft over warp represent triggers
function weave(index, id) {
	var weftStep = 3,
		warpStep = 1,
		sum = warpStep + weftStep;

	return ((index + id) % sum) < weftStep;
}

function applyPattern (pattern, index) {
	return pattern[index % _.sum(pattern)];
}

// Implementation of the Bjorklund algo for even distribution of timing events
// For reference, see http://cgm.cs.mcgill.ca/~godfried/publications/banff.pdf
function generateEuclideanSequence (num_slots, num_pulses) {
  /*---------------------
   * First, compute the count and remainder arrays
   */
	 var divisor = num_slots - num_pulses;
   var remainder = [num_pulses];
	 // divisor = num_pulses;
	 // remainder = [num_slots - num_pulses];
	 var count = new Array;
   level = 0;
   do {
		 count[level] = Math.floor(divisor / remainder[level]);
		remainder[level+1] = divisor % remainder[level];
		 divisor = remainder[level];
		 level = level + 1;
	 }
   while (remainder[level] > 1);
   count[level] = divisor;

  /*---------------------
   * Now build the bitmap string
   */
	 var arr = [];
   build_string (level, arr, count, remainder);
	 return arr;
}

function build_string (level, arr, count, remainder) {
	if (level === -1) {
		arr.unshift(false);
		// append a “0” to the end of the bitmap;
	}
	else if (level === -2) {
		arr.unshift(true);
		// append a “1” to the end of the bitmap;
	}
	else {
		if (!count) {
			return;
		}
		for (var i=0; i < count[level]; i++) {
			build_string(level-1, arr, count, remainder);
		}
  	if (remainder[level] != 0) {
			build_string(level-2, arr, count, remainder);
		}
	}
}

// function Sequence(type, length, hits, subdivision) {
function Sequence(params) {
	// this.type = type;
  // this.length = length;
	// this.hits = hits;
	this.type = params.type || 'bjorklund';
	this.hits = params.hits;
	this.length = params.length;
	this.pattern = params.pattern;
	this.subdivision = params.subdivision;

	console.log('test length', this.length);
  this.triggerArray = this.generateTriggerSequence(this.type, this.length, this.hits, this.subdivision);
	this.pitchArray = new Array(this.length);

	if (this.triggerArray) {
		console.log('trigger array', this.triggerArray);
	}
	// this.length = this.triggerArray.length;
}

Sequence.prototype = {
	shouldTrigger: function(index, id) {
		if (this.type === 'weave') {
			return weave(index, id);
		} else if (this.type === 'pattern') {
			return applyPattern(this.pattern, index);
		} else {
			return this.triggerArray[index % this.length];
		}
	},

	length: function () {
		return this.triggerArray.length;
	},

	generateTriggerSequence: function() {
	// Euclidean sequence generator:
	// Evenly distribute the number of notes over a sequence of given length
	// (only determines timing/triggers, not pitch)
		var trigArray,

			// hits: number of notes in a sequence of the defined length
			hits = _.clamp(this.hits, 0, this.length);

		// length 8 hits 4 generates incorrect result
		// post('trigarray', trigArray);
		// post();

		// obtain Euclidean Sequence
		if (this.type === 'bjorklund') {
			trigArray = generateEuclideanSequence(this.length, hits);
		} else if (this.type === 'bjorklund-inverse') {
			trigArray = generateEuclideanSequence(this.length, this.length - hits);
			trigArray = _.map(trigArray, function(val){
				return !val;
			});
		} else if (this.type === 'pattern') {
			trigArray = [];
			_.forEach(this.pattern, function (val) {
				trigArray.push(1);
				_.times(val-1, function () {
					trigArray.push(0);
				});
			});
		}

		// apply subdivisions
		if (this.subdivision > 1) {
			var newArr = [];
			_.forEach(trigArray, function(val) {
				_.times(subdivision, function(){
					newArr.push(val);
				});
			});

			trigArray = newArr;
		}

		console.log('trigarray', trigArray);

		return trigArray;
	},

	setSequenceFromMidi: function(midiVal) {
		var hits, length;

		if (midiVal < sequenceList.length) {
			this.hits = sequenceList[midiVal][0];
			this.length = sequenceList[midiVal][1];
		} else {
			console.log('listLength', sequenceList.length);
			this.hits = 16;
			this.length = 16;
		}

		this.triggerArray = this.generateTriggerSequence('bjorklund', this.length, this.hits, 1);
	},

	// update sequence at specified index with interval
	updateIntervalSequence: function(index, interval) {
		this.pitchArray[index % this.length] = interval;
	},

	getPitchFromScale: function(index) {
		return this.scale[index];
	},

	getInterval: function(index) {
		return this.pitchArray[index % this.length];
	},

	randomizeSequenceSpeed: function (id) {
		var sequenceSpeed = 1 + Math.round(Math.random());

		propagateChange('voiceMetronome', sequenceSpeed, id);
	}
}

exports.constructor = Sequence;
