class Triangle {
  constructor(a, b, c) {
    this.a = a;
    this.b = b;
    this.c = c;

    // Cache squared edge lengths.
    const abx = a[0] - b[0];
    const aby = a[1] - b[1];

    const bcx = b[0] - c[0];
    const bcy = b[1] - c[1];

    const cax = c[0] - a[0];
    const cay = c[1] - a[1];

    this.ab2 = abx * abx + aby * aby;
    this.bc2 = bcx * bcx + bcy * bcy;
    this.ca2 = cax * cax + cay * cay;

    // Determine the longest edge once.
    if (this.ab2 >= this.bc2 && this.ab2 >= this.ca2) {
      // AB is longest; C is opposite.
      this.longestA = a;
      this.longestB = b;
      this.opposite = c;
    } else if (this.bc2 >= this.ca2) {
      // BC is longest; A is opposite.
      this.longestA = b;
      this.longestB = c;
      this.opposite = a;
    } else {
      // CA is longest; B is opposite.
      this.longestA = c;
      this.longestB = a;
      this.opposite = b;
    }

    this._widestAngle = undefined;
  }

  isObtuse() {
    const longest = Math.max(
      this.ab2,
      this.bc2,
      this.ca2
    );

    // All values are squared distances, so no sqrt is necessary.
    return 0.01 + 2 * longest > this.ab2 + this.bc2 + this.ca2;
  }

  widestAngle() {
    if (this._widestAngle !== undefined) {
      return this._widestAngle;
    }

    // The widest angle is opposite the longest edge.
    //
    // If longest edge is AB, then the opposite vertex is C.
    // By the cosine rule:
    //
    // cos(C) = (CA² + CB² - AB²) / (2 * CA * CB)

    let adjacent1Squared;
    let adjacent2Squared;
    let oppositeSquared;

    if (this.ab2 >= this.bc2 && this.ab2 >= this.ca2) {
      adjacent1Squared = this.ca2;
      adjacent2Squared = this.bc2;
      oppositeSquared = this.ab2;
    } else if (this.bc2 >= this.ca2) {
      adjacent1Squared = this.ab2;
      adjacent2Squared = this.ca2;
      oppositeSquared = this.bc2;
    } else {
      adjacent1Squared = this.bc2;
      adjacent2Squared = this.ab2;
      oppositeSquared = this.ca2;
    }

    const denominator =
      2 *
      Math.sqrt(adjacent1Squared * adjacent2Squared);

    let cosine = (
      adjacent1Squared +
      adjacent2Squared -
      oppositeSquared
    ) / denominator;

    // Protect against tiny floating-point errors.
    cosine = Math.max(-1, Math.min(1, cosine));

    this._widestAngle = Math.acos(cosine);

    return this._widestAngle;
  }

  centroid() {
    return [
      (this.a[0] + this.b[0] + this.c[0]) / 3,
      (this.a[1] + this.b[1] + this.c[1]) / 3
    ];
  }

  trisectInto(output) {
    const m = this.centroid();

    output.push(
      new Triangle(this.a, this.b, m),
      new Triangle(this.a, m, this.c),
      new Triangle(m, this.b, this.c)
    );
  }

  merge(otherTriangle) {
    const v1 = this.opposite;
    const v2 = otherTriangle.opposite;

    const t1 = new Triangle(
      v1,
      v2,
      this.longestA
    );

    const t2 = new Triangle(
      v1,
      v2,
      this.longestB
    );

    return [t1, t2];
  }

  obtuseVertex() {
    return this.opposite;
  }

  longestEdge() {
    return [this.longestA, this.longestB];
  }

  longestEdgeIsHorizontal() {
    return this.longestA[1] === this.longestB[1];
  }

  longestEdgeIsVertical() {
    return this.longestA[0] === this.longestB[0];
  }

  longestEdgeOnWesternBorder() {
    return (
      this.longestEdgeIsVertical() &&
      this.longestA[0] === 0
    );
  }

  longestEdgeOnEasternBorder() {
    return (
      this.longestEdgeIsVertical() &&
      this.longestA[0] === 1000
    );
  }

  longestEdgeOnNorthernBorder() {
    return (
      this.longestEdgeIsHorizontal() &&
      this.longestA[1] === 0
    );
  }

  longestEdgeOnSouthernBorder() {
    return (
      this.longestEdgeIsHorizontal() &&
      this.longestA[1] === 1000
    );
  }

  inBounds() {
    const a = this.a;
    if (
      a[0] > 0 &&
      a[0] < 1000 &&
      a[1] > 0 &&
      a[1] < 1000
    ) {
      return true;
    }

    const b = this.b;
    if (
      b[0] > 0 &&
      b[0] < 1000 &&
      b[1] > 0 &&
      b[1] < 1000
    ) {
      return true;
    }

    const c = this.c;
    return (
      c[0] > 0 &&
      c[0] < 1000 &&
      c[1] > 0 &&
      c[1] < 1000
    );
  }

  toString() {
    return (
      this.a[0] + "," + this.a[1] + " " +
      this.b[0] + "," + this.b[1] + " " +
      this.c[0] + "," + this.c[1]
    );
  }

  longestEdgeToString() {
    const a = this.longestA;
    const b = this.longestB;

    if (
      a[0] < b[0] ||
      (a[0] === b[0] && a[1] <= b[1])
    ) {
      return (
        a[0] + "," + a[1] + ":" +
        b[0] + "," + b[1]
      );
    }

    return (
      b[0] + "," + b[1] + ":" +
      a[0] + "," + a[1]
    );
  }
}

