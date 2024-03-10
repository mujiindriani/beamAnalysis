"use strict";

/**
 * Plot result from the beam analysis calculation into a graph
 */
function AnalysisPlotter(container, xAxisLabel, yAxisLabel) {
  this.container = container;
  this.xAxisLabel = xAxisLabel;
  this.yAxisLabel = yAxisLabel;
}

AnalysisPlotter.prototype = {
  /**
   * Plot equation.
   *
   * @param {Object{beam : Beam, load : float, equation: Function}}  The equation data
   * @param {String} label 
   * @param {String} xAxisLabel
   * @param {String} yAxisLabel
   */
  plot: function (data, label, xAxisLabel, yAxisLabel) {
    //console.log('Plotting data : ', data);
    var canvas = document.getElementById(this.container);

    if (!this.chart) {
      var ctx = canvas.getContext("2d");
      this.chart = new Chart(ctx, {
        type: "line",
        data: {
          labels: [],
          datasets: [
            {
              label: label,
              data: [],
              backgroundColor: "rgba(75, 192, 192, 0.2)",
              borderColor: "rgba(75, 192, 192, 1)",
              borderWidth: 1,
              fill: true,
            },
          ],
        },
        options: {
          scales: {
            x: {
              type: "linear",
              position: "left",
              title: {
                display: true,
                text: xAxisLabel,
              },
            },
            y: {
              type: "linear",
              position: "left",
              title: {
                display: true,
                text: yAxisLabel,
              },
            },
          },
        },
      });
    }
    var labels = [];
    var values = [];

    for (var x = 0; x <= data.beam.primarySpan; x += 0.1) {
      labels.push(x);
      values.push(data.equation(x).y);
    }

    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = values;
    this.chart.update();
  },
};
