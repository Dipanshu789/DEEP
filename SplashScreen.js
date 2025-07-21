import React from 'react';
import logo from '../assets/logo.png';
import Loader from './Loader';

export default function SplashScreen() {
  return (
    <div style={{
      background: '#0D0D0D',
      width: '100vw',
      height: '100vh',
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      overflow: 'hidden',
      boxSizing: 'border-box',
      padding: 0,
      margin: 0
    }}>
      <img
        src={logo}
        alt="Logo"
        style={{
          width: '60vw',
          maxWidth: 280,
          minWidth: 120,
          height: 'auto',
          objectFit: 'contain',
          marginBottom: 16
        }}
      />
      <Loader />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: '6vh',
          textAlign: 'center',
          color: '#fff',
          fontSize: 'clamp(14px, 2vw, 20px)',
          letterSpacing: 2
        }}
      >
        version-S1.01
      </div>
    </div>
  );
}
