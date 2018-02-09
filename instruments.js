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
      modulationIndex = p.newdefault(160, 210, '*~', 0.0);

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
      p.connect(carrier, 0, outlet, 0);

      subscribeToChange('fmIndex', modulationIndex, 'float', id);
      subscribeToChange('fmRatio', modulatorMultiplier, 'float', id);

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
      outlet = p.newdefault(10, 410, 'outlet'),
      edge = p.newdefault(10, 60, 'edge~'),
      click = p.newdefault(10, 110, 'click~'),
      slide = p.newdefault(10, 160, 'slide~', 0, 50),
      noise = p.newdefault(120, 160, 'noise~'),
      noiseVca = p.newdefault(10, 210, '*~'),
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

    p.connect(inlet2, 0, edge, 0);
    p.connect(edge, 0, click, 0);
    p.connect(click, 0, slide, 0);
    p.connect(slide, 0, noiseVca, 0);
    p.connect(noise, 0, noiseVca, 1);
    p.connect(noiseVca, 0, tapin, 0);
    p.connect(tapin, 0, tapout, 0);
    p.connect(tapout, 0, outlet, 0);

    p.connect(inlet1, 0, pitch, 0);
    p.connect(baseFrequency, 0, pitch, 1);
    p.connect(one, 0, delayTime, 0);
    p.connect(pitch, 0, delayTime, 1);
    p.connect(delayTime, 0, tapout, 0);

    // modulator section
    p.connect(inlet1, 0, filterFrequency, 0);
    p.connect(filterFrequency, 0, filter, 1);
    p.connect(tapout, 0, filter, 0);
    p.connect(filter, 0, feedback, 0);
    p.connect(feedback, 0, tapin, 0);

    subscribeToChange('clickFilter', filterFrequency, 'float', id);
    subscribeToChange('clickFeedback', feedback, 'float', id);

    // hide subpatch window
    p.wind.visible = false;
  },

  // harmonic drone
  // TODO: let sequence events alter the weights of frequencies?
  // make less garbage
  harmonicDrone: function (p, id) {
    var spreadFrequency = 0.05,
      baseFrequency = this.baseFrequency,
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
        frequency = baseFrequency * i;

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
  }
}

exports.instruments = {
  generateInstrument: function(x, y, name, patcher, id){
    console.log('name', name);
    var patchObj = patcher.newdefault(x, y, 'patcher', name),
      subpatcher = patchObj.subpatcher(),
      instrument = instruments[name].call(this, subpatcher, id);

    return patchObj;
  }
};
