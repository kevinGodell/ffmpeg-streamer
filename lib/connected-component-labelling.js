'use strict'

function AssertException (message) {
  this.message = message
}

AssertException.prototype.toString = function () {
  return 'AssertException: ' + this.message
}

function assert (exp, message) {
  if (!exp) {
    throw new AssertException(message)
  }
}

console.log2D = function (data, w, h) {
  let offset = 0
  let line = ''

  for (let x = 0; x < w; x++) {
    const xx = (x < 10 ? ' ' : '') + x
    line += xx + ','
  }
  console.log('   ' + line)

  for (let y = 0; y < h; y++) {
    line = ''
    for (let x = 0; x < w; x++) {
      let d = data[offset].toFixed()
      if (d.length < 2) { d = ' ' + d }

      line += d + ','
      offset++
    }

    const yy = (y < 10 ? ' ' : '') + y
    console.log(yy + ' ' + line)
  }
}

/**
 * Sets sections of a array to the value
 * @param value to set
 * @param offset start offset
 * @param length
 */
Array.prototype.memset = function (offset, length, value) {
  for (let i = 0; i < length; i++) {
    this[offset++] = value
  }
}

Array.max = function (array) {
  // return Math.max.apply( Math, array );
  let max = Number.MIN_VALUE
  for (let i = array.length; i >= 0; i--) {
    if (array[i] > max) { max = array[i] }
  }
  return max
}

Array.min = function (array) {
  // return Math.min.apply( Math, array );
}

/**
 * Connected-component labeling (aka blob extraction)
 * Using Algorithm developed in "A linear-time component labeling algorithm using contour tracing technique"
 * @param data
 * @param width
 * @param height
 * @returns {BlobExtraction}
 */
function BlobExtraction (data, w, h) {
  const max = w * h

  // These are constants
  const BACKGROUND = 1// 255
  const FOREGROUND = 0
  const UNSET = 0
  const MARKED = -1

  /*
   * 5 6 7
   * 4 P 0
   * 3 2 1
   */
  const pos = [1, w + 1, w, w - 1, -1, -w - 1, -w, -w + 1] // Clockwise

  const label = [] // Same size as data
  let c = 1 // Component index

  // We change the border to be white. We could add a pixel around
  // but we are lazy and want to do this in place.
  // Set the outer rows/cols to min
  data.memset(0, w, BACKGROUND) // Top
  data.memset(w * (h - 1), w, BACKGROUND) // Bottom

  for (let y = 1; y < h - 1; y++) {
    const offset = y * w
    data[offset] = BACKGROUND // Left
    data[offset + w - 1] = BACKGROUND // Right
  }

  // Set labels to zeros
  label.memset(0, max, UNSET)

  const tracer = function (S, p) {
    for (let d = 0; d < 8; d++) {
      const q = (p + d) % 8

      const T = S + pos[q]

      // Make sure we are inside image
      if (T < 0 || T >= max) { continue }

      if (data[T] !== BACKGROUND) { return {T: T, q: q} }

      assert(label[T] <= UNSET)
      label[T] = MARKED
    }

    // No move
    return {T: S, q: -1}
  }

  /**
   *
   * @param S Offset of starting point
   * @param C label count
   * @param external Boolean Is this internal or external tracing
   */
  var contourTracing = function (S, C, external) {
    var p = external ? 7 : 3

    // Find out our default next pos (from S)
    var tmp = tracer(S, p)
    var T2 = tmp.T
    var q = tmp.q

    label[S] = C

    // Single pixel check
    if (T2 == S) { return }

    var counter = 0

    var Tnext = T2
    var T = T2

    while (T != S || Tnext != T2) {
      assert(counter++ < max, 'Looped too many times!')

      label[Tnext] = C

      T = Tnext
      p = (q + 5) % 8

      tmp = tracer(T, p)
      Tnext = tmp.T
      q = tmp.q
    }
  }

  var extract = function () {
    var y = 1 // We start at 1 to avoid looking above the image
    do {
      var x = 0
      do {
        var offset = y * w + x

        // We skip white pixels or previous labeled pixels
        if (data[offset] == BACKGROUND) { continue }

        var traced = false

        // Step 1 - P not labelled, and above pixel is white
        if (data[offset - w] == BACKGROUND && label[offset] == UNSET) {
          // console.log(x + "," + y + " step 1");

          // P must be external contour
          contourTracing(offset, c, true)
          c++

          traced = true
        }

        // Step 2 - Below pixel is white, and unmarked
        if (data[offset + w] == BACKGROUND && label[offset + w] == UNSET) {
          // console.log(x + "," + y + " step 2");

          // Use previous pixel label, unless this is already labelled
          var n = label[offset - 1]
          if (label[offset] != UNSET) { n = label[offset] }

          assert(n > UNSET, 'Step 2: N must be set, (' + x + ',' + y + ') ' + n + ' ' + data[offset - 1])

          // P must be a internal contour
          contourTracing(offset, n, false)

          traced = true
        }

        // Step 3 - Not dealt with in previous two steps
        if (label[offset] == UNSET) {
          // console.log(x + "," + y + " step 3");
          // console.log2D(label, w, h);
          var n = label[offset - 1]

          assert(!traced, 'Step 3: We have traced, but not set the label')
          assert(n > UNSET, 'Step 3: N must be set, (' + x + ',' + y + ') ' + n)

          // Assign P the value of N
          label[offset] = n
        }
      } while (x++ < w)
    } while (y++ < (h - 1)) // We end one before the end to to avoid looking below the image

    console.log('labels=' + c)
    return label
  }

  return extract()
}

