var prevState = {},
  voiceControl = {
    0: false,
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false,
    7: false
  };

function mapMidiToSampleFamily(val, library) {
  var samples = _.map(media[library], function(voice){
    var length = voice.length;

    return voice[length-1];
  });

  for (var i = 0; i < samples.length; i++) {
    if (val/127 <= (i+1)/(samples.length)) {
      console.log('sample', samples[i]);
      return samples[i];
    }
  }
}

// function mapMidiToSampleVariation(val, library) {
//   var samples = _.map(media[library], function(voice){
//     var length = voice.length;
//
//     return voice[length-1];
//   });
//
//   for (var i = 0; i < samples.length; i++) {
//     if (val/127 <= (i+1)/(samples.length)) {
//       console.log('sample', samples[i]);
//       return samples[i];
//     }
//   }
// }

// determine voice ID
function getVoiceSelection () {
  var id;

  _.forEach(voiceControl, function(val, i){
    if (val) {
      id = i;
    }
  });

  return id;
}

function modulateVoiceParam1(val) {
  var range = [0, 10],
    mappedValue = mapToRange(range, val),
    id = getVoiceSelection(),
    filepath = mapMidiToSampleFamily(val, 'TR808'),
    clickFilter = mapToRange([2, 64], val),
    fmRatio = mapToRange([0.5, 20], val, 0.125);


  if (id >= 0) {
    propagateChange('voiceParam1', mappedValue, id);
    propagateChange('fmRatio', fmRatio, id);
    propagateChange('mediaFile', filepath, id);
    propagateChange('clickFilter', clickFilter, id);

  } else {
    _.forEach(voiceControl, function(val, i){
      propagateChange('voiceParam1', mappedValue, i);
      propagateChange('fmRatio', fmRatio, i);
      propagateChange('mediaFile', filepath, i);
      propagateChange('clickFilter', clickFilter, i);
    });
  }
}

function modulateVoiceParam2(val) {
  var range = [0, 20],
    fmIndex = mapToRange([0, 10], val, 0.125),
    pitchShift = mapToRange([0.25, 4], val),
    clickFeedback = mapToRange([0.5, 1], val),
    id = getVoiceSelection();

    console.log('clickFeedback', clickFeedback);
  // console.log('pitchShift', pitchShift);

  if (id >= 0) {
    propagateChange('fmIndex', fmIndex, id);
    propagateChange('pitchShift', pitchShift, this.id);
    propagateChange('clickFeedback', clickFeedback, id);
  } else {
    _.forEach(voiceControl, function(val, i){
      propagateChange('fmIndex', fmIndex, i);
      propagateChange('pitchShift', pitchShift, this.id);
      propagateChange('clickFeedback', clickFeedback, i);
    });
  }
}

function modulateVoiceParam3(val) {
  var chordSpread = mapToRange([0, 100], val),
    id = getVoiceSelection();

  if (id >= 0) {
    propagateChange('chordSpread', chordSpread, id);
  } else {
    _.forEach(voiceControl, function(val, i){
      propagateChange('chordSpread', chordSpread, i);
    });
  }
}

function mapToRange(range, midiVal, increments) {
  var normalizedVal = midiVal / 127,
    span = range[1] - range[0],
    val = range[0] + normalizedVal * span;

    if (increments >= 0) {
      val = Math.round(val / increments) * increments;
    }

  return val;
}

function modulateTempo(val, prevVal) {
  var range = [250, 5000],
    normalizedVal = val / 127,
    mappedValue = mapToRange(range, val),
    modulationFactor = Math.pow(2, mappedValue),
    metro = this.objects.metro,
    newVal = Math.round(qcvg.clock * modulationFactor);

  newVal = mappedValue;
  qcvg.clock = Math.round(newVal);

  console.log('newval', newVal);

  propagateChange('metronome', qcvg.clock);
}

function modulateRegister(val) {
  var range = [-2, 6],
    register = Math.round(mapToRange(range, val)),
    // frequency = this.preset.baseFrequency * Math.pow(4, register),
    voiceID = getVoiceSelection();

  if (voiceID >= 0) {
    this.voices[voiceID].setRegister(register);
    // this.voices.register = register;
    // propagateChange(param, val, voiceID);
  } else {
    _.forEach(voiceControl, function(temp, id){
      this.voices[voiceID].setRegister(register);
      // this.voices.register = register;
      // propagateChange(param, val, id);
    }.bind(this));
  }

  // propagateChange('baseFrequency', frequency);
}

function modulateEnvelopeFollower(val) {
  var newVal = mapToRange([0, 1], val);
    voiceID = getVoiceSelection();

  if (voiceID >= 0) {
    propagateChange('envelopeFollower', newVal, voiceID);
  } else {
    _.forEach(voiceControl, function(temp, id){
      propagateChange('envelopeFollower', newVal, id);
    });
  }
}

function modulateVolume(val) {
  var newVal = mapToRange([0, 4], val);
    voiceID = getVoiceSelection();

  if (voiceID >= 0) {
    propagateChange('volume', newVal, voiceID);
  } else {
    _.forEach(voiceControl, function(temp, id){
      propagateChange('volume', newVal, id);
    });
  }
}

function modulateADSR(param, val) {
  var maxValue = 5000,
    voiceID = getVoiceSelection();

  val = Math.pow(val / 127, 2);

  if (param != 'sustain') {
    val *= maxValue;
  }

  if (voiceID >= 0) {
    propagateChange(param, val, voiceID);
  } else {
    _.forEach(voiceControl, function(temp, id){
      propagateChange(param, val, id);
    });
  }
}

