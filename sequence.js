function generateTriggerSequence(length, hits) {
// Euclidean sequence generator:
// Evenly distribute the number of notes over a sequence of given length
// (only determines timing/triggers, not pitch)
	var trigArray = new Array(length);

	// hits: number of notes in a sequence of the defined length
	hits = _.clamp(hits, 0 ,length);

	// initialize the sequence with 1s and then 0s
	for (var i = 0 ; i < length ; i++) {
		if (i < hits) { trigArray[i] = true; }
		else        { trigArray[i] = false; }
	}

	// length 8 hits 4 generates incorrect result
	// post('trigarray', trigArray);
	// post();

	// obtain Euclidean Sequence
	// bjorklund(trigArray, length, hits);

	return trigArray;
}

function bjorklund(array, length, h) {
// Implementation of the Bjorklund algo for even distribution of timing events
// For reference, see http://cgm.cs.mcgill.ca/~godfried/publications/banff.pdf
	var j = 2,
	 iterations = -1+length / Math.min(h,length-h),
	 leftovers =  length % Math.min(h,length-h);

	for (var k = 0; k<iterations; k++) {
		var l = Math.min(h,length-h);
		for (var i = 0; i<l; i++ ) {
			shiftBoolean(array, length, i*j);
			if (l<h) {
				h--;
			}
			length--;
		}
		j++;
	}

	var l = Math.min(h,length-h);
	for (var i = 0; i<l; i++ ) {
		shiftBoolean(array, length, i*j*h/l-i*j/l);
		length--;
	}
}

function shiftBoolean(array, length, a) {
// Subroutine used in conjunction with Bjorklund
// Within trigger array, move the boolean at the end of the array to position after input 'a'

	 // move values one position down to make room for the transported value
	var temp = array[length-1];
	 for (var i = length-1 ; i > a+1 ; i--) {
		 array[i] = array[i-1];
	 }
	 array[a+1] = temp;
}

function Sequence(length, hits) {
  this.length = length;
  this.triggerArray = generateTriggerSequence(length, hits);
	this.pitchArray = new Array(length);

	post(this.id, '- trigger array', this.triggerArray);
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

  shouldTrigger: function(index) {
    return this.triggerArray[index % this.length];
  }
}

exports.constructor = Sequence;
