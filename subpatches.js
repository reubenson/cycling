const instruments = require('instruments').instruments;
var outputCVChannelCounter = 1;
var outputAudioChannelCounter = 5;
var inputAudioChannelCounter = 1;
var id = 0;

// var ExpertSleepers = require('expert-sleepers').expertSleepers,
// 	expertSleepers = new ExpertSleepers();

// subpatches = {
  // create delay subpatch
  // the delay feedback path will run through ES / QMMF-4
function delay (x, y, patcher, id) {
  var patchObj = patcher.newdefault(x, y, 'patcher', 'delay'),
    subpatcher = patchObj.subpatcher(),
    inlet1 = subpatcher.newdefault(10, 10, 'inlet'),
    inlet2 = subpatcher.newdefault(60, 10, 'inlet'),
    outlet = subpatcher.newdefault(10, 210, 'outlet'),
    attenuator = subpatcher.newdefault(110, 10, '*~', 0.1),
    delayLength = subpatcher.newdefault(260, 10, 'float', 100),
    delaySlide = subpatcher.newdefault(260, 160, 'slide', 10, 10),
    tapin = subpatcher.newdefault(60, 60, 'tapin~', 2000),
    tapout = subpatcher.newdefault(60, 110, 'tapout~', 500);
    // compressorObj = peaklim.call(this, 10, 160, subpatcher);

  // direct output
  subpatcher.connect(inlet1, 0, outlet, 0);
  // subpatcher.connect(compressorObj, 0, outlet, 0);

  // modulate from LFO
  var lfo = retrieveObject('LFO1'),
    delayLengthSum = subpatcher.newdefault(260, 60, '+~'),
    lfoSnapshot = subpatcher.newdefault(260, 110, 'snapshot~', 10),
    lfoAmplitude = subpatcher.newdefault(410, 10, '*~'),
    modulationAmount = subpatcher.newdefault(410, 60, '*~', 0.0);
  subpatcher.connect(delayLength, 0, delayLengthSum, 0);
  subpatcher.connect(lfo, 0, lfoAmplitude, 0);
  subpatcher.connect(delayLength, 0, lfoAmplitude, 1);
  subpatcher.connect(lfoAmplitude, 0, modulationAmount, 0);
  subpatcher.connect(modulationAmount, 0, delayLengthSum, 1);

  // feedback/delay section
  subpatcher.connect(inlet2, 0, attenuator, 0);
  subpatcher.connect(attenuator, 0, tapin, 0);
  subpatcher.connect(tapin, 0, tapout, 0);
  subpatcher.connect(tapout, 0, outlet, 0);
  subpatcher.connect(delayLengthSum, 0, lfoSnapshot, 0);
  subpatcher.connect(lfoSnapshot, 0, delaySlide, 0);
  subpatcher.connect(delaySlide, 0, tapout, 0);

  subscribeToChange('delayFeedback', attenuator, 'float', id);
  subscribeToChange('delayLength', delayLength, 'float', id);
  subscribeToChange('delayModulation', modulationAmount, 'float', id);

  // hide window
  subpatcher.wind.visible = false;

  return patchObj;
}

// single channel peak limiter
// (using omx.peaklim~ for now)
function peaklim (x, y, patcher) {
  var patchObj = patcher.newdefault(x, y, 'patcher', 'peaklim'),
    subpatcher = patchObj.subpatcher(),
    inlet = subpatcher.newdefault(10, 10, 'inlet'),
    peaklim = subpatcher.newdefault(10, 60, 'omx.peaklim~'),
    outlet = subpatcher.newdefault(10, 210, 'outlet');

  peaklim.mode(0);
  peaklim.ingain(0);
  peaklim.threshold(-3);
  // peaklim.outgain(-6);

  subpatcher.connect(inlet, 0, peaklim, 0);
  subpatcher.connect(compressor, 0, outlet, 0);

  // hide window
  subpatcher.wind.visible = false;

  return patchObj;
}

// glissando
function glissando (x, y, patcher, id) {
  var patchObj = patcher.newdefault(x, y, 'patcher', 'glissando'),
    subpatcher = patchObj.subpatcher(),
    inlet = subpatcher.newdefault(10, 10, 'inlet'),
    rampAmount = subpatcher.newdefault(110, 60, 'number', 0),
    rampsmooth = subpatcher.newdefault(10, 60, 'rampsmooth~'),
    outlet = subpatcher.newdefault(10, 210, 'outlet');

  subpatcher.connect(inlet, 0, rampsmooth, 0);
  subpatcher.connect(rampsmooth, 0, outlet, 0);
  subpatcher.connect(rampAmount, 0, rampsmooth, 1);
  subpatcher.connect(rampAmount, 0, rampsmooth, 2);

  subscribeToChange('glissando', rampAmount, 'int', id);

  // hide window
  subpatcher.wind.visible = false;

  return patchObj;
}

// voice dub subpatch
function voiceDub (x, y, patcher, dubArray, base, length) {
  var patchObj = patcher.newdefault(x, y, 'patcher', 'voiceDub'),
    subpatcher = patchObj.subpatcher(),
    inlet = subpatcher.newdefault(10, 10, 'inlet'),
    outlet = subpatcher.newdefault(10, 310, 'outlet'),
    tapin = subpatcher.newdefault(60, 60, 'tapin~', 2000),
    tapout = subpatcher.newdefault(60, 210, 'tapout~', dubArray),
    metronome = subpatcher.newdefault(210, 10, 'number'),
    baseDelay = subpatcher.newdefault(300, 10, '/', length),
    peakLimiter = subpatcher.newdefault(10, 260, 'omx.comp~', '');

  metronome.float(base);

  peakLimiter.bypass(1);
  // peakLimiter.agcThreshold(75); // this value seems to work ????
  // peakLimiter.mode(0); // punchy response
  // peakLimiter.ingain(40);
  // peakLimiter.threshold(20); // 0 is -24db, 100 is +24db
  // peakLimiter.outgain(0); // reduce by 6db before limiter
  subpatcher.connect(inlet, 0, tapin, 0);
  subpatcher.connect(tapin, 0, tapout, 0);
  subpatcher.connect(metronome, 0, baseDelay, 0);

  // generate multiplier for delay
  _.forEach(dubArray, function(dub, i) {
    var multiplier = subpatcher.newdefault(110 + 120 * i, 160, '*', dub);

    subpatcher.connect(baseDelay, 0, multiplier, 0);
    subpatcher.connect(multiplier, 0, tapout, i);
  });

  for (var i = 0; i < dubArray.length; i++) {
    var multiplier =  subpatcher.newdefault(110 + 120 * i, 260, '*~', 0.8 / dubArray.length);
    subpatcher.connect(tapout, i, multiplier, 0);
    subpatcher.connect(multiplier, 0, peakLimiter, 0);
  }

  // possible to refactor architecture to have peak limiter on the input of the panning node?
  subpatcher.connect(peakLimiter, 0, outlet, 0);

  subscribeToChange('metronome', metronome, 'float');
  metronome.bang();

  // hide window
  subpatcher.wind.visible = false;

  return patchObj;
}

