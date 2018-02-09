/*
  Usage of expert sleepers with another interface requires creating an aggregate device.
  In this case, a 'Synth' device has been generated, consisting of:
  an Expert Sleepers ES-8 (12 in / 16 out)
  and an Apollo Twin (14 in / 10 out)
*/

var generate = require('subpatches').generate;

var outputCVChannelCounter = 1;
var outputAudioChannelCounter = 5;
var inputAudioChannelCounter = 1;
var id = 0;

function expertSleepers () {

}

expertSleepers.prototype = {
  construct: function (obj) {
    var patcher = obj.patcher,
      inputFrequency = obj.inputFrequency,
      inputAudio = obj.inputAudio,
      outputCV = patcher.newdefault(500, 400, 'dac~', outputCVChannelCounter),
      outputAudio = patcher.newdefault(500, 200, 'dac~', outputAudioChannelCounter);

    // hard-coding base frequency to 120 for now
    // var expr = patcher.newdefault(10, 30, 'expr', '(log($f1 / 120)/log(2))/10.0'),
    var expr = patcher.newdefault(10, 30, 'expr', '(log($f1/120)/log(2))/10.0'),
      snapshot = patcher.newdefault(50, 30, 'snapshot~', 10),
      sig = patcher.newdefault(100, 30, 'sig~');

    patcher.connect(inputFrequency, 0, snapshot, 0);
    patcher.connect(snapshot, 0, expr, 0);
    patcher.connect(expr, 0 , sig, 0);

    patcher.connect(sig, 0, outputCV, 0);

    // generate delay line
    var delay = generate.delay(patcher, id);
    patcher.connect(inputAudio, 0, delay, 0);

    // pass delay line to ES input
    patcher.connect(delay, 0, outputAudio, 0);

    // pass audio out of Expert Sleepers
    var adc = patcher.newdefault(500, 600, 'adc~', inputAudioChannelCounter);

    // feed ES output back into delay
    patcher.connect(adc, 0, delay, 1);

    // auto-increment counters
    outputCVChannelCounter++;
    outputAudioChannelCounter++;
    inputAudioChannelCounter++;
    id++;

    return adc;
  }
}

exports.expertSleepers = expertSleepers;
