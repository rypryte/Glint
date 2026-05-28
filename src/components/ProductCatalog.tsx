import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PRODUCTS_DATA, SecuritySystemProduct } from "../types";
import { Shield, ChevronRight, Terminal, X, AlertTriangle, Layers, Crosshair } from "lucide-react";

interface ProductCatalogProps {
  droneImg: string;
  commsImg: string;
  thermalImg: string;
}

export default function ProductCatalog({ droneImg, commsImg, thermalImg }: ProductCatalogProps) {
  const products = PRODUCTS_DATA(droneImg, commsImg, thermalImg);
  const [selectedProduct, setSelectedProduct] = useState<SecuritySystemProduct | null>(null);

  // Status badge styling helper
  const getStatusStyle = (status: SecuritySystemProduct["status"]) => {
    switch (status) {
      case "Active":
        return {
          bg: "bg-emerald-950/30 border-emerald-500/20 text-emerald-400",
          dot: "bg-emerald-500",
        };
      case "Deployment Ready":
        return {
          bg: "bg-blue-950/30 border-blue-500/20 text-blue-400",
          dot: "bg-blue-500",
        };
      case "Prototype":
        return {
          bg: "bg-amber-950/30 border-amber-500/20 text-amber-400",
          dot: "bg-amber-500",
        };
      case "Research System":
        return {
          bg: "bg-purple-950/30 border-purple-500/20 text-purple-400",
          dot: "bg-purple-500",
        };
    }
  };

  return (
    <div className="space-y-10">
      {/* Introduction text of catalog */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8"
      >
        <div className="max-w-2xl">
          <span className="text-xs font-mono font-medium text-blue-500 uppercase tracking-widest block mb-2">
            Our Products &amp; Systems
          </span>
          <h3 className="font-display font-medium text-2xl md:text-3xl text-white tracking-tight uppercase">
            Security Products Catalogue
          </h3>
          <p className="text-sm text-steel-400 mt-2 leading-relaxed">
            Our secure hardware and software systems. Select any product below to review certificates, design specs, or ask for more details.
          </p>
        </div>
        <div className="shrink-0 flex items-center space-x-3 bg-graphite-900 border border-white/10 px-4 py-3 rounded text-xs font-mono text-steel-400">
          <Shield className="h-4 w-4 text-blue-500" />
          <span>PORTFOLIO CLASSIFICATION: SECURE DESIGN</span>
        </div>
      </motion.div>

      {/* Grid of Products */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product, index) => {
          const badge = getStatusStyle(product.status);
          const isSelected = selectedProduct?.id === product.id;

          return (
            <motion.div
              layoutId={`product-wrapper-${product.id}`}
              onClick={() => setSelectedProduct(product)}
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: index * 0.08 }}
              className="bento-card overflow-hidden flex flex-col h-full group cursor-pointer"
              whileHover={{ y: -4 }}
            >
              {/* Product Image Area with responsive size */}
              <div className="relative aspect-[4/3] bg-graphite-950 overflow-hidden border-b border-white/5">
                <img
                  src={product.imagePath}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                />
                {/* Tech grid overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-graphite-950 to-transparent opacity-60" />
                
                {/* Status Badge */}
                <div className="absolute top-4 left-4">
                  <div className={`px-2.5 py-1 text-[10px] font-mono rounded-full border flex items-center space-x-1.5 shadow-md ${badge.bg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dot} animate-pulse`} />
                    <span className="uppercase tracking-widest">{product.status}</span>
                  </div>
                </div>

                {/* Corner Crosshairs for tech visual */}
                <div className="absolute right-4 bottom-4 opacity-50 text-steel-500">
                  <Crosshair className="h-3.5 w-3.5" />
                </div>
              </div>

              {/* Product Content */}
              <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-steel-500 tracking-wider uppercase block">
                    {product.deploymentSector}
                  </span>
                  <h4 className="font-display font-medium text-base text-white tracking-wide uppercase group-hover:text-blue-400 transition-colors">
                    {product.name}
                  </h4>
                  <p className="text-xs text-steel-400 leading-relaxed line-clamp-3">
                    {product.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-steel-400 group-hover:text-white transition-colors">
                  <span>VIEW SPECIFICATIONS</span>
                  <ChevronRight className="h-3 w-3 translate-x-0 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Expandable Product Preview Panel (Sheet Overlay/Details) */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-graphite-950/90 backdrop-blur-md"
            />

            {/* Spec Sheet Document Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-graphite-900 border border-white/10 rounded-2xl shadow-2xl relative w-full max-w-4xl max-h-[85vh] overflow-y-auto z-10 grid grid-cols-1 md:grid-cols-12"
            >
              {/* Image & System metrics region - Left side column (5 cols) */}
              <div className="md:col-span-5 bg-graphite-950 border-r border-white/10 min-h-[250px] md:min-h-full relative flex flex-col justify-between">
                <div className="absolute inset-0 opacity-10 pointer-events-none mesh-grid" />
                <div className="relative h-64 md:h-full w-full">
                  <img
                    src={selectedProduct.imagePath}
                    alt={selectedProduct.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover opacity-70"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-graphite-950 via-graphite-950/20 to-transparent" />
                  
                  {/* Status Overlay */}
                  <div className="absolute bottom-6 left-6 right-6 space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${getStatusStyle(selectedProduct.status).dot} animate-pulse`} />
                      <span className="font-mono text-[10px] tracking-widest text-[#7c8ba1] uppercase">
                        STATUS: // {selectedProduct.status}
                      </span>
                    </div>
                    <h5 className="font-display font-medium text-lg text-white uppercase tracking-wider">
                      {selectedProduct.name}
                    </h5>
                  </div>
                </div>
              </div>

              {/* Specification Sheet content panel - Right side column (7 cols) */}
              <div className="md:col-span-12 lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                {/* Header of Spec Sheet */}
                <div className="flex items-start justify-between border-b border-white/5 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1.5 text-blue-500">
                      <Shield className="h-3 w-3" />
                      <span className="font-mono text-[9px] tracking-widest uppercase">system details</span>
                    </div>
                    <h4 className="font-display font-medium text-xl text-white uppercase tracking-wider">
                      Device Profile
                    </h4>
                  </div>
                  
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="p-1 text-steel-400 hover:text-white border border-transparent hover:border-white/10 hover:bg-white/5 rounded transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Specs and Technical Brief block */}
                <div className="space-y-4 flex-grow">
                  <div className="space-y-2">
                    <span className="font-mono text-[10px] text-steel-500 uppercase tracking-widest">About this Product</span>
                    <p className="text-sm text-steel-300 leading-relaxed">
                      {selectedProduct.longDescription}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="font-mono text-[10px] text-steel-500 uppercase tracking-widest">Primary Target Applications</span>
                    <p className="text-xs text-blue-400 font-medium">
                      Applications: {selectedProduct.deploymentSector}
                    </p>
                  </div>

                  {/* Bulleted Technical specs list */}
                  <div className="space-y-2 pt-2">
                    <span className="font-mono text-[10px] text-steel-500 uppercase tracking-widest block mb-1">
                      System Specifications
                    </span>
                    <div className="bg-graphite-950 rounded p-4 border border-white/5 space-y-2 font-mono text-xs">
                      {selectedProduct.specifications.map((spec, i) => (
                        <div key={i} className="flex items-start space-x-2 text-steel-300">
                          <span className="text-blue-500 shrink-0">::</span>
                          <span>{spec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer disclaimer / call actions */}
                <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center space-x-2 text-[10px] font-mono text-steel-400">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <span>Full technical blueprints available upon request.</span>
                  </div>
                  
                  <div className="flex space-x-3 w-full sm:w-auto">
                    <button
                      onClick={() => {
                        setSelectedProduct(null);
                        const contactSec = document.getElementById("secure-contact");
                        if (contactSec) contactSec.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-[10px] font-mono font-medium text-white tracking-widest uppercase rounded cursor-pointer text-center"
                    >
                      Get More Details
                    </button>
                    <button
                      onClick={() => setSelectedProduct(null)}
                      className="px-4 py-2 bg-transparent hover:bg-white/5 border border-white/10 text-[10px] font-mono font-medium text-steel-300 tracking-widest uppercase rounded cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