/**
 * Returns an array of each blob's bounds
 * TODO do this with the BlobExtraction stage
 * @param label
 * @param width
 * @param height
 */
function BlobBounds (label, width, height) {
  var blob = []

  var offset = 0
  for (var y = 0; y < height; y++) {
    for (var x = 0; x < width; x++) {
      var l = label[offset++]

      if (l <= 0) { continue }

      if (l in blob) {
        var b = blob[l]

        if (b.x2 < x) { b.x2 = x }

        if (b.x1 > x) { b.x1 = x }

        // As we are going from top down, the bottom y should increase
        b.y2 = y

        //				blob[l] = b;
      } else {
        blob[l] = {l: l, x1: x, y1: y, x2: x, y2: y}
      }
    }
  }

  blob[0] = {l: 0, x1: 0, y1: 0, x2: 0, y2: 0, area: 0}

  for (var i = 1; i < blob.length; i++) {
    var b = blob[i]
    b.area = (b.x2 - b.x1 + 1) * (b.y2 - b.y1 + 1)
  }

  return blob
}

/**
 * Draws a picture with each blob coloured
 * @param dest RGBA
 * @param width
 * @param height
 * @param label
 */
function BlobColouring (dest, width, height, labels) {
  var max = rect.width * rect.height
  var colors = []

  var maxcolors = Array.max(labels)
  var maxcolors2 = maxcolors / 2

  // Create a simple color scale (I could do this in two loops but I'm lazy)
  for (var i = 0; i <= maxcolors; i++) {
    var r = i <= maxcolors2 ? 1 - (i / maxcolors2) : 0
    var g = i <= maxcolors2 ? i / maxcolors2 : 1 - ((i - maxcolors2) / maxcolors2)
    var b = i <= maxcolors2 ? 0 : ((i - maxcolors2) / maxcolors2)

    colors[i] = [r * 255, g * 255, b * 255]
  }

  var offset = max - 1
  var destOffset = offset * 4
  do {
    var l = labels[offset]

    var color = l > 0 ? colors[ l ] : [0, 0, 0]
    dest[destOffset] = color[0]
    dest[destOffset + 1] = color[1]
    dest[destOffset + 2] = color[2]
    dest[destOffset + 3] = 0xff // Alpha

    destOffset -= 4
  } while (offset--)
}

module.exports = {
  BlobColoring: BlobColouring,
  BlobBounds: BlobBounds,
  BlobExtraction: BlobExtraction
}
