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
    var E = beam.material.properties.E;
    var I = beam.material.properties.I;

    var W = load;
    var L = beam.primarySpan;
    return function (x) {
        if(x >= 0 && x <= L){
            var deflection = -W * x * x / (24 * E * I);
            return {
                x: x,
                y: deflection
              };
        }else{
            return null
        }
      
    };
  },

  getBendingMomentEquation: function (beam, load) {
    var W = load;
    var L = beam.primarySpan;
    return function (x) {
        if (x >= 0 && x <= L){
            var bendingMoment = -2 * W * x * (L - x);
            return {
                x: x,
                y: bendingMoment
              };
        }else{
            return null;
        }
      
    };
  },

  getShearForceEquation: function (beam, load) {
    var W = load;
    var L = beam.primarySpan;
    return function (x) {
      if (x >= 0 && x <= L) {
        var shearForce = W * ((2 * L) / 2 - x);
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
    var E = beam.material.properties.E;
    var I = beam.material.properties.I;
    var L1 = beam.primarySpan;
    var L2 = beam.secondarySpan;

    return function (x) {
        if(x >= 0 && x <= L1){
            var deflection = -load * x * x / (24 *E * I);
            return {
                x: x,
                y: deflection
              };
        }else{
            return null;
        }
      
    };
  },

  getBendingMomentEquation: function (beam, load) {
    var L1 = beam.primarySpan;
    var L2 = beam.secondarySpan;

    return function (x) {
        if(x >=0 && x <= L1){
            var bendingMoment = load * x - load * x * x / 2;
            return {
                x: x,
                y: bendingMoment
              };
        }else if(x > L1 && x <= L1+L2){
            var bendingMoment = load * x - load * x * x / 2 + load * (x-L1) * (x - L1) / 2;
            return {
                x: x,
                y: bendingMoment
              };
        }else{
            return null;
        }
      
    };
  },

  getShearForceEquation: function (beam, load) {
    var L1 = beam.primarySpan;
    var L2 = beam.secondarySpan;

    return function (x) {
        if(x >= 0 && x <= L1){
            return{
                x:x,
                y:-load
            };
        }else if(x > L1 && x <= L1+L2){
            return{
                x: x,
                y: -load +load * (L1+L2 - x)
            };
        }else{
            return null;
        }
    };
  },
};
