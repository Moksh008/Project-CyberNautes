"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, Shield } from "lucide-react"

const Navbar1 = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const toggleMenu = () => setIsOpen(!isOpen)

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center w-full py-4 px-4">
        <motion.div
          className={`flex items-center justify-between px-6 py-3 rounded-full w-full max-w-3xl relative transition-all duration-500 border ${
            scrolled
              ? "bg-black/70 backdrop-blur-2xl border-white/10 shadow-2xl shadow-black/50"
              : "bg-white/[0.03] backdrop-blur-md border-white/[0.06]"
          }`}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5">
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
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {["Features", "Pricing", "Docs", "About"].map((item, i) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <a
                  href="#"
                  className="text-[13px] text-white/50 hover:text-white transition-colors font-medium px-3.5 py-2 rounded-full hover:bg-white/[0.06]"
                >
                  {item}
                </a>
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
            <a
              href="#"
              className="inline-flex items-center justify-center px-5 py-2 text-[13px] font-medium text-black bg-white rounded-full hover:bg-white/90 transition-all"
            >
              Login
            </a>
          </motion.div>

          {/* Mobile Menu Button */}
          <motion.button
            className="md:hidden flex items-center p-1"
            onClick={toggleMenu}
            whileTap={{ scale: 0.9 }}
          >
            <Menu className="h-5 w-5 text-white/70" />
          </motion.button>
        </motion.div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 pt-24 px-8 md:hidden"
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
              {["Features", "Pricing", "Docs", "About"].map((item, i) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 + 0.1 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <a
                    href="#"
                    className="block text-2xl text-white/60 hover:text-white font-medium py-3 transition-colors"
                    onClick={toggleMenu}
                  >
                    {item}
                  </a>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                exit={{ opacity: 0, y: 20 }}
                className="pt-8"
              >
                <a
                  href="#"
                  className="inline-flex items-center justify-center w-full px-5 py-4 text-base font-medium text-black bg-white rounded-full hover:bg-white/90 transition-colors"
                  onClick={toggleMenu}
                >
                  Login
                </a>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}


export { Navbar1 }
