//  {/* TAB ACTIONS */}
//           {activeTab === "actions" && (
//             <div className="">
//               {/* =========================== */}
//               {/* PROJECT NAME AND CTA  */}
//               {/* =========================== */}
//               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-4 mb-5">
//                 {/* /PROJECT NAME ONLY */}
//                 <div className="space-y-2">
//                   <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-foreground to-foreground/50 truncate max-w-[450px]">
//                     {project.projectName}
//                   </h1>
//                 </div>
//                 {/* PUBLIC || VIEW REPO  */}
//                 <div className="flex items-center gap-3">
//                   {/* VIEW REPO */}
//                   <Link href={project.repoUrl} target="_blank">
//                     <Button
//                       className="gap-2 shadow-lg shadow-primary/20"
//                       size="sm"
//                     >
//                       <Github className="w-4 h-4" /> View On Github
//                     </Button>
//                   </Link>
//                 </div>
//               </div>

//               {/* ACTIONS 3 AGENTS */}
//               <h2 className="text-lg font-semibold">Agent & Intelligence</h2>
//               <p className="text-sm text-muted-foreground">
//                 Understand your project better with our AI agents and 3D
//                 Visualizations.
//               </p>
//               <div className="grid grid-cols-3 gap-10 my-8">
//                 <Link
//                   href={`/dashboard/my-projects/${project._id}/action/codebase-copilot`}
//                 >
//                   <Card className="bg-linear-to-br from-blue-500/30 via-indigo-500/5 to-transparent py-3 scale-95 hover:scale-100 transition-all duration-300 cursor-pointer">
//                     <CardHeader>
//                       <CardTitle className="flex items-center justify-between ">
//                         <p>
//                           <LucideBrain className="w-4 h-4 inline mr-2" />
//                           Codebase Copilot
//                         </p>
//                         <div className="py-1 px-3 text-xs text-blue-600 dark:text-white bg-linear-to-br from-blue-300 to-indigo-400/30 rounded-full w-fit">
//                           PRO
//                         </div>
//                       </CardTitle>
//                     </CardHeader>
//                     <CardContent>
//                       <div className="">
//                         <div>
//                           <p>
//                             Chat with your repository like a senior engineer.
//                           </p>
//                           <p className="text-muted-foreground text-sm">
//                             Understands codebase, logic, and View graphical
//                             representation of codebase.
//                           </p>
//                         </div>
//                         <Image
//                           src="/6.png"
//                           alt="Repo Intelligence Agent"
//                           width={120}
//                           height={120}
//                           className="object-contain mx-auto opacity-70"
//                         />
//                       </div>
//                     </CardContent>
//                   </Card>
//                 </Link>

//                 {/* 2 */}
//                 <Link
//                   href={`/dashboard/my-projects/${project._id}/action/data-model-visualizer`}
//                 >
//                   <Card className="bg-linear-to-br from-blue-500/30 via-indigo-500/5 to-transparent py-3 scale-95 hover:scale-100 transition-all duration-300 cursor-pointer">
//                     <CardHeader>
//                       <CardTitle className="flex items-center justify-between ">
//                         <p>
//                           <LucideBrain className="w-4 h-4 inline mr-2" />
//                           Data Model Visualizer
//                         </p>
//                         <div className="py-1 px-3 text-xs text-blue-600 dark:text-white bg-linear-to-br from-blue-300 to-indigo-400/30 rounded-full w-fit">
//                           PRO
//                         </div>
//                       </CardTitle>
//                     </CardHeader>
//                     <CardContent>
//                       <div className="">
//                         <div>
//                           <p>Turn code into clear system diagrams.</p>
//                           <p className="text-muted-foreground text-sm">
//                             Generates ER diagrams Creates system & data flow
//                             diagrams Explains relationships visually
//                           </p>
//                         </div>
//                         <Image
//                           src="/5.png"
//                           alt="Repo Intelligence Agent"
//                           width={120}
//                           height={120}
//                           className="object-contain mx-auto opacity-70"
//                         />
//                       </div>
//                     </CardContent>
//                   </Card>
//                 </Link>
//                 {/* 3 */}
//                 <Link
//                   href={`/dashboard/my-projects/${project._id}/action/architecture-explorer`}
//                 >
//                   <Card className="bg-linear-to-br from-blue-500/30 via-indigo-500/5 to-transparent py-3 scale-95 hover:scale-100 transition-all duration-300 cursor-pointer">
//                     <CardHeader>
//                       <CardTitle className="flex items-center justify-between ">
//                         <p>
//                           <LucideBrain className="w-4 h-4 inline mr-2" />
//                           Architecture Explorer
//                         </p>
//                         <div className="py-1 px-3 text-xs text-blue-600 dark:text-white bg-linear-to-br from-blue-300 to-indigo-400/30 rounded-full w-fit">
//                           PRO
//                         </div>
//                       </CardTitle>
//                     </CardHeader>
//                     <CardContent>
//                       <div className="">
//                         <div>
//                           <p>Understand your project architecture.</p>
//                           <p className="text-muted-foreground text-sm">
//                             Generates architecture diagrams. Perfect for
//                             generating Auth Flows, System Flows etc.
//                           </p>
//                         </div>
//                         <Image
//                           src="/7.png"
//                           alt="Auto Documentation Agent"
//                           width={120}
//                           height={120}
//                           className="object-contain mx-auto opacity-70"
//                         />
//                       </div>
//                     </CardContent>
//                   </Card>
//                 </Link>
//               </div>

//               {/* AUTOMATIONS AND INTEGRATIONS */}
//               <div className="mt-10">
//                 <h2 className="text-lg font-semibold">
//                   Automations & Integrations
//                 </h2>
//                 <p className="text-sm text-muted-foreground">
//                   Automate your project with our AI agents and Conenct your
//                   project with other tools.
//                 </p>

//                 <div className="grid space-y-5 my-6 px-6">
//                   {/* 1 README / DOC */}
//                   <div className="flex items-center bg-muted/70 p-3 rounded-md w-[500px]">
//                     <div className="bg-accent w-10 h-10 rounded-full flex items-center justify-center">
//                       <LucideFileText className="w-4 h-4 inline " />
//                     </div>
//                     <Separator orientation="vertical" className="mx-2 h-4" />
//                     <p className="text-sm">
//                       {" "}
//                       Readme | Documentation Generator.
//                     </p>
//                   </div>
//                   {/* 2 NOTION INTEGRATION */}
//                   <div className="flex items-center bg-muted/70 p-3 rounded-md w-[500px]">
//                     <div className="bg-accent w-10 h-10 rounded-full flex items-center justify-center">
//                       <LucideNotebook className="w-4 h-4 inline " />
//                     </div>
//                     <Separator orientation="vertical" className="mx-2 h-4" />
//                     <p className="text-sm">
//                       {" "}
//                       Notion Integration, streamline your workflow.
//                     </p>
//                   </div>
//                   {/* 3 SLACK INTEGRATION */}
//                   <div className="flex items-center bg-muted/70 p-3 rounded-md w-[500px]">
//                     <div className="bg-accent w-10 h-10 rounded-full flex items-center justify-center">
//                       <LucideSlack className="w-4 h-4 inline " />
//                     </div>
//                     <Separator orientation="vertical" className="mx-2 h-4" />
//                     <p className="text-sm">
//                       {" "}
//                       Slack Integration, streamline your workflow.
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}