// // create an lfo subpatch with
// function lfo (patcher) {
//   var patchObj = patcher.newdefault(600, 160, 'patcher', 'LFO'),
//     subpatcher = patchObj.subpatcher(),
//
//     lfo = subpatcher.newdefault(10, 10, 'cycle~', 0.1),
//     snapshot = subpatcher.newdefault(10, 60, 'snapshot~', 1), // 1ms resolution
//     // better to use `bang` to trigger snapshot??
//     float = subpatcher.newdefault(10, 110, 'float'),
//
//     id = GLOBAL.lfo && GLOBAL.lfo.length + 1 || 0;
//
//   subpatcher.connect(lfo, 0, snapshot, 0);
//   subpatcher.connect(snapshot, 0, float, 0);
//
//   // save object to GLOBAL
//   saveToGlobal({
//     lfo: float
//   }, id);
//
//   // hide window
//   // subpatcher.wind.visible = false;
// }

// generate modulator
function modulator (x, y, patcher, phase, id) {
  var patchObj = patcher.newdefault(x, y, 'patcher', 'modulator'),
    subpatcher = patchObj.subpatcher(),
    inlet = subpatcher.newdefault(10, 10, 'inlet'),
    snapshot = subpatcher.newdefault(10, 260, 'snapshot~'),
    metro = subpatcher.newdefault(210, 10, 'number~', this.clock),
    timeFactor = subpatcher.newdefault(80, 10, 'float', 1000),
    divisor = subpatcher.newdefault(80, 60, '/~', 1000.),
    modifier = subpatcher.newdefault(80, 110, '*~', 1.),
    phaseOffset = subpatcher.newdefault(240, 110, 'number~', phase || 0),
    cycle = baseModulator.call(this, 80, 210, subpatcher),
    phaseModulator = subpatcher.newdefault(240, 160, 'number~'),
    phaseSum = subpatcher.newdefault(110, 160, '+~'),
    outlet = subpatcher.newdefault(10, 310, 'outlet');

  metro.float(this.clock);
  phaseOffset.float(phase || 0);
  phaseModulator.float(0);

  // wiring
  subpatcher.connect(inlet, 0, snapshot, 0);
  subpatcher.connect(timeFactor, 0, divisor, 0);
  subpatcher.connect(metro, 0, divisor, 1);
  subpatcher.connect(divisor, 0, modifier, 0);
  subpatcher.connect(modifier, 0, cycle, 0);
  subpatcher.connect(phaseOffset, 0, phaseSum, 0);
  subpatcher.connect(phaseModulator, 0, phaseSum, 1);
  subpatcher.connect(phaseSum, 0, cycle, 1);
  subpatcher.connect(cycle, 0, snapshot, 0);
  subpatcher.connect(snapshot, 0, outlet, 0);

  subscribeToChange('metronome', metro, 'float');
  subscribeToChange('modulator1', modifier, 'float', id);
  subscribeToChange('modulatorPhase', phaseModulator, 'float', id);

  // hide new subpatch window
	subpatcher.wind.visible = false;

  return patchObj;
}

// base modulator for pattern generation
function baseModulator (x, y, patcher, id) {
  var patchObj = patcher.newdefault(x, y, 'patcher', 'base-modulator'),
    subpatcher = patchObj.subpatcher(),
    // oscbank = subpatcher.newfault(10, 10, 'oscbank~'),
    inletFrequency = subpatcher.newdefault(10, 10, 'inlet'),
    inletPhase = subpatcher.newdefault(60, 10, 'inlet'),
    cycle = subpatcher.newdefault(10, 60, 'cycle~'),
    // tri = subpatcher.newdefault(210, 60, 'tri~'),
    saw = subpatcher.newdefault(310, 60, 'saw~'),
    // mix = subpatcher.newdefault(10, 110, '')
    outlet = subpatcher.newdefault(10, 310, 'outlet');

  // wiring
  subpatcher.connect(inletFrequency, 0, cycle, 0);
  subpatcher.connect(inletPhase, 0, cycle, 1);
  subpatcher.connect(cycle, 0, outlet, 0);

  // hide new subpatch window
  // subpatcher.wind.visible = false;

  return patchObj;
}

// 'memory' oscillator using oscbank??

// harmonic oscillator
function harmonicOscillator (x, y, patcher) {
  var patchObj = patcher.newdefault(x, y, 'patcher', 'harmonic-osc'),
    subpatcher = patchObj.subpatcher(),
    inlet = subpatcher.newdefault(10, 10, 'inlet'),
    outlet = subpatcher.newdefault(10, 310, 'outlet'),
    signalSum = subpatcher.newdefault(10, 260, '*~');
    numOscillators = 4;

  for (var i = 0; i < numOscillators; i++) {
    var cycle = subpatcher.newdefault(10, 160, 'cycle~'),
      frequencyMultiplier = subpatcher.newdefault(10, 110, '*~', i + 1),
      signalMultiplier = subpatcher.newdefault(10, 210, '*~', 1 / numOscillators);

    subpatcher.connect(inlet, 0, frequencyMultiplier, 0);
    subpatcher.connect(frequencyMultiplier, 0, cycle, 0);
    subpatcher.connect(cycle, 0, signalMultiplier, 0);
    subpatcher.connect(signalMultiplier, 0, signalSum, 0);
  }

  subpatcher.connect(signalSum, 0, outlet, 0);

  // hide new subpatch window
	// subpatcher.wind.visible = false;

  return patchObj;
}

