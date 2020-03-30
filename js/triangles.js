Array.prototype.distanceTo = function(otherPoint) {
  var diffX = this[0] - otherPoint[0];
  var diffY = this[1] - otherPoint[1];

  return Math.sqrt(Math.pow(diffX, 2) + Math.pow(diffY, 2));
};

Array.prototype.cartesianSort = function() {
  return this.sort(function(a, b) {
    if (a[0] < b[0]) { return -1; }
    if (a[0] > b[0]) { return  1; }
    if (a[1] < b[1]) { return -1; }
    if (a[1] > b[1]) { return  1; }
    return 0;
  })
};

Array.prototype.distanceSort = function() {
  return this.sort(function(a, b) {
    return a[0].distanceTo(a[1]) - b[0].distanceTo(b[1]);
  })
};

function Triangle(a, b, c) {
  this.a = a;
  this.b = b;
  this.c = c;

  this.isObtuse = function() {
    var lenAB = this.a.distanceTo(this.b);
    var lenBC = this.b.distanceTo(this.c);
    var lenCA = this.c.distanceTo(this.a);
    var max = Math.max(lenAB, lenBC, lenCA);

    return 2 * Math.pow(max, 2) >= Math.pow(lenAB, 2) + Math.pow(lenBC, 2) + Math.pow(lenCA, 2);
  }

  this.centroid = function() {
    var x = (this.a[0] + this.b[0] + this.c[0]) / 3;
    var y = (this.a[1] + this.b[1] + this.c[1]) / 3;

    return [x, y];
  }

  this.trisect = function() {
    var m = this.centroid();

    return [
      new Triangle(this.a, this.b, m),
      new Triangle(this.a, m, this.c),
      new Triangle(m, this.b, this.c),
    ];
  }

  this.merge = function(otherTriangle) {
    var longestEdge = this.longestEdge();
    var v1 = this.obtuseVertex();
    var v2 = otherTriangle.obtuseVertex();

    t1 = new Triangle(v1, v2, longestEdge[0]);
    t2 = new Triangle(v1, v2, longestEdge[1]);

    return [
      t1,
      t2,
    ];
  }

  this.toString = function() {
    return this.a[0] + "," + this.a[1] + " " + this.b[0] + "," + this.b[1] + " " + this.c[0] + "," + this.c[1];
  }

  this.verticesObtuseLast = function() {
    if (this.verticesObtuseLastMemo === undefined) {
      this.verticesObtuseLastMemo = [
        [this.a, this.b, this.c],
        [this.b, this.c, this.a],
        [this.c, this.a, this.b],
      ].distanceSort().map(x => x[2]);
    }

    return this.verticesObtuseLastMemo;
  }

  this.obtuseVertex = function() {
    return this.verticesObtuseLast()[2];
  }

  this.longestEdge = function() {
    var vertices = this.verticesObtuseLast();

    return [vertices[0], vertices[1]];
  }

  this.longestEdgeIsHorizontal = function() {
    var vertices = this.longestEdge();

    return vertices[0][1] === vertices[1][1];
  }

  this.longestEdgeIsVertical = function() {
    var vertices = this.longestEdge();

    return vertices[0][0] === vertices[1][0];
  }

  this.longestEdgeOnWesternBorder = function() {
    var vertices = this.longestEdge();

    return this.longestEdgeIsVertical() && vertices[0][0] === 0;
  };

  this.longestEdgeOnEasternBorder = function() {
    var vertices = this.longestEdge();

    return this.longestEdgeIsVertical() && vertices[0][0] === 1000;
  };

  this.longestEdgeOnNorthernBorder = function() {
    var vertices = this.longestEdge();

    return this.longestEdgeIsHorizontal() && vertices[0][1] === 0;
  };

  this.longestEdgeOnSouthernBorder = function() {
    var vertices = this.longestEdge();

    return this.longestEdgeIsHorizontal() && vertices[0][1] === 1000;
  };

  this.inBounds = function() {
    for (var vertex of [this.a, this.b, this.c]) {
      if (vertex[0] > 0 && vertex[0] < 1000 && vertex[1] > 0 && vertex[1] < 1000) {
        return true;
      }
    }

    return false;
  }

  this.longestEdgeToString = function() {
    var vertices = this.longestEdge().cartesianSort();

    return vertices[0][0] + "," + vertices[0][1] + " " + vertices[1][0] + "," + vertices[1][1];
  }
}

