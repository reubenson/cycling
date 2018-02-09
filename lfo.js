function LFO (amplitude, frequency, phase) {
  var s = Date.now() / 1000.;

  phase = phase || 0;

  return amplitude * Math.sin( 2 * Math.PI * (s / frequency + phase ));
}

LFO.prototype = {

}

exports.lfo = LFO;
