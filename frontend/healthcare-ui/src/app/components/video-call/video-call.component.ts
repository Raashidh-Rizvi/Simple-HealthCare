import { Component, OnInit, OnDestroy, ElementRef, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideoCallService } from '../../services/video-call.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-video-call',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="video-call-overlay" *ngIf="isActive">
      <div class="video-container">
        <div class="header">
          <h3 class="text-white m-0">Video Consultation</h3>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="timer-badge" *ngIf="isConnected">⏱ {{ callDuration }}</span>
            <span class="status-badge" [class.connected]="isConnected">{{ isConnected ? 'Connected' : 'Waiting for peer...' }}</span>
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
          <button class="control-btn" [class.muted]="!audioEnabled" (click)="toggleAudio()">
            {{ audioEnabled ? '🎤' : '🔇' }}
          </button>
          <button class="control-btn" [class.muted]="!videoEnabled" (click)="toggleVideo()">
            {{ videoEnabled ? '📷' : '🚫' }}
          </button>
          <button class="control-btn end-call" (click)="endCall()">
            ☎️ End
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
    .video-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
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
    .streams-wrapper {
      flex: 1;
      position: relative;
      background-color: #111118;
      display: flex;
      justify-content: center;
      align-items: center;
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
      width: 100px;
      height: 140px;
      background-color: #000;
      border-radius: 8px;
      object-fit: cover;
      border: 2px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
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

  isActive: boolean = true;
  isConnected: boolean = false;
  audioEnabled: boolean = true;
  videoEnabled: boolean = true;
  
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
        this.isConnected = false;
        if (this.remoteVideo?.nativeElement) {
          this.remoteVideo.nativeElement.srcObject = null;
        }
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
}