// chord oscillator
// deprecated???
// function chordOscillator(x, y, patcher, id, voiceParams) {
//   var spreadFrequency = 0.05;
//
//   var patchObj = patcher.newdefault(x, y, 'patcher', 'chord-oscillator'),
//     subpatcher = patchObj.subpatcher(),
//     inlet = subpatcher.newdefault(10, 10, 'inlet'),
//     outlet = subpatcher.newdefault(10, 360, 'outlet'),
//     mixer = subpatcher.newdefault(10, 310, '+~'),
//     spreadAmount = subpatcher.newdefault(160, 10, 'number~');
//
//     spreadAmount.float(2);
//     // voiceParams.chord = voiceParams.chord || [0];
//
//     // generate oscillators
//     if (voiceParams.chord) {
//       _.forEach(voiceParams.chord, function(interval, i) {
//         var spreadPhase = i / voiceParams.chord.length,
//           intervalFactor = subpatcher.newdefault(60, 10, 'number~'),
//           multiplier = subpatcher.newdefault(10, 60, '*~'),
//           spread = subpatcher.newdefault(120, 60, 'cycle~', spreadFrequency, spreadPhase),
//           spreadMultiplier = subpatcher.newdefault(120, 110, '*~'),
//           carrier = subpatcher.newdefault(10 + i * 110, 210, 'cycle~'),
//           carrierInput = subpatcher.newdefault(10, 160, '+~'),
//           mixFactor = subpatcher.newdefault(10, 260, '*~', 1 / voiceParams.chord.length);
//
//         intervalFactor.float(interval);
//         subpatcher.connect(inlet, 0, multiplier, 0);
//         subpatcher.connect(intervalFactor, 0, multiplier, 1);
//         subpatcher.connect(multiplier, 0, carrierInput, 0);
//         subpatcher.connect(spread, 0, spreadMultiplier, 0);
//         subpatcher.connect(spreadAmount, 0, spreadMultiplier, 1);
//         subpatcher.connect(spreadMultiplier, 0, carrierInput, 1);
//
//         subpatcher.connect(carrierInput, 0, carrier, 0);
//         subpatcher.connect(carrier, 0, mixFactor, 0);
//         subpatcher.connect(mixFactor, 0, mixer, 0);
//       })
//     }
//     // wiring carrier
//     subpatcher.connect(mixer, 0, outlet, 0);
//
//     // subscribeToChange('voiceParam1', modulationIndex, 'float', id);
//     subscribeToChange('chordSpread', spreadAmount, 'float', id);
//
//     // hide subpatch window
//     subpatcher.wind.visible = false;
//
//     return patchObj;
// }

// sound source (media or cycle)
function soundSource (x, y, patcher, voiceParams, id) {
	var patchObj = patcher.newdefault(x, y, 'patcher', 'soundSource'),
		subpatcher = patchObj.subpatcher(),
		sourceInlet1 = subpatcher.newdefault(10, 10, 'inlet'), // pitch input
    sourceInlet2 = subpatcher.newdefault(100, 10, 'inlet'), // adsr input
    sourceInlet3 = subpatcher.newdefault(190, 10, 'inlet'), // trigger input
		sourceOutlet = subpatcher.newdefault(10, 410 , 'outlet'),
    type = voiceParams.soundSource,

    chord = voiceParams.chord || [1],
    detuneSources = [];

  // generate detune sources
  _.forEach(chord, function(interval, i){
    var detuneFrequency = 0.01,
      detuneCycle = subpatcher.newdefault(210, 10, 'cycle~', detuneFrequency, i / chord.length),
      detuneAmplitude = subpatcher.newdefault(210, 60, '*~', 0);
      subpatcher.connect(detuneCycle, 0, detuneAmplitude, 0);
      detuneSources.push(detuneAmplitude);
      subscribeToChange('chordSpread', detuneAmplitude, 'float', id);
  });

  function addSoundSource(instrumentName) {
    var vca = subpatcher.newdefault(10, 210, '*~');

    _.forEach(chord, function(chordVal, i) {
      var chordIndex = subpatcher.newdefault(10, 60, '*~', chordVal),
        instrument = instruments.generateInstrument.call(this, 10, 110, instrumentName, subpatcher, id),
        chordAmplitude = subpatcher.newdefault(10, 160, '*~', 1 / chord.length);

      subpatcher.connect(sourceInlet1, 0, chordIndex, 0);
      subpatcher.connect(chordIndex, 0, instrument, 0);
      subpatcher.connect(sourceInlet2, 0, instrument, 1);
      subpatcher.connect(sourceInlet3, 0, instrument, 2);
      subpatcher.connect(instrument, 0, chordAmplitude, 0);
      subpatcher.connect(chordAmplitude, 0, vca, 0);
      subpatcher.connect(detuneSources[i], 0, chordIndex, 0);
    }.bind(this));

    subpatcher.connect(sourceInlet2, 0, vca, 1);
    subpatcher.connect(vca, 0, sourceOutlet, 0);
  };

	// hide new subpatch window
	subpatcher.wind.visible = false;

  if (type === 'expert-sleepers') {
    this.idCounter = this.idCounter || 0;
		this.idCounter++;

		var expr = subpatcher.newdefault(10, 30, 'expr', '(log($f1)/log(2))/10.0'),
			snapshot = subpatcher.newdefault(50, 30, 'snapshot~', 10),
			sig = subpatcher.newdefault(10, 50, 'sig~'),
			dac = subpatcher.newdefault(10, 70, 'dac~', this.idCounter);

		subpatcher.connect(sourceInlet1, 0, snapshot, 0);
		subpatcher.connect(snapshot, 0, expr, 0)
		subpatcher.connect(expr, 0, sig, 0);
		subpatcher.connect(sig, 0, dac, 0);
  }

  else {
    addSoundSource.call(this, type);
  }

	return patchObj;
}

