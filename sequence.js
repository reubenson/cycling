function generateTriggerSequence(type, length, hits, subdivision) {
// Euclidean sequence generator:
// Evenly distribute the number of notes over a sequence of given length
// (only determines timing/triggers, not pitch)
	var trigArray;

	// hits: number of notes in a sequence of the defined length
	hits = _.clamp(hits, 0 ,length);

	// length 8 hits 4 generates incorrect result
	// post('trigarray', trigArray);
	// post();

	// obtain Euclidean Sequence
	if (type === 'bjorklund') {
		trigArray = generateEuclideanSequence(length, hits);
	} else if (type === 'bjorklund-inverse') {
		trigArray = generateEuclideanSequence(length, length - hits);
		trigArray = _.map(trigArray, function(val){
			return !val;
		});
	}

	// apply subdivisions
	if (subdivision > 1) {
		var newArr = [];
		_.forEach(trigArray, function(val) {
			_.times(subdivision, function(){
				newArr.push(val);
			});
		});

		trigArray = newArr;
		// this.length = trigArray.length;
		// console.log('new length', trigArray);
	}

	return trigArray;
}

// Generate trigger sequences based on weaving patterns
// Voices are the weft, and intersections of weft over warp represent triggers
function weave(index, id) {
	var weftStep = 3,
		warpStep = 1,
		sum = warpStep + weftStep;

	return ((index + id) % sum) < weftStep;
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
		//  remainder[level+1] = mod(divisor, remainder[level]);
		remainder[level+1] = divisor % remainder[level];
		 divisor = remainder[level];
		 level = level + 1;
	 }
   while (remainder[level] > 1);
   count[level] = divisor;
	 console.log('level', level);
	 console.log('count', count);
	 console.log('remainder', remainder);
  /*---------------------
   * Now build the bitmap string
   */
	 var arr = [];
   build_string (level, arr, count, remainder);
	 console.log('arr', arr);
	 return arr;
}

function build_string (level, arr, count, remainder) {
	if (level === -1) {
		arr.unshift(false);
		// arr.push(false);
		// append a “0” to the end of the bitmap;
	}
	else if (level === -2) {
		arr.unshift(true);
		// arr.push(true);
		// append a “1” to the end of the bitmap;
	}
	else {
		if (!count) {
			console.log('none?', count);
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

function Sequence(type, length, hits, subdivision) {
	this.type = type;
  this.length = length;
  this.triggerArray = generateTriggerSequence(type, length, hits, subdivision);
	this.pitchArray = new Array(length);

	console.log('trigger array', this.triggerArray);
	this.length = this.triggerArray.length;
	// console.log('length', this.length);
}

Sequence.prototype = {
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

  shouldTrigger: function(index, id) {
		if (this.type === 'weave') {
			return weave(index, id);
		} else {
			return this.triggerArray[index % this.length];
		}
  }
}

exports.constructor = Sequence;
