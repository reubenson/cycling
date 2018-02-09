SCALES = {
  // Modcan quantizer scale banks below
  '-1':  [0,2,4,5,7,9,11],           // Major
  '-2':  [0,2,3,5,7,8,10],           // Minor
  '-3':  [0,2,3,5,7,9,10],           // Dorian
  '-4':  [0,1,3,5,7,8,10],           // Phyrgian
  '-5':  [0,2,4,6,7,9,11],           // Lydian
  '-6':  [0,2,3,6,7,8,11],           // Aeolian
  '-7':  [0,2,4,5,7,9,10],           // Mixolydian
  '-9':  [0,3,5,6,7,10],             // Blues
  '-10': [0,2,3,5,6,8,9,11],         // Diminished
  '-11': [0,3,4,6,8,11],             // Augmented
  '-12': [0,2,5,7,10],               // Pentatonic Neutral
  '-13': [0,5,10],                   // Fourths

  '-14': [0,4,7],                     // Major
  '-15': [0,4,7,9],                   // Major6
  '-16': [0,4,7,11],                  // Major7
  '-17': [0,4,6,11],                  // Major7b5
  '-18': [0,3,7],                     // Minor
  '-19': [0,3,7,9],                   // Minor6
  '-20': [0,3,7,10],                  // Minor7
  '-21': [0,5,7],                     // Sus4
  '-22': [0,2,7],                     // Sus2
  '-23': [0,2,5,7],                   // Sus4 Sus2
  '-24': [0,4,8],                     // Augmented
  '-25': [0,3,6],                    // Diminshed
  '-26': [0,3,6,9],                  // Diminished 7th
  '-27': [0,5,7,10],                 // 7 Sus4
  '-28': [0,3,6,10],                  // Min 7 b5
  '-29': [0,3,8,10],                  // Min 7 b5

  '-30': [0,2,3,5,6,7,8,11],          // Algerian
  '-31': [0,1,3,4,6,8,10],           // Altered
  '-32': [0,2,3,5,6,8,9,11],          // Aux Diminished
  '-33': [0,1,3,7,8],                 // Balinese
  '-34': [0,1,4,5,7,8,11],            // Byzantine
  '-35': [0,2,4,7,9],                 // Diatonic
  '-36': [0,1,4,5,7,8,10],            // Byzantine
  '-37': [0,1,4,5,7,8,11],            // Double Harmonic
  '-38': [0,2,4,5,7,8,10],            // Hindu
  '-39': [0,3,4,5,8,9],               // Sixtone Symmetric
  '-40': [0,2,3,4,6,7,8,9,11],       // Nine Tone
  '-41': [0,2,4,6,7,9,10],            // Overtone Dominant
  '-42': [0,1,3,7,8],                 // Pelog
  '-43': [0,2,4,6,9,10],              // Prometheus
  '-44': [0,1,4,6,8,10,11],           // Enigmantic
  '-45': [0,1,3,4,6,7,9,10],          // Octatonic

  '0': [1, 16/15, 6/5, 3/2, 8/5], // pelog (modcan)
  '1': [1, 9/8, 5/4, 3/2, 5/3],   // sunda
  '2': [1, 35/32, 5/4, 21/16, 49/32, 105/64, 7/4], // HMC American Gamelan
  '3': [1, 8/7, 12/7, 21/17, 147/128], // balugan
  '4': [1, 567/512, 9/8, 147/128, 21/16, 189/128, 3/2, 49/32, 7/4, 63/32] // (LMY 'Well' Tuning)
};


function random(min, max) {
  var range = max - min;
  return min + Math.floor(Math.random() * range);
}

function Scale(opts) {
  this.tuning = opts.tuning || 'P';
  this.numberOfDivisions = opts.numberOfDivisions || 12;
  this.scaleChoice = opts.scaleChoice || 0;

  var s;

  this.generateScale();
  this.length = this.scale.length;
}

