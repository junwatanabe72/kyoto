// ジオメトリ内の全ての座標点をboundsに追加する再帰関数
export const processPoints = (geometry, callback, thisArg) => {
    if (geometry.getType() === 'Point') {
      callback.call(thisArg, geometry.get());
    } else if (
      geometry.getType() === 'MultiPoint' ||
      geometry.getType() === 'LineString' ||
      geometry.getType() === 'LinearRing'
    ) {
      geometry.getArray().forEach(callback, thisArg);
    } else if (
      geometry.getType() === 'MultiLineString' ||
      geometry.getType() === 'MultiPolygon'
    ) {
      geometry.getArray().forEach((g) => processPoints(g, callback, thisArg));
    } else if (geometry.getType() === 'Polygon') {
      geometry.getArray().forEach((g) => processPoints(g, callback, thisArg));
    }
  };
  
  // マップをロードする設定
  export const mapOptions = {
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
    zoomControl: true,
    styles: [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      }
    ]
  };