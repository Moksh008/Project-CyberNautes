"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, Shield } from "lucide-react"

const Navbar1 = () => {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => setIsOpen(!isOpen)

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center w-full py-4 px-4">
        <motion.div
          className="glass-navbar flex items-center justify-between px-6 py-3 rounded-full w-full max-w-3xl relative transition-all duration-500"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <motion.div
              className="w-8 h-8 flex items-center justify-center"
              whileHover={{ rotate: 10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white/20 to-white/5 border border-white/10 flex items-center justify-center">
                <Shield size={16} className="text-white/80" strokeWidth={1.5} />
              </div>
            </motion.div>
            <span className="text-sm font-semibold text-white tracking-tight">SentinelAI</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {[
              { label: "Features", href: "/" },
              { label: "Pricing", href: "/pricing" },
              { label: "Docs", href: "/docs" },
              { label: "About", href: "/" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Link
                  to={item.href}
                  className="text-[13px] text-white/50 hover:text-white transition-colors duration-200 font-medium px-3.5 py-2 rounded-full hover:bg-white/[0.08] hover:backdrop-blur-sm"
                >
                  {item.label}
                </Link>
              </motion.div>
            ))}
          </nav>

          {/* Desktop CTA Button */}
          <motion.div
            className="hidden md:block"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-5 py-2 text-[13px] font-medium text-white bg-gradient-to-b from-blue-500 to-blue-600 rounded-full border border-white/10 shadow-[0_2px_10px_rgba(37,99,235,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_4px_16px_rgba(37,99,235,0.55),inset_0_1px_0_rgba(255,255,255,0.25)] hover:from-blue-400 hover:to-blue-500 transition-all duration-200"
            >
              Login
            </Link>
          </motion.div>

          {/* Mobile Menu Button */}
          <motion.button
            className="md:hidden flex items-center p-2 rounded-full bg-white/[0.06] border border-white/[0.08] hover:bg-white/[0.1] transition-colors"
            onClick={toggleMenu}
            whileTap={{ scale: 0.9 }}
          >
            <Menu className="h-4 w-4 text-white/70" />
          </motion.button>
        </motion.div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-[#05070a]/90 backdrop-blur-2xl backdrop-saturate-150 z-50 pt-24 px-8 md:hidden"
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <motion.button
              className="absolute top-6 right-6 p-2"
              onClick={toggleMenu}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <X className="h-6 w-6 text-white/70" />
            </motion.button>
            <div className="flex flex-col space-y-2">
              {[
                { label: "Features", href: "/" },
                { label: "Pricing", href: "/pricing" },
                { label: "Docs", href: "/docs" },
                { label: "About", href: "/" },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 + 0.1 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <Link
                    to={item.href}
                    className="block text-2xl text-white/60 hover:text-white font-medium py-3 transition-colors"
                    onClick={toggleMenu}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                exit={{ opacity: 0, y: 20 }}
                className="pt-8"
              >
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center w-full px-5 py-4 text-base font-medium text-black bg-white rounded-full hover:bg-white/90 transition-colors"
                  onClick={toggleMenu}
                >
                  Login
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}


export { Navbar1 }
