"use client";
import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const CollaborationSlide = () => (
  <div className="relative px-4 py-5 w-full rounded-lg bg-linear-to-br from-gray-800 to-black backdrop-blur-sm">
    <div className="flex items-center gap-4 mb-4">
      <div className="flex -space-x-2">
        {[
          "https://randomuser.me/api/portraits/men/32.jpg",
          "https://randomuser.me/api/portraits/women/44.jpg",
          "https://randomuser.me/api/portraits/men/76.jpg",
          "https://randomuser.me/api/portraits/women/68.jpg",
        ].map((src, i) => (
          <div
            key={i}
            className="size-7 rounded-full border border-neutral-700 overflow-hidden"
          >
            <img
              alt="people"
              src={src}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      <div className="text-xs text-neutral-400">
        <span className="text-white">25+ active collaborators</span> building
        projects right now
      </div>
    </div>

    <div className="space-y-2">
      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
        <div className="h-full w-[75%] bg-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
      </div>
      <div className="flex justify-between text-[11px] text-neutral-400">
        <span>Product Tracking</span>
        <span>75% Complete</span>
      </div>
    </div>
  </div>
);

const ActivitySlide = () => (
  <div className="relative p-4 w-full rounded-lg bg-linear-to-br from-gray-800 to-black backdrop-blur-sm">
    {/* Header */}
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs text-neutral-400">GitHub Activity</span>
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
        Live
      </span>
    </div>

    {/* Activity rows */}
    <div className="space-y-2 text-sm">
      {/* Commits */}
      <div className="flex items-center justify-between group">
        <div className="flex items-center gap-2">
          <div className="size-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-white">Commits</span>
        </div>
        <span className="text-blue-400 font-medium">+42</span>
      </div>

      {/* PRs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-1.5 rounded-full bg-indigo-400" />
          <span className="text-white">Pull Requests</span>
        </div>
        <span className="text-indigo-400 font-medium">+6</span>
      </div>
    </div>

    {/* Footer: People signal */}
    <div className="flex items-center gap-2 mt-2">
      <div className="flex -space-x-2">
        {[
          "https://randomuser.me/api/portraits/men/21.jpg",
          "https://randomuser.me/api/portraits/women/33.jpg",
          "https://randomuser.me/api/portraits/men/54.jpg",
        ].map((src, i) => (
          <div
            key={i}
            className="size-5 rounded-full border border-neutral-700 overflow-hidden"
          >
            <img src={src} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>

      <span className="text-[11px] text-neutral-400">
        Activity from <span className="text-white">core contributors</span>
      </span>
    </div>
  </div>
);

const AutomationSlide = () => (
  <div className="relative  px-4 py-5 w-full rounded-lg bg-linear-to-br from-gray-800 to-black backdrop-blur-sm">
    {/* Top row: People + context */}
    <div className="flex items-center gap-4 mb-4">
      <div className="flex -space-x-2">
        {[
          "https://randomuser.me/api/portraits/men/41.jpg",
          "https://randomuser.me/api/portraits/women/52.jpg",
          "https://randomuser.me/api/portraits/men/18.jpg",
        ].map((src, i) => (
          <div
            key={i}
            className="size-7 rounded-full border border-neutral-700 overflow-hidden"
          >
            <img
              alt="reviewer"
              src={src}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      <div className="text-xs text-neutral-400">
        <span className="text-white">Deployment approved</span> by core team
      </div>
    </div>

    {/* Status bar */}
    <div className="space-y-2">
      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
        <div className="h-full w-full bg-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.5)]" />
      </div>

      <div className="flex justify-between text-[11px] text-neutral-400">
        <span>CI / CD Pipeline</span>
        <span className="text-blue-400">Passed</span>
      </div>
    </div>
  </div>
);

const slideVariants = {
  enter: {
    x: 40, // comes from right
    opacity: 0,
  },
  center: {
    x: 0,
    opacity: 1,
  },
  exit: {
    x: -40, // goes to left
    opacity: 0,
  },
};

const slides = [
  <CollaborationSlide key="collab" />,
  <ActivitySlide key="activity" />,
  <AutomationSlide key="automation" />,
];

export default function DesignCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 5000); // slow & calm

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-[480px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            duration: 0.45,
            ease: "easeOut",
          }}
        >
          {slides[index]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// import { motion } from "framer-motion";

// const Design = () => {
//   return (
//     <div>
//       {/* Visual Element: Activity Mockup */}
//       <motion.div
//         initial={{ opacity: 0, scale: 0.95 }}
//         animate={{ opacity: 1, scale: 1 }}
//         transition={{ delay: 0.4 }}
//         className="relative p-4 rounded-lg  bg-linear-to-br from-gray-800 to-black backdrop-blur-sm group"
//       >
//         <div className="flex items-center gap-4 mb-4">
//           {/* Avatars */}
//           <div className="flex -space-x-2">
//             {[
//               "https://randomuser.me/api/portraits/men/32.jpg",
//               "https://randomuser.me/api/portraits/women/44.jpg",
//               "https://randomuser.me/api/portraits/men/76.jpg",
//               "https://randomuser.me/api/portraits/women/68.jpg",
//             ].map((src, i) => (
//               <div
//                 key={i}
//                 className="size-7 rounded-full border border-neutral-700 bg-neutral-800 overflow-hidden"
//               >
//                 <img
//                   src={src}
//                   alt="collaborator"
//                   className="w-full h-full object-cover"
//                 />
//               </div>
//             ))}
//           </div>

//           {/* Text */}
//           <div className="text-xs text-neutral-400 font-medium">
//             <span className="text-white">25+ active collaborators</span>{" "}
//             building projects right now
//           </div>
//         </div>

//         <div className="space-y-3">
//           <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
//             <motion.div
//               initial={{ width: 0 }}
//               animate={{ width: "75%" }}
//               transition={{ duration: 1.5, delay: 0.6 }}
//               className="h-full bg-blue-900/30 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
//             />
//           </div>
//           <div className="flex justify-between text-[11px] text-neutral-400 capitalize tracking-tighter">
//             <span>Product Tracking</span>
//             <span>75% Complete</span>
//           </div>
//         </div>
//       </motion.div>
//     </div>
//   );
// };

// export default Design;
