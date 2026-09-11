/**
 * OmniWeather — Annotations Module (GEV-derived)
 *
 * Voice-driven whiteboard on the globe:
 * - Draw boundary polygons
 * - Place marks (pin, circle, rectangle)
 * - Draw routes (multi-point lines)
 * - Save/load GeoJSON
 * - Screen-space and world-space rendering
 */

import { AnnotationEngine } from '../annotations/annotationEngine.js';
import { ScreenAnnotationRenderer } from '../annotations/screenAnnotationRenderer.js';
import { WorldAnnotationRenderer } from '../annotations/worldAnnotationRenderer.js';

export class OmniAnnotations {
  constructor(viewer) {
    this.viewer = viewer;
    this.engine = new AnnotationEngine();
    this.screenRenderer = new ScreenAnnotationRenderer(viewer);
    this.worldRenderer = new WorldAnnotationRenderer(viewer);
    this.mode = 'none';
    this.currentDraw = null;
  }

  setMode(mode) {
    this.mode = mode;
    this.engine.setMode(mode);
  }

  async onGlobeClick(position) {
    const cartesian = this.viewer.camera.pickEllipsoid(
      position,
      this.viewer.scene.globe.ellipsoid
    );
    if (!cartesian) return null;

    const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    const coords = {
      lat: Cesium.Math.toDegrees(cartographic.latitude),
      lon: Cesium.Math.toDegrees(cartographic.longitude),
    };

    switch (this.mode) {
      case 'pin':
        return this.engine.addPin(coords);
      case 'circle':
        return this.engine.addCircle(coords, this._currentCircleRadius ?? 1000);
      case 'rectangle':
        return this.engine.addRectangle(coords, this._currentRectSize ?? 5000);
      case 'route':
        return this.engine.addRoutePoint(coords);
      case 'polygon':
        return this.engine.addPolygonVertex(coords);
      default:
        return null;
    }
  }

  setCircleRadius(meters) {
    this._currentCircleRadius = meters;
  }

  setRectangleSize(meters) {
    this._currentRectSize = meters;
  }

  finishDraw() {
    const result = this.engine.finishCurrent();
    this.worldRenderer.render(this.engine.getAll());
    return result;
  }

  deleteAnnotation(id) {
    this.engine.delete(id);
    this.worldRenderer.render(this.engine.getAll());
  }

  clearAll() {
    this.engine.clear();
    this.worldRenderer.render([]);
  }

  exportGeoJSON() {
    return this.engine.toGeoJSON();
  }

  importGeoJSON(geojson) {
    this.engine.fromGeoJSON(geojson);
    this.worldRenderer.render(this.engine.getAll());
  }

  getAll() {
    return this.engine.getAll();
  }
}

export default OmniAnnotations;
