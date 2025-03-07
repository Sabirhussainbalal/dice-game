import { useState, useRef, useEffect } from "react";
import { ToastContainer, toast } from 'react-toastify';

// Helper function: proper modulus for negative numbers
// Helper function for proper modulus (handling negatives)
function mod(n, m) {
  return ((n % m) + m) % m;
}

function App() {
  const [gamestart, setGamestart] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false); // Track first-time animation
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(0); // Time in seconds
  const [selectnum, setselectnum] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState(false);
  const numbers = [1, 2, 3, 4, 5, 6];
  const [your, setYour] = useState(0);
  const [opponent, setOpponent] = useState(0);
  const [show, setShow] = useState(false);
  const notify = () => toast();

  const cubeRef = useRef(null);
  const audioRef = useRef(null);
  const rollingRef = useRef(false);
  // Store the current absolute rotation in degrees
  const currentRotation = useRef({ x: 0, y: 0 });

  // Mapping from dice face to its base transform (in degrees)
  // Cube faces: front=1, back=6, right=3, left=4, top=2, bottom=5
  const finalTransforms = {
    1: { x: 0, y: 0 },
    6: { x: 0, y: 180 },
    3: { x: 0, y: -90 }, // swapped
    4: { x: 0, y: 90 }, // swapped
    2: { x: -90, y: 0 },
    5: { x: 90, y: 0 },
  };

  useEffect(() => {
    if (show && !hasPlayed) {
      setShowAnimation(true);
      setHasPlayed(true); // Mark animation as played

      const timer = setTimeout(() => {
        setShowAnimation(false);
      }, 2000); // Hide after 2 seconds

      return () => clearTimeout(timer);
    }
  }, [show, hasPlayed]); // Only runs if `show` is true and animation hasn't played before

  const rollDice = () => {
    if (selectnum === null) {
      setError(true);
      return;
    } else {
      setError(false);
      setIsRunning(true);
      setShow(true);
    }
    if (rollingRef.current) return; // prevent overlapping rolls
    rollingRef.current = true;

    // Play the sound effect
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }

    // Choose a random dice face (1–6)
    const diceValues = [1, 2, 3, 4, 5, 6];
    const randomDice =
      diceValues[Math.floor(Math.random() * diceValues.length)];

    // Get the target base transform for the chosen face
    const target = finalTransforms[randomDice];

    // Get current rotation mod 360
    const currentXMod = mod(currentRotation.current.x, 360);
    const currentYMod = mod(currentRotation.current.y, 360);

    // Compute minimal difference to reach the target orientation
    let diffX = target.x - currentXMod;
    let diffY = target.y - currentYMod;

    // Adjust differences to be in the range (-180, 180]
    if (diffX > 180) diffX -= 360;
    if (diffX <= -180) diffX += 360;
    if (diffY > 180) diffY -= 360;
    if (diffY <= -180) diffY += 360;

    // If the difference is too small, add an extra full spin for effect
    if (Math.abs(diffX) < 45) {
      diffX += diffX >= 0 ? 360 : -360;
    }
    if (Math.abs(diffY) < 45) {
      diffY += diffY >= 0 ? 360 : -360;
    }

    // Add extra full spins (1 or 2 turns)
    const extraSpinX = 360 * (Math.floor(Math.random() * 2) + 1);
    const extraSpinY = 360 * (Math.floor(Math.random() * 2) + 1);

    // Compute the final absolute rotation angles
    const finalX = currentRotation.current.x + diffX + extraSpinX;
    const finalY = currentRotation.current.y + diffY + extraSpinY;

    // Compute an intermediate state (50%) with slight randomness for natural look
    const midX =
      currentRotation.current.x +
      (finalX - currentRotation.current.x) / 2 +
      (Math.random() * 30 - 15);
    const midY =
      currentRotation.current.y +
      (finalY - currentRotation.current.y) / 2 +
      (Math.random() * 30 - 15);

    // Animation duration in seconds
    const duration = 2.5;

    // Create dynamic keyframes for the smooth roll animation
    const keyframes = `
      @keyframes rollAnimation {
        0% { transform: rotateX(${currentRotation.current.x}deg) rotateY(${currentRotation.current.y}deg); }
        50% { transform: rotateX(${midX}deg) rotateY(${midY}deg); }
        100% { transform: rotateX(${finalX}deg) rotateY(${finalY}deg); }
      }
    `;

    // Insert the keyframes into a temporary style element
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = keyframes;
    document.head.appendChild(styleSheet);

    // Apply the animation to the cube element
    cubeRef.current.style.animation = `rollAnimation ${duration}s ease-out forwards`;

    // When the animation ends, set the final transform explicitly so it "locks" on the chosen face.
    const handleAnimationEnd = () => {
      cubeRef.current.style.animation = "";
      document.head.removeChild(styleSheet);
      // Set the final transform inline so it persists
      cubeRef.current.style.transform = `rotateX(${finalX}deg) rotateY(${finalY}deg)`;
      // Update the stored rotation for subsequent rolls
      currentRotation.current = { x: finalX, y: finalY };
      rollingRef.current = false;
      cubeRef.current.removeEventListener("animationend", handleAnimationEnd);
      setYour(selectnum);
      setOpponent(randomDice);

      if (randomDice === selectnum) {
        setScore(score + randomDice);
      } else {
        setScore(score - randomDice);
      }
      selectnum && setselectnum(null);
    };

    cubeRef.current.addEventListener("animationend", handleAnimationEnd);
  };

  useEffect(() => {
    let timer;
    if (isRunning) {
      timer = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      clearInterval(timer);
    }

    return () => clearInterval(timer);
  }, [isRunning]);

  // Format time (mm:ss)
  // Format time (mm:ss)
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };


  const resetall = () => {
    setShowAnimation(false);
    setHasPlayed(false);
    setScore(0);
    setTime(0);
    setselectnum(null);
    setIsRunning(false);
    setError(false);
    setYour(0);
    setOpponent(0);
    setShow(false);
  };

  const reset = () => {
  resetall();
    if(show){

      toast("Game Reset Successfully");
    }else{
      toast("Game Already Reset...");
    }
  };

  const exist = () => {
   resetall();
   setGamestart(false);
   toast("Game Exists");
  };

  return (
    <>
            <ToastContainer />
      {gamestart ? (
        <div className="min-h-screen flex justify-center items-center flex-col gap-5">
          <div
            className={`text-3xl font-black my-2 ${
              error ? "text-red-700" : "text-black"
            }`}
          >
            {error ? "Please Select a Number" : "Select a Number"}
          </div>
          <div className="font-bold">
            {show ? (
              <>
                You Enter {your} and Dice Roll{" "}
                {your === opponent ? (
                  <span>{opponent}</span>
                ) : (
                  <span className="text-red-700">{opponent}</span>
                )}
              </>
            ) : (
              "......"
            )}
          </div>

          {/* Numbers */}
          <div className="flex justify-center items-center">
            {numbers.map((number) => (
              <div className="m-2">
                <div
                  onClick={() => setselectnum(number)}
                  key={number}
                  className={`p-5 py-4 border cursor-pointer font-bold hover:bg-[#494b4b] hover:border-[#494b4b] hover:text-white hover:scale-110 transition-all duration-300 ease-in-out
                   ${
                     selectnum === number
                       ? "bg-[#494b4b] text-white"
                       : "text-black bg-none"
                   }
                  `}
                >
                  {number}
                </div>
              </div>
            ))}
          </div>
          {/* dice */}
          <div className="scene" onClick={rollDice}>
            <div className="cube" ref={cubeRef}>
              {/* Front face: 1 */}
              <div className="cube-face cube-face--front">
                <img src="./src/assets/dice1.png" alt="1" />
              </div>
              {/* Back face: 6 */}
              <div className="cube-face cube-face--back">
                <img src="./src/assets/dice6.png" alt="6" />
              </div>
              {/* Right face: 3 */}
              <div className="cube-face cube-face--right">
                <img src="./src/assets/dice3.png" alt="3" />
              </div>
              {/* Left face: 4 */}
              <div className="cube-face cube-face--left">
                <img src="./src/assets/dice4.png" alt="4" />
              </div>
              {/* Top face: 2 */}
              <div className="cube-face cube-face--top">
                <img src="./src/assets/dice2.png" alt="2" />
              </div>
              {/* Bottom face: 5 */}
              <div className="cube-face cube-face--bottom">
                <img src="./src/assets/dice5.png" alt="5" />
              </div>
            </div>
            <audio ref={audioRef} src="./src/assets/sound.mp4" />
          </div>
          <p>Click on dice to roll</p>
          {/* Score */}
          <h1 className="font-bold mx-3 relative">
            Total Score:{" "}
            <span className={score < 0 ? "text-red-700" : "text-green-700"}>
              {score}
            </span>
            {showAnimation && (
              <span
                className={`mx-3 absolute transition-opacity duration-200 ease-in-out ${
                  your === opponent
                    ? "text-green-700 animate-pulse"
                    : "text-red-700 animate-bounce"
                }`}
              >
                {your === opponent ? `+${opponent}` : `-${opponent}`}
              </span>
            )}
          </h1>
          {/* time */}
          <h1 className="font-bold mx-3">
            Time: <span>{formatTime(time)}</span>
          </h1>
          {/* Reset */}
          <div className="cursor-pointer bg-[#494b4b] my-5 absolute bottom-5   w-[25%]  flex justify-center items-center min-h-[45px] font-bold transition-all duration-300 ease-in-out gap-5 group  hover:shadow-lg hover:shadow-[#ffffff2e]">
            <span className="text-[#a8a9b4] group-hover:text-white transition-all duration-300">
              Reset Game
            </span>

     
            <button
              className="absolute flex justify-center cursor-pointer items-center bottom-[-5px] right-[-5px] w-4 h-4 bg-[#ffffff2e] rounded-full group-hover:w-full group-hover:h-full transition-all duration-300 ease-in-out group-hover:rounded-none"
              onClick={reset}
            >
              {" "}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#a8a9b4"
              >
                <path
                  className="group-hover:fill-[#149ddd] transition-all duration-300"
                  d="M520-330v-60h160v60H520Zm60 210v-50h-60v-60h60v-50h60v160h-60Zm100-50v-60h160v60H680Zm40-110v-160h60v50h60v60h-60v50h-60Zm111-280h-83q-26-88-99-144t-169-56q-117 0-198.5 81.5T200-480q0 72 32.5 132t87.5 98v-110h80v240H160v-80h94q-62-50-98-122.5T120-480q0-75 28.5-140.5t77-114q48.5-48.5 114-77T480-840q129 0 226.5 79.5T831-560Z"
                />
              </svg>
            </button>
          </div>
          {/* exist and stop */}
          {isRunning ? (
            <>
              <div className="absolute top-5 right-5 flex gap-5">
                <button
                  className="px-3 py-2 bg-[#494b4b] hover:bg-[#494b4b79] font-bold text-white cursor-pointer"
                  onClick={() => setIsRunning(false)}
                >
                  Pause Game
                </button>
                <button className="px-3 py-2 bg-[#494b4b] hover:bg-[#494b4b79] font-bold text-white cursor-pointer" onClick={exist}>
                  Exist Game
                </button>
              </div>
            </>
          ) : (
            ""
          )}

          {!isRunning & hasPlayed ? (
            <>
              <div className="bg-[#00000075] absolute w-full h-full">
                <button
                  className="px-3 py-2 bg-[#494b4b] hover:bg-[#494b4b79] absolute font-bold text-white cursor-pointer top-5 right-5 "
                  onClick={() => setIsRunning(true)}
                >
                  Resume Game
                </button>
              </div>
            </>
          ) : (
            ""
          )}
        </div>
      ) : (
        <div className="min-h-screen flex justify-center items-center">
          <div className="w-[50%] ">
            <img src="./src/assets/main.png" alt="" />
          </div>

          <div>
            <div className="text-4xl font-black my-2">The Dice Game</div>
            <div className="flex justify-end ">
              <button
                className=" px-5 py-2 cursor-pointer bg-black text-white font-semibold hover:bg-gray-600 hover:shadow-[0_5px_20px_0px_black] transition-all duration-300 ease-in-out hover:scale-110"
                onClick={() => setGamestart(true)}
              >
                Start Game
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
