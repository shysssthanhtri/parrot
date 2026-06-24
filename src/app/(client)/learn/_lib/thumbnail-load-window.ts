export function getThumbnailLoadIndices(
  activeIndex: number,
  speechCount: number,
  windowSize = 3
): number[] {
  const indices: number[] = [];

  for (let offset = 0; offset < windowSize; offset += 1) {
    const index = activeIndex + offset;
    if (index >= speechCount) {
      break;
    }

    indices.push(index);
  }

  return indices;
}

export function shouldLoadThumbnail(
  speechIndex: number,
  loadedIndices: ReadonlySet<number>
): boolean {
  return loadedIndices.has(speechIndex);
}