// generate ADSR
function adsr (x, y, patcher, id) {
  // TODO clean-up to make this less nested
  var adsrValues = this.preset.voiceParams[id].adsr || this.preset.adsr;

	var patchObj = patcher.newdefault(x, y, 'patcher', 'adsr'),
		subpatcher = patchObj.subpatcher(),
		trigInlet = subpatcher.newdefault(10, 10, 'inlet'),
		click = subpatcher.newdefault(10, 60, 'click~'),
		attackAmt = subpatcher.newdefault(120, 10, 'number'),
		decayAmt = subpatcher.newdefault(230, 10, 'number'),
		sustainAmt = subpatcher.newdefault(340, 10, 'number'),
		releaseAmt = subpatcher.newdefault(450, 10, 'number'),
    attack = subpatcher.newdefault(120, 60, 'sig~'),
    decay = subpatcher.newdefault(230, 60, 'sig~'),
    sustain = subpatcher.newdefault(340, 60, 'sig~'),
    release = subpatcher.newdefault(450, 60, 'sig~'),
		adsr = subpatcher.newdefault(10, 310, 'adsr~'),
		trigAdsr = subpatcher.newdefault(10, 110, 'adsr~', 0, 0, 1, 250);
    powExponent = subpatcher.newdefault(160, 360, 'number~'),
    pow = subpatcher.newdefault(10, 360, 'pow~'),
		out = subpatcher.newdefault(10, 410, 'outlet');

  powExponent.float(2);

  subscribeToChange('attack', attackAmt, 'float', id);
  subscribeToChange('decay', decayAmt, 'float', id);
  subscribeToChange('sustain', sustainAmt, 'float', id);
  subscribeToChange('release', releaseAmt, 'float', id);

  attackAmt.float(adsrValues[0]);
  decayAmt.float(adsrValues[1]);
  sustainAmt.float(adsrValues[2]);
	releaseAmt.float(adsrValues[3]);
  subpatcher.connect(attackAmt, 0, attack, 0);
  subpatcher.connect(decayAmt, 0, decay, 0);
  subpatcher.connect(sustainAmt, 0, sustain, 0);
  subpatcher.connect(releaseAmt, 0, release, 0);
	subpatcher.connect(attack, 0, adsr, 1);
	subpatcher.connect(decay, 0, adsr, 2);
	subpatcher.connect(sustain, 0, adsr, 3);
	subpatcher.connect(release, 0, adsr, 4);

  subpatcher.connect(trigInlet, 0, click, 0);
	subpatcher.connect(click, 0, trigAdsr, 0);
  subpatcher.connect(attack, 0, trigAdsr, 4);
	subpatcher.connect(decay, 0, trigAdsr, 4); // should actually sum attack and decay together
	subpatcher.connect(trigAdsr, 0, adsr, 0);

  subpatcher.connect(adsr, 0, pow, 1);
  subpatcher.connect(powExponent, 0, pow, 0);
  subpatcher.connect(pow, 0, out, 0);

	// activate adsr values
	attackAmt.bang();
	decayAmt.bang();
	sustainAmt.bang();
	releaseAmt.bang();

  // connect adsr to expert sleepers
  if (this.soundSource === 'expert-sleepers') {
    this.esCounter = this.esCounter || 5;
    var envelopeDac = voicePatcher.newdefault(500, 80, 'dac~', this.esCounter);
    connectByTask(voicePatcher, adsr, 0, envelopeDac, 0);
    this.esCounter++;
  }

	// hide subpatch window
	subpatcher.wind.visible = false;

  return patchObj;
}

// stereo panner
// in expr, power will determine strength of panning
// base:
// 0.25 = 1.5 dB
// 0.5   = 3 dB
// 0.75 = 4.5 dB
// 1 = 6dB (linear)
function stereoPan (x, y, patcher, id) {
  var patchObj = patcher.newdefault(x, y, 'patcher', 'stereo-pan'),
    subpatcher = patchObj.subpatcher(),
    inlet = subpatcher.newdefault(10, 10, 'inlet'),
    outletLeft = subpatcher.newdefault(10, 410, 'outlet'),
    outletRight = subpatcher.newdefault(60, 410, 'outlet'),
    reduceGain = subpatcher.newdefault(10, 60, '*~', 0.5), // needs to be variable on number of voices
    multiplierLeft = subpatcher.newdefault(10, 360, '*~'),
    multiplierRight = subpatcher.newdefault(60, 360, '*~'),
    panOscillator = subpatcher.newdefault(120, 10, 'cycle~', 0.1, id / this.numberOfVoices),
    snapshot = subpatcher.newdefault(120, 60, 'snapshot~', 10),
    scale = subpatcher.newdefault(120, 110, 'scale', '-1\t1\t0.\t1.'),
    expLeft = subpatcher.newdefault(120, 160, 'expr', '(pow((1.-$f1),1.0))'),
    expRight = subpatcher.newdefault(240, 160, 'expr', '(pow($f1,1.0))'),
    slideLeft = subpatcher.newdefault(120, 210, 'slide', '10\t10'),
    slideRight = subpatcher.newdefault(240, 210, 'slide', '10\t10'),
    lineLeft = subpatcher.newdefault(120, 260, 'line~'),
    lineRight = subpatcher.newdefault(240, 260, 'line~');

  // wiring
  subpatcher.connect(inlet, 0, reduceGain, 0);
  subpatcher.connect(panOscillator, 0, snapshot, 0);
  subpatcher.connect(snapshot, 0, scale, 0);

  // wiring left
  subpatcher.connect(scale, 0, expLeft, 0);
  subpatcher.connect(expLeft, 0, slideLeft, 0);
  subpatcher.connect(slideLeft, 0, lineLeft, 0);
  subpatcher.connect(reduceGain, 0, multiplierLeft, 0);
  subpatcher.connect(lineLeft, 0, multiplierLeft, 1);
  subpatcher.connect(multiplierLeft, 0, outletLeft, 0);

  // wiring right
  subpatcher.connect(scale, 0, expRight, 0);
  subpatcher.connect(expRight, 0, slideRight, 0);
  subpatcher.connect(slideRight, 0, lineRight, 0);
  subpatcher.connect(reduceGain, 0, multiplierRight, 0);
  subpatcher.connect(lineRight, 0, multiplierRight, 1);
  subpatcher.connect(multiplierRight, 0, outletRight, 0);

  // hide new subpatch window
	subpatcher.wind.visible = false;

  return patchObj;
}

