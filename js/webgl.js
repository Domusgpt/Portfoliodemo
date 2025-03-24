/**
 * WebGL Pattern Renderer for Clear Seas Solutions
 * 
 * Creates animated WebGL effects for the pattern backgrounds
 * using Three.js for rendering and GLSL shaders for visual effects.
 */

// Pattern shader code
const patternVertexShader = `
  varying vec2 vUv;
  uniform float time;
  uniform float scrollSpeed;
  
  void main() {
    vUv = uv;
    
    // Apply subtle vertex displacement for pattern movement
    vec3 pos = position;
    float displacement = sin(pos.x * 5.0 + time * 0.5) * sin(pos.y * 5.0 + time * 0.5) * 0.015 * scrollSpeed;
    pos.z += displacement;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const patternFragmentShader = `
  uniform sampler2D patternTexture;
  uniform float time;
  uniform float opacity;
  uniform float hueShift;
  uniform float brightness;
  uniform float saturation;
  uniform float scrollSpeed;
  uniform vec3 accentColor;
  varying vec2 vUv;
  
  vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
  }
  
  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }
  
  void main() {
    // Apply subtle UV animation
    vec2 uv = vUv;
    uv.x += sin(uv.y * 10.0 + time * 0.5) * 0.01 * scrollSpeed;
    uv.y += cos(uv.x * 10.0 + time * 0.5) * 0.01 * scrollSpeed;
    
    // Sample the pattern texture
    vec4 patternColor = texture2D(patternTexture, uv);
    
    // Apply color adjustments (HSV color space)
    vec3 hsv = rgb2hsv(patternColor.rgb);
    hsv.x = mod(hsv.x + hueShift, 1.0); // Hue shift
    hsv.y = hsv.y * saturation;         // Saturation
    hsv.z = hsv.z * brightness;         // Brightness
    
    // Convert back to RGB
    vec3 shiftedColor = hsv2rgb(hsv);
    
    // Mix with accent color based on pattern brightness
    float luminance = dot(patternColor.rgb, vec3(0.299, 0.587, 0.114));
    vec3 finalColor = mix(shiftedColor, accentColor, luminance * 0.3 * scrollSpeed);
    
    // Add subtle pulsing glow to bright areas
    float glow = sin(time * 0.5) * 0.5 + 0.5;
    finalColor += accentColor * luminance * glow * 0.2 * scrollSpeed;
    
    // Apply final opacity
    gl_FragColor = vec4(finalColor, patternColor.a * opacity);
  }
