module.exports = function(RED) {
  function RampNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    node.target = "";
    node.interval = config.samplingrate;
    node.timer = null;

    node.on('input', function(msg) {
      if (node.timer) {
        return;
      }
      node.count = 0;
      node.time = config.time || msg.payload.time;
      // If only target in payload
      if (!msg.payload.hasOwnProperty('source') && msg.payload.hasOwnProperty('target')) {
        node.source = config.source || node.target || msg.payload.target;
      } else {
        node.source = config.source || msg.payload.source;
      }
      node.target = config.target || msg.payload.target;

      if (!Array.isArray(node.source) && !Array.isArray(node.target)) {
          node.source = JSON.parse(node.source);
          node.target = JSON.parse(node.target);
      }


      var values = valuesToInterpolate(node.source, node.target, node.interval, node.time);
      var realInterval;
      if (Array.isArray(values[0])) {
          realInterval = (node.time / values[0].length);
      } else {
          realInterval = (node.time / values.length);
      }

      node.timer = setInterval(outputSteps, realInterval, values);

      function outputSteps(values){
          var endOfArray;

          if (Array.isArray(values[0])) {
              endOfArray = values[0].length;
              var output = [];
              for (var e in values) {
                  output.push(values[e][node.count]);
              }
              msg.payload = output;
              node.send(msg);
          } else {
              endOfArray = values.length;
              msg.payload = values[node.count];
              node.send(msg);
          }
          if (node.count == endOfArray-1) {
                  clearInterval(node.timer);
                  node.timer = null;
                  node.count = 0;
                  return;
          }
          node.count++;
      }
    });

    function valuesToInterpolate(source, target, interval, time) {
        let steps = Math.floor(time/interval);

        var output = [];

        if (Array.isArray(source) && Array.isArray(target)) {
            for (var i = 0; i < source.length; i++) {
                var currentArray = [];
                let increment = (target[i]-source[i]) / steps;
                for (let v = 0 ; v <= steps ; v++) {
                    currentArray.push(source[i] + (v * increment));
                }
                output.push(currentArray);
            }

        } else {
            let increment = (target - source) / steps;
            for (let v = 0 ; v <= steps ; v++) {
                //node.warn(v);
                output.push(source + (v * increment));
            }
        }
        return output;
    }
  }
  RED.nodes.registerType("ramp", RampNode);
};