function metronome (x, y, patcher) {
  var patchObj = patcher.newdefault(x, y, 'patcher', 'metronome'),
    subpatcher = patchObj.subpatcher(),
    phasor = subpatcher.newdefault(40, 210, 'phasor~'),
    inlet1 = subpatcher.newdefault(10, 10, 'inlet'),
    inlet2 = subpatcher.newdefault(60, 10, 'inlet'),
    expr = subpatcher.newdefault(40, 60, 'expr', '1000.*$f2/$f1'),
    exprSig = subpatcher.newdefault(40, 110, 'sig~'),
    swingInput = subpatcher.newdefault(150, 10, 'expr', '1000.*8/$f1'),
    swingAmt = subpatcher.newdefault(150, 60, '*~', 0),
    swingCycle = subpatcher.newdefault(150, 110, 'cycle~'),
    swingMult = subpatcher.newdefault(150, 160, '*~'),
    phasorInput = subpatcher.newdefault(40, 160, '+~'),
    phasorSnapshot = subpatcher.newdefault(90, 260, 'snapshot~', 1),
    lcm = subpatcher.newdefault(100, 10, 'number', this.lcm),
    round = subpatcher.newdefault(40, 260, 'round~', '1.0'),
    edgeDetector = subpatcher.newdefault(40, 310, 'edge~'),
    gate = subpatcher.newdefault(10, 360, 'gate', 1),
    outlet = subpatcher.newdefault(10, 410, 'outlet');

  lcm.int(this.lcm);

  // connections
  subpatcher.connect(inlet2, 0, expr, 0);
  subpatcher.connect(lcm, 0, expr, 1);
  subpatcher.connect(expr, 0, exprSig, 0);
  subpatcher.connect(exprSig, 0, swingAmt, 0);
  subpatcher.connect(inlet2, 0, swingInput, 0);
  subpatcher.connect(swingInput, 0, swingCycle, 0);
  subpatcher.connect(swingCycle, 0, swingMult, 0);
  subpatcher.connect(swingAmt, 0, swingMult, 1);
  subpatcher.connect(exprSig, 0, phasorInput, 0);
  subpatcher.connect(swingMult, 0, phasorInput, 1);
  subpatcher.connect(phasorInput, 0, phasorSnapshot, 0);
  subpatcher.connect(phasorSnapshot, 0, phasor, 0);
  subpatcher.connect(phasor, 0, round, 0)
  subpatcher.connect(round, 0, edgeDetector, 0);
  subpatcher.connect(edgeDetector, 1, gate, 1);
  subpatcher.connect(inlet1, 0, gate, 0);
  subpatcher.connect(gate, 0, outlet, 0);

  lcm.bang();

  subscribeToChange('metronomeSwing', swingAmt, 'float');

  // hide subpatch window
  subpatcher.wind.visible = false;

  return patchObj;
}

function voiceMetronome (x, y, patcher, id) {
  this.lcm = this.voices[id].sequence.length;

  var patchObj = patcher.newdefault(x, y, 'patcher', 'voiceMetronome'),
    subpatcher = patchObj.subpatcher(),
    phasor = subpatcher.newdefault(120, 260, 'phasor~'),
    inlet1 = subpatcher.newdefault(10, 10, 'inlet'),
    inlet2 = subpatcher.newdefault(60, 10, 'inlet'),
    inlet2Sig = subpatcher.newdefault(40, 60, 'sig~'),
    var2 = subpatcher.newdefault(40, 110, '/~'),
    swingInput = subpatcher.newdefault(260, 10, '/~', 2),
    // swingInput = subpatcher.newdefault(260, 10, 'expr', '1000.*8/$f1'),
    swingAmt = subpatcher.newdefault(260, 60, '*~', 0),
    swingCycle = subpatcher.newdefault(260, 110, 'cycle~'),
    swingMult = subpatcher.newdefault(260, 160, '*~'),
    phasorInput = subpatcher.newdefault(40, 160, '+~'),
    phasorMultiplier = subpatcher.newdefault(40, 210, '*~', 1),
    phasorSnapshot = subpatcher.newdefault(40, 260, 'snapshot~', 1),
    lcm = subpatcher.newdefault(150, 10, 'number', this.lcm),
    lcmSig = subpatcher.newdefault(150, 60, 'sig~'),
    var1 = subpatcher.newdefault(150, 110, '*~', 1000),
    round = subpatcher.newdefault(230, 260, 'round~', '1.0'),
    edgeDetector = subpatcher.newdefault(340, 260, 'edge~'),
    gate = subpatcher.newdefault(10, 360, 'gate', 1),
    message = subpatcher.newdefault(120, 360, 'message'),
    sprintf = subpatcher.newdefault(120, 410, 'sprintf', '%s'),
    outlet = subpatcher.newdefault(10, 410, 'outlet');

  lcm.int(this.lcm);
  message.set('bangVoice ' + id);

  // connections
  subpatcher.connect(inlet2, 0, inlet2Sig, 0);
  subpatcher.connect(inlet2Sig, 0, var2, 1);
  subpatcher.connect(lcm, 0, lcmSig, 0);
  subpatcher.connect(lcmSig, 0, var1, 0);
  subpatcher.connect(var1, 0, var2, 0);
  subpatcher.connect(var2, 0, swingInput, 0);
  subpatcher.connect(swingInput, 0, swingCycle, 0);
  subpatcher.connect(swingCycle, 0, swingMult, 0);
  subpatcher.connect(swingAmt, 0, swingMult, 1);
  subpatcher.connect(swingMult, 0, phasorInput, 1);
  subpatcher.connect(phasorInput, 0, phasorMultiplier, 0);
  subpatcher.connect(var2, 0, phasorInput, 0);
  subpatcher.connect(phasorInput, 0, phasorMultiplier, 0);
  subpatcher.connect(phasorMultiplier, 0, phasorSnapshot, 0);
  subpatcher.connect(phasorSnapshot, 0, phasor, 0);
  subpatcher.connect(phasor, 0, round, 0)
  subpatcher.connect(round, 0, edgeDetector, 0);
  subpatcher.connect(edgeDetector, 1, gate, 1);
  subpatcher.connect(inlet1, 0, gate, 0);
  subpatcher.connect(gate, 0, message, 0);
  subpatcher.connect(message, 0, sprintf, 0);
  subpatcher.connect(sprintf, 0, outlet, 0);

  lcm.bang();

  subscribeToChange('metronomeSwing', swingAmt, 'float');
  subscribeToChange('voiceMetronome', phasorMultiplier, 'float', id);
  subscribeToChange('sequenceLength', lcm, 'int', id);

  // hide subpatch window
  subpatcher.wind.visible = false;

  return patchObj;
}

