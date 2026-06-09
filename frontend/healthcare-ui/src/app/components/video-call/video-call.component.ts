import { Component, OnInit, OnDestroy, ElementRef, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideoCallService } from '../../services/video-call.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-video-call',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div #overlayContainer class="video-call-overlay" [class.is-fullscreen]="isFullscreen" *ngIf="isActive">
      <div class="video-container">
        <div class="header">
          <h3 class="text-white m-0">Video Consultation</h3>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="timer-badge" *ngIf="isConnected">⏱ {{ callDuration }}</span>
            <span class="status-badge" [class.connected]="isConnected">{{ isConnected ? 'Connected' : 'Waiting for peer...' }}</span>
            <button class="fullscreen-btn" (click)="toggleFullscreen()" title="Toggle Fullscreen">
              <span *ngIf="!isFullscreen">⛶</span>
              <span *ngIf="isFullscreen">✖</span>
            </button>
          </div>
        </div>
        
        <div class="streams-wrapper">
          <video #remoteVideo autoplay playsinline class="remote-video" [class.hidden]="!isConnected"></video>
          <div class="waiting-message" *ngIf="!isConnected">
            <div class="spinner"></div>
            <p>Waiting for the other person to join...</p>
          </div>
          <video #localVideo autoplay playsinline muted class="local-video"></video>
        </div>

        <div class="controls">
          <button class="control-btn" [class.muted]="!audioEnabled" (click)="toggleAudio()" [title]="audioEnabled ? 'Mute' : 'Unmute'">
            <svg *ngIf="audioEnabled" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M5 3a3 3 0 0 1 6 0v5a3 3 0 0 1-6 0V3z"/><path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5z"/></svg>
            <svg *ngIf="!audioEnabled" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M6.717 3.55A3.001 3.001 0 0 1 11 3v5c0 .356-.06.697-.168 1.016l-1.04-1.04A2.001 2.001 0 0 0 8 3V1.693z"/><path d="M2.293 1.293a1 1 0 0 1 1.414 0l10 10a1 1 0 0 1-1.414 1.414L10.96 11.455A4.985 4.985 0 0 1 8 13c-2.76 0-5-2.24-5-5V7a1 1 0 0 1 2 0v1a3 3 0 0 0 2.238 2.898l-3.53-3.53a1 1 0 0 1 0-1.414zM4.693 5.307 2.293 2.907a1 1 0 0 1 1.414-1.414l2.4 2.4-1.414 1.414z"/></svg>
          </button>
          <button class="control-btn" [class.muted]="!videoEnabled" (click)="toggleVideo()" [title]="videoEnabled ? 'Turn off camera' : 'Turn on camera'">
            <svg *ngIf="videoEnabled" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M0 5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 1.983 1.738l3.11-1.382A1 1 0 0 1 16 4.269v7.462a1 1 0 0 1-1.406.913l-3.111-1.382A2 2 0 0 1 9.5 13H2a2 2 0 0 1-2-2V5z"/></svg>
            <svg *ngIf="!videoEnabled" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M15.906 13.913a.5.5 0 0 1-.726.68L2.094 2.115a.5.5 0 0 1 .726-.68l13.086 12.478zM10.46 9.61 8.5 7.746v-.004l-1.956-1.86H2a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h7.5c.348 0 .674-.088.96-.24z"/><path d="M11.5 5.5v1.238l-1.5-1.429A1 1 0 0 0 9.5 5H4.294L2.24 3.041A2.001 2.001 0 0 1 4 3h5.5a2 2 0 0 1 1.983 1.738l3.11-1.382A1 1 0 0 1 16 4.269v7.462a1 1 0 0 1-1.406.913l-3.111-1.382z"/></svg>
          </button>
          <button class="control-btn end-call" (click)="endCall()" title="End Consultation">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M1.885.511a1.745 1.745 0 0 1 2.61.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.678.678 0 0 0 .178.643l2.457 2.457a.678.678 0 0 0 .644.178l2.189-.547a1.745 1.745 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 0 0 1-7.01-4.42 18.634 18.634 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511zM10.5 4.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V5.207l-3.146 3.147a.5.5 0 0 1-.708-.708L13.793 4.5H11a.5.5 0 0 1-.5-.5z"/></svg>
            <span style="margin-left: 6px;">End</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .video-call-overlay {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 480px;
      height: 360px;
      min-width: 320px;
      min-height: 240px;
      max-width: 90vw;
      max-height: 90vh;
      background-color: #1e1e2e;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.1);
      resize: both;
    }
    .video-call-overlay.is-fullscreen,
    .video-call-overlay:fullscreen {
      width: 100vw !important;
      height: 100vh !important;
      max-width: none;
      max-height: none;
      bottom: 0;
      right: 0;
      border-radius: 0;
      border: none;
      resize: none;
    }
    .video-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      overflow: hidden;
      min-height: 0;
    }
    .header {
      padding: 12px 16px;
      background: linear-gradient(to right, #2b2b40, #1e1e2e);
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .header h3 {
      font-size: 14px;
      font-weight: 600;
    }
    .status-badge {
      font-size: 10px;
      padding: 4px 8px;
      border-radius: 12px;
      background-color: #f59e0b;
      color: white;
    }
    .status-badge.connected {
      background-color: #10b981;
    }
    .timer-badge {
      font-size: 11px;
      font-weight: 600;
      color: #e2e8f0;
      background-color: rgba(0,0,0,0.4);
      padding: 4px 8px;
      border-radius: 12px;
    }
    .fullscreen-btn {
      background: none;
      border: none;
      color: #9ca3af;
      cursor: pointer;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      border-radius: 4px;
      transition: background 0.2s, color 0.2s;
    }
    .fullscreen-btn:hover {
      background: rgba(255,255,255,0.1);
      color: white;
    }
    .streams-wrapper {
      flex: 1;
      position: relative;
      background-color: #111118;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 0;
      overflow: hidden;
    }
    .remote-video {
      width: 100%;
      height: 100%;
      object-fit: contain;
      background-color: #000;
    }
    .remote-video.hidden {
      display: none;
    }
    .local-video {
      position: absolute;
      bottom: 16px;
      right: 16px;
      width: 160px;
      height: 120px;
      background-color: #000;
      border-radius: 8px;
      object-fit: cover;
      border: 2px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      transition: all 0.3s ease;
      z-index: 10;
    }
    .video-call-overlay.is-fullscreen .local-video,
    .video-call-overlay:fullscreen .local-video {
      width: 240px;
      height: 180px;
    }
    .waiting-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      color: #9ca3af;
      font-size: 12px;
    }
    .spinner {
      width: 24px;
      height: 24px;
      border: 3px solid rgba(255,255,255,0.1);
      border-radius: 50%;
      border-top-color: #3b82f6;
      animation: spin 1s ease-in-out infinite;
      margin-bottom: 8px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .controls {
      padding: 16px;
      display: flex;
      justify-content: center;
      gap: 16px;
      background-color: #1e1e2e;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }
    .control-btn {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: none;
      background-color: #3b4252;
      color: white;
      font-size: 18px;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
      transition: all 0.2s;
    }
    .control-btn:hover {
      background-color: #4c566a;
      transform: scale(1.05);
    }
    .control-btn.muted {
      background-color: #ef4444;
    }
    .control-btn.end-call {
      background-color: #ef4444;
      width: auto;
      border-radius: 24px;
      padding: 0 20px;
      font-weight: 600;
      font-size: 14px;
    }
    .control-btn.end-call:hover {
      background-color: #dc2626;
    }
  `]
})
export class VideoCallComponent implements OnInit, OnDestroy {
  @Input() callId!: string;
  @Input() isInitiator: boolean = false;
  @Output() callEnded = new EventEmitter<void>();

  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('overlayContainer') overlayContainer!: ElementRef;

  isActive: boolean = true;
  isConnected: boolean = false;
  audioEnabled: boolean = true;
  videoEnabled: boolean = true;
  isFullscreen: boolean = false;
  
  callDuration: string = '00:00';
  private connectionStartTime: number | null = null;
  private timerInterval: any;

  private peerConnection!: RTCPeerConnection;
  private localStream!: MediaStream;
  private subscriptions: Subscription[] = [];
  
  private pendingCandidates: RTCIceCandidateInit[] = [];
  private hasRemoteDescription: boolean = false;

  private rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  constructor(private videoCallService: VideoCallService) {}

  async ngOnInit() {
    console.log('VideoCallComponent initializing with callId:', this.callId);
    console.log('Am I initiator?', this.isInitiator);
    await this.videoCallService.startConnection();
    this.setupSignalRListeners();
    await this.initLocalMedia();
    console.log('Joining SignalR group:', this.callId);
    await this.videoCallService.joinCall(this.callId);
  }

  ngOnDestroy() {
    this.endCall();
  }

  private startTimer() {
    if (this.timerInterval) return;
    this.connectionStartTime = Date.now();
    this.timerInterval = setInterval(() => {
      if (!this.connectionStartTime) return;
      const diff = Math.floor((Date.now() - this.connectionStartTime) / 1000);
      const mins = Math.floor(diff / 60).toString().padStart(2, '0');
      const secs = (diff % 60).toString().padStart(2, '0');
      this.callDuration = `${mins}:${secs}`;
    }, 1000);
  }

  private stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.callDuration = '00:00';
  }

  private setupSignalRListeners() {
    // Listen for fullscreen changes made via Esc key
    document.addEventListener('fullscreenchange', () => {
      this.isFullscreen = !!document.fullscreenElement;
    });

    this.subscriptions.push(
      this.videoCallService.peerJoined$.subscribe(async (peerId) => {
        console.log('Peer joined:', peerId);
        // The peer who receives this event was in the room first. 
        // They will automatically act as the initiator.
        if (!this.peerConnection) {
          await this.createPeerConnection(peerId);
        }
        await this.createOffer();
      }),
      this.videoCallService.peerLeft$.subscribe((peerId) => {
        console.log('Peer left:', peerId);
        alert('The other person has ended the consultation.');
        this.endCall();
      }),
      this.videoCallService.receiveOffer$.subscribe(async (data) => {
        console.log('Received offer');
        // The peer who receives this offer joined second.
        // They will automatically act as the answerer.
        if (!this.peerConnection) {
          await this.createPeerConnection(data.peerId);
        }
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(JSON.parse(data.offer)));
        this.hasRemoteDescription = true;
        await this.processPendingCandidates();
        await this.createAnswer();
      }),
      this.videoCallService.receiveAnswer$.subscribe(async (data) => {
        console.log('Received answer');
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(JSON.parse(data.answer)));
        this.hasRemoteDescription = true;
        this.isConnected = true;
        this.startTimer();
        await this.processPendingCandidates();
      }),
      this.videoCallService.receiveIceCandidate$.subscribe(async (data) => {
        console.log('Received ICE candidate');
        const candidate = JSON.parse(data.candidate);
        if (this.peerConnection && this.hasRemoteDescription) {
          try {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error('Error adding received ice candidate', e);
          }
        } else {
          this.pendingCandidates.push(candidate);
        }
      })
    );
  }

  private async processPendingCandidates() {
    for (const candidate of this.pendingCandidates) {
      try {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error('Error adding pending ice candidate', e);
      }
    }
    this.pendingCandidates = [];
  }

  private async initLocalMedia() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (this.localVideo && this.localVideo.nativeElement) {
        this.localVideo.nativeElement.srcObject = this.localStream;
      }
    } catch (e) {
      console.error('Error accessing media devices.', e);
      alert('Could not access camera/microphone. Please check permissions.');
    }
  }

  private async createPeerConnection(peerId: string) {
    this.peerConnection = new RTCPeerConnection(this.rtcConfig);

    this.peerConnection.onicecandidate = event => {
      if (event.candidate) {
        this.videoCallService.sendIceCandidate(this.callId, JSON.stringify(event.candidate));
      }
    };

    this.peerConnection.ontrack = event => {
      console.log('Received remote track');
      this.isConnected = true;
      this.startTimer();
      if (this.remoteVideo && this.remoteVideo.nativeElement) {
        this.remoteVideo.nativeElement.srcObject = event.streams[0];
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection.connectionState === 'connected') {
        this.isConnected = true;
        this.startTimer();
      } else if (this.peerConnection.connectionState === 'disconnected' || this.peerConnection.connectionState === 'failed') {
        this.isConnected = false;
        this.stopTimer();
      }
    };

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });
    }
  }

  private async createOffer() {
    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      await this.videoCallService.sendOffer(this.callId, JSON.stringify(offer));
    } catch (e) {
      console.error('Error creating offer', e);
    }
  }

  private async createAnswer() {
    try {
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      await this.videoCallService.sendAnswer(this.callId, JSON.stringify(answer));
    } catch (e) {
      console.error('Error creating answer', e);
    }
  }

  toggleAudio() {
    this.audioEnabled = !this.audioEnabled;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = this.audioEnabled;
      });
    }
  }

  toggleVideo() {
    this.videoEnabled = !this.videoEnabled;
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = this.videoEnabled;
      });
    }
  }

  async endCall() {
    this.isActive = false;
    this.isConnected = false;
    this.hasRemoteDescription = false;
    this.pendingCandidates = [];
    this.stopTimer();
    
    if (this.isFullscreen) {
      document.exitFullscreen().catch(e => console.error(e));
    }
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }
    if (this.peerConnection) {
      this.peerConnection.close();
    }
    
    await this.videoCallService.leaveCall(this.callId);
    
    this.subscriptions.forEach(s => s.unsubscribe());
    this.callEnded.emit();
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      this.overlayContainer.nativeElement.requestFullscreen().catch((err: any) => {
        console.error(`Error attempting to enable fullscreen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }
}
