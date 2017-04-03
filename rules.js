function randomStep(probability) {
  var r = _.random(0,1001);

  if (r < 1000 * probability) {
    return true;
  } else {
    return false;
  }
}


switch (this.rule) {
  case 'A': {
    this.upwards = this.id % 2;
    var randomIndex = Math.ceil(Math.random() * Scale.length);
    var increment = Math.pow(Scale.s[randomIndex], Math.pow(-1,this.upwards));
    if (new_note * increment > this.roof || new_note * increment < this.floor) {
      this.upwards = !this.upwards; increment = 1./increment;
    }
    new_note *= increment;
    break;
  }

  case 'B': {
    if (new_note * PrevCV > this.roof || new_note * PrevCV < this.floor) {
      PrevCV = 1./PrevCV;
      this.fixInterval(PrevCV);
      this.roof = 16;
    }
    new_note *= PrevCV;
    break;
  }

  //  LFO mode
  case 'C': {
    var freq = 0.005;
    var freq_offset = this.id * 0.01;
    var sine = 2 + LFO(2, freq + freq_offset, 0, 1, 0);
    new_note = pow(2, sine);
    break;
  }

  // generate intervals that produce specific difference tones
  case 'D': {
    var modulation = LFO(1,0.001,0,0,0);
    var span = 1.;
    // if (InputMode) { span = ReadInput(1); }
    new_note = Scale.DifferenceInterval(this.id,modulation,span);
    break;
  }

  // random walk through scale
  case 'G': {
    var n_high = (this.roof / this.floor) * Scale.length / Scale.s[length-1];
    new_note = this.floor * Scale.Get(this.intervalIndex);
    // cv = _.clamp(cv,this.floor,this.roof);
    this.intervalIndex += random(-1,2);
    this.intervalIndex = _.clamp(this.intervalIndex,0,n_high);
    break;
  }

  // generate harmonic intervals
  case 'H': {
    var base = 1.;
    // if (InputMode) { base = ReadInput(1); }
    new_note = Scale.HarmonicInterval(1,16,base);
    break;
  }

  // generate just intonation intervals
  case 'J': {
    var limit = 7;  // n-limit of just intervals
    var power = 1;  // just interval power
    // cv = ShiftRegister[this.id]*Scale1.JustInterval(limit,power);
    new_note = PrevCV * Scale.JustInterval(limit,power);
    break;
  }

  // derive note from instantaneous value of LFO
  case 'R': {
    var SequenceDuration = this.length * this.main.clock_period / 1.0e3;
    var freq = Math.PI / SequenceDuration;
    // if (InputMode) { freq *= ReadInput(1); }  // allow user input to scale

    var Amplitude = 0.5 * Math.log(this.roof/this.floor) / Math.log(2);
    var Offset = this.floor * Amplitude;
    new_note = Math.pow(2., Offset + this.main.LFO(Amplitude, freq, 0 * this.id/4.0, 1, 0 * this.id % 2));
    break;
  }
}

var Rules = {
  // generate random interval
  'R': function() {
    var interval = _.random(1, 2, true),
      register = _.random(Math.sqrt(this.roof / this.floor) - 1);

    return Math.pow(2, register) * interval;
  },

  // ascend and descend scale
  'S': function() {
    var interval = this.floor * this.scale.getPitch(this.intervalIndex),
      numOctaves = Math.sqrt(this.roof / this.floor);
      stepSize = 1;

    if (!this.hasOwnProperty('upwards')) { this.upwards = true }

    if (randomStep(0.3)) { stepSize++ }
    this.intervalIndex += this.upwards ? stepSize : -stepSize;

    // apply reflecting boundary condition
    if (this.intervalIndex <= 0) {
      this.intervalIndex = 0;
      this.upwards = true;
    } else if (this.intervalIndex >= this.scale.length * numOctaves - 1) {
      this.intervalIndex = this.scale.length * numOctaves - 1;
      this.upwards = false;
    }

    return interval;
  }
}

exports.rules = Rules;