function Fractal(trianglesArr) {
  this.triangles = [];
  this.svg = d3.select("#main");

  for (var triangleArr of trianglesArr) {
    var triangle = new Triangle(triangleArr[0], triangleArr[1], triangleArr[2])
    this.triangles.push(triangle);
  }

  this.draw = function() {
    this.svg.selectAll("polygon").remove();

    this.svg
      .selectAll("polygon")
      .data(this.triangles)
      .enter()
      .append("polygon")
      .attr("points", function (d) { return d.toString(); })
      .classed("obtuse", function (d) { return d.isObtuse(); });
  }

  this.iterate = function() {
    var nextTriangles = [];
    var obtusePairs = {};

    while (this.triangles.length > 0) {
      var triangle = this.triangles.pop();
      var newTriangles = [];

      if (triangle.isObtuse()) {
        var longestEdge = triangle.longestEdgeToString();

        if (longestEdge in obtusePairs) {
          var otherTriangle = obtusePairs[longestEdge];
          newTriangles = triangle.merge(otherTriangle);
          delete obtusePairs[longestEdge];
        } else if (triangle.longestEdgeOnWesternBorder()) {
          var vertices = triangle.verticesObtuseLast();
          var otherTriangle = new Triangle(vertices[0], vertices[1], [-vertices[2][0], vertices[2][1]]);
          newTriangles = triangle.merge(otherTriangle);
          delete obtusePairs[longestEdge];
        } else if (triangle.longestEdgeOnEasternBorder()) {
          var vertices = triangle.verticesObtuseLast();
          var otherTriangle = new Triangle(vertices[0], vertices[1], [2000 - vertices[2][0], vertices[2][1]]);
          newTriangles = triangle.merge(otherTriangle);
          delete obtusePairs[longestEdge];
        } else if (triangle.longestEdgeOnNorthernBorder()) {
          var vertices = triangle.verticesObtuseLast();
          var otherTriangle = new Triangle(vertices[0], vertices[1], [vertices[2][0], -vertices[2][1]]);
          newTriangles = triangle.merge(otherTriangle);
          delete obtusePairs[longestEdge];
        } else if (triangle.longestEdgeOnSouthernBorder()) {
          var vertices = triangle.verticesObtuseLast();
          var otherTriangle = new Triangle(vertices[0], vertices[1], [vertices[2][0], 2000 - vertices[2][1]]);
          newTriangles = triangle.merge(otherTriangle);
          delete obtusePairs[longestEdge];
        } else {
          obtusePairs[longestEdge] = triangle;
        }
      } else {
        newTriangles = triangle.trisect();
      }

      for (var newTriangle of newTriangles) {
        if (newTriangle.inBounds()) {
          nextTriangles.push(newTriangle);
        }
      }
    }

    for (var longestEdge in obtusePairs) {
      nextTriangles.push(obtusePairs[longestEdge]);
    }

    this.triangles = nextTriangles;
    this.draw();
  }
}

var nw = [0, 0]
var n  = [500, 0]
var ne = [1000, 0]
var e  = [1000, 500]
var se = [1000, 1000]
var s  = [500, 1000]
var sw = [0, 1000]
var w  = [0, 500]
var m =  [500, 500]
var mnw = [490, 490]
var mne = [510, 490]
var mse = [510, 510]
var msw = [490, 510]

var fractal = new Fractal([
  [w, nw, mnw],
  [n, nw, mnw],
  [n, ne, mne],
  [e, ne, mne],
  [w, sw, msw],
  [s, sw, msw],
  [s, se, mse],
  [e, se, mse],
  [w, mnw, msw],
  [e, mne, mse],
  [n, mnw, mne],
  [s, msw, mse],
  [m, mne, mnw],
  [m, mne, mse],
  [m, mse, msw],
  [m, mnw, msw],
]);

fractal.draw();
