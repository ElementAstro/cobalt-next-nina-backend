const ctx: Worker = self as unknown as Worker;

ctx.addEventListener("message", (e: MessageEvent) => {
  const { imageData, displayMode } = e.data;

  if (!imageData || !imageData.data) {
    ctx.postMessage([]);
    return;
  }
  const histogramData = Array(256)
    .fill(0)
    .map((_, i) => ({
      value: i,
      count: 0,
      r: 0,
      g: 0,
      b: 0,
    }));

  const { data } = imageData;

  // 遍历像素数据
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const luminance = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);

    if (displayMode === "rgb" || displayMode === "luminance") {
      histogramData[luminance].count++;
    }

    histogramData[r].r++;
    histogramData[g].g++;
    histogramData[b].b++;
  }

  let maxCount = 0;
  let maxR = 0;
  let maxG = 0;
  let maxB = 0;

  for (let i = 0; i < 256; i++) {
    maxCount = Math.max(maxCount, histogramData[i].count);
    maxR = Math.max(maxR, histogramData[i].r);
    maxG = Math.max(maxG, histogramData[i].g);
    maxB = Math.max(maxB, histogramData[i].b);
  }

  for (let i = 0; i < 256; i++) {
    if (maxCount > 0)
      histogramData[i].count = (histogramData[i].count / maxCount) * 100;
    if (maxR > 0) histogramData[i].r = (histogramData[i].r / maxR) * 100;
    if (maxG > 0) histogramData[i].g = (histogramData[i].g / maxG) * 100;
    if (maxB > 0) histogramData[i].b = (histogramData[i].b / maxB) * 100;
  }
  if (displayMode === "luminance") {
    histogramData.forEach((item) => {
      item.r = item.count;
      item.g = item.count;
      item.b = item.count;
    });
  } else if (displayMode === "rgb") {
  }
  ctx.postMessage(histogramData);
});

export {};
