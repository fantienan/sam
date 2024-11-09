import 'mapbox-gl/dist/mapbox-gl.css';
import '@ttfn/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import './app.css';
import { useEffect, useRef, useState } from 'react';
// import image from '/canvas-image.png';
// import image from './a.png';
import { segmentAnythingModel, SegmentAnythingModelReturnType } from './segment';
import { GeoJSONSource, Map } from 'mapbox-gl';
import { polygon } from '@turf/turf';
import { genMap } from './map';
import type { FeatureCollection } from 'geojson';

function App() {
  const [map, setMap] = useState<Map>();
  const [state, setState] = useState<{ state: 'loading' | 'loaded' | 'error'; model: SegmentAnythingModelReturnType }>();
  const imageRef = useRef<HTMLImageElement>(null);
  // const onClick = async () => {
  //   if (!map) return;
  //   const canvas = map.getCanvas();
  //   const ctx = canvas.getContext('2d');
  //   if (!ctx) return;
  //   const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  //   const tensor = await segmentAnythingModel(imageData);
  //   console.log(tensor);
  // };
  useEffect(() => {
    (async () => {
      const mapCtrl = genMap();
      setMap(mapCtrl.map);
      const model = await segmentAnythingModel();
      console.log('Segment Anything Model Loaded');
      setState({ state: 'loaded', model });
      mapCtrl.map.on('click', async (e) => {
        const rect = e.target.getCanvas().getBoundingClientRect();
        const res = await model.getInferenceMasks(e.target.getCanvas(), rect.width, rect.height, [{ type: 0, point: e.point }]);
        if (Array.isArray(res)) {
          const poly = polygon(res.map((mask) => mask.map((point) => e.target.unproject(point).toArray())));
          const source = e.target.getSource('SEGMENT') as GeoJSONSource;
          const data = source._data as FeatureCollection;
          data.features.push(poly);
          source.setData(data);
        }
      });
    })();
  }, []);
  return (
    <>
      {/* <button style={{ position: 'absolute', top: 0, left: 0 }} onClick={onClick}>
        分析
      </button> */}
      {/* <img src={image} ref={imageRef} /> */}
      <div id="map" style={{ width: '100%', height: '100%' }}></div>
    </>
  );
}

export default App;
