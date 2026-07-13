import React, { useState, useEffect, useRef } from "react";

export interface CertificateProps {
  studentName: string;
  assignmentTitle: string;
  courseTitle: string;
  teacherName: string;
  obtainedMarks: number;
  totalMarks: number;
  percentage: number;
  completionDate: string;
  certificateId: string;
  badgeImage: string;
  verificationUrl: string;
  batchName?: string;
}

export const CertificateTemplate: React.FC<CertificateProps> = ({
  studentName,
  assignmentTitle,
  courseTitle,
  teacherName,
  obtainedMarks,
  totalMarks,
  percentage,
  completionDate,
  certificateId,
  verificationUrl,
  batchName,
}) => {
  const [scale, setScale] = useState(1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (!wrapperRef.current) return;
      let parentWidth = wrapperRef.current.parentElement?.clientWidth || wrapperRef.current.clientWidth;
      if (wrapperRef.current.parentElement) {
        const computedStyle = window.getComputedStyle(wrapperRef.current.parentElement);
        const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
        const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
        parentWidth = parentWidth - paddingLeft - paddingRight;
      }
      // Standard A4 landscape dimensions: 297mm x 210mm.
      // At standard 96dpi, 297mm is exactly 1122.52px. We use 1123px as baseline width.
      const baseWidth = 1123;
      if (parentWidth > 0 && parentWidth < baseWidth) {
        setScale(parentWidth / baseWidth);
      } else {
        setScale(1);
      }
    };

    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (wrapperRef.current?.parentElement) {
      observer.observe(wrapperRef.current.parentElement);
    }
    return () => observer.disconnect();
  }, []);

  // Format completion date nicely
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formattedDate = formatDate(completionDate);

  // Determine achievement level (Gold, Silver, Bronze)
  const isGold = percentage >= 90;
  const isSilver = !isGold && percentage >= 75;
  const grade = isGold ? "Gold" : isSilver ? "Silver" : "Bronze";
  const distinctionLabel = isGold
    ? "Gold Distinction"
    : isSilver
    ? "Silver Excellence"
    : "Bronze Achievement";

  // Medal Metallic Highlights
  const primaryColor = isGold ? "#B45309" : isSilver ? "#5A5A5A" : "#8A4F2A"; // Gold/Bronze copper colors
  const ribbonColor = isGold ? "#92400E" : isSilver ? "#374151" : "#78350F";

  return (
    <div className="w-full flex justify-center bg-transparent py-4 items-center overflow-hidden" ref={wrapperRef} id="certificate-print-area">
      {/* Self-contained CSS declarations for fonts, luxury textures, and custom layout */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Hanken+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        
        .certificate-canvas {
            aspect-ratio: 1.414 / 1; /* A4 Landscape */
            width: 100%;
            max-width: 1050px;
            background-color: #FCFCFA; /* Subtle high-end cotton-paper off-white */
            box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.08);
            position: relative;
        }

        /* Luxury Fine Linen Texture */
        .linen-texture {
            background-image: 
                linear-gradient(90deg, rgba(180, 180, 150, 0.015) 1px, transparent 1px),
                linear-gradient(0deg, rgba(180, 180, 150, 0.015) 1px, transparent 1px);
            background-size: 3px 3px;
        }

        /* Giant Watermark Logo at precisely 1% opacity */
        .watermark-large {
            opacity: 0.013;
            pointer-events: none;
            user-select: none;
            width: 60%;
            max-height: 60%;
            object-fit: contain;
            filter: grayscale(100%);
        }

        /* Premium Ornamental Document Frame */
        .outer-bronze-frame {
            border: 2px solid #B45309; /* Elegant Copper bronze outer line */
            padding: 10px;
            background-color: #FCFCFA;
        }
        .inner-thin-frame {
            border: 0.75px solid rgba(0, 106, 98, 0.15); /* Light emerald fine inside line */
            height: 100%;
            width: 100%;
            padding: 32px;
        }

        /* Classic Fonts Mapping */
        .font-serif-elegant {
            font-family: 'Lora', Georgia, serif;
        }
        .font-display-classic {
            font-family: 'Cinzel', serif;
        }
        .font-sans-modern {
            font-family: 'Hanken Grotesk', sans-serif;
        }
        .font-mono-data {
            font-family: 'JetBrains Mono', monospace;
        }

        /* Subtle Luxury Signature cursive placeholder */
        .cursive-sig {
            font-family: 'Lora', 'Georgia', serif;
            font-style: italic;
            font-weight: 500;
            color: rgba(90, 90, 90, 0.45);
            letter-spacing: 0.05em;
        }
      ` }} />

      <div
        style={{
          width: `${1123 * scale}px`,
          height: `${794 * scale}px`,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          transition: "width 0.1s ease-out, height 0.1s ease-out",
        }}
      >
        {/* Outer Bronze Frame */}
        <div
          id="certificate-container"
          className="outer-bronze-frame rounded-[4px]"
          style={{
            width: "1123px",
            height: "794px",
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            position: "absolute",
            top: 0,
            left: 0,
            boxSizing: "border-box",
          }}
        >
          {/* Inner Thin Frame */}
          <div className="inner-thin-frame rounded-[2px] relative linen-texture flex flex-col justify-between overflow-hidden">
          
          {/* Subtle Decorative Corner Brackets (Traditional Document Craftsmanship) */}
          <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-[#B45309]/50 pointer-events-none" />
          <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-[#B45309]/50 pointer-events-none" />
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-[#B45309]/50 pointer-events-none" />
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-[#B45309]/50 pointer-events-none" />

          {/* Thin Ornamental Center Gridlines */}
          <div className="absolute top-6 left-12 right-12 h-[0.5px] bg-[#B45309]/15 pointer-events-none" />
          <div className="absolute bottom-6 left-12 right-12 h-[0.5px] bg-[#B45309]/15 pointer-events-none" />

          {/* 1% Opacity Perfectly Centered Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <img
              alt="Xebia Watermark"
              className="watermark-large"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAdWwJbwlfkqQRNkjPOpAZ5rAFPstlj0552jGHFJz7miDXjEtFQPdqkNjK63D7eWfM215z-WnZFPN7tmIGmPSM0pn1FAxrJq9HTQ4fCQxAjixAdZjjifPFgt71LrHwuF_XQCaX3Gg49AabmMOeDExso2_RMqq8kRSJ4eKC7oDS6wkmXdBEGxx1CDqc1lREanSA7c5iDuX8PqNshOO9SbKwQPIfXa_N9CONCS_Bb0tmJXeft2BuNR6MQ-MuJmmXzw30IDw"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Header Section (Invisible grid, large spacing) */}
          <div className="relative z-10 flex flex-col items-center text-center mt-4">
            <img
              alt="Xebia Logo"
              className="h-10 w-auto object-contain mb-3.5 select-none"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCKGwmz_-yoz9mu9LZtQonpM_OXkGPm-rYrdhNh2bJyBc4QjMFoN9QRIJjNXJbh9w5F3NhkWmltOZDwjIMzCvAJq4sRKVBYpjvJ8Gse-DwjIhXow1GDMyYr8WMlhGePPu0-pZFqogoRGu2zlCwODy41n7hpLZtVZ89MaQB24gxiGaahckTXRbzBWbhjdKxAUG1AD8ZF7msj3iO9PfDgkLPOmhBYSvJ9kP0RxYEI53xjauhphXUJh_DWMb9dRkNfQ8syaQ"
              referrerPolicy="no-referrer"
            />
            <p className="font-sans-modern text-[10px] text-slate-500 font-bold uppercase tracking-[0.22em] mb-1.5">
              Xebia Learning Platform
            </p>
            
            <h1 className="font-display-classic text-3xl md:text-4xl text-[#191c1f] font-normal tracking-[0.14em] uppercase mt-1">
              Certificate of Achievement
            </h1>
            <p className="font-serif-elegant italic text-xs text-slate-400 mt-1.5 tracking-wide">
              Professional Digital Credential of Excellence
            </p>
          </div>

          {/* Central Prestige Body (Huge Whitespace & Focus Flow) */}
          <div className="relative z-10 text-center flex flex-col items-center my-6">
            <p className="font-serif-elegant text-slate-400 italic text-[15px] tracking-wide mb-3">
              This certificate proudly recognizes
            </p>
            
            {/* Huge Student Name - Dominates the Page */}
            <h2 className="font-serif-elegant text-5xl md:text-6xl text-[#191c1f] font-normal tracking-tight leading-none mb-4 py-1 select-all">
              {studentName}
            </h2>

            <div className="max-w-[720px] px-4 space-y-3.5">
              <p className="font-sans-modern text-slate-500 text-[14px] leading-relaxed font-light tracking-wide">
                for successfully completing the professional curriculum assignment and demonstrating comprehensive proficiency in
              </p>
              
              {/* Assignment Title - Stands Out, Emerald Color, Elegant underline */}
              <div className="relative inline-block max-w-full">
                <h3 className="font-sans-modern text-xl md:text-2xl text-[#006a62] font-semibold tracking-tight text-center px-6">
                  {assignmentTitle}
                </h3>
                <div className="h-[1.5px] bg-gradient-to-r from-transparent via-[#006a62]/60 to-transparent w-full mt-2" />
              </div>
            </div>
          </div>

          {/* Luxury Achievement Centerpiece */}
          <div className="relative z-10 max-w-[850px] mx-auto w-full grid grid-cols-3 items-center border-t border-b border-slate-200/50 py-5 my-2 gap-4">
            
            {/* Left Column: Premium Medal Badge Artwork */}
            <div className="flex flex-col items-center justify-center text-center">
              <svg width="68" height="68" viewBox="0 0 100 100" className="drop-shadow-md select-none overflow-visible">
                <defs>
                  <linearGradient id="metalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={isGold ? "#FBBF24" : isSilver ? "#E2E8F0" : "#D97706"} />
                    <stop offset="50%" stopColor="#FFFFFF" />
                    <stop offset="100%" stopColor={primaryColor} />
                  </linearGradient>
                </defs>
                {/* Ribbons */}
                <path d="M35 50 L20 85 L50 72 L80 85 L65 50 Z" fill={ribbonColor} opacity="0.9" />
                <path d="M45 50 L38 88 L62 88 L55 50 Z" fill="#6C1D5F" opacity="0.85" />
                {/* Medal Body */}
                <circle cx="50" cy="45" r="32" fill="url(#metalGrad)" stroke={primaryColor} strokeWidth="1.5" />
                <circle cx="50" cy="45" r="27" fill="none" stroke="#FFFFFF" strokeWidth="0.75" opacity="0.8" />
                <circle cx="50" cy="45" r="25" fill="none" stroke={primaryColor} strokeWidth="0.5" strokeDasharray="3,2" />
                {/* Core Star symbol */}
                <path d="M50,28 L53.5,38 L64,38 L55.5,44 L59,54 L50,48 L41,54 L44.5,44 L36,38 L46.5,38 Z" fill="#FFFFFF" stroke={primaryColor} strokeWidth="0.5" />
              </svg>
              <span className="font-sans-modern text-[11px] font-bold mt-2 uppercase tracking-widest text-slate-800">
                {distinctionLabel}
              </span>
            </div>

            {/* Center Column: Big Assessment Score */}
            <div className="flex flex-col items-center justify-center text-center border-l border-r border-slate-200/40 px-4">
              <span className="font-sans-modern text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">
                Assessment Score
              </span>
              <div className="flex items-baseline gap-1">
                <span className="font-sans-modern text-3xl font-extrabold text-[#6C1D5F]">
                  {obtainedMarks}
                </span>
                <span className="font-sans-modern text-xs text-slate-400 font-medium">
                  / {totalMarks} pts
                </span>
              </div>
              <span className="font-mono-data text-[10px] text-slate-400 font-semibold mt-0.5">
                Verified Marks
              </span>
            </div>

            {/* Right Column: Performance Distinction Percentile */}
            <div className="flex flex-col items-center justify-center text-center">
              <span className="font-sans-modern text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">
                Performance Level
              </span>
              <span className="font-sans-modern text-3xl font-extrabold text-[#006a62]">
                {typeof percentage === "number" ? percentage.toFixed(0) : percentage}%
              </span>
              <span className="font-sans-modern text-[10px] text-[#006a62] font-extrabold uppercase tracking-wider mt-1">
                {grade} Excellence
              </span>
            </div>

          </div>

          {/* Traditional Trust Signatures & Verification Row */}
          <div className="relative z-10 grid grid-cols-3 items-end gap-12 mt-4 px-6">
            
            {/* Signature A: Academic Evaluator */}
            <div className="text-center">
              <div className="h-10 flex items-center justify-center mb-1">
                <span className="cursive-sig text-2xl select-none">
                  {teacherName.replace(/\s+/g, "")}
                </span>
              </div>
              <div className="border-t border-slate-300 pt-1.5">
                <p className="font-sans-modern text-[12px] text-[#191c1f] font-bold">
                  {teacherName}
                </p>
                <p className="font-sans-modern text-[8px] text-slate-400 uppercase tracking-widest mt-0.5">
                  Academic Evaluator, Xebia Learning
                </p>
              </div>
            </div>

            {/* Middle: Professional Digital Seal */}
            <div className="flex flex-col items-center justify-center pb-1">
              <svg width="78" height="78" viewBox="0 0 100 100" className="select-none overflow-visible">
                <defs>
                  <path id="sealTextPath" d="M 50,50 m -32,0 a 32,32 0 1,1 64,0 a 32,32 0 1,1 -64,0" />
                </defs>
                {/* Embossed Luxury Copper Ring */}
                <circle cx="50" cy="50" r="39" fill="#ffffff" stroke="#B45309" strokeWidth="1.5" />
                <circle cx="50" cy="50" r="36" fill="none" stroke="#B45309" strokeWidth="0.5" strokeDasharray="2,1" />
                <circle cx="50" cy="50" r="33" fill="none" stroke="#6C1D5F" strokeWidth="0.5" opacity="0.2" />
                
                {/* Circular Ribbon typography */}
                <text fontSize="4.5" fontWeight="800" fill="#6C1D5F" letterSpacing="0.4">
                  <textPath href="#sealTextPath" startOffset="0%">
                    • OFFICIAL • XEBIA • DIGITAL • CREDENTIAL • OFFICIAL • XEBIA • DIGITAL
                  </textPath>
                </text>
                
                {/* Official Crest/Crown */}
                <g transform="translate(40, 40) scale(0.33)" opacity="0.85">
                  <path d="M15 2l-15 6 3 14 12 6 12-6 3-14-15-6zm0 4l11 4.4-2.2 10.2-8.8 4.4-8.8-4.4-2.2-10.2 11-4.4z" fill="#B45309" />
                  <polygon points="15,9 17,13 21,13.5 18,16.5 19,20.5 15,18.5 11,20.5 12,16.5 9,13.5 13,13" fill="#006a62" />
                </g>
              </svg>
              <span className="font-sans-modern text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                Official Security Seal
              </span>
            </div>

            {/* Signature B: Program Director */}
            <div className="text-center">
              <div className="h-10 flex items-center justify-center mb-1">
                <span className="cursive-sig text-2xl select-none">
                  XebiaDirector
                </span>
              </div>
              <div className="border-t border-slate-300 pt-1.5">
                <p className="font-sans-modern text-[12px] text-[#191c1f] font-bold">
                  Director of Learning
                </p>
                <p className="font-sans-modern text-[8px] text-slate-400 uppercase tracking-widest mt-0.5">
                  Program Director, Xebia Learning
                </p>
              </div>
            </div>

          </div>

          {/* Bottom Official Security Verification Bar */}
          <div className="mt-6 pt-3 border-t border-slate-200/50 flex justify-between items-center text-[8.5px] font-mono-data text-slate-400 relative z-10 opacity-80">
            <div className="flex gap-4">
              <div>
                <span className="font-bold text-slate-500">CREDENTIAL ID:</span>{" "}
                <span className="text-slate-700 select-all">{certificateId}</span>
              </div>
              <div>
                <span className="font-bold text-slate-500">COMPLETION:</span>{" "}
                <span className="text-slate-700">{formattedDate}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <span className="font-bold text-slate-500">VERIFICATION:</span>{" "}
              <span className="text-slate-700 truncate max-w-[280px] select-all" title={verificationUrl}>
                {verificationUrl}
              </span>
            </div>

            <div className="font-extrabold text-[#006a62] tracking-wider uppercase text-[8px]">
              Secure Blockchain Authenticated
            </div>
          </div>

        </div>
      </div>
      </div>
    </div>
  );
};