// TODO: function to provide callback for voice bang trigger
// function voiceCallback (x, y, patcher, id) {
//   var patchObj = patcher.newdefault(x, y, 'patcher', 'voiceCallback'),
//     subpatcher = patchObj.subpatcher(),
//     inlet = subpatcher.newdefault(10, 10, 'inlet'),
//     outlet = subpatcher.newdefault(60, 10, 'outlet');
//
//
// }

// sends midi channel information when note in is detected
function noteInDetector(x, y, patcher) {
  var patchObj = patcher.newdefault(x, y, 'patcher', 'noteInDetector'),
    subpatcher = patchObj.subpatcher(),
    notein = subpatcher.newdefault(10, 10, 'notein'),
    sig = subpatcher.newdefault(60, 60, 'sig~'),
    message = subpatcher.newdefault(10, 210, 'message'),
    edge = subpatcher.newdefault(60, 110, 'edge~'),
    // delay = subpatcher.newdefault(10, 160, 'delay', 10), // not really needed
    outlet = subpatcher.newdefault(10, 300, 'outlet');

  subpatcher.connect(notein, 0, message, 1);
  subpatcher.connect(notein, 1, sig, 0);
  subpatcher.connect(sig, 0, edge, 0);
  subpatcher.connect(edge, 0, message, 0);
  // subpatcher.connect(delay, 0, message, 0);
  subpatcher.connect(edge, 1, message, 0);
  subpatcher.connect(message, 0, outlet, 0);

  // hide subpatch window
  subpatcher.wind.visible = false;

  return patchObj;
}

function stereoOutput(x, y, patcher) {
  var patchObj = patcher.newdefault(x, y, 'patcher', 'stereo-output'),
    subpatcher = patchObj.subpatcher(),
    inlet1 = subpatcher.newdefault(10, 10, 'inlet'),
    inlet2 = subpatcher.newdefault(60, 10, 'inlet'),
    inlet3 = subpatcher.newdefault(110, 10, 'inlet'),
    filename = '' + Date.now() + '.aiff',
    message = subpatcher.newdefault(110, 260, 'message'), //  'open ' + filename
    record = subpatcher.newdefault(10, 260, 'sfrecord~', 2),

    // output to channels 5 and 6 (Virtual 1 and 2) on apollo twin
    // if not bypassing expert sleepers
    outputChannels = this.preset.bypassExpertSleepers ? [1, 2] : [21, 22],
    dac = subpatcher.newdefault(10, 310, 'dac~', outputChannels);

  subpatcher.connect(inlet1, 0, dac, 0);
  subpatcher.connect(inlet2, 0, dac, 1);
  subpatcher.connect(inlet1, 0, record, 0);
  subpatcher.connect(inlet2, 0, record, 1);
  subpatcher.connect(message, 0, record, 0);
  subpatcher.connect(inlet3, 0, record, 0);
  subpatcher.connect(inlet3, 0, message, 0);

  message.set('open ' + filename);
  // record.open(filename);

  // hide subpatch window
  // subpatcher.wind.visible = false;

  return patchObj;
}

