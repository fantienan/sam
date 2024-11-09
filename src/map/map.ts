import MapboxDraw from '@ttfn/mapbox-gl-draw';
import { Map } from 'mapbox-gl';
import { type MapOptions } from 'mapbox-gl';

const options: MapOptions = {
  container: 'map',
  center: [116.26195341218272, 27.924590816119448],
  accessToken: 'pk.eyJ1IjoiZXhhbXBsZXMiLCJhIjoiY20xdXM1OWQ5MDQ5MDJrb2U1cGcyazR6MiJ9.ZtSFvLFKtrwOt01u-COlYg', // 官网
  preserveDrawingBuffer: true,
  zoom: 16,
  maxZoom: 21,
  minZoom: 1,
  style: '/style.json',
  hash: true,
};

window.__biz__fetch__ = window.fetch;
const interceptRequest = (placeHolder: string) => {
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      if (input instanceof Request && typeof input.url === 'string' && input.url.includes(placeHolder)) {
        return Promise.resolve(new Response(null, { status: 200, statusText: 'OK' }));
      }
    } catch (e) {
      console.warn('拦截器异常:', e);
    }
    return window.__biz__fetch__(input, init);
  };
  class BizXMLHttpRequest extends XMLHttpRequest {
    private _url: string = '';
    open(...args: any): void {
      this._url = args[1];
      // @ts-ignore
      return super.open(...args);
    }
    send(body?: Document | XMLHttpRequestBodyInit | null): void {
      try {
        if (this._url && this._url.includes(placeHolder)) {
          const event = new Event('readystatechange');
          Object.defineProperty(this, 'status', { value: 200 });
          Object.defineProperty(this, 'statusText', { value: 'ok' });
          Object.defineProperty(this, 'readyState', { value: 4 });
          this.dispatchEvent(event);
          // @ts-ignore
          if (super.onload) super.onload();
          return;
        }
      } catch (e) {
        console.warn('拦截器异常:', e);
      }
      return super.send(body);
    }
  }
  window.XMLHttpRequest = BizXMLHttpRequest;
};
interceptRequest(`access_token=${options.accessToken}`);
export const genMap = () => {
  const map = new Map(options);
  const draw = new MapboxDraw({ clickNotthingNoChangeMode: false, measureOptions: { enable: false }, displayControlsDefault: true });
  map.addControl(draw);
  map.on('style.load', () => {
    map.addSource('SEGMENT', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [116.26195341218272, 27.924590816119448],
                  [116.26163787332393, 27.921844611060436],
                  [116.26577143237631, 27.92142640112411],
                  [116.2658818709769, 27.924325956742422],
                  [116.2639097531083, 27.9244514165282],
                  [116.26195341218272, 27.924590816119448],
                ],

                [
                  [116.263, 27.923], // 内环顶点1
                  [116.2635, 27.923], // 内环顶点2
                  [116.2635, 27.9235], // 内环顶点3
                  [116.263, 27.9235], // 内环顶点4
                  [116.263, 27.923], // 内环顶点5（闭合）
                ],
              ],
            },
            properties: {},
          },
        ],
      },
    });
    map.addLayer({
      id: 'segment-fill',
      source: 'SEGMENT',
      type: 'fill',
      paint: {
        'fill-color': '#088',
        // 'fill-opacity': 0.8,
      },
    });
    // map.addLayer({
    //   id: 'segment-line',
    //   source: 'SEGMENT',
    //   type: 'line',
    //   paint: {
    //     'line-color': '#08f',
    //     'line-width': 2,
    //   },
    // });
  });
  window.__mapCtrl__ = { map, draw };
  return {
    map,
  };
};
