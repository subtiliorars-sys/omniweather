/**
 * OmniWeather — Scene Director (GEV-derived)
 *
 * Cinematic camera tours for weather demos:
 * - Storm chase sequences
 * - Hurricane tracking
 * - Regional briefing flyovers
 * - Custom waypoint tours
 */

const DEFAULT_TOUR_SPEED = 0.5;
const WAYPOINT_ARRIVAL_THRESHOLD = 500;

export class SceneDirector {
  constructor(viewer) {
    this.viewer = viewer;
    this.tours = new Map();
    this.activeTour = null;
    this.activeWaypointIndex = 0;
    this.isPlaying = false;
    this.speed = DEFAULT_TOUR_SPEED;
  }

  registerTour(name, waypoints, options = {}) {
    this.tours.set(name, {
      waypoints,
      duration: options.duration ?? waypoints.length * 5,
      loop: options.loop ?? false,
      onWaypointChange: options.onWaypointChange ?? (() => {}),
      onComplete: options.onComplete ?? (() => {}),
    });
  }

  async play(name) {
    const tour = this.tours.get(name);
    if (!tour) throw new Error(`Tour "${name}" not registered`);
    this.activeTour = tour;
    this.activeWaypointIndex = 0;
    this.isPlaying = true;
    await this._flyToCurrentWaypoint();
  }

  pause() { this.isPlaying = false; }
  resume() { if (this.activeTour) this.isPlaying = true; }
  stop() {
    this.isPlaying = false;
    this.activeTour = null;
    this.activeWaypointIndex = 0;
  }

  async next() {
    if (!this.activeTour) return;
    this.activeWaypointIndex++;
    if (this.activeWaypointIndex >= this.activeTour.waypoints.length) {
      if (this.activeTour.loop) {
        this.activeWaypointIndex = 0;
      } else {
        this.activeTour.onComplete();
        this.stop();
        return;
      }
    }
    await this._flyToCurrentWaypoint();
  }

  async previous() {
    if (!this.activeTour) return;
    this.activeWaypointIndex = Math.max(0, this.activeWaypointIndex - 1);
    await this._flyToCurrentWaypoint();
  }

  async _flyToCurrentWaypoint() {
    const tour = this.activeTour;
    if (!tour) return;
    const waypoint = tour.waypoints[this.activeWaypointIndex];
    tour.onWaypointChange(waypoint, this.activeWaypointIndex);

    await this.viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        waypoint.lon,
        waypoint.lat,
        waypoint.altitude ?? 10000
      ),
      orientation: {
        heading: waypoint.heading ?? 0,
        pitch: waypoint.pitch ?? Cesium.Math.toRadians(-45),
        roll: waypoint.roll ?? 0,
      },
      duration: waypoint.flyDuration ?? (tour.duration / tour.waypoints.length),
      easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
    });
  }

  captureScreenshot() {
    return this.viewer.scene.canvas.toDataURL('image/png');
  }

  serialize() {
    return {
      activeTour: this.activeTour ? [...this.activeTour.waypoints] : [],
      currentIndex: this.activeWaypointIndex,
      isPlaying: this.isPlaying,
      speed: this.speed,
    };
  }
}

export default SceneDirector;