`;

// Pattern Renderer Class
class PatternRenderer {
  constructor(options = {}) {
    // Default options
    this.options = Object.assign({
      canvasId: null,
      patternType: 1, // 1 or 2
      hueShift: 0,
      brightness: 1.0,
      saturation: 1.0,
      interactWithMouse: true,
      interactWithScroll: true,
      accentColor: new THREE.Color(1, 0.2, 0.3) // Default red accent
    }, options);
    
    // Pattern textures
    this.patternTextures = {
      1: 'https://i.imgur.com/w19qtCh.png', // Red roses
      2: 'https://i.imgur.com/he2HjBd.png'  // Pink/yellow roses
    };
    
    // Setup properties
    this.canvas = document.getElementById(this.options.canvasId);
    this.width = this.canvas ? this.canvas.clientWidth : 0;
    this.height = this.canvas ? this.canvas.clientHeight : 0;
    this.mouse = { x: 0, y: 0 };
    this.scrollSpeed = 0;
    this.isInitialized = false;
    this.time = 0;
    
    // Bind methods
    this.init = this.init.bind(this);
    this.render = this.render.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
    this.updateScrollSpeed = this.updateScrollSpeed.bind(this);
    
    // Load texture then initialize
    if (this.canvas) {
      this.loadTexture();
    } else {
      console.error(`PatternRenderer: Canvas with ID ${this.options.canvasId} not found.`);
    }
  }
  
  loadTexture() {
    // Create texture loader
    const textureLoader = new THREE.TextureLoader();
    
    // Load pattern texture based on type
    const textureUrl = this.patternTextures[this.options.patternType] || this.patternTextures[1];
    
    textureLoader.load(textureUrl, (texture) => {
      this.patternTexture = texture;
      this.patternTexture.wrapS = THREE.RepeatWrapping;
      this.patternTexture.wrapT = THREE.RepeatWrapping;
      this.init();
    }, undefined, (error) => {
      console.error('Error loading texture:', error);
      // Create empty texture as fallback
      this.patternTexture = new THREE.Texture();
      this.init();
    });
  }
  
  init() {
    if (!this.canvas) return;
    
    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ 
      canvas: this.canvas,
      alpha: true,
      antialias: true
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Create scene
    this.scene = new THREE.Scene();
    
    // Create camera (orthographic for 2D effect)
    this.camera = new THREE.OrthographicCamera(
      -0.5, 0.5, 0.5, -0.5, 0.1, 1000
    );
    this.camera.position.z = 1;
    
    // Create shader material
    this.material = new THREE.ShaderMaterial({
      vertexShader: patternVertexShader,
      fragmentShader: patternFragmentShader,
      transparent: true,
      uniforms: {
        patternTexture: { value: this.patternTexture },
        time: { value: 0 },
        opacity: { value: 0 }, // Start at 0 and animate in
        hueShift: { value: this.options.hueShift },
        brightness: { value: this.options.brightness },
        saturation: { value: this.options.saturation },
        scrollSpeed: { value: 0.2 }, // Base value
        accentColor: { value: this.options.accentColor }
      }
    });
    
    // Create plane geometry that fills the canvas
    const geometry = new THREE.PlaneGeometry(1, 1, 32, 32);
    
    // Create mesh
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(this.mesh);
    
    // Add event listeners
    window.addEventListener('resize', this.onWindowResize);
    
    if (this.options.interactWithMouse) {
      window.addEventListener('mousemove', this.onMouseMove);
      window.addEventListener('touchmove', this.onTouchMove);
    }
    
    if (this.options.interactWithScroll) {
      window.addEventListener('scroll', this.updateScrollSpeed);
    }
    
    // Animate in the pattern
    gsap.to(this.material.uniforms.opacity, {
      value: 1,
      duration: 1.5,
      ease: 'power2.out'
    });
    
    // Start the render loop
    this.isInitialized = true;
    this.render();
  }
  
  onWindowResize() {
    if (!this.canvas) return;
    
    this.width = this.canvas.clientWidth;
    this.height = this.canvas.clientHeight;
    
    this.renderer.setSize(this.width, this.height);
  }
  
  onMouseMove(event) {
    // Calculate mouse position in normalized coordinates (-1 to +1)
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }
  
  onTouchMove(event) {
    if (event.touches.length > 0) {
      // Calculate touch position in normalized coordinates (-1 to +1)
      this.mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
    }
  }
  
  updateScrollSpeed() {
    // Calculate scroll speed based on how fast the user is scrolling
    const currentScroll = window.scrollY;
    
    if (!this.lastScrollTop) {
      this.lastScrollTop = currentScroll;
      return;
    }
    
    // Calculate the delta and normalize it
    const delta = Math.abs(currentScroll - this.lastScrollTop);
    this.scrollSpeed = Math.min(delta / 50, 1); // Clamp between 0 and 1
    
    // Decay the scroll speed over time using GSAP
    gsap.to(this, {
      scrollSpeed: 0,
      duration: 0.5,
      ease: 'power2.out'
    });
    
    this.lastScrollTop = currentScroll;
  }
  
  render() {
    if (!this.isInitialized) return;
    
    // Update time
    this.time += 0.01;
    
    // Update uniforms
    this.material.uniforms.time.value = this.time;
    
    // Update scroll and mouse interaction
    this.material.uniforms.scrollSpeed.value = this.scrollSpeed + 0.2; // Base value + scroll speed
    
    // Subtle movement based on mouse position
    if (this.options.interactWithMouse) {
      // Use GSAP for smooth mouse following
      gsap.to(this.mesh.position, {
        x: this.mouse.x * 0.05,
        y: this.mouse.y * 0.05,
        duration: 1,
        ease: 'power2.out'
      });
    }
    
    // Render the scene
    this.renderer.render(this.scene, this.camera);
    
    // Request next frame
    requestAnimationFrame(this.render);
  }
  
  // Public method to animate hue shift
  animateHueShift(targetValue, duration = 1) {
    gsap.to(this.material.uniforms.hueShift, {
      value: targetValue,
      duration: duration,
      ease: 'power2.out'
    });
  }
  
  // Public method to animate brightness
  animateBrightness(targetValue, duration = 1) {
    gsap.to(this.material.uniforms.brightness, {
      value: targetValue,
      duration: duration,
      ease: 'power2.out'
    });
  }
  
  // Public method to animate saturation
  animateSaturation(targetValue, duration = 1) {
    gsap.to(this.material.uniforms.saturation, {
      value: targetValue,
      duration: duration,
      ease: 'power2.out'
    });
  }
  
  // Public method to change accent color
  changeAccentColor(color) {
    gsap.to(this.material.uniforms.accentColor.value, {
      r: color.r,
      g: color.g,
      b: color.b,
      duration: 1,
      ease: 'power2.out'
    });
  }
  
  // Public method to simulate scroll speed (useful for animations)
  simulateScroll(speed, duration = 0.5) {
    gsap.to(this, {
      scrollSpeed: speed,
      duration: duration,
      ease: 'power2.out',
      onComplete: () => {
        gsap.to(this, {
          scrollSpeed: 0,
          duration: duration,
          ease: 'power2.out'
        });
      }
    });
  }
  
  // Clean up method
  destroy() {
    // Remove event listeners
    window.removeEventListener('resize', this.onWindowResize);
    
    if (this.options.interactWithMouse) {
      window.removeEventListener('mousemove', this.onMouseMove);
      window.removeEventListener('touchmove', this.onTouchMove);
    }
    
    if (this.options.interactWithScroll) {
      window.removeEventListener('scroll', this.updateScrollSpeed);
    }
    
    // Dispose of Three.js resources
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.material.dispose();
    }
    
    if (this.renderer) {
      this.renderer.dispose();
    }
    
    // Clear properties
    this.isInitialized = false;
  }
}
