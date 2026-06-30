<div class="loader-wrap">
  <div class="coin">
    <div class="coin-inner">
      <div class="dot d1"></div>
      <div class="dot d2"></div>
      <div class="dot d3"></div>
      <div class="cross"></div>
    </div>
  </div>
  <p class="loading-text">Math Primaire</p>
</div>

<style>
  .loader-wrap {
    position: fixed;
    inset: 0;
    background: linear-gradient(180deg, #5bb8f5 0%, #87CEEB 55%, #7BC67E 80%, #4CAF50 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 28px;
    z-index: 9999;
  }

  .coin {
    width: 110px;
    height: 44px;
    border-radius: 50%;
    background: #1a1a2e;
    border: 6px solid #FFD700;
    box-shadow:
      0 0 0 3px #FFA500,
      inset 0 2px 8px rgba(0,0,0,0.6);
    position: relative;
    animation: spin3d 1.4s ease-in-out infinite;
    transform-style: preserve-3d;
  }

  .coin-inner {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .dot {
    position: absolute;
    background: white;
    border-radius: 50%;
    opacity: 0.85;
  }
  .d1 { width: 5px; height: 5px; top: 6px;  left: 18px; }
  .d2 { width: 4px; height: 4px; bottom: 5px; right: 22px; }
  .d3 { width: 3px; height: 3px; top: 8px;  right: 16px; }

  .cross {
    position: absolute;
    width: 14px;
    height: 14px;
    right: 28px;
    top: 50%;
    transform: translateY(-50%);
  }
  .cross::before,
  .cross::after {
    content: '';
    position: absolute;
    background: white;
    border-radius: 2px;
  }
  .cross::before { width: 2px; height: 100%; left: 50%; transform: translateX(-50%); }
  .cross::after  { width: 100%; height: 2px; top: 50%;  transform: translateY(-50%); }

  @keyframes spin3d {
    0%   { transform: rotateY(0deg)   scaleY(1);    }
    25%  { transform: rotateY(90deg)  scaleY(0.12); }
    50%  { transform: rotateY(180deg) scaleY(1);    }
    75%  { transform: rotateY(270deg) scaleY(0.12); }
    100% { transform: rotateY(360deg) scaleY(1);    }
  }

  .loading-text {
    font-size: 22px;
    font-weight: 900;
    color: white;
    letter-spacing: 1px;
    text-shadow: 0 2px 8px rgba(0,0,0,0.2);
    animation: pulse 1.4s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.6; }
  }
</style>
