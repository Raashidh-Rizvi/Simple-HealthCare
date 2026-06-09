import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VideoCallService {
  private hubConnection!: signalR.HubConnection;
  
  public peerJoined$ = new Subject<string>();
  public peerLeft$ = new Subject<string>();
  public receiveOffer$ = new Subject<{ peerId: string, offer: string }>();
  public receiveAnswer$ = new Subject<{ peerId: string, answer: string }>();
  public receiveIceCandidate$ = new Subject<{ peerId: string, candidate: string }>();

  constructor() {}

  public async startConnection() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5207/hubs/videocall')
      .withAutomaticReconnect()
      .build();

    this.hubConnection.on('PeerJoined', (peerId: string) => {
      this.peerJoined$.next(peerId);
    });

    this.hubConnection.on('PeerLeft', (peerId: string) => {
      this.peerLeft$.next(peerId);
    });

    this.hubConnection.on('ReceiveOffer', (peerId: string, offer: string) => {
      this.receiveOffer$.next({ peerId, offer });
    });

    this.hubConnection.on('ReceiveAnswer', (peerId: string, answer: string) => {
      this.receiveAnswer$.next({ peerId, answer });
    });

    this.hubConnection.on('ReceiveIceCandidate', (peerId: string, candidate: string) => {
      this.receiveIceCandidate$.next({ peerId, candidate });
    });

    try {
      await this.hubConnection.start();
      console.log('SignalR Connection Started');
    } catch (err) {
      console.error('Error while starting connection: ' + err);
    }
  }

  public async joinCall(callId: string) {
    if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('JoinCall', callId);
    }
  }

  public async leaveCall(callId: string) {
    if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('LeaveCall', callId);
    }
  }

  public async sendOffer(callId: string, offer: string) {
    if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('SendOffer', callId, offer);
    }
  }

  public async sendAnswer(callId: string, answer: string) {
    if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('SendAnswer', callId, answer);
    }
  }

  public async sendIceCandidate(callId: string, candidate: string) {
    if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('SendIceCandidate', callId, candidate);
    }
  }
}