function modulateAttack(val) {
  modulateADSR('attack', val);
}

function modulateDecay(val) {
  modulateADSR('decay', val);
}

function modulateSustain(val) {
  modulateADSR('sustain', val);
}

function modulateRelease(val) {
  modulateADSR('release', val);
}

function modulateDelayFeedback(val) {
  var feedbackLevel = val / 127.;
  _.forEach(this.voices, function(voice, id) {
    propagateChange('delayFeedback', feedbackLevel, id);
  });
}

function modulateDelayLength(val) {
  var modFactor = mapToRange([this.lcm / 16, this.lcm], val);

  modFactor = Math.round( (modFactor * this.lcm) ) / this.lcm ;

  console.log('modFactor', modFactor);
  // console.log('this.clock', this.clock);
  var delay = (this.clock / this.lcm) * modFactor;
  console.log('delay', delay);

  _.forEach(this.voices, function(voice, id) {
    // console.log('length', length);
    propagateChange('delayLength', delay, id);
  });
}

function delayModulation(val) {
  var range = [0, 1],
    mappedValue = mapToRange(range, val),
    id = getVoiceSelection();

  if (id >= 0) {
    propagateChange('delayModulation', mappedValue, id);

  } else {
    _.forEach(voiceControl, function(val, i){
      propagateChange('delayModulation', mappedValue, i);
    });
  }
}

function modulateMainFrequency (val) {
  var newValue = mapToRange([0, 4], val),
    id = getVoiceSelection();

  // round to .25
  newValue = Math.round(newValue * 8) / 8;

  qcvg.frequency = newValue;
  if (id >= 0) {
    propagateChange('modulator1', newValue, id);
  } else {
    _.forEach(voiceControl, function(val, i){
      propagateChange('modulator1', newValue, i);
    })
  }

  console.log('newval', newValue);
}

function modulateMainPhase (val) {
  var newValue = mapToRange([0, 1], val),
    id = getVoiceSelection();

  // round to 1/64
  newValue = Math.round(newValue * 64) / 64;

  // qcvg.frequency = newValue;
  // propagateChange('modulator1', newValue);
  if (id >= 0) {
    propagateChange('modulatorPhase', newValue, id);
  } else {
    _.forEach(voiceControl, function(val, i){
      propagateChange('modulatorPhase', newValue, i);
    })
  }

  console.log('phase val', newValue);
}

function toggleVoiceControl(id) {
  voiceControl[id] = !voiceControl[id];
}

function modulatePhaserResonance (val) {
  var range = [0,1],
    newVal = mapToRange(range, val),
    id = getVoiceSelection();

  if (id >= 0) {
    propagateChange('phaserResonance', newVal, id);
  } else {
    _.forEach(voiceControl, function(val, i){
      propagateChange('phaserResonance', newVal, i);
    })
  }
}

function handleMPC (val) {
  switch (val) {
    case 44: // voice 1
      toggleVoiceControl(0);
      break;
    case 45: // voice 2
      toggleVoiceControl(1);
      break;
    case 46: // voice 3
      toggleVoiceControl(2);
      break;
    case 47: // voice 4
      toggleVoiceControl(3);
      break;
    case 48: // voice 1
      toggleVoiceControl(4);
      break;
    case 49: // voice 2
      toggleVoiceControl(5);
      break;
    case 50: // voice 3
      toggleVoiceControl(6);
      break;
    case 51: // voice 4
      toggleVoiceControl(7);
      break;


    case 36:
      this.toggleFreezeAll();
      break;
    default:

  }
}

var controller = {
  // track previous values
  prevState: {},

  beatstep: {
    // clock
    '0': {
      channel: 7,
      fn: modulateTempo
    },
    1: {
      channel: 10,
      fn: modulateMainFrequency
    },
    2: {
      channel: 74,
      fn: modulateRegister
    },
    3: {
      channel: 71,
      fn: modulateDelayLength
    },
    4: {
      channel: 76,
      fn: modulateDelayFeedback
    },
    5: {
      channel: 77,
      fn: modulateVoiceParam1
    },
    6: {
      channel: 93,
      fn: modulateVoiceParam2
    },
    7: {
      channel: 73,
      fn: modulateVoiceParam3
    },
    8: {
      channel: 75,
      fn: modulateVolume
    },

    // attack
    9: {
      channel: 114,
      fn: modulateAttack
    },
    // decay
    10: {
      channel: 18,
      fn: modulateDecay
    },
    // sustain
    11: {
      channel: 19,
      fn: modulateSustain
    },
    // release
    12: {
      channel: 16,
      fn: modulateRelease
    },
    13: {
      channel: 17,
      fn: modulatePhaserResonance
    },
    14: {
      channel: 91,
      fn: delayModulation
    },
    15: {
      channel: 79,
      fn: modulateEnvelopeFollower
    },
    16: {
      channel: 72,
      fn: modulateMainPhase
    },

    // handles MPC buttons 1-16
    // NOT SURE WHY JUST SETTING CHANNEL 44 WORKS HERE????
    17: {
      channel: 44,
      fn: handleMPC
    }
  }
}

controller.saveToPrevState = function (channel, value) {
  prevState[channel] =  value;
}

controller.getPrevVal = function (channel) {
  return prevState[channel];
}

exports.controller = controller;
// exports.saveToPrevState = saveToPrevState;
// exports.getP
