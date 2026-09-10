import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widget.css';
import './styles/main.css';

/**
 * OmniWeather — Main Entry Point
 * Lean Tauri + CesiumJS globe: global weather, radar, satellite, forecast.
 */
async function init() {
  const loadingScreen = document.getElementById('loading-screen');
  const loaderStatus = loadingScreen?.querySelector('.loader-status');

  try {
    loaderStatus && (loaderStatus.textContent = 'Configuring viewer...');

    const viewer = new Cesium.Viewer('cesiumContainer', {
      timeline: false,
      animation: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      fullscreenButton: false,
      vrButton: false,
      selectionIndicator: false,
      infoBox: false,
      baseLayer: false,
      creditContainer: (() => {
        const el = document.createElement('div');
        el.id = 'cesium-credits';
        document.body.appendChild(el);
        return el;
      })(),
      msaaSamples: 4,
      contextOptions: { webgl: { preserveDrawingBuffer: true } },
    });

    viewer.scene.globe.enableLighting = false;
    viewer.scene.globe.showGroundAtmosphere = true;
    viewer.scene.screenSpaceCameraController.enableCollisionDetection = false;
    viewer.scene.screenSpaceCameraController.maximumZoomDistance = 6.0e7;
    viewer.scene.screenSpaceCameraController.minimumZoomDistance = 10.0;

    // Default base layer: Cesium World Imagery (free tier)
    viewer.imageryLayers.addImageryProvider(new Cesium.UrlTemplateImageryProvider({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      maximumLevel: 19,
    }));

    loaderStatus && (loaderStatus.textContent = 'Ready — OmniWeather');
    console.log('[OmniWeather] Globe ready');
  } catch (err) {
    console.error('[OmniWeather] Init failed:', err);
    loaderStatus && (loaderStatus.textContent = 'Init failed — see console');
  }
}

init();
