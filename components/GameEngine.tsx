import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameState, GameObject } from '../types';
import { audioController } from '../services/audio';

const BASE_WIDTH = 400;
const BASE_HEIGHT = 800; // Taller for better mobile aspect ratio
const PLAYER_SPEED = 6;
const BULLET_SPEED = 12;
const ENEMY_BULLET_SPEED = 8;
const LEVEL_DISTANCE = 4000; 

// Particle System Types
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

interface GameEngineProps {
  onGameOver: (score: number) => void;
}

const GameEngine: React.FC<GameEngineProps> = ({ onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    fuel: 300, // Increased fuel to 300 (3x)
    lives: 3,
    level: 1,
    isPlaying: false,
    gameOver: false,
    levelComplete: false,
    startTime: 0,
  });

  const stateRef = useRef(gameState);
  const playerRef = useRef<GameObject & { bank: number }>({ 
    x: BASE_WIDTH / 2 - 20, 
    y: BASE_HEIGHT - 120, 
    width: 44, 
    height: 56, 
    type: 'player', 
    active: true, 
    color: '#94a3b8',
    bank: 0 // Banking angle in radians
  });
  
  const objectsRef = useRef<GameObject[]>([]);
  const bulletsRef = useRef<GameObject[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const requestRef = useRef<number>();
  const scrollOffsetRef = useRef(0);
  const levelDistanceRef = useRef(0);

  useEffect(() => {
    stateRef.current = gameState;
    // Audio engine logic
    if (gameState.isPlaying) {
      audioController.startEngine();
    } else {
      audioController.stopEngine();
    }
  }, [gameState]);

  // --- Effects ---
  const spawnExplosion = (x: number, y: number, color: string) => {
    audioController.playExplosion();
    for(let i=0; i<20; i++) {
      particlesRef.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1.0,
        color: i % 2 === 0 ? '#fbbf24' : '#ef4444', // Mix fire colors
        size: Math.random() * 5 + 2
      });
    }
  };

  const spawnEngineTrail = (x: number, y: number) => {
    // Single engine trail for F-16
    particlesRef.current.push({
      x: x, 
      y: y + 8, // slightly below center
      vx: (Math.random() - 0.5) * 0.5,
      vy: 6 + Math.random() * 2,
      life: 0.4,
      color: 'rgba(245, 158, 11, 0.6)', // Orange/Yellow afterburner
      size: Math.random() * 4 + 4
    });
  };

  const spawnEnemy = (yOffset: number) => {
    const rand = Math.random();
    let type: 'enemy_ship' | 'enemy_heli' | 'enemy_tank' = 'enemy_ship';
    let color = '#475569';
    
    if (rand < 0.4) {
        type = 'enemy_ship';
        color = '#334155'; 
    } else if (rand < 0.8) {
        type = 'enemy_heli';
        color = '#14532d'; 
    } else {
        type = 'enemy_tank';
        color = '#1e3a8a'; 
    }

    const x = 60 + Math.random() * (BASE_WIDTH - 120); 
    objectsRef.current.push({
      x,
      y: -yOffset,
      width: 32,
      height: type === 'enemy_tank' ? 24 : (type === 'enemy_ship' ? 40 : 30),
      type,
      active: true,
      color
    });
  };

  const spawnFuel = (yOffset: number) => {
    const x = 100 + Math.random() * (BASE_WIDTH - 200);
    objectsRef.current.push({
      x,
      y: -yOffset,
      width: 30,
      height: 40,
      type: 'fuel',
      active: true,
      color: '#f472b6'
    });
  };

  const nextLevel = () => {
    const nextLvl = stateRef.current.level + 1;
    levelDistanceRef.current = 0;
    scrollOffsetRef.current = 0;
    
    objectsRef.current = [];
    bulletsRef.current = [];
    particlesRef.current = [];
    playerRef.current.y = BASE_HEIGHT - 100;
    playerRef.current.x = BASE_WIDTH / 2;

    for(let i=1; i<8; i++) {
        spawnEnemy(i * 150);
        if (i % 3 === 0) spawnFuel(i * 150 + 75);
    }

    setGameState(prev => ({
        ...prev,
        level: nextLvl,
        levelComplete: false,
        isPlaying: true,
        fuel: 300, // Reset to 300
        startTime: Date.now()
    }));
  };

  const resetGame = () => {
    playerRef.current = { x: BASE_WIDTH / 2 - 20, y: BASE_HEIGHT - 120, width: 44, height: 56, type: 'player', active: true, color: '#94a3b8', bank: 0 };
    objectsRef.current = [];
    bulletsRef.current = [];
    particlesRef.current = [];
    scrollOffsetRef.current = 0;
    levelDistanceRef.current = 0;
    
    for(let i=1; i<8; i++) {
        spawnEnemy(i * 150);
        if (i % 3 === 0) spawnFuel(i * 150 + 75);
    }

    setGameState({
      score: 0,
      fuel: 300, // Reset to 300
      lives: 3,
      level: 1,
      isPlaying: true,
      gameOver: false,
      levelComplete: false,
      startTime: Date.now(),
    });
    
    audioController.init();
    audioController.startEngine();
  };

  const handleInput = () => {
    const player = playerRef.current;
    let movedX = false;
    
    // Banking Physics
    const targetBank = 0.5; // Slightly more aggressive bank for F-16
    
    if (keysRef.current['ArrowLeft'] || keysRef.current['a']) {
        player.x -= PLAYER_SPEED;
        player.bank = Math.max(player.bank - 0.08, -targetBank);
        movedX = true;
    }
    if (keysRef.current['ArrowRight'] || keysRef.current['d']) {
        player.x += PLAYER_SPEED;
        player.bank = Math.min(player.bank + 0.08, targetBank);
        movedX = true;
    }
    
    // Return to level flight
    if (!movedX) {
        if (player.bank > 0.02) player.bank -= 0.06;
        else if (player.bank < -0.02) player.bank += 0.06;
        else player.bank = 0;
    }

    if (keysRef.current['ArrowUp'] || keysRef.current['w']) player.y -= PLAYER_SPEED / 1.5;
    if (keysRef.current['ArrowDown'] || keysRef.current['s']) player.y += PLAYER_SPEED / 1.5;

    // Boundaries
    if (player.x < 30) { player.x = 30; player.bank = 0; }
    if (player.x > BASE_WIDTH - 30 - player.width) { player.x = BASE_WIDTH - 30 - player.width; player.bank = 0; }
    if (player.y < 30) player.y = 30;
    if (player.y > BASE_HEIGHT - 50) player.y = BASE_HEIGHT - 50;
  };

  const fireBullet = useCallback(() => {
    if (!stateRef.current.isPlaying) return;
    audioController.playShoot();
    
    // Fire from Wingtips (F-16 Sidewinder rails)
    bulletsRef.current.push({
      x: playerRef.current.x - 4, // Left Wingtip
      y: playerRef.current.y + 15,
      width: 4,
      height: 15,
      type: 'bullet',
      active: true,
      color: '#fbbf24' // Yellow tracer
    });
    bulletsRef.current.push({
      x: playerRef.current.x + playerRef.current.width, // Right Wingtip
      y: playerRef.current.y + 15,
      width: 4,
      height: 15,
      type: 'bullet',
      active: true,
      color: '#fbbf24'
    });

  }, []);

  const spawnEnemyBullet = (enemy: GameObject) => {
      bulletsRef.current.push({
          x: enemy.x + enemy.width / 2 - 2,
          y: enemy.y + enemy.height,
          width: 6,
          height: 6,
          type: 'enemy_bullet',
          active: true,
          color: '#ef4444'
      });
  };

  const update = () => {
    if (!stateRef.current.isPlaying || stateRef.current.gameOver || stateRef.current.levelComplete) return;

    handleInput();

    // Engine Trail (Single engine F-16)
    spawnEngineTrail(playerRef.current.x + playerRef.current.width/2, playerRef.current.y + playerRef.current.height);

    // Time Check
    const elapsed = Date.now() - stateRef.current.startTime;
    const canShoot = elapsed > 40000; 

    // Fuel Consumption
    const newFuel = stateRef.current.fuel - 0.12;
    if (newFuel <= 0) {
      setGameState(prev => ({ ...prev, gameOver: true, isPlaying: false }));
      audioController.stopEngine();
      audioController.playExplosion();
      onGameOver(stateRef.current.score);
      return;
    }

    // Scroll Logic
    const baseSpeed = 3 + (stateRef.current.level * 0.5); 
    const scrollSpeed = keysRef.current['ArrowUp'] ? baseSpeed * 1.5 : (keysRef.current['ArrowDown'] ? baseSpeed * 0.5 : baseSpeed);
    
    scrollOffsetRef.current += scrollSpeed;
    levelDistanceRef.current += scrollSpeed;

    if (levelDistanceRef.current > LEVEL_DISTANCE) {
        setGameState(prev => ({ ...prev, levelComplete: true, isPlaying: false }));
        return;
    }

    // Spawn Logic
    const spawnRate = Math.max(60, 120 - (stateRef.current.level * 10));
    if (Math.floor(scrollOffsetRef.current) % spawnRate < scrollSpeed) {
         if (Math.random() > 0.3) spawnEnemy(50); 
         if (Math.random() > 0.75) spawnFuel(100);
    }

    // Update Objects
    objectsRef.current.forEach(obj => {
      obj.y += scrollSpeed;

      // Enemy Shooting Logic
      if (canShoot && obj.active && obj.type !== 'fuel' && obj.y > 0 && obj.y < BASE_HEIGHT) {
          if (Math.random() < 0.015) {
              spawnEnemyBullet(obj);
          }
      }
    });

    // Update Particles
    particlesRef.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.03;
    });
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);

    // Update Bullets
    bulletsRef.current.forEach(b => {
      if (b.type === 'enemy_bullet') {
          b.y += ENEMY_BULLET_SPEED;
      } else {
          b.y -= BULLET_SPEED;
      }
    });

    // Cleanup
    objectsRef.current = objectsRef.current.filter(o => o.y < BASE_HEIGHT + 50 && o.active);
    bulletsRef.current = bulletsRef.current.filter(b => b.y > -20 && b.y < BASE_HEIGHT + 20 && b.active);

    // Collision Logic (Same as before, simplified for brevity here)
    const player = playerRef.current;
    bulletsRef.current.forEach(bullet => {
      if (bullet.type === 'bullet') {
          objectsRef.current.forEach(obj => {
            if (obj.active &&
                bullet.x < obj.x + obj.width &&
                bullet.x + bullet.width > obj.x &&
                bullet.y < obj.y + obj.height &&
                bullet.y + bullet.height > obj.y) {
                  
                  if (obj.type === 'fuel') {
                     obj.active = false;
                     bullet.active = false;
                     spawnExplosion(obj.x + obj.width/2, obj.y + obj.height/2, '#f472b6');
                     setGameState(prev => ({ ...prev, score: Math.max(0, prev.score - 50) }));
                  } else {
                     obj.active = false;
                     bullet.active = false;
                     spawnExplosion(obj.x + obj.width/2, obj.y + obj.height/2, '#fbbf24');
                     setGameState(prev => ({ ...prev, score: prev.score + 100 }));
                  }
            }
          });
      } else if (bullet.type === 'enemy_bullet') {
          if (bullet.active &&
              bullet.x < player.x + player.width - 10 &&
              bullet.x + bullet.width > player.x + 10 &&
              bullet.y < player.y + player.height - 10 &&
              bullet.y + bullet.height > player.y + 10) {
                 spawnExplosion(player.x, player.y, '#fff');
                 setGameState(prev => ({ ...prev, gameOver: true, isPlaying: false }));
                 audioController.stopEngine();
                 onGameOver(stateRef.current.score);
          }
      }
    });

    objectsRef.current.forEach(obj => {
      if (obj.active &&
          player.x < obj.x + obj.width - 5 &&
          player.x + player.width > obj.x + 5 &&
          player.y < obj.y + obj.height - 5 &&
          player.y + player.height > obj.y + 5) {
            
            if (obj.type === 'fuel') {
              obj.active = false;
              audioController.playRefuel();
              setGameState(prev => ({ ...prev, fuel: Math.min(300, prev.fuel + 40), score: prev.score + 50 })); // Cap at 300
            } else {
              spawnExplosion(player.x, player.y, '#fff');
              setGameState(prev => ({ ...prev, gameOver: true, isPlaying: false }));
              audioController.stopEngine();
              onGameOver(stateRef.current.score);
            }
      }
    });

    setGameState(prev => ({ ...prev, fuel: newFuel }));
  };

  // --- Drawing Functions ---

  const drawFighterJet = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, bank: number) => {
      ctx.save();
      ctx.translate(x + w/2, y + h/2);
      ctx.rotate(bank);
      
      // Shadow
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = bank * 30;
      ctx.shadowOffsetY = 20;

      // F-16 Geometry
      
      // 1. Wingtip Missiles (AIM-9 Sidewinders) - Draw first so they are under wings
      ctx.fillStyle = '#e2e8f0'; // Light grey missile body
      // Left Missile
      ctx.fillRect(-w/2 - 2, -h/6, 4, h/2);
      // Right Missile
      ctx.fillRect(w/2 - 2, -h/6, 4, h/2);
      
      // Missile fins
      ctx.fillStyle = '#334155';
      ctx.fillRect(-w/2 - 4, h/3 - 2, 8, 2);
      ctx.fillRect(w/2 - 4, h/3 - 2, 8, 2);
      // Missile Tips
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-w/2 - 1, -h/6 - 2, 2, 2);
      ctx.fillRect(w/2 - 1, -h/6 - 2, 2, 2);

      // 2. Main Wings (Cropped Delta)
      const wingGrad = ctx.createLinearGradient(-w/2, 0, w/2, 0);
      wingGrad.addColorStop(0, '#475569');
      wingGrad.addColorStop(0.5, '#94a3b8');
      wingGrad.addColorStop(1, '#475569');
      ctx.fillStyle = wingGrad;
      
      ctx.beginPath();
      ctx.moveTo(0, -h/4); // LERX start (near cockpit)
      ctx.lineTo(w/2, h/4); // Wingtip Leading Edge
      ctx.lineTo(w/2, h/2 - 5); // Wingtip Trailing Edge
      ctx.lineTo(8, h/2 - 8); // Root
      ctx.lineTo(-8, h/2 - 8);
      ctx.lineTo(-w/2, h/2 - 5);
      ctx.lineTo(-w/2, h/4);
      ctx.closePath();
      ctx.fill();

      // 3. Horizontal Stabilizers (Tail)
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(4, h/2 - 5);
      ctx.lineTo(16, h/2 + 10);
      ctx.lineTo(16, h/2 + 18); // Swept back
      ctx.lineTo(4, h/2 + 15);
      ctx.lineTo(-4, h/2 + 15);
      ctx.lineTo(-16, h/2 + 18);
      ctx.lineTo(-16, h/2 + 10);
      ctx.lineTo(-4, h/2 - 5);
      ctx.fill();

      // 4. Fuselage
      const fuselageGrad = ctx.createLinearGradient(-6, 0, 6, 0);
      fuselageGrad.addColorStop(0, '#334155');
      fuselageGrad.addColorStop(0.5, '#cbd5e1'); // Highlight on spine
      fuselageGrad.addColorStop(1, '#334155');
      ctx.fillStyle = fuselageGrad;
      
      ctx.beginPath();
      ctx.moveTo(0, -h/2 - 8); // Needle nose
      ctx.lineTo(3, -h/2 + 5);
      ctx.lineTo(5, h/2 + 10);
      ctx.lineTo(-5, h/2 + 10);
      ctx.lineTo(-3, -h/2 + 5);
      ctx.closePath();
      ctx.fill();

      // 5. Cockpit (Bubble Canopy)
      const glassGrad = ctx.createLinearGradient(0, -h/4, 0, -h/8);
      glassGrad.addColorStop(0, '#0284c7');
      glassGrad.addColorStop(1, '#e0f2fe'); // Reflection
      ctx.fillStyle = glassGrad;
      ctx.beginPath();
      // Teardrop shape for cockpit
      ctx.ellipse(0, -h/5, 4, 10, 0, 0, Math.PI*2);
      ctx.fill();
      // Specular highlight
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath();
      ctx.ellipse(-1.5, -h/5 - 3, 1.5, 4, 0.3, 0, Math.PI*2);
      ctx.fill();

      // 6. Engine Nozzle (Single)
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc(0, h/2 + 10, 4, 0, Math.PI*2);
      ctx.fill();

      // Afterburner Glow (Dynamic)
      if (Math.random() > 0.2) {
          ctx.fillStyle = 'rgba(255, 100, 0, 0.8)';
          ctx.beginPath();
          ctx.arc(0, h/2 + 12, 3 + Math.random()*2, 0, Math.PI*2);
          ctx.fill();
      }

      ctx.restore();
  };

  const drawBattleShip = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(x + 10, y + 10, 32, 40);

      // Gradient Hull
      const hullGrad = ctx.createLinearGradient(x, 0, x+32, 0);
      hullGrad.addColorStop(0, '#1e293b');
      hullGrad.addColorStop(0.5, '#475569');
      hullGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = hullGrad;
      
      ctx.beginPath();
      ctx.moveTo(x + 16, y + 40); 
      ctx.lineTo(x + 32, y + 10); 
      ctx.lineTo(x + 16, y); 
      ctx.lineTo(x, y + 10);
      ctx.fill();
      
      // Deck details
      ctx.fillStyle = '#64748b';
      ctx.fillRect(x + 8, y + 10, 16, 20);

      ctx.fillStyle = '#0f172a';
      ctx.beginPath(); 
      ctx.arc(x + 16, y + 12, 5, 0, Math.PI*2); 
      ctx.fill();
      ctx.fillRect(x + 15, y + 6, 2, 8);
  };

  const drawAttackHeli = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.arc(x+20, y+20, 10, 0, Math.PI*2);
      ctx.fill();

      ctx.fillStyle = '#14532d'; 
      ctx.beginPath();
      ctx.ellipse(x + 16, y + 14, 8, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      const angle = Date.now() / 30; // Faster spin
      ctx.beginPath();
      ctx.moveTo(x + 16 + Math.cos(angle)*20, y + 14 + Math.sin(angle)*20);
      ctx.lineTo(x + 16 - Math.cos(angle)*20, y + 14 - Math.sin(angle)*20);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 16 + Math.cos(angle + 1.57)*20, y + 14 + Math.sin(angle + 1.57)*20);
      ctx.lineTo(x + 16 - Math.cos(angle + 1.57)*20, y + 14 - Math.sin(angle + 1.57)*20);
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(x + 14, y + 18, 4, 6);
  };

  const drawTank = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string) => {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(x + 5, y + 5, 26, 26);

      ctx.fillStyle = color;
      ctx.fillRect(x + 2, y, 6, 24);
      ctx.fillRect(x + 24, y, 6, 24);
      
      ctx.fillStyle = '#374151';
      ctx.fillRect(x + 6, y + 4, 20, 16);
      
      // Turret with gradient
      const turrGrad = ctx.createLinearGradient(x+10, 0, x+22, 0);
      turrGrad.addColorStop(0, '#172554');
      turrGrad.addColorStop(0.5, '#3b82f6');
      turrGrad.addColorStop(1, '#172554');
      ctx.fillStyle = turrGrad;
      ctx.fillRect(x + 10, y + 8, 12, 10);
      ctx.fillStyle = '#000';
      ctx.fillRect(x + 15, y - 4, 2, 14); 
  };

  const drawFuel = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(x+5, y+5, 30, 40);

      const grad = ctx.createLinearGradient(x, 0, x+30, 0);
      grad.addColorStop(0, '#be185d');
      grad.addColorStop(0.5, '#ec4899');
      grad.addColorStop(1, '#be185d');

      ctx.fillStyle = grad;
      ctx.fillRect(x, y, 30, 40);
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px monospace';
      ctx.fillText("F", x + 9, y + 28);
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    // --- Ocean Background with Parallax Grid ---
    const grad = ctx.createLinearGradient(0, 0, BASE_WIDTH, 0);
    grad.addColorStop(0, '#0f172a'); // Darker deep sea
    grad.addColorStop(0.5, '#1e40af');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);

    // Scrolling Grid lines (Modern Cyber look)
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
    ctx.lineWidth = 1;
    const offset = scrollOffsetRef.current % 50;
    for(let i=0; i<BASE_HEIGHT/50 + 1; i++) {
        const y = i * 50 + offset - 50;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(BASE_WIDTH, y);
        ctx.stroke();
    }
    // Vertical grid lines
    for(let i=1; i<5; i++) {
        const x = i * (BASE_WIDTH / 5);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, BASE_HEIGHT);
        ctx.stroke();
    }

    // --- Banks (Terrain) ---
    ctx.fillStyle = '#064e3b'; // Dark emerald
    // Irregular banks
    ctx.beginPath();
    ctx.moveTo(0,0);
    for(let i=0; i<=BASE_HEIGHT; i+=20) {
        // Simple noise based on position
        const noise = Math.sin((i + scrollOffsetRef.current)*0.01) * 15;
        ctx.lineTo(40 + noise, i);
    }
    ctx.lineTo(0, BASE_HEIGHT);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(BASE_WIDTH, 0);
    for(let i=0; i<=BASE_HEIGHT; i+=20) {
        const noise = Math.sin((i + scrollOffsetRef.current + 100)*0.01) * 15;
        ctx.lineTo(BASE_WIDTH - 40 + noise, i);
    }
    ctx.lineTo(BASE_WIDTH, BASE_HEIGHT);
    ctx.fill();

    // --- Shadows & Objects ---
    objectsRef.current.forEach(obj => {
      if (!obj.active) return;
      if (obj.type === 'fuel') drawFuel(ctx, obj.x, obj.y);
      else if (obj.type === 'enemy_ship') drawBattleShip(ctx, obj.x, obj.y);
      else if (obj.type === 'enemy_heli') drawAttackHeli(ctx, obj.x, obj.y);
      else if (obj.type === 'enemy_tank') drawTank(ctx, obj.x, obj.y, obj.color);
    });

    // Particles (Engine trails & Explosions)
    particlesRef.current.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    });

    // Bullets
    bulletsRef.current.forEach(b => {
      if(!b.active) return;
      ctx.fillStyle = b.color;
      if (b.type === 'enemy_bullet') {
          // Glowing enemy orb
          ctx.shadowBlur = 8;
          ctx.shadowColor = 'red';
          ctx.beginPath();
          ctx.arc(b.x + b.width/2, b.y + b.height/2, 4, 0, Math.PI*2);
          ctx.fill();
          ctx.shadowBlur = 0;
      } else {
          // Player Laser
          ctx.shadowBlur = 5;
          ctx.shadowColor = 'cyan';
          ctx.fillRect(b.x, b.y, b.width, b.height);
          ctx.shadowBlur = 0;
      }
    });

    // Player
    const p = playerRef.current;
    drawFighterJet(ctx, p.x, p.y, p.width, p.height, p.bank);
  };

  const renderLoop = (time: number) => {
    update();
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) draw(ctx);
    requestRef.current = requestAnimationFrame(renderLoop);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(requestRef.current!);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true;
      if (e.code === 'Space') fireBullet();
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [fireBullet]);

  const handleTouch = (dir: string, active: boolean) => {
      if (dir === 'fire' && active) fireBullet();
      const map: Record<string, string> = { 'left': 'ArrowLeft', 'right': 'ArrowRight', 'up': 'ArrowUp', 'down': 'ArrowDown' };
      if (map[dir]) keysRef.current[map[dir]] = active;
  };

  return (
    <div ref={containerRef} className="relative w-full h-[85vh] md:h-[800px] flex flex-col items-center justify-center bg-zinc-900 overflow-hidden border-4 border-zinc-800 rounded-xl shadow-2xl">
      
      {/* HUD Overlay */}
      <div className="absolute top-4 left-4 right-4 flex justify-between font-mono text-xl z-10 pointer-events-none">
        <div className="bg-black/50 p-2 rounded border border-green-500 text-green-400 backdrop-blur-sm">
           <div className="text-xs text-green-600">SCORE</div>
           {gameState.score.toString().padStart(6, '0')}
        </div>
        <div className={`bg-black/50 p-2 rounded border ${gameState.fuel < 75 ? 'border-red-500 text-red-500 animate-pulse' : 'border-yellow-500 text-yellow-400'} backdrop-blur-sm`}>
           <div className="text-xs opacity-70">FUEL</div>
           {Math.floor(gameState.fuel)}
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={BASE_WIDTH}
        height={BASE_HEIGHT}
        className="w-full h-full object-fill bg-black shadow-[0_0_20px_rgba(0,0,0,0.5)]"
      />
      
      {/* Game State Overlays */}
      {(!gameState.isPlaying && !gameState.gameOver && !gameState.levelComplete) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20">
          <button 
            onClick={resetGame}
            className="group relative px-8 py-4 bg-transparent border-2 border-green-600 text-green-500 font-bold text-2xl uppercase tracking-widest hover:text-black overflow-hidden transition-all duration-300"
          >
            <span className="relative z-10 flex items-center gap-2"><i className="fas fa-fighter-jet"></i> ENGAGE</span>
            <div className="absolute inset-0 bg-green-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
          </button>
        </div>
      )}

      {gameState.levelComplete && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-900/90 backdrop-blur z-20 text-white text-center p-6 border-y-8 border-yellow-400">
              <h2 className="text-4xl font-bold mb-2 text-yellow-300 drop-shadow-lg">SECTOR SECURED</h2>
              <p className="text-xl mb-6">INTELLIGENCE DATA UPLOADED</p>
              <button 
              onClick={nextLevel}
              className="px-8 py-3 bg-white text-green-900 font-bold text-xl rounded hover:bg-gray-200 shadow-xl animate-pulse"
              >
              ADVANCE TO SECTOR {gameState.level + 1}
              </button>
          </div>
      )}

      {gameState.gameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/90 backdrop-blur z-20 text-white border-4 border-red-600">
          <h2 className="text-5xl font-bold mb-4 drop-shadow-md">K.I.A.</h2>
          <p className="text-2xl mb-6 font-mono">SCORE: {gameState.score}</p>
          <button 
            onClick={resetGame}
            className="px-6 py-3 bg-white text-red-900 font-bold text-xl rounded hover:bg-gray-200 shadow-lg"
          >
            REDEPLOY
          </button>
        </div>
      )}

      {/* Mobile Controls Overlay */}
      <div className="absolute bottom-4 left-0 right-0 p-4 grid grid-cols-3 gap-2 w-full max-w-[400px] mx-auto opacity-70 hover:opacity-100 transition-opacity z-30">
        <div className="col-start-2">
            <button 
               className="w-full h-16 bg-zinc-800/80 rounded border-2 border-white/20 active:bg-green-500/50"
               onTouchStart={() => handleTouch('up', true)} onTouchEnd={() => handleTouch('up', false)}
               onMouseDown={() => handleTouch('up', true)} onMouseUp={() => handleTouch('up', false)}
            ><i className="fas fa-chevron-up text-white"></i></button>
        </div>
        <div className="col-start-1 row-start-2">
            <button 
               className="w-full h-16 bg-zinc-800/80 rounded border-2 border-white/20 active:bg-green-500/50"
               onTouchStart={() => handleTouch('left', true)} onTouchEnd={() => handleTouch('left', false)}
               onMouseDown={() => handleTouch('left', true)} onMouseUp={() => handleTouch('left', false)}
            ><i className="fas fa-chevron-left text-white"></i></button>
        </div>
        <div className="col-start-2 row-start-2">
            <button 
               className="w-full h-16 bg-zinc-800/80 rounded border-2 border-white/20 active:bg-green-500/50"
               onTouchStart={() => handleTouch('down', true)} onTouchEnd={() => handleTouch('down', false)}
               onMouseDown={() => handleTouch('down', true)} onMouseUp={() => handleTouch('down', false)}
            ><i className="fas fa-chevron-down text-white"></i></button>
        </div>
        <div className="col-start-3 row-start-2">
            <button 
               className="w-full h-16 bg-zinc-800/80 rounded border-2 border-white/20 active:bg-green-500/50"
               onTouchStart={() => handleTouch('right', true)} onTouchEnd={() => handleTouch('right', false)}
               onMouseDown={() => handleTouch('right', true)} onMouseUp={() => handleTouch('right', false)}
            ><i className="fas fa-chevron-right text-white"></i></button>
        </div>
        <div className="col-start-3 row-start-1">
             <button 
               className="w-full h-16 bg-red-600/80 text-white font-bold rounded border-2 border-red-400 active:bg-red-500 active:scale-95 transition-transform"
               onTouchStart={() => handleTouch('fire', true)} onTouchEnd={() => handleTouch('fire', false)}
               onMouseDown={() => handleTouch('fire', true)} onMouseUp={() => handleTouch('fire', false)}
            ><i className="fas fa-crosshairs"></i></button>
        </div>
      </div>
    </div>
  );
};

export default GameEngine;