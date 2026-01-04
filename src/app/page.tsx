import React from "react";
import { Navbar } from "../modules/web/header";

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Navbar />
      <h1 className="text-3xl">MARKETING PAGE </h1>
      <h1 className="text-7xl">BUILD TOGETHER , SHIP FASTER</h1>
    </div>
  );
};

export default Home;
