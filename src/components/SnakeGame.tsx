import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Trophy,
  Flame,
  ShieldAlert,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };
type GameMode = 'classic' | 'speed' | 'obstacles';

const GRID_SIZE = 20;
const INITIAL_SPEED = 140;

interface SnakeGameProps {
  onGoToFeedback?: () => void;
}

export const SnakeGame: React.FC<SnakeGameProps> = ({ onGoToFeedback }) => {
  const [snake, setSnake] = useState<Position[]>([
    { x: 10, y: 10 },
    { x: 10, y: 11 },
    { x: 10, y: 12 },
  ]);
  const [food, setFood] = useState<Position>({ x: 5, y: 5 });
  const [bonusFood, setBonusFood] = useState<Position | null>(null);
  const [obstacles, setObstacles] = useState<Position[]>([]);
  const [direction, setDirection] = useState<Direction>('UP');
  const [nextDirection, setNextDirection] = useState<Direction>('UP');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem('snake_beta_highscore') || '0', 10);
  });
  const [gameMode, setGameMode] = useState<GameMode>('classic');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(INITIAL_SPEED);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Play synthesized retro sounds
  const playSound = useCallback(
    (type: 'eat' | 'bonus' | 'die' | 'turn') => {
      if (!soundEnabled) return;
      try {
        if (!audioCtxRef.current) {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            audioCtxRef.current = new AudioContextClass();
          }
        }
        const ctx = audioCtxRef.current;
        if (!ctx) return;
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;

        if (type === 'eat') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(320, now);
          osc.frequency.exponentialRampToValueAtTime(640, now + 0.08);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
          osc.start(now);
          osc.stop(now + 0.08);
        } else if (type === 'bonus') {
          osc.type = 'square';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
          osc.start(now);
          osc.stop(now + 0.15);
        } else if (type === 'die') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(280, now);
          osc.frequency.linearRampToValueAtTime(70, now + 0.35);
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
          osc.start(now);
          osc.stop(now + 0.35);
        } else if (type === 'turn') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(220, now);
          gain.gain.setValueAtTime(0.05, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);
          osc.start(now);
          osc.stop(now + 0.03);
        }
      } catch (e) {
        // audio fail-safe
      }
    },
    [soundEnabled]
  );

  // Generate random obstacle blocks
  const generateObstacles = useCallback((): Position[] => {
    const newObstacles: Position[] = [];
    const count = 6;
    for (let i = 0; i < count; i++) {
      const obs = {
        x: Math.floor(Math.random() * (GRID_SIZE - 4)) + 2,
        y: Math.floor(Math.random() * (GRID_SIZE - 4)) + 2,
      };
      // Avoid center spawn area
      if (Math.abs(obs.x - 10) > 2 || Math.abs(obs.y - 11) > 2) {
        newObstacles.push(obs);
      }
    }
    return newObstacles;
  }, []);

  // Spawn food avoiding snake & obstacles
  const spawnFood = useCallback(
    (currentSnake: Position[], currentObstacles: Position[]): Position => {
      let newFood: Position;
      let collision = true;
      while (collision) {
        newFood = {
          x: Math.floor(Math.random() * GRID_SIZE),
          y: Math.floor(Math.random() * GRID_SIZE),
        };
        const hitsSnake = currentSnake.some((s) => s.x === newFood.x && s.y === newFood.y);
        const hitsObstacle = currentObstacles.some((o) => o.x === newFood.x && o.y === newFood.y);
        if (!hitsSnake && !hitsObstacle) {
          return newFood;
        }
      }
      return { x: 5, y: 5 };
    },
    []
  );

  // Reset Game
  const resetGame = useCallback(() => {
    const newObstacles = gameMode === 'obstacles' ? generateObstacles() : [];
    const initialSnake = [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 },
    ];
    setSnake(initialSnake);
    setObstacles(newObstacles);
    setFood(spawnFood(initialSnake, newObstacles));
    setBonusFood(null);
    setDirection('UP');
    setNextDirection('UP');
    setIsGameOver(false);
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setIsPlaying(true);
  }, [gameMode, generateObstacles, spawnFood]);

  // Handle Keyboard Inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ' || e.code === 'Space') {
        if (isGameOver) {
          resetGame();
        } else {
          setIsPlaying((prev) => !prev);
        }
        return;
      }

      if (!isPlaying || isGameOver) return;

      if ((e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') && direction !== 'DOWN') {
        setNextDirection('UP');
        playSound('turn');
      } else if ((e.key === 'ArrowDown' || e.key.toLowerCase() === 's') && direction !== 'UP') {
        setNextDirection('DOWN');
        playSound('turn');
      } else if ((e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') && direction !== 'RIGHT') {
        setNextDirection('LEFT');
        playSound('turn');
      } else if ((e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') && direction !== 'LEFT') {
        setNextDirection('RIGHT');
        playSound('turn');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, isPlaying, isGameOver, resetGame, playSound]);

  // Game Loop
  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    const gameInterval = setInterval(() => {
      setSnake((prevSnake) => {
        const head = { ...prevSnake[0] };
        const currentDir = nextDirection;
        setDirection(currentDir);

        if (currentDir === 'UP') head.y -= 1;
        if (currentDir === 'DOWN') head.y += 1;
        if (currentDir === 'LEFT') head.x -= 1;
        if (currentDir === 'RIGHT') head.x += 1;

        // Check Wall Collision
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          setIsGameOver(true);
          setIsPlaying(false);
          playSound('die');
          return prevSnake;
        }

        // Check Self Collision
        if (prevSnake.some((segment) => segment.x === head.x && segment.y === head.y)) {
          setIsGameOver(true);
          setIsPlaying(false);
          playSound('die');
          return prevSnake;
        }

        // Check Obstacle Collision
        if (obstacles.some((obs) => obs.x === head.x && obs.y === head.y)) {
          setIsGameOver(true);
          setIsPlaying(false);
          playSound('die');
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

        // Check Normal Food
        if (head.x === food.x && head.y === food.y) {
          const points = gameMode === 'speed' ? 15 : 10;
          setScore((prev) => {
            const nextScore = prev + points;
            if (nextScore > highScore) {
              setHighScore(nextScore);
              localStorage.setItem('snake_beta_highscore', nextScore.toString());
            }
            return nextScore;
          });
          playSound('eat');
          setFood(spawnFood(newSnake, obstacles));

          // Speed rush logic
          if (gameMode === 'speed') {
            setSpeed((s) => Math.max(65, s - 4));
          }

          // Random bonus apple chance
          if (Math.random() < 0.25 && !bonusFood) {
            setBonusFood(spawnFood(newSnake, obstacles));
          }
        } else if (bonusFood && head.x === bonusFood.x && head.y === bonusFood.y) {
          // Ate bonus gold apple!
          setScore((prev) => {
            const nextScore = prev + 50;
            if (nextScore > highScore) {
              setHighScore(nextScore);
              localStorage.setItem('snake_beta_highscore', nextScore.toString());
            }
            return nextScore;
          });
          playSound('bonus');
          setBonusFood(null);
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, speed);

    return () => clearInterval(gameInterval);
  }, [
    isPlaying,
    isGameOver,
    nextDirection,
    food,
    bonusFood,
    obstacles,
    highScore,
    speed,
    gameMode,
    spawnFood,
    playSound,
  ]);

  const changeDirection = (newDir: Direction) => {
    if (newDir === 'UP' && direction !== 'DOWN') setNextDirection('UP');
    if (newDir === 'DOWN' && direction !== 'UP') setNextDirection('DOWN');
    if (newDir === 'LEFT' && direction !== 'RIGHT') setNextDirection('LEFT');
    if (newDir === 'RIGHT' && direction !== 'LEFT') setNextDirection('RIGHT');
    playSound('turn');
  };

  return (
    <div className="bg-slate-900 border border-emerald-500/20 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
      {/* Decorative Grid Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
              Beta Build v0.8.2
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Live Playable Sandbox
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white mt-1">Snake Game Playtest</h2>
          <p className="text-sm text-slate-400">
            Test controls, responsiveness, and mechanics before submitting feedback.
          </p>
        </div>

        {/* Action Controls & Sounds */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title={soundEnabled ? 'Mute Audio' : 'Enable Audio'}
          >
            {soundEnabled ? <Volume2 size={18} className="text-emerald-400" /> : <VolumeX size={18} />}
          </button>

          <div className="flex bg-slate-800 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => {
                setGameMode('classic');
                resetGame();
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                gameMode === 'classic'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Classic
            </button>
            <button
              onClick={() => {
                setGameMode('speed');
                resetGame();
              }}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                gameMode === 'speed'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Flame size={12} />
              Speed Rush
            </button>
            <button
              onClick={() => {
                setGameMode('obstacles');
                resetGame();
              }}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                gameMode === 'obstacles'
                  ? 'bg-purple-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldAlert size={12} />
              Obstacles
            </button>
          </div>
        </div>
      </div>

      {/* Main Play Area & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Game Canvas Container */}
        <div className="lg:col-span-8 flex flex-col items-center">
          {/* Scoreboard bar */}
          <div className="w-full max-w-md flex items-center justify-between bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-xl mb-3 font-mono">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs">SCORE:</span>
              <span className="text-lg font-bold text-emerald-400">{score}</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy size={14} className="text-amber-400" />
              <span className="text-slate-400 text-xs">BEST:</span>
              <span className="text-lg font-bold text-amber-400">{highScore}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <span>LEN:</span>
              <span className="text-slate-200 font-bold">{snake.length}</span>
            </div>
          </div>

          {/* Grid Board */}
          <div className="relative w-full max-w-md aspect-square bg-slate-950 border-2 border-emerald-500/40 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.15)]">
            {/* Grid Pattern Lines */}
            <div
              className="absolute inset-0 grid"
              style={{
                gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, idx) => (
                <div key={idx} className="border-[0.5px] border-slate-900/60" />
              ))}
            </div>

            {/* Snake Body & Head */}
            {snake.map((segment, index) => {
              const isHead = index === 0;
              return (
                <div
                  key={index}
                  className={`absolute rounded-sm transition-all duration-75 ${
                    isHead
                      ? 'bg-emerald-400 shadow-[0_0_8px_#34d399] z-20'
                      : 'bg-emerald-600/90 z-10'
                  }`}
                  style={{
                    width: `${100 / GRID_SIZE}%`,
                    height: `${100 / GRID_SIZE}%`,
                    left: `${(segment.x / GRID_SIZE) * 100}%`,
                    top: `${(segment.y / GRID_SIZE) * 100}%`,
                  }}
                >
                  {isHead && (
                    <div className="w-full h-full relative flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-slate-950 rounded-full" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Food item */}
            <div
              className="absolute z-10 flex items-center justify-center animate-pulse"
              style={{
                width: `${100 / GRID_SIZE}%`,
                height: `${100 / GRID_SIZE}%`,
                left: `${(food.x / GRID_SIZE) * 100}%`,
                top: `${(food.y / GRID_SIZE) * 100}%`,
              }}
            >
              <div className="w-3/4 h-3/4 bg-red-500 rounded-full shadow-[0_0_10px_#ef4444]" />
            </div>

            {/* Bonus Gold Apple */}
            {bonusFood && (
              <div
                className="absolute z-10 flex items-center justify-center animate-bounce"
                style={{
                  width: `${100 / GRID_SIZE}%`,
                  height: `${100 / GRID_SIZE}%`,
                  left: `${(bonusFood.x / GRID_SIZE) * 100}%`,
                  top: `${(bonusFood.y / GRID_SIZE) * 100}%`,
                }}
              >
                <div className="w-3/4 h-3/4 bg-amber-400 rounded-full shadow-[0_0_12px_#f59e0b] border border-yellow-200" />
              </div>
            )}

            {/* Obstacles */}
            {obstacles.map((obs, i) => (
              <div
                key={i}
                className="absolute z-10 bg-purple-700/80 border border-purple-400/50 rounded-sm flex items-center justify-center"
                style={{
                  width: `${100 / GRID_SIZE}%`,
                  height: `${100 / GRID_SIZE}%`,
                  left: `${(obs.x / GRID_SIZE) * 100}%`,
                  top: `${(obs.y / GRID_SIZE) * 100}%`,
                }}
              >
                <div className="w-1 h-1 bg-purple-200 rounded-full" />
              </div>
            ))}

            {/* Game Over Overlay */}
            {isGameOver && (
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center">
                <span className="text-3xl mb-2">💥</span>
                <h3 className="text-xl font-black text-red-400 tracking-wider font-mono">
                  GAME OVER
                </h3>
                <p className="text-sm text-slate-300 mt-1">Final Score: {score}</p>
                {score >= highScore && score > 0 && (
                  <span className="text-xs text-amber-400 font-bold mt-1 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                    🏆 New Personal High Score!
                  </span>
                )}
                <div className="flex flex-col sm:flex-row gap-2 mt-5">
                  <button
                    onClick={resetGame}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-1.5 text-sm transition-all shadow-lg"
                  >
                    <RotateCcw size={16} /> Play Again
                  </button>
                  {onGoToFeedback && (
                    <button
                      onClick={onGoToFeedback}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold rounded-xl flex items-center justify-center gap-1.5 text-sm border border-emerald-500/30 transition-all"
                    >
                      <MessageSquare size={16} /> Rate & Report Bugs
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Start / Paused Overlay */}
            {!isPlaying && !isGameOver && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs z-30 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-3 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <Play size={26} className="ml-1" />
                </div>
                <h3 className="text-lg font-bold text-white">Ready to Playtest?</h3>
                <p className="text-xs text-slate-400 max-w-xs mt-1 mb-4">
                  Use WASD, Arrow keys, or the on-screen touch D-pad below to steer.
                </p>
                <button
                  onClick={() => setIsPlaying(true)}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/25"
                >
                  Start Game
                </button>
              </div>
            )}
          </div>

          {/* Action Row below canvas */}
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => {
                if (isGameOver) resetGame();
                else setIsPlaying(!isPlaying);
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              {isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            </button>
            <button
              onClick={resetGame}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <RotateCcw size={14} /> Reset
            </button>
          </div>
        </div>

        {/* Touch D-Pad & Tester Testing Notes */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Virtual Mobile D-Pad (for mobile preview or touch simulation) */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Touch D-Pad Simulation
            </span>
            <div className="grid grid-cols-3 gap-2 w-48">
              <div />
              <button
                onClick={() => changeDirection('UP')}
                disabled={!isPlaying || direction === 'DOWN'}
                className="h-12 bg-slate-800 hover:bg-emerald-600/30 active:bg-emerald-500 active:text-slate-950 text-slate-200 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
              >
                <ArrowUp size={20} />
              </button>
              <div />

              <button
                onClick={() => changeDirection('LEFT')}
                disabled={!isPlaying || direction === 'RIGHT'}
                className="h-12 bg-slate-800 hover:bg-emerald-600/30 active:bg-emerald-500 active:text-slate-950 text-slate-200 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
              >
                <ArrowLeft size={20} />
              </button>
              <button
                onClick={resetGame}
                className="h-12 bg-slate-900 border border-slate-700 text-slate-400 hover:text-white rounded-xl flex items-center justify-center text-xs font-mono font-bold"
              >
                RESET
              </button>
              <button
                onClick={() => changeDirection('RIGHT')}
                disabled={!isPlaying || direction === 'LEFT'}
                className="h-12 bg-slate-800 hover:bg-emerald-600/30 active:bg-emerald-500 active:text-slate-950 text-slate-200 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
              >
                <ArrowRight size={20} />
              </button>

              <div />
              <button
                onClick={() => changeDirection('DOWN')}
                disabled={!isPlaying || direction === 'UP'}
                className="h-12 bg-slate-800 hover:bg-emerald-600/30 active:bg-emerald-500 active:text-slate-950 text-slate-200 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
              >
                <ArrowDown size={20} />
              </button>
              <div />
            </div>
            <p className="text-[11px] text-slate-500 text-center mt-3">
              Simulates touch response for mobile Android beta evaluations.
            </p>
          </div>

          {/* Test Focus Checklist */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>🎯</span> What to evaluate while playing:
            </h4>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4">
              <li>Input responsiveness & turn delays</li>
              <li>Collision accuracy near boundaries</li>
              <li>Sound feedback on food eating & collision</li>
              <li>Performance smoothness under Speed Rush mode</li>
              <li>Touch button ergonomics on mobile devices</li>
            </ul>

            {onGoToFeedback && (
              <button
                onClick={onGoToFeedback}
                className="w-full mt-4 py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
              >
                <MessageSquare size={16} />
                Submit Post-Play Feedback Form
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
