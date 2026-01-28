const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex justify-center items-center h-screen w-screen overflow-hidden relative bg-black">
      <div className="absolute top-0 left-80 w-full max-w-4xl h-[500px] bg-blue-500/25 blur-[160px] rounded-full pointer-events-none " />
      <div className="absolute bottom-10 -right-20 w-full max-w-2xl h-[260px] bg-gray-50/30 blur-[160px] rounded-full pointer-events-none " />
      {children}
    </div>
  );
};

export default AuthLayout;
