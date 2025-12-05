import React, { useEffect } from 'react'
import * as THREE from 'three'
import { gsap } from 'gsap'

function App() {
  useEffect(() => {
    // --- Begin ported script.js logic (kept mostly verbatim, adapted for React lifecycle) ---
    let scene, camera, renderer, particles;
    let count = 15000;
    let currentState = 'sphere';
    let isMobile = false;
    let isNameDisplayed = false;
    let isFirstMessage = true;
    let ringParticles = null;
    let ringCount = 1500;
    let pulseTween = null;
    let rafId = null;

    function detectDevice() {
      isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isTablet = /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(navigator.userAgent);
      if (isMobile && !isTablet) {
        count = 8000;
        ringCount = 800;
      } else if (isTablet) {
        count = 12000;
        ringCount = 1200;
      } else {
        count = 15000;
        ringCount = 1800;
      }
    }

    function createParticles() {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);

      function sphericalDistribution(i) {
        const phi = Math.acos(-1 + (2 * i) / count);
        const theta = Math.sqrt(count * Math.PI) * phi;
        return {
          x: 8 * Math.cos(theta) * Math.sin(phi),
          y: 8 * Math.sin(theta) * Math.sin(phi),
          z: 8 * Math.cos(phi)
        };
      }

      for (let i = 0; i < count; i++) {
        const point = sphericalDistribution(i);
        positions[i * 3] = point.x + (Math.random() - 0.5) * 0.5;
        positions[i * 3 + 1] = point.y + (Math.random() - 0.5) * 0.5;
        positions[i * 3 + 2] = point.z + (Math.random() - 0.5) * 0.5;

        const color = new THREE.Color();
        const depth = Math.sqrt(point.x * point.x + point.y * point.y + point.z * point.z) / 8;
        color.setHSL(0.55 + depth * 0.2, 0.7, 0.4 + depth * 0.3);

        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const particleSize = isMobile ? 0.1 : 0.08;

      const material = new THREE.PointsMaterial({
        size: particleSize,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
      });

      if (particles) scene.remove(particles);
      particles = new THREE.Points(geometry, material);
      scene.add(particles);
      if (!ringParticles) createOrbitRing();
    }

    function createOrbitRing() {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(ringCount * 3);
      const colors = new Float32Array(ringCount * 3);

      const tilt = 0.45;
      for (let i = 0; i < ringCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 11 + Math.random() * 3;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = (Math.random() - 0.5) * 0.8;
        const y2 = y * Math.cos(tilt) - z * Math.sin(tilt);
        const z2 = y * Math.sin(tilt) + z * Math.cos(tilt);

        positions[i * 3] = x;
        positions[i * 3 + 1] = y2;
        positions[i * 3 + 2] = z2;

        const color = new THREE.Color();
        color.setHSL(0.7 + Math.random() * 0.05, 0.6, 0.6 + Math.random() * 0.1);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const material = new THREE.PointsMaterial({
        size: isMobile ? 0.06 : 0.045,
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        depthWrite: false
      });

      ringParticles = new THREE.Points(geometry, material);
      ringParticles.visible = false;
      ringParticles.userData = { speed: 0.0025 + Math.random() * 0.003 };
      scene.add(ringParticles);
    }

    function replaceExistingBotAvatars() {
      const avatars = document.querySelectorAll('.message.bot .message-avatar');
      avatars.forEach((av) => {
        const canv = av.querySelector('.avatar-canvas');
        if (canv) canv.remove();
        av.style.display = 'none';
      });
    }

    function hideBotAvatars() {
      const avatars = document.querySelectorAll('.message.bot .message-avatar');
      avatars.forEach((av) => {
        av.style.display = 'none';
      });
    }

    function createTextPoints(text) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      let fontSize = 120;
      if (window.innerWidth < 768) {
        fontSize = 80;
      } else if (window.innerWidth < 1024) {
        fontSize = 100;
      }
      const padding = 30;
      ctx.font = `bold ${fontSize}px Arial`;
      const textMetrics = ctx.measureText(text);
      const textWidth = textMetrics.width;
      const textHeight = fontSize;
      canvas.width = textWidth + padding * 2;
      canvas.height = textHeight + padding * 2;
      ctx.fillStyle = 'white';
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillText(text, canvas.width / 2, canvas.height / 2);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      const points = [];
      const threshold = 128;
      const samplingRate = isMobile ? 0.25 : 0.35;
      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i] > threshold) {
          const x = (i / 4) % canvas.width;
          const y = Math.floor((i / 4) / canvas.width);
          if (Math.random() < samplingRate) {
            points.push({
              x: (x - canvas.width / 2) / (fontSize / 10),
              y: -(y - canvas.height / 2) / (fontSize / 10)
            });
          }
        }
      }
      return points;
    }

    function morphToText(text) {
      currentState = 'text';
      if (ringParticles) ringParticles.visible = false;
      const textPoints = createTextPoints(text);
      const positions = particles.geometry.attributes.position.array;
      const targetPositions = new Float32Array(count * 3);

      gsap.to(particles.rotation, { x: 0, y: 0, z: 0, duration: 0.5 });

      for (let i = 0; i < count; i++) {
        if (i < textPoints.length) {
          targetPositions[i * 3] = textPoints[i].x;
          targetPositions[i * 3 + 1] = textPoints[i].y;
          targetPositions[i * 3 + 2] = 0;
        } else {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * 20 + 10;
          targetPositions[i * 3] = Math.cos(angle) * radius;
          targetPositions[i * 3 + 1] = Math.sin(angle) * radius;
          targetPositions[i * 3 + 2] = (Math.random() - 0.5) * 10;
        }
      }

      for (let i = 0; i < positions.length; i += 3) {
        gsap.to(particles.geometry.attributes.position.array, {
          [i]: targetPositions[i],
          [i + 1]: targetPositions[i + 1],
          [i + 2]: targetPositions[i + 2],
          duration: 2,
          ease: 'power2.inOut',
          onUpdate: () => {
            particles.geometry.attributes.position.needsUpdate = true;
          }
        });
      }
    }

    function morphToCircle() {
      currentState = 'sphere';
      const positions = particles.geometry.attributes.position.array;
      const targetPositions = new Float32Array(count * 3);
      const colors = particles.geometry.attributes.color.array;

      function sphericalDistribution(i) {
        const phi = Math.acos(-1 + (2 * i) / count);
        const theta = Math.sqrt(count * Math.PI) * phi;
        return {
          x: 8 * Math.cos(theta) * Math.sin(phi),
          y: 8 * Math.sin(theta) * Math.sin(phi),
          z: 8 * Math.cos(phi)
        };
      }

      for (let i = 0; i < count; i++) {
        const point = sphericalDistribution(i);
        targetPositions[i * 3] = point.x + (Math.random() - 0.5) * 0.5;
        targetPositions[i * 3 + 1] = point.y + (Math.random() - 0.5) * 0.5;
        targetPositions[i * 3 + 2] = point.z + (Math.random() - 0.5) * 0.5;

        const depth = Math.sqrt(point.x * point.x + point.y * point.y + point.z * point.z) / 8;
        const color = new THREE.Color();
        color.setHSL(0.55 + depth * 0.2, 0.7, 0.4 + depth * 0.3);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      }

      for (let i = 0; i < positions.length; i += 3) {
        gsap.to(particles.geometry.attributes.position.array, {
          [i]: targetPositions[i],
          [i + 1]: targetPositions[i + 1],
          [i + 2]: targetPositions[i + 2],
          duration: 1.5,
          ease: 'power2.inOut',
          onUpdate: () => {
            particles.geometry.attributes.position.needsUpdate = true;
          }
        });
      }

      for (let i = 0; i < colors.length; i += 3) {
        gsap.to(particles.geometry.attributes.color.array, {
          [i]: colors[i],
          [i + 1]: colors[i + 1],
          [i + 2]: colors[i + 2],
          duration: 1.5,
          ease: 'power2.inOut',
          onUpdate: () => {
            particles.geometry.attributes.color.needsUpdate = true;
          }
        });
      }

      setTimeout(() => {
        if (!ringParticles) createOrbitRing();
        if (ringParticles) {
          ringParticles.visible = true;
          gsap.fromTo(ringParticles.material, { opacity: 0 }, { opacity: 0.95, duration: 1.2, ease: 'power2.out' });
        }
      }, 600);
    }

    function captureAvatarSnapshot(avCanvas) {
      try {
        const mainCanvas = renderer.domElement;
        if (!mainCanvas || !avCanvas) return;
        let prevRing = null;
        if (ringParticles) {
          prevRing = ringParticles.visible;
          ringParticles.visible = false;
        }
        renderer.render(scene, camera);
        const mainW = mainCanvas.width;
        const mainH = mainCanvas.height;
        const regionSize = Math.floor(Math.min(mainW, mainH) * 0.25);
        const sx = Math.floor((mainW - regionSize) / 2);
        const sy = Math.floor((mainH - regionSize) / 2.6);
        const ctx = avCanvas.getContext('2d');
        ctx.clearRect(0, 0, avCanvas.width, avCanvas.height);
        ctx.drawImage(mainCanvas, sx, sy, regionSize, regionSize, 0, 0, avCanvas.width, avCanvas.height);
        if (ringParticles) {
          ringParticles.visible = prevRing;
          renderer.render(scene, camera);
        }
      } catch (e) {
        // ignore
      }
    }

    function animate() {
      rafId = requestAnimationFrame(animate);
      if (currentState === 'sphere' && particles) {
        particles.rotation.y += 0.002;
        particles.rotation.x += 0.001;
      }
      if (ringParticles && ringParticles.visible) {
        ringParticles.rotation.y += ringParticles.userData.speed || 0.003;
        ringParticles.rotation.x = Math.sin(Date.now() * 0.0003) * 0.05;
      }
      renderer.render(scene, camera);
    }

    // Named handlers so we can remove them on cleanup
    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      if (window.innerWidth < 768) {
        camera.position.z = 30;
      } else {
        camera.position.z = 25;
      }
    }

    function onTouchEnd(e) {
      // keep behavior consistent with original file
      const now = Date.now();
      // original used lastTouchEnd variable inside setupEventListeners; we'll simply ignore double-tap zoom
    }

    function setupEventListeners() {
      const getStartedBtn = document.getElementById('getStartedBtn');
      const getStartedContainer = document.getElementById('getStartedContainer');
      const chatContainer = document.getElementById('chatContainer');
      const sendBtn = document.getElementById('sendBtn');
      const chatInput = document.getElementById('chatInput');

      function addMessage(text, type) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        const content = document.createElement('div');
        content.className = 'message-content';
        content.textContent = text;
        if (type === 'bot') {
          hideBotAvatars();
        }
        messageDiv.appendChild(content);
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }

      function addTypingIndicator() {
        const chatMessages = document.getElementById('chatMessages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot';
        typingDiv.id = 'typingIndicator';
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        const avCanvas = document.createElement('canvas');
        avCanvas.className = 'avatar-canvas';
        const size = 44;
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        avCanvas.width = size * ratio;
        avCanvas.height = size * ratio;
        avCanvas.style.width = size + 'px';
        avCanvas.style.height = size + 'px';
        avatar.appendChild(avCanvas);
        captureAvatarSnapshot(avCanvas);
        const content = document.createElement('div');
        content.className = 'message-content';
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
        content.appendChild(indicator);
        typingDiv.appendChild(avatar);
        typingDiv.appendChild(content);
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        if (ringParticles) ringParticles.visible = false;
        if (!pulseTween && particles) {
          pulseTween = gsap.to(particles.scale, { x: 1.06, y: 1.06, z: 1.06, duration: 0.8, ease: 'sine.inOut', repeat: -1, yoyo: true });
        }
      }

      function removeTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) indicator.remove();
        if (pulseTween) {
          pulseTween.kill();
          pulseTween = null;
        }
        if (currentState === 'sphere' && ringParticles) {
          ringParticles.visible = true;
        }
      }

      function typeBotMessage(text, baseDelayMs = 35) {
        hideBotAvatars();
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot';
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.style.display = 'none';
        const content = document.createElement('div');
        content.className = 'message-content';
        content.textContent = '';
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        if (ringParticles) ringParticles.visible = false;
        if (!pulseTween && particles) {
          pulseTween = gsap.to(particles.scale, { x: 1.06, y: 1.06, z: 1.06, duration: 0.8, ease: 'sine.inOut', repeat: -1, yoyo: true });
        }

        let i = 0;
        const len = text.length;

        function finishTyping() {
          if (pulseTween) {
            pulseTween.kill();
            pulseTween = null;
          }
          if (currentState === 'sphere' && ringParticles) ringParticles.visible = true;
          avatar.style.display = 'none';
        }

        function typeNextChar() {
          if (i >= len) {
            finishTyping();
            return;
          }
          const ch = text.charAt(i);
          content.textContent += ch;
          chatMessages.scrollTop = chatMessages.scrollHeight;
          i++;
          let delay = baseDelayMs + Math.floor(Math.random() * (baseDelayMs * 0.6));
          if (/[\.!?,]/.test(ch)) {
            delay += 220 + Math.floor(Math.random() * 160);
          }
          if (ch === '\n') delay += 200;
          setTimeout(typeNextChar, delay);
        }

        setTimeout(typeNextChar, baseDelayMs);
      }

      function handleSendMessage() {
        const chatInput = document.getElementById('chatInput');
        const message = chatInput.value.trim();
        if (!message) return;
        addMessage(message, 'user');
        chatInput.value = '';
        chatInput.blur();
        setTimeout(() => {
          typeBotMessage('This is a demo response. Connect your AI backend here!', 35);
        }, 500);
      }

      // Attach handlers
      if (getStartedBtn) {
        const onGetStarted = () => {
          getStartedContainer.classList.add('hidden');
          morphToText('Avdesh');
          isNameDisplayed = true;
          setTimeout(() => {
            morphToCircle();
            document.getElementById('container').classList.add('minimized');
            if (particles) {
              const scaleFactor = isMobile ? 1.35 : (window.innerWidth < 1024 ? 1.25 : 1.15);
              gsap.to(particles.scale, { x: scaleFactor, y: scaleFactor, z: scaleFactor, duration: 0.8, ease: 'power2.out' });
            }
            chatContainer.classList.add('visible');
            const chatInputEl = document.getElementById('chatInput');
            chatInputEl.placeholder = 'Type your message...';
            chatInputEl.focus();
            typeBotMessage("Hello! I'm AVDESH AI. How can I help you today?", 40);
            isFirstMessage = false;
          }, 3000);
        };
        getStartedBtn.addEventListener('click', onGetStarted);
        // store reference for cleanup
        getStartedBtn._onGetStarted = onGetStarted;
      }

      if (sendBtn) {
        const onSend = () => handleSendMessage();
        sendBtn.addEventListener('click', onSend);
        sendBtn._onSend = onSend;
      }

      const onKeyPress = (e) => { if (e.key === 'Enter') handleSendMessage(); };
      document.getElementById('chatInput')?.addEventListener('keypress', onKeyPress);
      document.getElementById('chatInput')._onKeyPress = onKeyPress;

      // touchend handler to avoid double tap zoom behavior similar to original
      let lastTouchEnd = 0;
      const touchHandler = (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
          e.preventDefault();
        }
        lastTouchEnd = now;
      };
      document.addEventListener('touchend', touchHandler, false);
      document._lavbot_touch_handler = touchHandler;

    }

    // init sets up THREE, renderer and UI
    function init() {
      detectDevice();
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      renderer = new THREE.WebGLRenderer({ antialias: !isMobile, powerPreference: 'high-performance', precision: isMobile ? 'mediump' : 'highp', alpha: true });
      const pixelRatio = Math.min(window.devicePixelRatio, 2);
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setClearColor(0x000000, 1);
      document.getElementById('container').appendChild(renderer.domElement);
      if (window.innerWidth < 768) camera.position.z = 30; else camera.position.z = 25;
      createParticles();
      setupEventListeners();
      setTimeout(() => replaceExistingBotAvatars(), 300);
      window.addEventListener('resize', onWindowResize);
      animate();
    }

    init();

    // cleanup on unmount
    return () => {
      try {
        window.removeEventListener('resize', onWindowResize);
        if (document._lavbot_touch_handler) document.removeEventListener('touchend', document._lavbot_touch_handler, false);
        // remove event listeners attached to UI buttons
        const getStartedBtn = document.getElementById('getStartedBtn');
        if (getStartedBtn && getStartedBtn._onGetStarted) getStartedBtn.removeEventListener('click', getStartedBtn._onGetStarted);
        const sendBtn = document.getElementById('sendBtn');
        if (sendBtn && sendBtn._onSend) sendBtn.removeEventListener('click', sendBtn._onSend);
        const chatInput = document.getElementById('chatInput');
        if (chatInput && chatInput._onKeyPress) chatInput.removeEventListener('keypress', chatInput._onKeyPress);

        if (rafId) cancelAnimationFrame(rafId);
        if (renderer) {
          try { renderer.dispose(); } catch (e) {}
          const container = document.getElementById('container');
          if (container && renderer.domElement) container.removeChild(renderer.domElement);
        }
      } catch (e) {
        // ignore cleanup errors
      }
    };
    // --- End ported script.js logic ---
  }, []);

  // Render the original markup as JSX so IDs remain the same and existing logic can query DOM elements.
  return (
    <>
      <div id="container"></div>

      <div className="get-started-container" id="getStartedContainer">
        <button className="get-started-btn" id="getStartedBtn">
          Get Started
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <div className="chat-container" id="chatContainer">
        <div className="chat-messages" id="chatMessages"></div>
        <div className="input-area">
          <div className="input-wrapper">
            <input type="text" id="chatInput" placeholder="Type your message..." autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false" />
            <button className="submit-btn" id="sendBtn">
              <span className="button-content">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Send</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default App
