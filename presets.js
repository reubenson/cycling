var basePath = '~/code/cycling/media',
  library = '/TR808',
  chords = require('chords').chords;

var presets = {
  0: {
    clock: 2000,
    baseFrequency: 55,
    // baseFrequency: 1,  set to 1 when in expert sleepers mode?
    rule: 'L',
    ET: false,
    quantize: true,
    chordIndex: 4,
    frequency: 0.25 * 1.5,
    sequenceType: 'bjorklund',
    adsr: [1, 5, 1.0, 10],

    repetitions: 1,
    twill: [1],

    // PITCH MODES
    shiftRegisterMode: false,
    ringChanges: false,
    singleVoice: false,

    // TEMPORAL MODES
    offsetVoiceMode: false,
    scale: {
      tuning: 'P',
    	scaleChoice: '-18',
    	numberOfDivisions: 12
    },

    // soundSource: fmOscillator, media, or expert-sleepers
    voiceParams: [
      {
        soundSource: 'plonk',
        sequence: {
          length: 8,
          hits: 8
        },
        dub: [0], // dub needs to be re-written for plonk
        adsr: [0, 10, 0, 0],
        register: 3,
        qmmf: true,
        post: []
      },
      {
        soundSource: 'fmOscillator',
        sequence: {
          length: 8,
          hits: 3
        },
        chord: [0.25, 0.5, 0.5, 1, 1, 3/12, 7/12],
        adsr: [0, 100, 1.0, 1500],
        register: 2,
        dub: [0],
        qmmf: true,
        post: ['cverb', 'cverb']
      },
      {
        soundSource: 'click',
        sequence: {
          length: 8,
          hits: 5
        },
        adsr: [0, 100, 1, 200],
        dub: [0],
        register: 5,
        qmmf: true,
        post: []
      },
      {
        soundSource: 'media',
        file: basePath + library + '/CY/CY7575.WAV',
        dir: basePath + library,
        // rule: 'R',
        sequence: {
          length: 4,
          hits: 1
        },
        adsr: [0, 1000, 1, 0],
        dub: [1],
        chord: [1, 2],
        subdivision: 2,
        // dub: [5, 5.5, 6.0],
        register: 1,
        qmmf: true,
        post: ['cverb']
      },
      {
        soundSource: 'fmOscillator',
        file: basePath + library + '/LC/LC75.WAV',
        dir: basePath + library,
        // rule: 'R',
        // triggerRule: 'LFO',
        sequenceType: 'bjorklund-inverse',
        sequence: {
          length: 8,
          hits: 1
        },
        chord: [0.25, 0.5, 0.5, 0.5, 1],
        adsr: [50, 50, 1.0, 5000],
        // chord: [0.25, 0.5, 1, 3/12, 7/12],
        dub: [0],
        // subdivision: 8,
        register: 0,
        qmmf: false,
        post: ['cverb']
      },
      {
        soundSource: 'media',
        file: basePath + library + '/BD/BD7575.WAV',
        dir: basePath + library,
        sequence: {
          length: 4,
          hits: 1
        },
        adsr: [0, 1000, 1, 0],
        chord: [0.5, 1, 3/12],
        dub: [0, 1.5, 3],
        register: 1,
        qmmf: false,
        post: ['cverb']
      },
      {
        soundSource: 'fmBell',
        sequence: {
          length: 16,
          hits: 4
        },
        chord: [1],
        // chord: [0.25, 0.5, 0.5, 1, 1, 3/12, 7/12, 2, 3, 4, 5], // organ
        adsr: [0, 5, 1.0, 250],
        dub: [0, 3, 4],
        register: 3,
        qmmf: false,
        post: ['cverb']
      },
      {
        soundSource: 'media',
        file: basePath + library + '/LT/LT75.WAV',
        dir: basePath + library,
        // sequenceType: 'bjorklund-inverse',
        sequence: {
          length: 16,
          hits: 1
        },
        dub: [0, 3, 8, 12],
        // dub: [0, 1.5, 3],
        register: 0,
        qmmf: false,
        post: []
      }
    ]
  },

  1: {
    clock: 1500,
    baseFrequency: 110,
    // baseFrequency: 1,  set to 1 when in expert sleepers mode?
    rule: 'R',
    ET: false,
    quantize: true,
    chordIndex: 4,

    frequency: 0.25 * 1.5,

    sequenceType: 'bjorklund',

    attack: 0,
    decay: 20,
    sustain: 1.0,
    release: 150,

    repetitions: 1,

    // PITCH MODES
    shiftRegisterMode: false,
    ringChanges: false,
    singleVoice: false,

    // TEMPORAL MODES
    offsetVoiceMode: false,
    scale: {
      tuning: 'P',
    	scaleChoice: '-18',
    	numberOfDivisions: 12
    },

    // soundSource: fmOscillator, media, or expert-sleepers
    voiceParams: [
      {
        soundSource: 'media',
        file: basePath + library + '/BD/BD7575.WAV',
        dir: basePath + library,
        sequence: {
          length: 8,
          hits: 5
        },
        dub: [4, 8],
        register: 2,
        qmmf: true,
        post: []
      },
      {
        soundSource: 'media',
        file: basePath + library + '/SD/SD0000.WAV',
        dir: basePath + library,
        sequence: {
          length: 8,
          hits: 5
        },
        // dub: [4, 8],
        dub: [4, 8],
        register: 2,
        qmmf: true,
        post: []
      },
      {
        soundSource: 'media',
        file: basePath + library + '/LC/LC75.WAV',
        dir: basePath + library,
        sequence: {
          length: 8,
          hits: 5
        },
        dub: [4, 8],
        register: 2,
        qmmf: true,
        post: []
      },
      {
        soundSource: 'media',
        file: basePath + library + '/CL/CL.WAV',
        dir: basePath + library,
        sequence: {
          length: 8,
          hits: 5
        },
        chord: chords[14],
        dub: [4, 8],
        register: 2,
        qmmf: true,
        post: ['phaser']
      },
      {
        soundSource: 'media',
        file: basePath + library + '/MC/MC75.WAV',
        dir: basePath + library,
        sequence: {
          length: 8,
          hits: 5
        },
        dub: [4, 8],
        register: 2,
        post: []
      },
      {
        soundSource: 'media',
        file: basePath + library + '/CH/CH.WAV',
        dir: basePath + library,
        sequence: {
          length: 8,
          hits: 5
        },
        dub: [4, 8],
        register: 2,
        post: []
      },
      {
        soundSource: 'media',
        file: basePath + library + '/CP/CP.WAV',
        dir: basePath + library,
        sequence: {
          length: 8,
          hits: 5
        },
        dub: [4, 8],
        register: 2,
        post: []
      },
      {
        soundSource: 'media',
        file: basePath + library + '/CY/CY7575.WAV',
        dir: basePath + library,
        sequence: {
          length: 8,
          hits: 5
        },
        dub: [4, 8],
        register: 2,
        post: []
      }
    ]
  }
}

exports.presets = presets;
