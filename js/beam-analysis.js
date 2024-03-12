"use strict";

/** ============================ Beam Analysis Data Type ============================ */

/**
 * Beam material specification.
 *
 * @param {String} name         Material name
 * @param {Object} properties   Material properties {EI : 0, GA : 0, ....}
 */
function Material(name, properties) {
  this.name = name;
  this.properties = properties;
}

/**
 *
 * @param {Number} primarySpan          Beam primary span length
 * @param {Number} secondarySpan        Beam secondary span length
 * @param {Material} material           Beam material object
 */
function Beam(primarySpan, secondarySpan, material) {
  this.primarySpan = primarySpan;
  this.secondarySpan = secondarySpan;
  this.material = material;
}

/** ============================ Beam Analysis Class ============================ */

function BeamAnalysis() {
  this.options = {
    condition: "simply-supported",
  };

  this.analyzer = {
    "simply-supported": new BeamAnalysis.analyzer.simplySupported(),
    "two-span-unequal": new BeamAnalysis.analyzer.twoSpanUnequal(),
  };
}

BeamAnalysis.prototype = {
  /**
   *
   * @param {Beam} beam
   * @param {Number} load
   */
  getDeflection: function (beam, load, condition) {
    var analyzer = this.analyzer[condition];
    console.log(analyzer.getDeflectionEquation(beam, load));
    if (analyzer) {
      return {
        beam: beam,
        load: load,
        equation: analyzer.getDeflectionEquation(beam, load),
      };
    } else {
      throw new Error("Invalid condition");
    }
  },

  getBendingMoment: function (beam, load, condition) {
    var analyzer = this.analyzer[condition];
    if (analyzer) {
      return {
        beam: beam,
        load: load,
        equation: analyzer.getBendingMomentEquation(beam, load),
      };
    } else {
      throw new Error("Invalid condition");
    }
  },

  getShearForce: function (beam, load, condition) {
    var analyzer = this.analyzer[condition];

    if (analyzer) {
      return {
        beam: beam,
        load: load,
        equation: analyzer.getShearForceEquation(beam, load),
      };
    } else {
      throw new Error("Invalid condition");
    }
  },
};

/** ============================ Beam Analysis Analyzer ============================ */

/**
 * Available analyzers for different conditions
 */
BeamAnalysis.analyzer = {};

/**
 * Calculate deflection, bending stress and shear stress for a simply supported beam
 *
 * @param {Beam}   beam   The beam object
 * @param {Number}  load    The applied load
 */
BeamAnalysis.analyzer.simplySupported = function (beam, load) {
  this.beam = beam;
  this.load = load;
};

BeamAnalysis.analyzer.simplySupported.prototype = {
  getDeflectionEquation: function (beam, load) {
    var EI = beam.material.properties.EI;
    var W = load;
    var L = beam.primarySpan;
    var j2 = 2;
    return function (x) {
      if (x >= 0 && x <= L) {
        var deflection = -((W * x) / (24 * EI)) * (Math.pow(L, 3) - 2 * L * Math.pow(x, 2) + Math.pow(x, 3)) * j2 * 1000;
        return {
          x: x,
          y: deflection,
        };
      } else {
        return null;
      }
    };
  },

  getBendingMomentEquation: function (beam, load) {
    var W = load;
    var L = beam.primarySpan;

    return function (x) {
      if (x >= 0 && x <= L) {
        var bendingMoment = (W / 2) * (L * x - Math.pow(x, 2));
        return {
          x: x,
          y: bendingMoment,
        };
      } else {
        return null;
      }
    };
  },

  getShearForceEquation: function (beam, load) {
    var W = load;
    var L = beam.primarySpan;
    return function (x) {
      if (x >= 0 && x <= L) {
        var shearForce = W * (L / 2 - x);
        return {
          x: x,
          y: shearForce,
        };
      } else {
        return null;
      }
    };
  },
};

/**
 * Calculate deflection, bending stress and shear stress for a beam with two spans of equal condition
 *
 * @param {Beam}   beam   The beam object
 * @param {Number}  load    The applied load
 */
BeamAnalysis.analyzer.twoSpanUnequal = function (beam, load) {
  this.beam = beam;
  this.load = load;
};

