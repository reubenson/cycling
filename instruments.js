var instruments = {
  // FM Oscillator
  fmOscillator: function(p, id) {
    var inlet = p.newdefault(10, 10, 'inlet'),
      fmInlet = p.newdefault(60, 10, 'inlet'),
      outlet = p.newdefault(10, 310, 'outlet'),
      carrierInput = p.newdefault(10, 210, '+~'),
      carrier = p.newdefault(10, 260, 'cycle~'),
      modulatorMultiplier = p.newdefault(110, 10, '*~', 1.0),
      modulator = p.newdefault(160, 60, 'cycle~'),
      modulatorTotal = p.newdefault(160, 110, '*~'),
      modulationX = p.newdefault(160, 160, '*~'),
      modulationIndex = p.newdefault(160, 210, '*~', 0.0),
      powExponent = p.newdefault(220, 210, 'sig~', 1),
      pow = p.newdefault(160, 260, 'pow~');

      // wiring modulator
      p.connect(inlet, 0, modulatorMultiplier, 0);
      p.connect(modulatorMultiplier, 0, modulator, 0);
      p.connect(modulator, 0, modulatorTotal, 0);

      p.connect(fmInlet, 0, modulatorTotal, 1);
      p.connect(modulatorTotal, 0, modulationX, 0);
      p.connect(inlet, 0, modulationX, 1);
      p.connect(modulationX, 0, modulationIndex, 0);
      p.connect(modulationIndex, 0, pow, 1);
      p.connect(powExponent, 0, pow, 0);
      p.connect(pow, 0, carrierInput, 1);


      // wiring carrier
      p.connect(inlet, 0, carrierInput, 0);
      p.connect(carrierInput, 0, carrier, 0);
      p.connect(carrier, 0, outlet, 0);

      subscribeToChange('fmIndex', modulationIndex, 'float', id);
      subscribeToChange('fmRatio', modulatorMultiplier, 'float', id);
      // should instead apply feedback to linear FM
      // subscribeToChange('fmPower', powExponent, 'float', id);

      // hide subpatch window
      // p.wind.visible = false;
  },

  // interp
  // TODO: pulse width is pretty weak. might want to re-implement
  interp: function(p, id) {
    var inlet = p.newdefault(10, 10, 'inlet'),
      inlet2 = p.newdefault(60, 10, 'inlet'),
      mix = p.newdefault(110, 10, 'float', 0),
      triAmt = p.newdefault(10, 60, 'expr', '0.8-0.8*pow($f1-0,2)'),
      rectAmt = p.newdefault(120, 60, 'expr', '0.8-0.8*pow($f1-0.5,2)'),
      sawAmt = p.newdefault(230, 60, 'expr', '0.8-0.8*pow($f1-1,2)'),
      triSig = p.newdefault(10, 110, 'sig~'),
      rectSig = p.newdefault(120, 110, 'sig~'),
      sawSig = p.newdefault(230, 110, 'sig~'),
      triAmp = p.newdefault(10, 210, '*~'),
      rectAmp = p.newdefault(120, 210, '*~'),
      sawAmp = p.newdefault(230, 210, '*~'),
      tri = p.newdefault(10, 160, 'tri~'),
      rect = p.newdefault(120, 160, 'rect~'),
      saw = p.newdefault(230, 160, 'saw~'),
      // pulseWidth = p.newdefault(120, 60, 'number', 0.5),
      outlet = p.newdefault(10, 310, 'outlet');


    p.connect(inlet, 0, tri, 0);
    p.connect(inlet, 0, rect, 0);
    p.connect(inlet, 0, saw, 0);
    p.connect(tri, 0, triAmp, 0);
    p.connect(rect, 0, rectAmp, 0);
    p.connect(saw, 0, sawAmp, 0);
    p.connect(mix, 0, triAmt, 0);
    p.connect(mix, 0, rectAmt, 0);
    p.connect(mix, 0, sawAmt, 0);
    p.connect(triAmt, 0, triSig, 0);
    p.connect(rectAmt, 0, rectSig, 0);
    p.connect(sawAmt, 0, sawSig, 0);
    p.connect(triAmt, 0, triAmp, 1);
    p.connect(rectAmt, 0, rectAmp, 1);
    p.connect(sawAmt, 0, sawAmp, 1);
    p.connect(triAmp, 0, outlet, 0);
    p.connect(rectAmp, 0, outlet, 0);
    p.connect(sawAmp, 0, outlet, 0);

    mix.float(0.5);
    subscribeToChange('interpMix', mix, 'float', id);

    // hide subpatch window
    p.wind.visible = false;
  },

  // media
  media: function(p, id) {
    var inlet = p.newdefault(10, 10, 'inlet'),
      inlet2 = p.newdefault(60, 10, 'inlet'),
      outlet = p.newdefault(10, 310, 'outlet'),
      pitchRatio = p.newdefault(10, 60, '/~', this.baseFrequency),
      sfplay = p.newdefault(10, 110, 'sfplay~'),
      file = this.voiceParams[id].file,
      folder = p.newdefault(300, 300, 'folder', this.voiceParams[id].dir);

    folder.bang();
    p.connect(inlet, 0, pitchRatio, 0);
    p.connect(pitchRatio, 0, sfplay, 1);
    p.connect(sfplay, 0, outlet, 0);

    sfplay.open(file);
    sfplay.slurtime(5.0);

    // sfplay.loop(1); // temp

    var speedMode = false;
    if (true) {
      subscribeToChange('pitchRatio', sfplay, 'speed', id);
    } else {
      sfplay.timestretch(1);
      sfplay.formantcorrection(1);
      // sfplay.mode('extremestretch');
      sfplay.formant(1);
      // sfplay.quality('best');
      subscribeToChange('pitchShift', sfplay, 'pitchshift', id);
    }

    subscribeToChange('voiceTrigger', sfplay, 'message', id);
    subscribeToChange('mediaFile', sfplay, 'open', id);

    // hide subpatch window
    p.wind.visible = false;
  },

  // mediaLoop
  mediaLoop: function(p, id) {
    var numDivisions = 16,
      inlet = p.newdefault(10, 10, 'inlet'),
      inlet2 = p.newdefault(60, 10, 'inlet'),
      outlet = p.newdefault(10, 310, 'outlet'),
      file = this.voiceParams[id].file,
      // buffer = p.newdefault(210, 110, 'buffer~', 'waveform', file, -1),
      phasor = p.newdefault(10, 60, 'phasor~'),
      // sampleDuration = p.newdefault(110, 310, '*~'),
      // play = p.newdefault(210, 160, 'play~', 'waveform'),
      folder = p.newdefault(300, 300, 'folder', this.voiceParams[id].dir);

    _.times(numDivisions, function(i) {
      var buffer = p.newdefault(210, 10, 'buffer~', 'waveform-'+i, file, -1),
        play = p.newdefault(10, 160, 'play~', 'waveform-'+i),
        sampleDuration = p.newdefault(110, 310, '*~'),
        offset = 10;
        // length = buffer.getattr('size') / numDivisions,
        length = 1 * (i+1);
        start = offset + length * i,
        end = offset + (i + 1) * length;

      sampleDuration.float(length);
      buffer.crop(start, end);
      play.loop(1);

      p.connect(phasor, 0, sampleDuration, 0);
      p.connect(sampleDuration, 0, play, 0);
      p.connect(play, 0, outlet, 0);
      // subscribeToChange('mediaFile', buffer, 'read', id);
      subscribeToChange('mediaLoopLength', sampleDuration, 'int', id);
    });

    folder.bang();
    // p.connect(phasor, 0, sampleDuration, 0);
    p.connect(inlet, 0, phasor, 0);


    // subscribeToChange('voiceTrigger', sfplay, 'message', id);

    // hide subpatch window
    p.wind.visible = false;
  },

  // FM Bell
  fmBell: function(p, id) {
    var inlet = p.newdefault(10, 10, 'inlet'),
      fmInlet = p.newdefault(60, 10, 'inlet'),
      outlet = p.newdefault(10, 410, 'outlet'),
      carrierInput = p.newdefault(10, 310, '+~'),
      carrier = p.newdefault(10, 350, 'cycle~'),
      amplitude = p.newdefault(10, 380, '*~', 0.8),
      modulatorMultiplier = p.newdefault(110, 60, '*~', 1.0),
      modulator = p.newdefault(110, 110, 'cycle~'),
      modulatorTotal = p.newdefault(110, 160, '*~'),
      modulationX = p.newdefault(110, 210, '*~'),
      modulationIndex = p.newdefault(110, 260, '*~', 0.0);

    // wiring modulator
    p.connect(inlet, 0, modulatorMultiplier, 0);
    p.connect(modulatorMultiplier, 0, modulator, 0);
    p.connect(modulator, 0, modulatorTotal, 0);

    p.connect(fmInlet, 0, modulatorTotal, 1);
    p.connect(modulatorTotal, 0, modulationX, 0);
    p.connect(inlet, 0, modulationX, 1);
    p.connect(modulationX, 0, modulationIndex, 0);
    p.connect(modulationIndex, 0, carrierInput, 1);

    // wiring carrier
    p.connect(inlet, 0, carrierInput, 0);
    p.connect(carrierInput, 0, carrier, 0);
    p.connect(carrier, 0, amplitude, 0);
    p.connect(amplitude, 0, outlet, 0);

    subscribeToChange('fmIndex', modulationIndex, 'float', id);
    subscribeToChange('fmRatio', modulatorMultiplier, 'float', id);

    // voice two (tine)
    var carrierInput = p.newdefault(300, 260, '+~'),
      carrier = p.newdefault(300, 310, 'cycle~'),
      modulatorMultiplier = p.newdefault(300, 10, '*~', 8),
      modulator = p.newdefault(300, 60, 'cycle~'),
      modulatorTotal = p.newdefault(300, 110, '*~'),
      modulationX = p.newdefault(300, 160, '*~'),
      modulationIndex = p.newdefault(300, 210, '*~', 20),
      edge = p.newdefault(500, 10, 'edge~'),
      click = p.newdefault(500, 60, 'click~'),
      envelope = p.newdefault(500, 110, 'rampsmooth~', 0, 750),
      vca = p.newdefault(300, 360, '*~'),
      amplitude = p.newdefault(300, 410, '*~', 0.1);

    // wiring modulator
    p.connect(inlet, 0, modulatorMultiplier, 0);
    p.connect(modulatorMultiplier, 0, modulator, 0);
    p.connect(modulator, 0, modulatorTotal, 0);

    p.connect(fmInlet, 0, edge, 0);
    p.connect(edge, 0, click, 0);
    p.connect(click, 0, envelope, 0);
    p.connect(envelope, 0, modulatorTotal, 1);
    p.connect(modulatorTotal, 0, modulationX, 0);
    p.connect(inlet, 0, modulationX, 1);
    p.connect(modulationX, 0, modulationIndex, 0);
    p.connect(modulationIndex, 0, carrierInput, 1);

    // wiring carrier
    p.connect(inlet, 0, carrierInput, 0);
    p.connect(carrierInput, 0, carrier, 0);
    p.connect(carrier, 0, vca, 0);
    p.connect(envelope, 0, vca, 1);
    p.connect(vca, 0, amplitude, 0);
    p.connect(amplitude, 0, outlet, 0);

    // hide subpatch window
    p.wind.visible = false;
  },

  // click instrument
  click: function (p, id) {
    var inlet1 = p.newdefault(10, 10, 'inlet'),
      inlet2 = p.newdefault(60, 10, 'inlet'),
      inlet3 = p.newdefault(110, 10, 'inlet'),
      outlet = p.newdefault(10, 410, 'outlet'),
      edge = p.newdefault(10, 60, 'edge~'),
      click = p.newdefault(10, 110, 'click~'),
      slide = p.newdefault(10, 160, 'slide~', 0, 50),
      sourceMix = p.newdefault(500, 10, 'float', 1.0),
      sourceMixSig = p.newdefault(600, 10, 'sig~'),
      cycleAmt = p.newdefault(500, 60, '*~'),
      oneMinus = p.newdefault(500, 160, 'sig~', 1),
      noiseMixSig = p.newdefault(500, 210, '-~'),
      noiseAmt = p.newdefault(500, 110, '*~'),
      cycleModFactor = p.newdefault(400, 300, '*~', 32),
      cycleMod = p.newdefault(400, 400, '*~'),
      cycle = p.newdefault(310, 160, 'cycle~'),
      noise = p.newdefault(120, 160, 'noise~'),
      sourceVca = p.newdefault(10, 210, '*~'),
      baseFrequency = p.newdefault(230, 10, 'number~'),
      pitch = p.newdefault(230, 60, '/~'),
      one = p.newdefault(230, 110, 'sig~', 1000 / 32), // factor of 32 because register needs to be high
      delayTime = p.newdefault(230, 160, '/~'),
      tapin = p.newdefault(10, 260, 'tapin~', 1000),
      tapout = p.newdefault(10, 310, 'tapout~'),
      feedback = p.newdefault(120, 310, '*~', 0.9999),
      filterFrequency = p.newdefault(120, 210, '*~', 2), // make this variable
      filter = p.newdefault(120, 260, 'onepole~');

    baseFrequency.float(this.baseFrequency);

    // p.connect(inlet3, 0, edge, 0);
    p.connect(inlet3, 0, click, 0);
    p.connect(click, 0, slide, 0);
    p.connect(slide, 0, sourceVca, 0);
    // p.connect(noise, 0, sourceVca, 1);
    p.connect(inlet1, 0, cycle, 0);
    p.connect(sourceVca, 0, tapin, 0);
    p.connect(tapin, 0, tapout, 0);
    p.connect(tapout, 0, outlet, 0);

    p.connect(inlet1, 0, pitch, 0);
    p.connect(baseFrequency, 0, pitch, 1);
    p.connect(one, 0, delayTime, 0);
    p.connect(pitch, 0, delayTime, 1);
    p.connect(delayTime, 0, tapout, 0);

    // soundsource mix
    p.connect(inlet1, 0, cycleModFactor, 0);
    p.connect(cycleModFactor, 0, cycleMod, 0);
    p.connect(slide, 0, cycleMod, 1);
    p.connect(cycleMod, 0, cycle, 0);
    p.connect(cycle, 0, cycleAmt, 0);
    p.connect(sourceMix, 0, sourceMixSig, 0);
    p.connect(sourceMixSig, 0, cycleAmt, 1);
    p.connect(cycleAmt, 0, sourceVca, 1);

    p.connect(noise, 0, noiseAmt, 0);
    p.connect(oneMinus, 0, noiseMixSig, 0);
    p.connect(sourceMix, 0, noiseMixSig, 1);
    p.connect(noiseMixSig, 0, noiseAmt, 1);
    p.connect(noiseAmt, 0, sourceVca, 1);

    // modulator section
    p.connect(inlet1, 0, filterFrequency, 0);
    p.connect(filterFrequency, 0, filter, 1);
    p.connect(tapout, 0, filter, 0);
    p.connect(filter, 0, feedback, 0);
    p.connect(feedback, 0, tapin, 0);

    subscribeToChange('clickFilter', filterFrequency, 'float', id);
    subscribeToChange('clickFeedback', feedback, 'float', id);
    subscribeToChange('clickMix', sourceMix, 'float', id);

    // hide subpatch window
    // p.wind.visible = false;
  },

  // harmonic drone
  // TODO: let sequence events alter the weights of frequencies?
  // make less garbage
  harmonicDrone: function (p, id) {
    var baseFrequency = this.baseFrequency,
      numOscillators = 18,
      arr = [],
      frequencySmoothingSamples = 1024,
      amplitudeSmoothingSamples = 1024;


    function normalDistribution(x, mean, deviation) {
      var exp = -Math.pow(x - mean, 2) / ( 2 * Math.pow(deviation, 2)),
        base = Math.exp(1) / ( deviation * Math.sqrt(2 * Math.PI) );

      return Math.pow(base, exp);
    }

    // var patchObj = patcher.newdefault(x, y, 'patcher', 'harmonic-drone'),
    //   subpatcher = patchObj.subpatcher(),
    var oscbank = p.newdefault(10, 60, 'ioscbank~', numOscillators, frequencySmoothingSamples, amplitudeSmoothingSamples),
      // inlet = p.newdefault(10, 10, 'inlet'),
      outlet = p.newdefault(10, 360, 'outlet');


    _.times(numOscillators, function(i) {
      var amp = 0.5 * normalDistribution(i, 4, 1),
        frequency = baseFrequency * (i);

      if (i < 2) {
        frequency = baseFrequency * Math.pow(2, -2 + i);
      }
      arr.push(frequency);
      arr.push(amp);
    });

    oscbank.set(arr);

    // hide subpatch window
    p.wind.visible = false;

    p.connect(oscbank, 0, outlet, 0);
  },

  // noise
  noise: function(p, id) {
    var inlet = p.newdefault(10, 10, 'inlet'),
      inlet2 = p.newdefault(60, 10, 'inlet'),
      outlet = p.newdefault(10, 310, 'outlet'),
      pink = p.newdefault(10, 160, 'noise~'),
      q = p.newdefault(120, 110, 'float', 10),
      numHarmonics = 16;

    _.times(numHarmonics, function(i) {
      var index = p.newdefault(10, 60, '*~', i + 1),
        fMultiplier = p.newdefault(10, 110, '*~', 2),
        reson = p.newdefault(10, 210, 'reson~', 2, 1, 100);

      p.connect(inlet, 0, index, 0);
      p.connect(index, 0, fMultiplier, 0);
      p.connect(pink, 0, reson, 0);
      p.connect(fMultiplier, 0, reson, 2);
      p.connect(q, 0, reson, 3);
      p.connect(reson, 0, outlet, 0);

      subscribeToChange('noiseHarmonics', fMultiplier, 'float', id);
      subscribeToChange('noiseQ', q, 'float', id);
    });

    // hide subpatch window
    p.wind.visible = false;
  },

  // recursive oscillator with frequency modulation
  recursiveFM: function(p, id) {
    var recursionLevels = 4,
      inlet = p.newdefault(10, 10, 'inlet'),
      inlet2 = p.newdefault(60, 10, 'inlet'),
      instrument = generator.call(this, 10, 60, p, 0),
      outlet = p.newdefault(10, 310, 'outlet');

    function generator(x, y, p, i) {
      var patchObj = p.newdefault(x, y, 'patcher', 'generator-' + i),
        subpatcher = patchObj.subpatcher(),
        inlet = subpatcher.newdefault(10, 10, 'inlet'),
        inlet2 = subpatcher.newdefault(60, 10, 'inlet'),
        cycleInput = subpatcher.newdefault(10, 260, '+~'),
        cycle = subpatcher.newdefault(10, 310, 'cycle~'),
        modulatorInterval = subpatcher.newdefault(120, 60, '*~', 1),
        modulator,
        modulation = subpatcher.newdefault(120, 160, '*~'),
        modulationAmount = subpatcher.newdefault(120, 210, '*~', 1),
        output = subpatcher.newdefault(10, 360, 'outlet');

      if (i < recursionLevels) {
        modulator = generator.call(this, 120, 110, subpatcher, i+1);
      } else {
        modulator = subpatcher.newdefault(120, 110, 'cycle~');
      }

      subpatcher.connect(inlet, 0, cycleInput, 0);
      subpatcher.connect(modulationAmount, 0, cycleInput, 0);
      subpatcher.connect(cycleInput, 0, cycle, 0);
      subpatcher.connect(inlet, 0, modulatorInterval, 0);
      subpatcher.connect(modulatorInterval, 0, modulator, 0);
      subpatcher.connect(inlet, 0, modulation, 0);
      subpatcher.connect(modulator, 0, modulation, 1);
      subpatcher.connect(modulation, 0, modulationAmount, 0);
      subpatcher.connect(modulationAmount, 0, cycleInput, 0);
      subpatcher.connect(cycle, 0, output, 0);

      subscribeToChange('recursiveFMAmount', modulationAmount, 'float', id);
      subscribeToChange('recursiveFMInterval', modulatorInterval, 'float', id);
      p.wind.visible = false;
      return patchObj;
    }

    p.connect(inlet, 0, instrument, 0);
    p.connect(instrument, 0, outlet, 0);


    // hide subpatch window
    p.wind.visible = false;
  },

  // recursive oscillator with amplitude modulation
  recursiveAM: function(p, id) {
    var recursionLevels = 16,
      inlet = p.newdefault(10, 10, 'inlet'),
      inlet2 = p.newdefault(60, 10, 'inlet'),
      instrument = generator.call(this, 10, 60, p, 0),
      outlet = p.newdefault(10, 310, 'outlet');

    function generator(x, y, p, i) {
      var patchObj = p.newdefault(x, y, 'patcher', 'generator-' + i),
        subpatcher = patchObj.subpatcher(),
        inlet = subpatcher.newdefault(10, 10, 'inlet'),
        inlet2 = subpatcher.newdefault(60, 10, 'inlet'),
        cycle = subpatcher.newdefault(10, 110, 'cycle~'),
        modulatorInterval = subpatcher.newdefault(120, 60, '*~', 1),
        modulator,
        one = subpatcher.newdefault(230, 10, 'sig~', 1),
        modulationAmount = subpatcher.newdefault(340, 10, 'float', 0.1),
        modulationAmountSig = subpatcher.newdefault(340, 110, 'sig~'),
        modulationAmountInv = subpatcher.newdefault(210, 110, '-~'),
        cycleAmp = subpatcher.newdefault(10, 260, '*~'),
        modulationAmp = subpatcher.newdefault(120, 260, '*~'),
        modulatedCycle = subpatcher.newdefault(60, 160, '*~'),
        output = subpatcher.newdefault(10, 310, 'outlet');

      if (i < recursionLevels) {
        modulator = generator.call(this, 120, 110, subpatcher, i+1);
      } else {
        modulator = subpatcher.newdefault(120, 110, 'cycle~');
      }

      subpatcher.connect(inlet, 0, cycle, 0);
      subpatcher.connect(inlet, 0, modulatorInterval, 0);
      subpatcher.connect(modulatorInterval, 0, modulator, 0);
      subpatcher.connect(cycle, 0, cycleAmp, 0);
      subpatcher.connect(cycle, 0, modulatedCycle, 0);
      subpatcher.connect(modulator, 0, modulatedCycle, 1);
      subpatcher.connect(modulatedCycle, 0, modulationAmp, 0);
      subpatcher.connect(one, 0, modulationAmountInv, 0);
      subpatcher.connect(modulationAmount, 0, modulationAmountSig, 0);
      subpatcher.connect(modulationAmountSig, 0, modulationAmountInv, 1);
      subpatcher.connect(modulationAmountInv, 0, cycleAmp, 1);
      subpatcher.connect(modulationAmountSig, 0, modulationAmp, 1);
      subpatcher.connect(cycleAmp, 0, output, 0);
      subpatcher.connect(modulationAmp, 0, output, 0);

      subscribeToChange('recursiveAMAmount', modulationAmount, 'float', id);
      subscribeToChange('recursiveAMInterval', modulatorInterval, 'float', id);
      p.wind.visible = false;
      return patchObj;
    }

    p.connect(inlet, 0, instrument, 0);
    p.connect(instrument, 0, outlet, 0);


    // hide subpatch window
    p.wind.visible = false;
  },

  // plonk
  plonk: function(p, id) {
    var inlet = p.newdefault(10, 10, 'inlet'),
      inlet2 = p.newdefault(60, 10, 'inlet'),
      outlet = p.newdefault(10, 310, 'outlet'),
      edge = p.newdefault(110, 60, 'edge~'),
      click = p.newdefault(10, 60, 'click~'),
      slide = p.newdefault(10, 110, 'slide~', 0, 500);

    p.connect(inlet2, 0, edge, 0);
    p.connect(edge, 0, click, 0);
    p.connect(click, 0, slide, 0);
    p.connect(slide, 0, outlet, 0);

    // hide subpatch window
    p.wind.visible = false;
  },

  // risset / shepard chord??
  risset: function (p, id) {
    var octaves = [-4, -3, -2, -1, 0, 1,-3,  2, 3, 4],
      inlet = p.newdefault(10, 10, 'inlet'),
      inlet2 = p.newdefault(60, 10, 'inlet'),
      speed = p.newdefault(110, 10, 'float', 2),
      speedSig =  p.newdefault(210, 10, 'sig~'),
      outlet = p.newdefault(10, 310, 'outlet');

    _.forEach(octaves, function(octave, i){
      var frequencyInput = p.newdefault(10, 60, '*~', Math.pow(2, octave)),
        ampCycle = p.newdefault(120, 110, 'cycle~', 0, i * 0.25 / octaves.length),
        cycle = p.newdefault(10, 160, 'cycle~'),
        amplitude = p.newdefault(10, 210, '*~'),
        attenuator = p.newdefault(10, 260, '*~', 1 / octaves.length);

      p.connect(inlet, 0, frequencyInput, 0);
      p.connect(frequencyInput, 0, cycle, 0);
      p.connect(cycle, 0, amplitude, 0);
      p.connect(speed, 0, speedSig, 0);
      p.connect(speedSig, 0, ampCycle, 0);
      p.connect(ampCycle, 0, amplitude, 1);
      p.connect(amplitude, 0, attenuator, 0);
      p.connect(attenuator, 0, outlet, 0);
    });

    subscribeToChange('rissetSpeed', speed, 'float', id);
    // wire up param2 to some function that modifies shape of ampCycle
    // hide subpatch window
    p.wind.visible = false;
  }
}

exports.instruments = {
  generateInstrument: function(x, y, name, patcher, id){
    var patchObj = patcher.newdefault(x, y, 'patcher', name),
      subpatcher = patchObj.subpatcher(),
      instrument = instruments[name].call(this, subpatcher, id);

    return patchObj;
  }
};
