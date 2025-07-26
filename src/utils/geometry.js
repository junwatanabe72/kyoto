// src/utils/geometry.js
export function processPoints(geometry, callback, thisArg) {
  if (!geometry) return;
  const t = geometry.getType?.();
  try {
    if (t === "Point") callback.call(thisArg, geometry.get());
    else if (["MultiPoint", "LineString", "LinearRing"].includes(t))
      geometry.getArray?.().forEach((p) => callback.call(thisArg, p));
    else if (t === "Polygon")
      geometry
        .getArray?.()
        .forEach((r) =>
          r?.getArray?.().forEach((p) => callback.call(thisArg, p))
        );
    else if (
      ["MultiLineString", "MultiPolygon", "GeometryCollection"].includes(t)
    )
      geometry.getArray?.().forEach((g) => processPoints(g, callback, thisArg));
  } catch (e) {
    console.error("geometry error:", e, geometry);
  }
}
