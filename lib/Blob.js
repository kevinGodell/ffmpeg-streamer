'use strict'

function FindBlobs (srcPixelsZ, xSizeZ, ySizeZ) {
  var xSize = xSizeZ
  var ySize = ySizeZ
  var srcPixels = srcPixelsZ
  var x
  var y
  var pos

  // This will hold the indecies of the regions we find
  var blobMap = []
  var label = 1

  // The labelTable remembers when blobs of different labels merge
  // so labelTabel[1] = 2; means that label 1 and 2 are the same blob
  var labelTable = [0]

  // Start by labeling every pixel as blob 0
  for (y = 0; y < ySize; y++) {
    blobMap.push([])
    for (x = 0; x < xSize; x++) {
      blobMap[y].push(0)
    }
  }

  // Temporary variables for neighboring pixels and other stuff
  var nn, nw, ne, ww, ee, sw, ss, se, minIndex
  var luma = 0
  var isVisible = 0

  // We're going to run this algorithm twice
  // The first time identifies all of the blobs candidates the second pass
  // merges any blobs that the first pass failed to merge
  var nIter = 2
  while (nIter--) {
    // We leave a 1 pixel border which is ignored so we do not get array
    // out of bounds errors
    for (y = 1; y < ySize - 1; y++) {
      for (x = 1; x < xSize - 1; x++) {
        pos = (y * xSize + x) * 4

        // We're only looking at the alpha channel in this case but you can
        // use more complicated heuristics
        isVisible = (srcPixels[pos + 3] > 127)

        if (isVisible) {
          // Find the lowest blob index nearest this pixel
          nw = blobMap[y - 1][x - 1] || 0
          nn = blobMap[y - 1][x - 0] || 0
          ne = blobMap[y - 1][x + 1] || 0
          ww = blobMap[y - 0][x - 1] || 0
          ee = blobMap[y - 0][x + 1] || 0
          sw = blobMap[y + 1][x - 1] || 0
          ss = blobMap[y + 1][x - 0] || 0
          se = blobMap[y + 1][x + 1] || 0
          minIndex = ww
          if (ww > 0 && ww < minIndex) { minIndex = ww }
          if (ee > 0 && ee < minIndex) { minIndex = ee }
          if (nn > 0 && nn < minIndex) { minIndex = nn }
          if (ne > 0 && ne < minIndex) { minIndex = ne }
          if (nw > 0 && nw < minIndex) { minIndex = nw }
          if (ss > 0 && ss < minIndex) { minIndex = ss }
          if (se > 0 && se < minIndex) { minIndex = se }
          if (sw > 0 && sw < minIndex) { minIndex = sw }

          // This point starts a new blob -- increase the label count and
          // and an entry for it in the label table
          if (minIndex === 0) {
            blobMap[y][x] = label
            labelTable.push(label)
            label += 1

            // This point is part of an old blob -- update the labels of the
            // neighboring pixels in the label table so that we know a merge
            // should occur and mark this pixel with the label.
          } else {
            if (minIndex < labelTable[nw]) { labelTable[nw] = minIndex }
            if (minIndex < labelTable[nn]) { labelTable[nn] = minIndex }
            if (minIndex < labelTable[ne]) { labelTable[ne] = minIndex }
            if (minIndex < labelTable[ww]) { labelTable[ww] = minIndex }
            if (minIndex < labelTable[ee]) { labelTable[ee] = minIndex }
            if (minIndex < labelTable[sw]) { labelTable[sw] = minIndex }
            if (minIndex < labelTable[ss]) { labelTable[ss] = minIndex }
            if (minIndex < labelTable[se]) { labelTable[se] = minIndex }

            blobMap[y][x] = minIndex
          }

          // This pixel isn't visible so we won't mark it as special
        } else {
          blobMap[y][x] = 0
        }
      }
    }

    // Compress the table of labels so that every location refers to only 1
    // matching location
    let i = labelTable.length
    while (i--) {
      label = labelTable[i]
      while (label !== labelTable[label]) {
        label = labelTable[label]
      }
      labelTable[i] = label
    }

    // Merge the blobs with multiple labels
    for (y = 0; y < ySize; y++) {
      for (x = 0; x < xSize; x++) {
        label = blobMap[y][x]
        if (label === 0) { continue }
        while (label !== labelTable[label]) {
          label = labelTable[label]
        }
        blobMap[y][x] = label
      }
    }
  }

  // The blobs may have unusual labels: [1,38,205,316,etc..]
  // Let's rename them: [1,2,3,4,etc..]
  var uniqueLabels = unique(labelTable)
  let i = 0
  for (label in uniqueLabels) {
    labelTable[label] = i++
  }

  // convert the blobs to the minimized labels
  for (y = 0; y < ySize; y++) {
    for (x = 0; x < xSize; x++) {
      label = blobMap[y][x]
      blobMap[y][x] = labelTable[label]
    }
  }

  // Return the blob data:
  return blobMap
};

function unique (arr) {
/// Returns an object with the counts of unique elements in arr
/// unique([1,2,1,1,1,2,3,4]) === { 1:4, 2:2, 3:1, 4:1 }

  var value
  var counts = {}
  var i
  var l = arr.length
  for (i = 0; i < l; i += 1) {
    value = arr[i]
    if (counts[value]) {
      counts[value] += 1
    } else {
      counts[value] = 1
    }
  }

  return counts
}

module.exports.FindBlobs = FindBlobs
