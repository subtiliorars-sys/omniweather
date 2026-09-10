/**
 * OmniWeather — Voice Control (OpenAI Realtime)
 *
 * Hands-free weather queries: "Show me the radar over Texas",
 * "Forecast for London next 48 hours", "Track that storm cell".
 *
 * Uses OpenAI Realtime API via WebSocket (same pattern as GEV).
 * Falls back to keyless HUD summary when no API key.
 */

import { keylessHudSummary } from '../hudSummaryResponse.js';

const STATUS = { idle: 'OFF', connecting: 'CONNECTING', listening: 'LISTENING', executing: 'EXECUTING', error: 'ERROR' };
const TOKEN_URL = '/api/realtime/token';
const REALTIME_CALLS_URL = 'https://api.openai.com/v1/realtime/calls';

export class OmniVoiceAgent {
  constructor(options = {}) {
    this.model = options.model || 'gpt-realtime-2';
    this.voice = options.voice || 'alloy';
    this.apiKey = options.apiKey || null;
    this.status = STATUS.idle;
    this.ws = null;
    this.onResult = options.onResult || (() => {});
    this.onStatusChange = options.onStatusChange || (() => {});
  }

  setApiKey(key) { this.apiKey = key; }

  async connect() {
    if (!this.apiKey) { this.status = STATUS.error; this.onStatusChange(STATUS.error); return; }
    this.status = STATUS.connecting;
    this.onStatusChange(STATUS.connecting);
    try {
      const resp = await fetch(TOKEN_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: this.model }) });
      const { clientSecret } = await resp.json();
      this.ws = new WebSocket(clientSecret);
      this.ws.onopen = () => { this.status = STATUS.listening; this.onStatusChange(STATUS.listening); this._sendSessionUpdate(); };
      this.ws.onmessage = (evt) => this._handleMessage(evt);
      this.ws.onerror = () => { this.status = STATUS.error; this.onStatusChange(STATUS.error); };
      this.ws.onclose = () => { this.status = STATUS.idle; this.onStatusChange(STATUS.idle); };
    } catch (err) {
      this.status = STATUS.error;
      this.onStatusChange(STATUS.error);
    }
  }

  _sendSessionUpdate() {
    this.ws.send(JSON.stringify({ type: 'session.update', session: { model: this.model, voice: this.voice, instructions: 'You are OmniWeather voice assistant. Answer weather questions using the globe data layers. Be concise and factual.' } }));
  }

  _handleMessage(evt) {
    const msg = JSON.parse(evt.data);
    if (msg.type === 'response.text.delta') { this.onResult(msg.delta); }
    if (msg.type === 'response.done') { this.status = STATUS.idle; this.onStatusChange(STATUS.idle); }
  }

  async speak(audioBlob) {
    if (this.ws?.readyState === WebSocket.OPEN) { this.ws.send(JSON.stringify({ type: 'input.audio.buffer.append', audio: audioBlob })); }
  }

  disconnect() { this.ws?.close(); this.status = STATUS.idle; this.onStatusChange(STATUS.idle); }
}

export default OmniVoiceAgent;