BeamAnalysis.analyzer.twoSpanUnequal.prototype = {
  getDeflectionEquation: function (beam, load) {
    var L1 = beam.primarySpan;
    var L2 = beam.secondarySpan;
    var EI = beam.material.properties.EI;
    var W = load;

    return function (x) {
      var j2 = 2;
      var R1 = (W * L2) / (L1 + L2);
      var R2 = W - R1;

      if (x >= 0 && x <= L1) {
        var D1 = (x / ((24 * EI) / Math.pow(1000, 3))) * (4 * R1 * Math.pow(x, 2) - W * Math.pow(x, 3) + W * Math.pow(L1, 3) - 4 * R1 * Math.pow(L1, 2)) * 1000 * j2;
        return {
          x: x,
          y: D1,
        };
      } else if (x > L1 && x <= L1 + L2) {
        var D2 =
          ((((R1 * x) / 6) * (Math.pow(x, 2) - Math.pow(L1, 2)) + ((R2 * x) / 6) * (Math.pow(x, 2) - 3 * L1 * x + 3 * Math.pow(L1, 2)) - (R2 * Math.pow(L1, 3)) / 6 - ((W * x) / 24) * (Math.pow(x, 2) - L1 * 3)) * 1) /
          ((EI / Math.pow(1000, 3)) * 1000 * j2);
        return {
          x: x,
          y: D2,
        };
      } else {
        return null;
      }
    };
  },

  getBendingMomentEquation: function (beam, load) {
    var L1 = beam.primarySpan;
    var L2 = beam.secondarySpan;
    var W = load;

    return function (x) {
      var a = L1;
      var b = L2;
      var M1 = (W * Math.pow(b, 3) + W * Math.pow(a, 3)) / (8 * (a + b));
      var R1 = M1 / a + (W * a) / 2;
      var R3 = M1 / b + (W * b) / 2;
      var R2 = W * a + W * b - R1 - R3;
      var V2 = W * a - R1;
      var V3 = W * b - R3;
      var V4 = -R1;

      var Mx1 = R1 * x - 0.5 * W * Math.pow(x, 2);
      var Mx2 = R3 * (x - L1) - 0.5 * W * Math.pow(x - L1, 2);

      if (x >= 0 && x < a) {
        return {
          x: x,
          y: Mx1,
        };
      } else if (x === a) {
        return {
          x: x,
          y: Mx1 + R2 * (x - L1),
        };
      } else if (x > a && x <= L1) {
        return {
          x: x,
          y: Mx1 + R2 * (x - L1),
        };
      } else if (x === L1) {
        return {
          x: x,
          y: Mx1 + R2 * (x - L1),
        };
      } else if (x > L1 && x <= L1 + L2) {
        return {
          x: x,
          y: Mx2 + V4 * (x - L1),
        };
      } else {
        return null;
      }
    };
  },

  getShearForceEquation: function (beam, load) {
    var L1 = beam.primarySpan;
    var L2 = beam.secondarySpan;
    var W = load;

    return function (x) {
      var M1 = (W * Math.pow(beam.secondarySpan, 3) + W * Math.pow(beam.primarySpan, 3)) / (8 * (beam.primarySpan + beam.secondarySpan));
      var a = beam.primarySpan;
      var b = beam.secondarySpan;
      var R1 = M1 / a + (W * a) / 2;
      var R3 = M1 / b + (W * b) / 2;
      var R2 = W * a + W * b - R1 - R3;
      var V2 = W * a - R1;
      var V3 = W * b - R3;
      var V4 = -R1;

      if (x === 0) {
        return {
          x: x,
          y: R1,
        };
      } else if (x > 0 && x < a) {
        return {
          x: x,
          y: R1 - W * x,
        };
      } else if (x === a) {
        return {
          x: x,
          y: R1 + R2 - W * L1,
        };
      } else if (x > a && x <= L1) {
        return {
          x: x,
          y: R1 + R2 - W * x,
        };
      } else if (x === L1) {
        return {
          x: x,
          y: R1 + R2 - W * L1,
        };
      } else if (x > L1 && x <= L1 + L2) {
        return {
          x: x,
          y: V4 - W * (x - L1),
        };
      } else {
        return null;
      }
    };
  },
};
