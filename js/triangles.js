Array.prototype.distanceTo = function(otherPoint) {
  const diffX = this[0] - otherPoint[0];
  const diffY = this[1] - otherPoint[1];

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

  this.widestAngle = function() {
    const vertices = this.verticesObtuseLast();
    const opposite = vertices[2];
    const adjacent1 = vertices[0];
    const adjacent2 = vertices[1];

    const a = opposite.distanceTo(adjacent1);
    const b = opposite.distanceTo(adjacent2);
    const c = adjacent1.distanceTo(adjacent2);

    return Math.acos(
      (Math.pow(a, 2) + Math.pow(b, 2) - Math.pow(c, 2)) /
      (2 * a * b)
    );
  }

  this.isObtuse = function() {
    const ab = this.a.distanceTo(this.b);
    const bc = this.b.distanceTo(this.c);
    const ca = this.c.distanceTo(this.a);

    const longest = Math.max(ab, bc, ca);

    return 0.01 + 2 * longest ** 2 > ab ** 2 + bc ** 2 + ca ** 2;
  };

  this.centroid = function() {
    const x = (this.a[0] + this.b[0] + this.c[0]) / 3;
    const y = (this.a[1] + this.b[1] + this.c[1]) / 3;

    return [x, y];
  }

  this.trisect = function() {
    const m = this.centroid();

    return [
      new Triangle(this.a, this.b, m),
      new Triangle(this.a, m, this.c),
      new Triangle(m, this.b, this.c),
    ];
  }

  this.merge = function(otherTriangle) {
    const longestEdge = this.longestEdge();
    const v1 = this.obtuseVertex();
    const v2 = otherTriangle.obtuseVertex();

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
    const vertices = this.verticesObtuseLast();

    return [vertices[0], vertices[1]];
  }

  this.longestEdgeIsHorizontal = function() {
    const vertices = this.longestEdge();

    return vertices[0][1] === vertices[1][1];
  }

  this.longestEdgeIsVertical = function() {
    const vertices = this.longestEdge();

    return vertices[0][0] === vertices[1][0];
  }

  this.longestEdgeOnWesternBorder = function() {
    const vertices = this.longestEdge();

    return this.longestEdgeIsVertical() && vertices[0][0] === 0;
  };

  this.longestEdgeOnEasternBorder = function() {
    const vertices = this.longestEdge();

    return this.longestEdgeIsVertical() && vertices[0][0] === 1000;
  };

  this.longestEdgeOnNorthernBorder = function() {
    const vertices = this.longestEdge();

    return this.longestEdgeIsHorizontal() && vertices[0][1] === 0;
  };

  this.longestEdgeOnSouthernBorder = function() {
    const vertices = this.longestEdge();

    return this.longestEdgeIsHorizontal() && vertices[0][1] === 1000;
  };

  this.inBounds = function() {
    for (const vertex of [this.a, this.b, this.c]) {
      if (vertex[0] > 0 && vertex[0] < 1000 && vertex[1] > 0 && vertex[1] < 1000) {
        return true;
      }
    }

    return false;
  }

  this.longestEdgeToString = function() {
    const vertices = this.longestEdge().cartesianSort();

    return vertices[0][0] + "," + vertices[0][1] + " " + vertices[1][0] + "," + vertices[1][1];
  }
}

function Fractal(trianglesArr) {
  this.triangles = [];

  const angleScale = d3.scaleLinear()
    .domain([0, Math.PI])
    .range(["red", "yellow"]);

  this.svg = d3.select("#main");

  for (const triangleArr of trianglesArr) {
    const triangle = new Triangle(triangleArr[0], triangleArr[1], triangleArr[2])
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
      .attr("fill", function(d) {
        return angleScale(d.widestAngle());
      })
  }

  this.iterate = function() {
    const nextTriangles = [];
    const obtusePairs = {};

    while (this.triangles.length > 0) {
      const triangle = this.triangles.pop();
      let newTriangles = [];

      if (triangle.isObtuse()) {
        const longestEdge = triangle.longestEdgeToString();

        if (longestEdge in obtusePairs) {
          const otherTriangle = obtusePairs[longestEdge];
          newTriangles = triangle.merge(otherTriangle);
          delete obtusePairs[longestEdge];
        } else if (triangle.longestEdgeOnWesternBorder()) {
          const vertices = triangle.verticesObtuseLast();
          const otherTriangle = new Triangle(vertices[0], vertices[1], [-vertices[2][0], vertices[2][1]]);
          newTriangles = triangle.merge(otherTriangle);
          delete obtusePairs[longestEdge];
        } else if (triangle.longestEdgeOnEasternBorder()) {
          const vertices = triangle.verticesObtuseLast();
          const otherTriangle = new Triangle(vertices[0], vertices[1], [2000 - vertices[2][0], vertices[2][1]]);
          newTriangles = triangle.merge(otherTriangle);
          delete obtusePairs[longestEdge];
        } else if (triangle.longestEdgeOnNorthernBorder()) {
          const vertices = triangle.verticesObtuseLast();
          const otherTriangle = new Triangle(vertices[0], vertices[1], [vertices[2][0], -vertices[2][1]]);
          newTriangles = triangle.merge(otherTriangle);
          delete obtusePairs[longestEdge];
        } else if (triangle.longestEdgeOnSouthernBorder()) {
          const vertices = triangle.verticesObtuseLast();
          const otherTriangle = new Triangle(vertices[0], vertices[1], [vertices[2][0], 2000 - vertices[2][1]]);
          newTriangles = triangle.merge(otherTriangle);
          delete obtusePairs[longestEdge];
        } else {
          obtusePairs[longestEdge] = triangle;
        }
      } else {
        newTriangles = triangle.trisect();
      }

      for (const newTriangle of newTriangles) {
        if (newTriangle.inBounds()) {
          nextTriangles.push(newTriangle);
        }
      }
    }

    for (const longestEdge in obtusePairs) {
      nextTriangles.push(obtusePairs[longestEdge]);
    }

    this.triangles = nextTriangles;
    this.draw();
  }
}

const r1 = Math.floor(Math.random() * (400 - 25 + 1)) + 25;

const nw = [0, 0]
const n  = [500, 0]
const ne = [1000, 0]
const e  = [1000, 500]
const se = [1000, 1000]
const s  = [500, 1000]
const sw = [0, 1000]
const w  = [0, 500]
const m =  [500, 500]
const mnw = [500 - r1, 500 - r1]
const mne = [500 + r1, 500 - r1]
const mse = [500 + r1, 500 + r1]
const msw = [500 - r1, 500 + r1]

const fractal = new Fractal([
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