Scale.prototype = {
  getPitch: function(index) {
    var register = Math.floor(index / this.length),
      offset = Math.pow(2, register);

    return offset * this.scale[index % this.length];
  },

  generateScale: function() {
  // Generate scale according to Tuning, this.numberOfDivisions, and ScaleChoice

    switch (this.tuning) {
      case 'P': {
        this.scale = new Array(this.numberOfDivisions);

        this.scale = _.map(this.scale, function(note, index) {
          return Math.pow(2, index / this.numberOfDivisions);
        }.bind(this));

        if (this.scaleChoice && this.numberOfDivisions === 12) {
          this.scale = _.pullAt(this.scale, SCALES[this.scaleChoice]);
        }

        break;
      }

      case 'H': {
        var LowestHarmonic, HighestHarmonic;
        var LinearMode = false;

        if (LinearMode) {
          var center = 4;
          var span = 0.25;
          LowestHarmonic = center - span*center;
          HighestHarmonic = center + span*center;
        }
        else {
          var Register = 1;
          LowestHarmonic = Math.pow(2,Register+0);
          HighestHarmonic = Math.pow(2,Register+4);
          LowestHarmonic = 2;
          HighestHarmonic = 32;
        }

        this.length = HighestHarmonic - LowestHarmonic + 1;
        this.scale = new Array(this.length);
        for (var i=0; i<this.length; i++) {
          this.scale[i] = LowestHarmonic + i / LowestHarmonic;
        }
        break;
      }
    }
  },

  // Quantize note to the scale defined
  quantizeNote: function(interval) {
    var register = Math.floor(Math.log(interval) / Math.log(2));
      interval /= Math.pow(2, register);

    // determine closest note on the scale to interval
    var j=1;
    while (interval > this.scale[j] && j < this.length) {
      j++;
    }

    var intervalBelow = this.scale[j-1],
      intervalAbove = this.scale[j];
    if (j == this.length) { intervalAbove = 2.0; }

    if (intervalAbove/interval > interval/intervalBelow ) {
      // interval is closer to intervalBelow than intervalAbove
      interval = intervalBelow;
    } else  {
      // interval is closer or equal to intervalAblove than intervalBelow
      interval = intervalAbove;
    }

    // restore interval to its original octave register
    interval *= Math.pow(2, register);

    return interval;
  },

  JustInterval: function(base, power) {
  // Generate just interval (whole number ratio)
    return Math.pow(random(2,base+1),random(1,power+1))/pow(random(2,base+1),random(1,power+1));
  },

  HarmonicInterval: function(LowestHarmonic, HighestHarmonic, base) {
  // Return intervallic value based on the harmonic series

    var RisingMode = true;
    // RisingMode: ascending and descending harmonic series
    // !RisingMode: random selection from harmonic series

    // keep track of current set of harmonics
    var memory = new Array(4);
    var index=0;

    if (RisingMode) {
      var Direction;
      // Generates Harmonic Intervals in ascending and then descending order
      memory[index%4] = memory[(index-1)%4] + Math.pow(-1,Direction);
      if (memory[index%4]<LowestHarmonic) {
        memory[index%4] = LowestHarmonic;
        Direction = 0;
      }
      else if (memory[index%4]>HighestHarmonic) {
        memory[index%4] = HighestHarmonic;
        Direction = 1;
      }
      memory[index%4] = constrain(memory[index%4],LowestHarmonic,HighestHarmonic);
    }
    else {
      // randomly select from harmonic series
      var harmonic = random(LowestHarmonic,HighestHarmonic+1);
      // ensure that a new value is chosen
      while (harmonic == memory[0] || harmonic == memory[1] || harmonic == memory[2] || harmonic == memory[3]) {
        harmonic = random(LowestHarmonic,HighestHarmonic+1);
      }
      memory[index%4] = harmonic;
    }

    // calculate intervallic ratio, relative to the lowest harmonic
    var interval = memory[index%4] / LowestHarmonic;

    // scale to base
    var maxvalue = 16. * (LowestHarmonic / HighestHarmonic);
    interval *= (1-base) + (maxvalue)*(base);

    index++;
    return interval;
  }
}

exports.constructor = Scale
exports.quantizeNote = Scale.prototype.quantizeNote;