// generate voice
function voice(length, hits) {
  // var outputMode = 'expert-sleepers'; // temporary

  var id = this.voices.length,
    pitchOutlet = id * 2,
    triggerOutlet = pitchOutlet + 1;
    voice = new Voice({
      main: this,
      length: length,
      hits: hits,
      pitchOutlet: pitchOutlet,
      triggerOutlet: triggerOutlet,
      scale: this.scale,
      rule: this.rule,
      strata: this.strata
    }, this.preset);

  this.voices.push(voice);

  // construct metronome
  var metronomeObj = voiceMetronome.call(this, 310, 160, this.patcher, id);
  this.patcher.connect(this.objects.metroToggle, 0, metronomeObj, 0);
  this.patcher.connect(this.objects.metro, 0, metronomeObj, 1);
  this.patcher.connect(metronomeObj, 0, this.box, 0);

  var xPos = 10 + id * 140;
  var voicePatch = this.patcher.newdefault(xPos, 400, 'patcher', 'voice'),
    voicePatcher = voicePatch.subpatcher(),
    pitchInlet = voicePatcher.newdefault(10, 10, 'inlet'),
    trigInlet = voicePatcher.newdefault(50, 10, 'inlet'),

    outletLeft = voicePatcher.newdefault(10, 360, 'outlet'),
    outletRight = voicePatcher.newdefault(60, 360, 'outlet'),

    frequencyMultiplier = this.patcher.newdefault(xPos, 360, '*~'),
    sig = this.patcher.getnamed('sig');

  var post = this.voiceParams[id].post;
  var useQMMF = this.voiceParams[id].qmmf && !this.preset.bypassExpertSleepers;


  // construct sound source
  var voiceParams = this.voiceParams[id],
    soundSourceObj = soundSource.call(this, 10, 110, voicePatcher, voiceParams, id);

  // var construct glissando
  var glissandoObj = glissando.call(this, 10, 40, voicePatcher, id);
  voicePatcher.connect(pitchInlet, 0, glissandoObj, 0);

  // generate routing for voice
  voicePatcher.connect(glissandoObj, 0, soundSourceObj, 0);

  // construct ADSR and connect
  var adsrObject = adsr.call(this, 110, 60, voicePatcher, id);
  voicePatcher.connect(trigInlet, 0, adsrObject, 0);
  voicePatcher.connect(adsrObject, 0, soundSourceObj, 1);
  voicePatcher.connect(trigInlet, 0, soundSourceObj, 2);

  // construct sound source modifier and connect
  var dubArray = this.voiceParams[id].dub;
  var base = this.clock / length;
  var voiceDubObj = voiceDub.call(this, 10, 160, voicePatcher, dubArray, this.clock, length);
  voicePatcher.connect(soundSourceObj, 0, voiceDubObj, 0);

  // generate effects chain
  var postChainObj = postChain.call(this, 10, 260, voicePatcher, id);
  voicePatcher.connect(voiceDubObj, 0, postChainObj, 0);

  // generate stereo pan
  var stereoPanObj = stereoPan.call(this, 10, 310, voicePatcher, id);

  // route through Expert Sleepers
  if (useQMMF) {
    var esOutput = expertSleepersInterface.call(this, {
        patcher: voicePatcher,
        inputFrequency: pitchInlet, // actually just inputFrequency for now
        inputAudio: postChainObj
      }),
      boostSignal = voicePatcher.newdefault(400, 260, '*~', 1.3);

    voicePatcher.connect(esOutput, 0, boostSignal, 0),
    voicePatcher.connect(boostSignal, 0, stereoPanObj, 0);

    // connect cv output
    var cvOutputObj = cvOutput.call(this, 500, 400, voicePatcher, id);
    voicePatcher.connect(pitchInlet, 0, cvOutputObj, 0);
    voicePatcher.connect(voiceDubObj, 0, cvOutputObj, 1);
  } else {
    // generate delay line
    var delayObj = delay.call(this, 10, 210, voicePatcher, id);
    // var feedback = voicePatcher.newdefault(110, 210, '*~', 1);
    voicePatcher.connect(postChainObj, 0, delayObj, 0);
    voicePatcher.connect(delayObj, 0, delayObj, 1);

    // pass delay line to ES input
    voicePatcher.connect(delayObj, 0, stereoPanObj, 0);

    // voicePatcher.connect(soundSourceObj, 0, stereoPanObj, 0);
    // voicePatcher.connect(postChainObj, 0, stereoPanObj, 0);
    // connectByTask(voicePatcher, multiply, 0, out, 0);
  }

  // connect pan object to outlets
  // outlets are switched for some weird reason
  voicePatcher.connect(stereoPanObj, 1, outletLeft, 0);
  voicePatcher.connect(stereoPanObj, 0, outletRight, 0);

  // connect main object to voice sub-patch
  this.patcher.connect(this.box, pitchOutlet, frequencyMultiplier, 1);
  this.patcher.connect(this.box, triggerOutlet, voicePatch, 1);

  // generate multiplier
  this.patcher.connect(sig, 0, frequencyMultiplier, 0);
  this.patcher.connect(frequencyMultiplier, 0, voicePatch, 0);
  frequencyMultiplier.varname = 'multiplier';

  // connect to delay line
  // var delay = generate.delay(voicePatcher);
  // this.patcher.connect(voicePatch, 0, delay, 0);

  // hide subpatch window
  voicePatcher.wind.visible = false;

  voicePatch.varname = 'voicePatch' + id;
  return voicePatch;
}

/*
Usage of expert sleepers with another interface requires creating an aggregate device.
In this case, a 'Synth' device has been generated, consisting of:
an Expert Sleepers ES-8 (12 in / 16 out)
and an Apollo Twin (14 in / 10 out)
*/
function expertSleepersInterface (obj) {
  var patcher = obj.patcher,
    inputFrequency = obj.inputFrequency,
    inputAudio = obj.inputAudio,
    outputAudio = patcher.newdefault(10, 410, 'dac~', outputAudioChannelCounter);

  // generate delay line
  var delayObj = delay.call(this, 10, 360, patcher, id);
  patcher.connect(inputAudio, 0, delayObj, 0);

  // pass delay line to ES input
  patcher.connect(delayObj, 0, outputAudio, 0);

  // pass audio out of Expert Sleepers
  var adc = patcher.newdefault(300, 400, 'adc~', inputAudioChannelCounter);

  // feed ES output back into delay
  patcher.connect(adc, 0, delayObj, 1);

  // auto-increment counters
  outputAudioChannelCounter++;
  inputAudioChannelCounter++;
  id++;

  return adc;
}

// generate cv-output
function cvOutput (x, y, patcher, id) {
  var patchObj = patcher.newdefault(x, y, 'patcher', 'cv-output'),
    subpatcher = patchObj.subpatcher(),
    inlet1 = subpatcher.newdefault(10, 10, 'inlet'),
    inlet2 = subpatcher.newdefault(60, 10, 'inlet'),
    outputCV = subpatcher.newdefault(10, 360, 'dac~', outputCVChannelCounter);
    baseFrequency = subpatcher.newdefault(160, 110, 'number', this.baseFrequency),
    expr = subpatcher.newdefault(10, 110, 'expr', '(log($f1/$f2)/log(2))/10.0'),
    snapshot = subpatcher.newdefault(10, 60, 'snapshot~', 10),
    sig = subpatcher.newdefault(10, 160, 'sig~'),
    rectifier = subpatcher.newdefault(260, 60, 'maximum~', 0),
    envelopeFollower = subpatcher.newdefault(260, 110, 'slide~', 1200, 1200),
    followerAmount = subpatcher.newdefault(260, 160, '*~', 0.1),
    cvSum = subpatcher.newdefault(10, 310, '+~'),
    lfo = subpatcher.newdefault(310, 310, 'cycle~', 0.05),
    lfoAmplitude = subpatcher.newdefault(410, 310, '*~', 0.05, id / this.numberOfVoices);

  subpatcher.connect(inlet1, 0, snapshot, 0);
  subpatcher.connect(snapshot, 0, expr, 0);
  subpatcher.connect(baseFrequency, 0, expr, 1);
  subpatcher.connect(expr, 0 , sig, 0);
  subpatcher.connect(sig, 0, cvSum, 0);
  subpatcher.connect(cvSum, 0, outputCV, 0);

  subpatcher.connect(inlet2, 0, rectifier, 0);
  subpatcher.connect(rectifier, 0, envelopeFollower, 0);
  subpatcher.connect(envelopeFollower, 0, followerAmount, 0);
  subpatcher.connect(followerAmount, 0, cvSum, 1);

  // add in lfo animation
  subpatcher.connect(lfo, 0, lfoAmplitude, 0);
  subpatcher.connect(lfoAmplitude, 0, cvSum, 1);

  baseFrequency.int(this.baseFrequency);
  baseFrequency.bang();

  // auto-increment counters
  outputCVChannelCounter++;

  subscribeToChange('envelopeFollower', followerAmount, 'float', id);

  // hide new subpatch window
  subpatcher.wind.visible = false;

  return patchObj;
}

