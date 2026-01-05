import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFound = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
            {/* Background with some gradient effects */}
            <div className="absolute inset-0 bg-[#030014]">
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(14,165,233,0.15),rgba(255,255,255,0))] animate-pulse" />
            </div>

            <div className="z-10 text-center px-4">
                <motion.h1
                    className="text-9xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-cyan-500"
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    404
                </motion.h1>

                <motion.h2
                    className="text-2xl md:text-4xl font-semibold text-white mt-4 mb-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    Page Not Found
                </motion.h2>

                <motion.p
                    className="text-gray-400 text-lg mb-8 max-w-md mx-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                >
                    The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                >
                    <Link
                        to="/"
                        className="inline-block px-8 py-3 rounded-full bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-medium text-lg hover:from-purple-700 hover:to-cyan-700 transition-all transform hover:scale-105 shadow-lg shadow-purple-500/25"
                    >
                        Go to Home
                    </Link>
                </motion.div>
            </div>

            {/* Decorative elements */}
            <div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />
        </div>
    );
};

export default NotFound;
