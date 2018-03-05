var prevState = {},
  voiceControl = {
    0: false,
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false,
    7: false,
    8: false,
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

function propagateChanges(data, id) {
  var ids = [id];

  if (typeof id === 'undefined') {
    ids = Object.keys(voiceControl);
    ids = _.map(ids, function(id) {
      return parseInt(id);
    });
  }

  _.forEach(ids, function(id) {
    _.forEach(data, function(value, key) {
      propagateChange(key, value, id);
    });
  })
}

function modulateGlissando(val) {
  var id = getVoiceSelection();

  propagateChanges({
    glissando: mapToRange([0, 20000], val)
  }, id);
}

function modulateSwing(val) {
  propagateChange('metronomeSwing', mapToRange([0, 0.5], val))
}

function modulateVoiceParam1(val) {
  var id = getVoiceSelection();

  propagateChanges({
    voiceParam1: mapToRange([0, 10], val),
    fmRatio: mapToRange([0.5, 20], val, 0.125),
    mediaFile: mapMidiToSampleFamily(val, 'TR808'),
    mediaLoopLength: mapToRange([1, 500], val),
    clickFilter: mapToRange([2, 64], val),
    interpMix: mapToRange([0, 1], val),
    noiseQ: mapToRange([1, 1000], val),
    rissetSpeed: mapToRange([-10, 10], val),
    recursiveAMAmount: mapToRange([0, 1], val),
    recursiveFMAmount: mapToRange([0, 2], val)
  }, id);
}

function modulateVoiceParam2(val) {
  var id = getVoiceSelection();

  propagateChanges({
    fmIndex: mapToRange([0, 10], val, 0.125),
    pitchShift: mapToRange([0.25, 4], val),
    clickFeedback: mapToRange([0, 1], val),
    noiseHarmonics: mapToRange([1, 4], val, 0.125),
    recursiveAMInterval: mapToRange([0.5, 4], val, 0.125),
    recursiveFMInterval: mapToRange([0.5, 4], val, 0.125)
  }, id);
}

function modulateVoiceParam3(val) {
  var id = getVoiceSelection();

  propagateChanges({
    clickMix: mapToRange([0, 1], val)
  }, id);
}

function modulateChordSpread(val) {
  var id = getVoiceSelection();

  propagateChanges({
    chordSpread: mapToRange([0, 100], val)
  }, id);
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
}

function modulateEnvelopeFollower(val) {
  var id = getVoiceSelection();

  propagateChanges({
    envelopeFollower: mapToRange([0, 1], val)
  }, id);
}

function modulateVolume(val) {
  var id = getVoiceSelection();

  propagateChanges({
    volume: mapToRange([0, 4], val)
  }, id);
}

function modulateADSR(param, val) {
  var maxValue = 5000,
    id = getVoiceSelection();

  val = Math.pow(val / 127, 2);

  if (param != 'sustain') {
    val *= maxValue;
  }

  var changes = {};
  changes[param] = val;

  propagateChanges(changes, id);
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
  var feedbackLevel = val / 127.,
    id = getVoiceSelection();

  propagateChanges({
    delayFeedback: feedbackLevel
  }, id);
}

function modulateDelayLength(val) {
  var modFactor = mapToRange([this.lcm / 16, this.lcm], val),
    id = getVoiceSelection();

  modFactor = Math.round( (modFactor * this.lcm) ) / this.lcm ;

  var delay = (this.clock / this.lcm) * modFactor;
  console.log('delay', delay);

  propagateChanges({
    delayLength: delay
  }, id);
}

function delayModulation(val) {
  var range = [0, 1],
    mappedValue = mapToRange(range, val),
    id = getVoiceSelection();

  propagateChanges({
    delayModulation: mappedValue
  }, id);
}

function modulateMainFrequency (val) {
  var newValue = mapToRange([0, 4], val),
    id = getVoiceSelection();

  // round to .25
  newValue = Math.round(newValue * 8) / 8;

  qcvg.frequency = newValue;

  propagateChanges({
    modulator1: newValue
  }, id);

  console.log('newval', newValue);
}

function modulateMainPhase (val) {
  // var newValue = mapToRange([0, 1], val),
  var id = getVoiceSelection();

  propagateChanges({
    modulatorPhase: mapToRange([0, 1], val, 1/64),
  }, id);

  console.log('phase val', newValue);
}

function toggleVoiceControl(id) {
  voiceControl[id] = !voiceControl[id];
}

function modulatePhaserResonance (val) {
  // var range = [0,1],
    // newVal = mapToRange([0, 1], val),
  var id = getVoiceSelection();

  propagateChanges({
    phaserResonance: mapToRange([0, 1], val)
  }, id);
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
      fn: modulateChordSpread
      // fn: delayModulation
    },
    15: {
      channel: 79,
      fn: modulateGlissando
      // fn: modulateEnvelopeFollower
    },
    16: {
      channel: 72,
      fn: modulateSwing
      // fn: modulateMainPhase
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