class Fractal {
  constructor(trianglesArr) {
    this.triangles = new Array(trianglesArr.length);

    const angleScale = d3.scaleLinear()
      .domain([0, Math.PI])
      .range(["red", "yellow"]);

    this.colorSchemes = [
      {
        fill: d => angleScale(d.widestAngle()),
        strokeWidth: () => 0,
      },
      {
        fill: () => "black",
        strokeWidth: () => 1,
      },
    ];

    this.colorScheme = 0;

    this.svg = d3.select("#main");

    for (let i = 0; i < trianglesArr.length; i++) {
      const triangleArr = trianglesArr[i];

      this.triangles[i] = new Triangle(
        triangleArr[0],
        triangleArr[1],
        triangleArr[2]
      );
    }
  }

  scheme() {
    return this.colorSchemes[this.colorScheme];
  }

  draw() {
    this.svg
      .selectAll("polygon")
      .data(this.triangles)
      .join("polygon")
      .attr("points", d => d.toString())
      .attr("stroke-width", this.scheme().strokeWidth)
      .attr("fill", this.scheme().fill);
  }

  flip() {
    this.colorScheme = (this.colorScheme + 1) % 2;
    this.draw();
  }

  iterate() {
    const nextTriangles = [];
    const obtusePairs = new Map();

    // Reuse one array while processing triangles.
    const triangles = this.triangles;

    while (triangles.length > 0) {
      const triangle = triangles.pop();

      if (triangle.isObtuse()) {
        const v1 = triangle.longestA;
        const v2 = triangle.longestB;
        const v3 = triangle.opposite;

        const longestEdgeKey = triangle.longestEdgeToString();

        const pairedTriangle = obtusePairs.get(longestEdgeKey);

        if (pairedTriangle !== undefined) {
          const newTriangles = triangle.merge(pairedTriangle);

          if (newTriangles[0].inBounds()) {
            nextTriangles.push(newTriangles[0]);
          }

          if (newTriangles[1].inBounds()) {
            nextTriangles.push(newTriangles[1]);
          }

          obtusePairs.delete(longestEdgeKey);
        }

        else if (
          v1[0] === v2[0] &&
          v1[0] === 0
        ) {
          const otherTriangle = new Triangle(
            v1,
            v2,
            [-v3[0], v3[1]]
          );

          const newTriangles = triangle.merge(otherTriangle);

          if (newTriangles[0].inBounds()) {
            nextTriangles.push(newTriangles[0]);
          }

          if (newTriangles[1].inBounds()) {
            nextTriangles.push(newTriangles[1]);
          }
        }

        else if (
          v1[0] === v2[0] &&
          v1[0] === 1000
        ) {
          const otherTriangle = new Triangle(
            v1,
            v2,
            [2000 - v3[0], v3[1]]
          );

          const newTriangles = triangle.merge(otherTriangle);

          if (newTriangles[0].inBounds()) {
            nextTriangles.push(newTriangles[0]);
          }

          if (newTriangles[1].inBounds()) {
            nextTriangles.push(newTriangles[1]);
          }
        }

        else if (
          v1[1] === v2[1] &&
          v1[1] === 0
        ) {
          const otherTriangle = new Triangle(
            v1,
            v2,
            [v3[0], -v3[1]]
          );

          const newTriangles = triangle.merge(otherTriangle);

          if (newTriangles[0].inBounds()) {
            nextTriangles.push(newTriangles[0]);
          }

          if (newTriangles[1].inBounds()) {
            nextTriangles.push(newTriangles[1]);
          }
        }

        else if (
          v1[1] === v2[1] &&
          v1[1] === 1000
        ) {
          const otherTriangle = new Triangle(
            v1,
            v2,
            [v3[0], 2000 - v3[1]]
          );

          const newTriangles = triangle.merge(otherTriangle);

          if (newTriangles[0].inBounds()) {
            nextTriangles.push(newTriangles[0]);
          }

          if (newTriangles[1].inBounds()) {
            nextTriangles.push(newTriangles[1]);
          }
        }

        else {
          obtusePairs.set(longestEdgeKey, triangle);
        }
      }

      else {
        triangle.trisectInto(nextTriangles);
      }
    }

    // Any unpaired obtuse triangles survive unchanged.
    for (const triangle of obtusePairs.values()) {
      nextTriangles.push(triangle);
    }

    this.triangles = nextTriangles;

    this.draw();
  }
}


// ------------------------------------------------------------
// Initial geometry
// ------------------------------------------------------------

const r1 = Math.floor(
  Math.random() * (400 - 25 + 1)
) + 25;

const nw  = [0, 0];
const n   = [500, 0];
const ne  = [1000, 0];
const e   = [1000, 500];
const se  = [1000, 1000];
const s   = [500, 1000];
const sw  = [0, 1000];
const w   = [0, 500];
const m   = [500, 500];

const mnw = [500 - r1, 500 - r1];
const mne = [500 + r1, 500 - r1];
const mse = [500 + r1, 500 + r1];
const msw = [500 - r1, 500 + r1];


// ------------------------------------------------------------
// Fractal
// ------------------------------------------------------------

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
  [m, mnw, msw]
]);

fractal.draw();
