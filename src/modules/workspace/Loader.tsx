"use client"
import React, { useState, useEffect } from 'react'
import { CheckCircle2 } from 'lucide-react'

const LoaderPage = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [prevIndex, setPrevIndex] = useState(-1);
    const totalSlides = 3;

    useEffect(() => {
        const interval = setInterval(() => {
            setPrevIndex(currentIndex);
            setCurrentIndex((prev) => (prev + 1) % totalSlides);
        }, 3000);
        return () => clearInterval(interval);
    }, [currentIndex]);

    const getSlideClass = (index: number) => {
        if (index === currentIndex) return "slide active";
        if (index === prevIndex) return "slide exit";
        return "slide";
    };

    return (
        <div>
            <div className="relative w-full max-w-lg h-[360px] mx-auto"  id="slider-container">

                {/* Slide 1: Avocado Alien (Lime) */}
                <div className={`${getSlideClass(0)} group flex flex-col h-full rounded-2xl border bg-neutral-900 overflow-hidden shadow-2xl shadow-black/50`}>
                    {/* Window Preview Area */}
                    <div className="p-5 pt-8 bg-neutral-900 flex-1 flex flex-col justify-end">
                        <div className="w-full rounded-t-lg bg-neutral-950 border border-neutral-800 border-b-0 overflow-hidden shadow-xl">
                            {/* Window Header */}
                            <div className="flex items-center gap-1.5 px-3 py-2 bg-neutral-900 border-b border-neutral-800/50">
                                <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
                                <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
                                <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
                            </div>
                            {/* Window Body: Dashboard Layout */}
                            <div className="flex h-50 bg-neutral-950">
                                {/* Sidebar */}
                                <div className="w-14 border-r border-neutral-800 bg-neutral-900/30 flex flex-col gap-2 p-2 pt-3">
                                    <div className="h-4 w-4 rounded-md bg-neutral-700/50 mb-1 mx-auto"></div>
                                    {/* Active Nav */}
                                    <div className="h-7 w-full bg-neutral-800 rounded-md flex items-center justify-center border border-neutral-700/50 shadow-sm">
                                        <div className="h-3 w-3 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(132,204,22,0.6)] animate-pulse"></div>
                                    </div>
                                    {/* Inactive Nav */}
                                    <div className="h-7 w-full flex items-center justify-center opacity-40">
                                        <div className="h-1 w-4 bg-neutral-700 rounded-full"></div>
                                    </div>
                                    <div className="h-7 w-full flex items-center justify-center opacity-40">
                                        <div className="h-1 w-4 bg-neutral-700 rounded-full"></div>
                                    </div>
                                </div>
                                
                                {/* Main Content */}
                                <div className="flex-1 p-3 flex flex-col gap-3">
                                    {/* Breadcrumb & User */}
                                    <div className="flex justify-between items-center pb-2 border-b border-neutral-800/50">
                                        <div className="h-1.5 w-16 bg-neutral-800 rounded-full"></div>
                                        <div className="flex gap-1.5 items-center">
                                            <div className="h-1.5 w-8 bg-neutral-800 rounded-full hidden sm:block"></div>
                                            <div className="h-3 w-3 rounded-full bg-neutral-700"></div>
                                        </div>
                                    </div>
                                    
                                    {/* Stats Row */}
                                    <div className="grid grid-cols-2 gap-2">
                                        {/* Card 1 */}
                                        <div className="bg-neutral-900/50 border border-neutral-800 rounded-md p-2 flex flex-col gap-1.5">
                                            <div className="h-1 w-6 bg-neutral-700 rounded-full opacity-50"></div>
                                            <div className="flex items-end justify-between">
                                                <div className="h-2.5 w-8 bg-neutral-600 rounded-sm"></div>
                                                <div className="h-3 w-6 bg-lime-500/20 rounded-sm flex items-center justify-center">
                                                    <div className="h-0.5 w-3 bg-sky-500 rounded-full"></div>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Card 2 */}
                                        <div className="bg-neutral-900/50 border border-neutral-800 rounded-md p-2 flex flex-col gap-1.5 opacity-60">
                                            <div className="h-1 w-6 bg-neutral-700 rounded-full opacity-50"></div>
                                            <div className="flex items-end justify-between">
                                                <div className="h-2.5 w-5 bg-neutral-600 rounded-sm"></div>
                                                <div className="h-3 w-3 rounded-full bg-neutral-800"></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Activity List */}
                                    <div className="flex flex-col gap-1.5 mt-1">
                                        <div className="flex items-center gap-2 p-1.5 rounded-md bg-neutral-900/30 border border-neutral-800/50">
                                            <div className="h-4 w-4 rounded bg-lime-900/20 border border-sky-500/30 shrink-0"></div>
                                            <div className="flex-1 flex flex-col gap-1">
                                                <div className="h-1 w-12 bg-neutral-700 rounded-full"></div>
                                                <div className="h-1 w-8 bg-neutral-800 rounded-full"></div>
                                            </div>
                                            <div className="h-1.5 w-6 bg-sky-500 rounded-full animate-pulse"></div>
                                        </div>
                                        <div className="flex items-center gap-2 p-1.5 rounded-md border border-transparent opacity-50">
                                            <div className="h-4 w-4 rounded bg-neutral-800 shrink-0"></div>
                                            <div className="flex-1 flex flex-col gap-1">
                                                <div className="h-1 w-10 bg-neutral-700 rounded-full"></div>
                                                <div className="h-1 w-6 bg-neutral-800 rounded-full"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Card Footer */}
                    <div className="px-5 py-4 border-t border-neutral-800 bg-neutral-900 flex items-center justify-between z-20 relative">
                        <span className="text-base font-medium text-white tracking-tight">Avoid Dealines & Conflicts</span>
                        <div className="text-sky-500">
                            <CheckCircle2 className="w-6 h-6 fill-lime-500/10" />
                        </div>
                    </div>
                </div>

                {/* Slide 2: Rainbow Candy (Purple) */}
                <div className={`${getSlideClass(1)} group flex flex-col h-full rounded-2xl border bg-neutral-900 overflow-hidden shadow-2xl shadow-black/50`}>
                    {/* Window Preview Area */}
                    <div className="p-5 pt-8 bg-neutral-900 flex-1 flex flex-col justify-end">
                        <div className="w-full rounded-t-lg bg-neutral-950 border border-neutral-800 border-b-0 overflow-hidden shadow-xl">
                            {/* Window Header */}
                            <div className="flex items-center gap-1.5 px-3 py-2 bg-neutral-900 border-b border-neutral-800/50">
                                <div className="w-2 h-2 rounded-full bg-red-500/40"></div>
                                <div className="w-2 h-2 rounded-full bg-yellow-500/40"></div>
                                <div className="w-2 h-2 rounded-full bg-green-500/40"></div>
                            </div>
                            {/* Window Body: Dashboard Layout */}
                            <div className="flex h-50 bg-neutral-950">
                                {/* Sidebar */}
                                <div className="w-14 border-r border-neutral-800 bg-neutral-900/30 flex flex-col gap-2 p-2 pt-3">
                                    <div className="h-4 w-4 rounded-md bg-neutral-700/50 mb-1 mx-auto"></div>
                                    {/* Active Nav */}
                                    <div className="h-7 w-full bg-neutral-800 rounded-md flex items-center justify-center border border-neutral-700/50 shadow-sm">
                                        <div className="h-3 w-3 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(168,85,247,0.6)] animate-pulse"></div>
                                    </div>
                                    {/* Inactive Nav */}
                                    <div className="h-7 w-full flex items-center justify-center opacity-40">
                                        <div className="h-1 w-4 bg-neutral-700 rounded-full"></div>
                                    </div>
                                    <div className="h-7 w-full flex items-center justify-center opacity-40">
                                        <div className="h-1 w-4 bg-neutral-700 rounded-full"></div>
                                    </div>
                                </div>
                                
                                {/* Main Content */}
                                <div className="flex-1 p-3 flex flex-col gap-3">
                                    {/* Breadcrumb & User */}
                                    <div className="flex justify-between items-center pb-2 border-b border-neutral-800/50">
                                        <div className="h-1.5 w-16 bg-neutral-800 rounded-full"></div>
                                        <div className="flex gap-1.5 items-center">
                                            <div className="h-1.5 w-8 bg-neutral-800 rounded-full hidden sm:block"></div>
                                            <div className="h-3 w-3 rounded-full bg-neutral-700"></div>
                                        </div>
                                    </div>
                                    
                                    {/* Stats Row */}
                                    <div className="grid grid-cols-2 gap-2">
                                        {/* Card 1 */}
                                        <div className="bg-neutral-900/50 border border-neutral-800 rounded-md p-2 flex flex-col gap-1.5">
                                            <div className="h-1 w-6 bg-neutral-700 rounded-full opacity-50"></div>
                                            <div className="flex items-end justify-between">
                                                <div className="h-2.5 w-8 bg-neutral-600 rounded-sm"></div>
                                                <div className="h-3 w-6 bg-indigo-500/20 rounded-sm flex items-center justify-center">
                                                    <div className="h-0.5 w-3 bg-indigo-500 rounded-full"></div>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Card 2 */}
                                        <div className="bg-neutral-900/50 border border-neutral-800 rounded-md p-2 flex flex-col gap-1.5 opacity-60">
                                            <div className="h-1 w-6 bg-neutral-700 rounded-full opacity-50"></div>
                                            <div className="flex items-end justify-between">
                                                <div className="h-2.5 w-5 bg-neutral-600 rounded-sm"></div>
                                                <div className="h-3 w-3 rounded-full bg-neutral-800"></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Activity List */}
                                    <div className="flex flex-col gap-1.5 mt-1">
                                        <div className="flex items-center gap-2 p-1.5 rounded-md bg-neutral-900/30 border border-neutral-800/50">
                                            <div className="h-4 w-4 rounded bg-indigo-900/20 border border-indigo-500/30 shrink-0"></div>
                                            <div className="flex-1 flex flex-col gap-1">
                                                <div className="h-1 w-12 bg-neutral-700 rounded-full"></div>
                                                <div className="h-1 w-8 bg-neutral-800 rounded-full"></div>
                                            </div>
                                            <div className="h-1.5 w-6 bg-indigo-500 rounded-full animate-pulse"></div>
                                        </div>
                                        <div className="flex items-center gap-2 p-1.5 rounded-md border border-transparent opacity-50">
                                            <div className="h-4 w-4 rounded bg-neutral-800 shrink-0"></div>
                                            <div className="flex-1 flex flex-col gap-1">
                                                <div className="h-1 w-10 bg-neutral-700 rounded-full"></div>
                                                <div className="h-1 w-6 bg-neutral-800 rounded-full"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Card Footer */}
                    <div className="px-5 py-4 border-t border-neutral-800 bg-neutral-900 flex items-center justify-between z-20 relative">
                        <span className="text-base font-medium text-white tracking-tight">Auto Issue Assign</span>
                        <div className="text-indigo-500">
                            <CheckCircle2 className="w-6 h-6 fill-indigo-500/10" />
                        </div>
                    </div>
                </div>

                {/* Slide 3: Honeydew Punch (Cyan) */}
                <div className={`${getSlideClass(2)} group flex flex-col h-full rounded-2xl border bg-neutral-900 overflow-hidden shadow-2xl shadow-black/50`}>
                    {/* Window Preview Area */}
                    <div className="p-5 pt-8 bg-neutral-900 flex-1 flex flex-col justify-end">
                        <div className="w-full rounded-t-lg bg-neutral-950 border border-neutral-800 border-b-0 overflow-hidden shadow-xl">
                            {/* Window Header */}
                            <div className="flex items-center gap-1.5 px-3 py-2 bg-neutral-900 border-b border-neutral-800/50">
                                <div className="w-2 h-2 rounded-full bg-red-500/40"></div>
                                <div className="w-2 h-2 rounded-full bg-yellow-500/40"></div>
                                <div className="w-2 h-2 rounded-full bg-green-500/40"></div>
                            </div>
                            {/* Window Body: Dashboard Layout */}
                            <div className="flex h-50 bg-neutral-950">
                                {/* Sidebar */}
                                <div className="w-14 border-r border-neutral-800 bg-neutral-900/30 flex flex-col gap-2 p-2 pt-3">
                                    <div className="h-4 w-4 rounded-md bg-neutral-700/50 mb-1 mx-auto"></div>
                                    {/* Active Nav */}
                                    <div className="h-7 w-full bg-neutral-800 rounded-md flex items-center justify-center border border-neutral-700/50 shadow-sm">
                                        <div className="h-3 w-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(6,182,212,0.6)] animate-pulse"></div>
                                    </div>
                                    {/* Inactive Nav */}
                                    <div className="h-7 w-full flex items-center justify-center opacity-40">
                                        <div className="h-1 w-4 bg-neutral-700 rounded-full"></div>
                                    </div>
                                    <div className="h-7 w-full flex items-center justify-center opacity-40">
                                        <div className="h-1 w-4 bg-neutral-700 rounded-full"></div>
                                    </div>
                                </div>
                                
                                {/* Main Content */}
                                <div className="flex-1 p-3 flex flex-col gap-3">
                                    {/* Breadcrumb & User */}
                                    <div className="flex justify-between items-center pb-2 border-b border-neutral-800/50">
                                        <div className="h-1.5 w-16 bg-neutral-800 rounded-full"></div>
                                        <div className="flex gap-1.5 items-center">
                                            <div className="h-1.5 w-8 bg-neutral-800 rounded-full hidden sm:block"></div>
                                            <div className="h-3 w-3 rounded-full bg-neutral-700"></div>
                                        </div>
                                    </div>
                                    
                                    {/* Stats Row */}
                                    <div className="grid grid-cols-2 gap-2">
                                        {/* Card 1 */}
                                        <div className="bg-neutral-900/50 border border-neutral-800 rounded-md p-2 flex flex-col gap-1.5">
                                            <div className="h-1 w-6 bg-neutral-700 rounded-full opacity-50"></div>
                                            <div className="flex items-end justify-between">
                                                <div className="h-2.5 w-8 bg-neutral-600 rounded-sm"></div>
                                                <div className="h-3 w-6 bg-blue-500/20 rounded-sm flex items-center justify-center">
                                                    <div className="h-0.5 w-3 bg-blue-500 rounded-full"></div>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Card 2 */}
                                        <div className="bg-neutral-900/50 border border-neutral-800 rounded-md p-2 flex flex-col gap-1.5 opacity-60">
                                            <div className="h-1 w-6 bg-neutral-700 rounded-full opacity-50"></div>
                                            <div className="flex items-end justify-between">
                                                <div className="h-2.5 w-5 bg-neutral-600 rounded-sm"></div>
                                                <div className="h-3 w-3 rounded-full bg-neutral-800"></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Activity List */}
                                    <div className="flex flex-col gap-1.5 mt-1">
                                        <div className="flex items-center gap-2 p-1.5 rounded-md bg-neutral-900/30 border border-neutral-800/50">
                                            <div className="h-4 w-4 rounded bg-blue-900/20 border border-blue-500/30 shrink-0"></div>
                                            <div className="flex-1 flex flex-col gap-1">
                                                <div className="h-1 w-12 bg-neutral-700 rounded-full"></div>
                                                <div className="h-1 w-8 bg-neutral-800 rounded-full"></div>
                                            </div>
                                            <div className="h-1.5 w-6 bg-blue-500 rounded-full animate-pulse"></div>
                                        </div>
                                        <div className="flex items-center gap-2 p-1.5 rounded-md border border-transparent opacity-50">
                                            <div className="h-4 w-4 rounded bg-neutral-800 shrink-0"></div>
                                            <div className="flex-1 flex flex-col gap-1">
                                                <div className="h-1 w-10 bg-neutral-700 rounded-full"></div>
                                                <div className="h-1 w-6 bg-neutral-800 rounded-full"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Card Footer */}
                    <div className="px-5 py-4 border-t border-neutral-800 bg-neutral-900 flex items-center justify-between z-20 relative">
                        <span className="text-base font-medium text-white tracking-tight">Agents Auto Code Review</span>
                        <div className="text-blue-500">
                            <CheckCircle2 className="w-6 h-6 fill-blue-500/10" />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}

export default LoaderPage