// generate phaser
function phaser (x, y, patcher, num, id) {
  var patchObj = patcher.newdefault(x, y, 'patcher', 'phaser'),
    subpatcher = patchObj.subpatcher(),
    inlet = subpatcher.newdefault(10, 10, 'inlet'),
    cycle = subpatcher.newdefault(110, 10, 'cycle~', 0.1),
    sum = subpatcher.newdefault(210, 10, '+~', 1.1),
    multiply = subpatcher.newdefault(310, 10, '*~', 1000),
    q = subpatcher.newdefault(410, 10, 'float', 0.5),
    mix = subpatcher.newdefault(10, 160, '*~', 1),
    outlet = subpatcher.newdefault(10, 210, 'outlet');

  var baseFrequency = 30,
    lastObj;

  _.times(num, function(i){
    var phaseshift = subpatcher.newdefault(10 + i*100, 110, 'phaseshift~');

    if (lastObj) {
      subpatcher.connect(lastObj, 0, phaseshift, 0);
    } else {
      subpatcher.connect(inlet, 0, phaseshift, 0);
    }

    subpatcher.connect(multiply, 0, phaseshift, 1);
    subpatcher.connect(q, 0, phaseshift, 2);
    lastObj = phaseshift;
  })

  // wiring
  subpatcher.connect(cycle, 0, sum, 0);
  subpatcher.connect(sum, 0, multiply, 0);
  subpatcher.connect(inlet, 0, mix, 0);
  subpatcher.connect(lastObj, 0, mix, 0);
  subpatcher.connect(mix, 0, outlet, 0);

  subscribeToChange('phaserResonance', q, 'float', id);

  // hide new subpatch window
  subpatcher.wind.visible = false;

  return patchObj;
}

function lpg (x, y, patcher, id) {
  var patchObj = patcher.newdefault(x, y, 'patcher', 'lpg'),
    subpatcher = patchObj.subpatcher(),
    inlet = subpatcher.newdefault(10, 10, 'inlet'),
    abs = subpatcher.newdefault(120, 60, 'abs~'),
    slide = subpatcher.newdefault(120, 110, 'slide~', 500, 500),
    edge = subpatcher.newdefault(230, 60, 'edge~'),
    click = subpatcher.newdefault(230, 110, 'click~'),
    adsr = subpatcher.newdefault(230, 160, 'adsr~', 0, 0, 1, 200),
    envelope = subpatcher.newdefault(230, 210, '*~', 500),
    maximum = subpatcher.newdefault(120, 160, 'maximum~'),
    onepole = subpatcher.newdefault(10, 260, 'onepole~'),
    vca = subpatcher.newdefault(10, 310, '*~'),
    outlet = subpatcher.newdefault(10, 360, 'outlet');

  subpatcher.connect(inlet, 0, onepole, 0);
  subpatcher.connect(inlet, 0, edge, 0);
  subpatcher.connect(inlet, 0, abs, 0);
  subpatcher.connect(abs, 0, slide, 0);
  subpatcher.connect(edge, 0, click, 0);
  subpatcher.connect(click, 0, adsr, 0);
  subpatcher.connect(slide, 0, maximum, 0);
  subpatcher.connect(adsr, 0, maximum, 1);
  subpatcher.connect(maximum, 0, envelope, 0);
  subpatcher.connect(envelope, 0, onepole, 1);
  subpatcher.connect(onepole, 0, vca, 0);
  subpatcher.connect(maximum, 0, vca, 1);
  subpatcher.connect(vca, 0, outlet, 0);


  // hide new subpatch window
  subpatcher.wind.visible = false;

  return patchObj;
}

// effects chain
function postChain (x, y, patcher, id) {
  var patchObj = patcher.newdefault(x, y, 'patcher', 'post-chain'),
    subpatcher = patchObj.subpatcher(),
    inlet = subpatcher.newdefault(10, 10, 'inlet'),
    outlet = subpatcher.newdefault(10, 410, 'outlet'),
    amplitude = subpatcher.newdefault(160, 10, '*~', 0.8);

  // generate and wire objects defined in presets
  if (this.voiceParams[id].post.length) {
    var newObject, lastObject;
    _.forEach(this.voiceParams[id].post, function(item, i){
      // call items dynamically instead
      if (item === 'phaser') {
        newObject = phaser(10 + i * 100, 110, subpatcher, 8, id);
      } else if (item === 'cverb') {
        newObject = subpatcher.newdefault(10 + i * 100, 110, 'cverb~', 100);
      } else if ( item === 'comb') {
        newObject = subpatcher.newdefault(10 + i * 100, 110, 'comb~', 100);
      } else if ( item === 'lpg') {
        newObject = lpg.call(this, 10 + i * 100, 110, subpatcher, id);
      }

      if (lastObject && newObject) {
        subpatcher.connect(lastObject, 0, newObject, 0);
      } else {
        subpatcher.connect(amplitude, 0, newObject, 0);
      }
      lastObject = newObject;
    });

    subpatcher.connect(lastObject, 0, outlet, 0);
  } else {
    subpatcher.connect(amplitude, 0, outlet, 0);
  }

  subpatcher.connect(inlet, 0, amplitude, 0);
  subscribeToChange('volume', amplitude, 'float', id);

  // hide new subpatch window
  subpatcher.wind.visible = false;

  return patchObj;
}

exports.generate = {
  voice: voice,
  expertSleepersInterface: expertSleepersInterface,
  delay: delay,
  stereoPan: stereoPan,
  voiceDub: voiceDub,
  modulator: modulator,
  baseModulator: baseModulator,
  soundSource: soundSource,
  adsr: adsr,
  metronome: metronome,
  voiceMetronome: voiceMetronome,
  noteInDetector: noteInDetector,
  postChain: postChain,
  stereoOutput: stereoOutput,
  cvOutput: cvOutput,
  glissando: glissando

}
