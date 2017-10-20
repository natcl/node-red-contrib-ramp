module.exports = function(RED) {
  function RampNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    node.source = null;
    node.target = null;
    node.interval = 25;
    node.timer = null;

    node.on('input', function(msg) {
      node.count = 0;
      var source;
      var target;

      if (msg.payload.hasOwnProperty('source') && msg.payload.hasOwnProperty('target')) {
          source = msg.payload.source;
          target = msg.payload.target;
          node.target = target;
      }

      // If only target is present
      if (!msg.payload.hasOwnProperty('source') && msg.payload.hasOwnProperty('target')) {
          if (!node.target) {
              node.warn('First set source and target');
              return;
          }
          source = node.target;
          target = msg.payload.target;
          node.target = target;
      }

      node.time = msg.payload.time;

      var values = valuesToInterpolate(source, target, node.interval, node.time);
      var realInterval;
      if (Array.isArray(values[0])) {
          realInterval = (node.time / values[0].length);
      } else {
          realInterval = (node.time / values.length);
      }

      node.timer = setInterval(outputSteps, realInterval, values, msg);
    });

    function outputSteps(values, msg){
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
                node.count = 0;
                return;
        }
        node.count++;
    }

    function finish(timer){
        clearInterval(timer);
        count = 0;
        console.log('And we\'re done');

    }

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
