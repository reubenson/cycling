var basePath = '~/code/cycling/media',
  library = '/TR808',
  chords = require('chords').chords;

var presets = {
  0: {
    // bypassExpertSleepers: true,
    clock: 2000,
    baseFrequency: 55,
    // baseFrequency: 1,  set to 1 when in expert sleepers mode?
    rule: 'L',
    ET: false,
    quantize: true,
    chordIndex: 4,
    sequenceType: 'bjorklund',
    adsr: [1, 5, 1.0, 10],

    repetitions: 1,
    twill: [1],

    // PITCH MODES
    shiftRegisterMode: false,
    // ringChanges: false,
    singleVoice: false,

    // TEMPORAL MODES
    offsetVoiceMode: false,
    scale: {
      tuning: 'P',
    	scaleChoice: '-18',
    	numberOfDivisions: 12
    },

    controller: {
      modulator1: 2.35,
      delayLength: 300,
      delayFeedback: 0.4
    },

    // soundSource: fmOscillator, media, or expert-sleepers
    voiceParams: [
      {
        soundSource: 'plonk',
        sequence: {
          length: 8,
          hits: 4
        },
        chord: [1],
        dub: [0], // dub needs to be re-written for plonk
        adsr: [0, 10, 0, 0], // plonk
        register: 1,
        qmmf: true,
        post: [],
        controller: {
          volume: 0.0
        }
      },
      {
        soundSource: 'interp',
        sequence: {
          length: 8,
          hits: 1
        },
        chord: [1, 0.99, 1.01, 2],
        dub: [0],
        adsr: [0, 100, 1.0, 1800],
        register: 2,
        qmmf: true,
        post: ['cverb'],
        controller: {
          volume: 0.5
        }
      },
      {
        soundSource: 'fmOscillator',
        sequence: {
          length: 8,
          hits: 1
        },
        // chord: [0.25, 0.5, 0.5, 1, 1, 3/12, 7/12],
        chord: [1, 0.99, 1.01, 2],
        adsr: [0, 100, 1.0, 1800],
        register: 2,
        dub: [0, 4],
        qmmf: true,
        post: ['cverb', 'cverb'],
        controller: {
          volume: 0.5,
          fmIndex: 10,
          fmRatio: 8
          // fmPower: 1.5
        }
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
        adsr: [0, 10000, 1, 0],
        dub: [1],
        chord: [1, 2],
        subdivision: 2,
        // dub: [5, 5.5, 6.0],
        register: 1,
        qmmf: true,
        post: ['cverb'],
        controller: {
          volume: 0.8
        }
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
        adsr: [50, 1000, 1.0, 5000],
        glissando: 1000,
        // chord: [0.25, 0.5, 1, 3/12, 7/12],
        dub: [0],
        // subdivision: 8,
        register: 0,
        qmmf: false,
        post: ['cverb'],
        controller: {
          volume: 1.0,
          // fmIndex: 2,
          // fmRatio: 4
        }
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
        post: ['cverb'],
        controller: {
          volume: 0.5
        }
      },
      {
        soundSource: 'fmBell',
        sequence: {
          length: 16,
          hits: 16
        },
        chord: [1],
        // ringChanges: true,
        // chord: [0.25, 0.5, 0.5, 1, 1, 3/12, 7/12, 2, 3, 4, 5], // organ
        adsr: [0, 5, 1.0, 250],
        dub: [0],
        // dub: [0, 3, 4],
        register: 2,
        qmmf: false,
        post: ['cverb'],
        controller: {
          volume: 0.3,
          delayLength: 250,
          delayFeedback: 0.8
        }
      },
      {
        soundSource: 'click',
        sequence: {
          length: 32,
          hits: 20
        },
        triggerRule: 'random',
        // ringChanges: true,
        // subdivision: 4,
        adsr: [0, 100, 1, 0],
        dub: [0],
        register: 3,
        qmmf: false,
        post: [],
        controller: {
          volume: 0.3,
          clickFeedback: 0.0,
          clickFilter: 64,
          clickMix: 1
        }
      },
      {
        soundSource: 'media',
        file: basePath + library + '/HT/HT75.WAV',
        dir: basePath + library,
        sequenceType: 'bjorklund-inverse',
        sequence: {
          length: 16,
          hits: 14
        },
        // subdivision: 4,
        adsr: [0, 100, 1, 0],
        dub: [0],
        register: 3,
        qmmf: false,
        post: [],
        controller: {
          volume: 0.1
        }
      }
    ]
  },

  1: {
    // bypassExpertSleepers: true,
    clock: 2000,
    baseFrequency: 55,
    // baseFrequency: 1,  set to 1 when in expert sleepers mode?
    rule: 'L',
    ET: false,
    quantize: true,
    chordIndex: 4,
    sequenceType: 'bjorklund',
    adsr: [1, 5, 1.0, 10],

    repetitions: 1,
    twill: [1],

    // PITCH MODES
    shiftRegisterMode: false,
    // ringChanges: false,
    singleVoice: false,

    // TEMPORAL MODES
    offsetVoiceMode: false,
    scale: {
      tuning: 'P',
    	scaleChoice: '-18',
    	numberOfDivisions: 12
    },

    controller: {
      modulator1: 2.35,
      delayLength: 300,
      delayFeedback: 0.0
    },

    // soundSource: fmOscillator, media, or expert-sleepers
    voiceParams: [
      {
        soundSource: 'plonk',
        sequence: {
          length: 8,
          hits: 4
        },
        chord: [1],
        dub: [0], // dub needs to be re-written for plonk
        adsr: [0, 10, 0, 0], // plonk
        register: 1,
        qmmf: true,
        post: [],
        controller: {
          volume: 0.0
        }
      },
      {
        soundSource: 'mediaLoop',
        sequence: {
          length: 8,
          hits: 8
        },
        file: basePath + library + '/CY/CY7575.WAV',
        dir: basePath + library,
        // chord: [1, 0.99, 1.01, 2],
        dub: [0],
        adsr: [0, 100, 1.0, 1800],
        register: 2,
        qmmf: true,
        post: ['lpg'],
        controller: {
          volume: 1
        }
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
        adsr: [50, 1000, 1.0, 5000],
        glissando: 1000,
        // chord: [0.25, 0.5, 1, 3/12, 7/12],
        dub: [0],
        // subdivision: 8,
        register: 0,
        qmmf: true,
        post: [],
        controller: {
          volume: 1.0,
          // fmIndex: 2,
          // fmRatio: 4
        }
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
        qmmf: true,
        post: [],
        controller: {
          volume: 1
        }
      },
      {
        soundSource: 'click',
        sequence: {
          length: 32,
          hits: 20
        },
        triggerRule: 'random',
        // ringChanges: true,
        // subdivision: 4,
        adsr: [0, 100, 1, 0],
        dub: [0],
        register: 3,
        qmmf: false,
        post: [],
        controller: {
          volume: 0.3,
          clickFeedback: 0.0,
          clickFilter: 64,
          clickMix: 1
        }
      },
      {
        soundSource: 'media',
        file: basePath + library + '/HT/HT75.WAV',
        dir: basePath + library,
        sequenceType: 'bjorklund-inverse',
        sequence: {
          length: 16,
          hits: 14
        },
        // subdivision: 4,
        adsr: [0, 100, 1, 0],
        dub: [0],
        register: 3,
        qmmf: false,
        post: [],
        controller: {
          volume: 0.1
        }
      }
    ]
  }
}

exports.presets = presets;
