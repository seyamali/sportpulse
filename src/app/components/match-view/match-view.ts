import { Component, ElementRef, OnInit, ViewChild, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import Hls from 'hls.js';

interface Channel {
  id: number;
  name: string;
  url: string;
}

@Component({
  selector: 'app-match-view',
  imports: [CommonModule],
  templateUrl: './match-view.html',
  styleUrl: './match-view.css'
})
export class MatchView implements OnInit, OnDestroy {
  @ViewChild('videoPlayer', { static: true }) videoElementRef!: ElementRef<HTMLVideoElement>;
  
  channels = signal<Channel[]>([]);
  activeChannel = signal<Channel | null>(null);
  private hls: Hls | null = null;
  isLoading = signal(true);
  errorMsg = signal('');
  supportsPiP = signal(false);

  async ngOnInit() {
    this.supportsPiP.set(document.pictureInPictureEnabled);
    try {
      const res = await fetch('/channels.json');
      const data = await res.json();
      this.channels.set(data);
      if (data.length > 0) {
        this.selectChannel(data[0]);
      } else {
        this.isLoading.set(false);
      }
    } catch (e) {
      this.errorMsg.set('Failed to load channels.');
      this.isLoading.set(false);
    }
  }

  selectChannel(channel: Channel) {
    this.activeChannel.set(channel);
    this.isLoading.set(true);
    this.errorMsg.set('');
    
    const video = this.videoElementRef.nativeElement;
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const proxyUrl = isLocalhost ? 'http://localhost:8080/' : '';
    const streamUrl = proxyUrl + channel.url;
    
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }

    const isSafariOrIOS = /Safari/i.test(navigator.userAgent) && !/Chrome/i.test(navigator.userAgent) || /iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isSafariOrIOS && video.canPlayType('application/vnd.apple.mpegurl')) {
      // Prioritize native HLS player for iOS/Safari. It naturally bypasses CORS restrictions
      // that block hls.js XHR requests.
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        this.isLoading.set(false);
        video.play().catch(e => console.log("Autoplay prevented", e));
      });
      video.addEventListener('error', () => {
        this.errorMsg.set('Failed to load the stream natively.');
        this.isLoading.set(false);
      });
    } else if (Hls.isSupported()) {
      // Fallback to hls.js for Android, Windows, Chrome, etc.
      this.hls = new Hls({
        debug: false,
      });
      this.hls.loadSource(streamUrl);
      this.hls.attachMedia(video);
      this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
        this.isLoading.set(false);
        video.play().catch(e => console.log("Autoplay prevented", e));
      });
      this.hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          this.errorMsg.set('Stream encountered a fatal error.');
          this.isLoading.set(false);
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        this.isLoading.set(false);
        video.play().catch(e => console.log("Autoplay prevented", e));
      });
    } else {
      this.errorMsg.set('Your browser does not support HLS video playback.');
      this.isLoading.set(false);
    }
  }

  async togglePiP() {
    const video = this.videoElementRef.nativeElement;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
      }
    } catch (error) {
      console.error('Failed to enter/exit Picture-in-Picture', error);
    }
  }

  ngOnDestroy() {
    if (this.hls) {
      this.hls.destroy();
    }
  }
}
