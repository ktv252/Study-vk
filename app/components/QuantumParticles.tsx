import { motion } from "framer-motion";

const particles = [
  { size: 100, top: "15%", left: "15%", color: "bg-purple-500/20", duration: 20 },
  { size: 150, top: "40%", left: "60%", color: "bg-blue-500/20", duration: 25 },
  { size: 80, top: "70%", left: "20%", color: "bg-indigo-500/20", duration: 22 },
  { size: 120, top: "80%", left: "80%", color: "bg-fuchsia-500/20", duration: 28 },
];

export const QuantumParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full ${p.color} blur-3xl`}
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            top: p.top,
            left: p.left,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};
