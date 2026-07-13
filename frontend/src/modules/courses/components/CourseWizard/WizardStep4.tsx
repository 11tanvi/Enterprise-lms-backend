import React from "react";
import { SeoSettings } from "../../../../types";
import {
  Globe,
  Search,
  Share2,
  Settings2,
  ToggleLeft,
  ToggleRight,
  Link2,
  Image as ImageIcon,
  CheckCircle,
} from "lucide-react";

interface WizardStep4Props {
  courseData: any;
  setCourseData: (val: any) => void;
}

export const WizardStep4: React.FC<WizardStep4Props> = ({
  courseData,
  setCourseData,
}) => {
  // Extract or initialize SEO fields
  const seo: SeoSettings = courseData.seo || {
    indexInSearch: true,
    metaTitle: "",
    metaDescription: "",
    canonicalUrl: "",
    keywords: "",
    ogImage: "",
    ogTitle: "",
    ogDescription: "",
    xCardType: "Large Summary Card",
  };

  const handleSeoChange = (field: keyof SeoSettings, value: any) => {
    setCourseData((prev: any) => ({
      ...prev,
      seo: {
        ...(prev.seo || {}),
        [field]: value,
      },
    }));
  };

  // Live previews variables with fallbacks to main course values if empty!
  const previewTitle =
    seo.metaTitle || courseData.title || "Untitled Course Curriculum";
  const previewDesc =
    seo.metaDescription ||
    courseData.description ||
    "Learn core foundational structures, practical skills, and advance your career with expert certifications.";
  const previewImage =
    seo.ogImage ||
    courseData.thumbnailUrl ||
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=60";

  let previewDomain = "academy.edu";
  let previewPath = "/courses/" + (courseData.slug || "");
  if (seo.canonicalUrl) {
    try {
      let urlStr = seo.canonicalUrl.trim();
      if (!/^https?:\/\//i.test(urlStr)) {
        urlStr = "https://" + urlStr;
      }
      const urlObj = new URL(urlStr);
      previewDomain = urlObj.hostname;
      previewPath = urlObj.pathname;
    } catch (e) {
      previewDomain = seo.canonicalUrl;
      previewPath = "";
    }
  }

  // Recommendations indicators
  const isTitleIdeal = previewTitle.length > 30 && previewTitle.length <= 60;
  const isDescIdeal = previewDesc.length > 50 && previewDesc.length <= 160;

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      {/* Step Info Banner */}
      <div className="bg-[#4A1E47] text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#ffd7f0] bg-white/10 px-2.5 py-1 rounded-full">
            Step 4 of 4
          </span>
          <h2 className="text-lg font-bold mt-2 tracking-tight">
            Settings & Search Optimization
          </h2>
          <p className="text-xs text-gray-200 mt-1 max-w-xl">
            Configure metadata, search engine indexing, and social sharing
            properties to optimize how your course is presented across organic
            and social networks.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white/10 px-3.5 py-2 rounded-xl text-xs font-semibold">
          <CheckCircle className="w-4 h-4 text-[#01AC9F]" />
          <span>Ready for Publication</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - SEO Configuration Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#510047] flex items-center gap-2 pb-3 border-b border-gray-50">
              <Settings2 className="w-4 h-4 text-[#510047]" />
              Search Engine Optimization (SEO)
            </h4>

            {/* Indexing Checkbox Toggle */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                Search Visibility
              </label>
              <div
                onClick={() =>
                  handleSeoChange("indexInSearch", !seo.indexInSearch)
                }
                className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl cursor-pointer select-none border border-gray-100 hover:bg-gray-100/50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Globe className="w-5 h-5 text-[#510047]" />
                  <div>
                    <p className="text-xs font-bold text-gray-700">
                      Allow search engines to index this course
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Recommended if you want this course page to rank on Google
                      search results.
                    </p>
                  </div>
                </div>
                {seo.indexInSearch ? (
                  <ToggleRight className="w-7 h-7 text-[#01AC9F]" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-gray-300" />
                )}
              </div>
            </div>

            {/* Meta Title */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Meta Title Tag *
                </label>
                <span
                  className={`text-[10px] font-mono font-semibold ${previewTitle.length <= 70 ? "text-emerald-500" : "text-red-500"}`}
                >
                  {previewTitle.length} / 70 chars
                </span>
              </div>
              <input
                type="text"
                maxLength={70}
                required
                placeholder="e.g. Master Cybersecurity Defense Strategies | Enterprise Academy"
                value={seo.metaTitle || ""}
                onChange={(e) => handleSeoChange("metaTitle", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#510047] focus:ring-1 focus:ring-[#ffd7f0] text-gray-700 font-medium"
              />
              <div className="flex justify-between mt-1 text-[10px] text-gray-400">
                <span>Primary search result title.</span>
                <span
                  className={
                    isTitleIdeal
                      ? "text-emerald-600 font-medium"
                      : "text-amber-600"
                  }
                >
                  {isTitleIdeal
                    ? "✓ Ideal length for search display (30-60 chars)"
                    : "Recommended: 30-60 characters"}
                </span>
              </div>
            </div>

            {/* Meta Description */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Meta Description *
                </label>
                <span
                  className={`text-[10px] font-mono font-semibold ${previewDesc.length <= 320 ? "text-emerald-500" : "text-red-500"}`}
                >
                  {previewDesc.length} / 320 chars
                </span>
              </div>
              <textarea
                placeholder="Summarize the course contents, syllabus details, industry credentials, and learning objectives..."
                maxLength={320}
                rows={4}
                required
                value={seo.metaDescription || ""}
                onChange={(e) =>
                  handleSeoChange("metaDescription", e.target.value)
                }
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#510047] focus:ring-1 focus:ring-[#ffd7f0] resize-none leading-relaxed text-gray-700"
              />
              <div className="flex justify-between mt-1 text-[10px] text-gray-400">
                <span>Displays under page title in Google results.</span>
                <span
                  className={
                    isDescIdeal
                      ? "text-emerald-600 font-medium"
                      : "text-amber-600"
                  }
                >
                  {isDescIdeal
                    ? "✓ Ideal length for search display (50-160 chars)"
                    : "Recommended: 50-160 characters"}
                </span>
              </div>
            </div>

            {/* SEO Keywords */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                SEO Keywords
              </label>
              <input
                type="text"
                placeholder="e.g. Cyber Security, Cyber Defense, Network Security"
                value={seo.keywords || ""}
                onChange={(e) => handleSeoChange("keywords", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#510047] focus:ring-1 focus:ring-[#ffd7f0] text-gray-700"
              />
              <p className="text-[10px] text-gray-400 mt-1.5">
                Comma-separated terms that align this curriculum to core
                administrative search phrases.
              </p>
            </div>

            {/* Canonical Link */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Canonical Link URL
              </label>
              <div className="relative">
                <Link2 className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  placeholder="https://academy.edu/courses/cyber-defense"
                  value={seo.canonicalUrl || ""}
                  onChange={(e) =>
                    handleSeoChange("canonicalUrl", e.target.value)
                  }
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-[#510047] focus:ring-1 focus:ring-[#ffd7f0] font-mono text-gray-600"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5">
                The authoritative master link to resolve duplicate crawler
                paths.
              </p>
            </div>

            {/* Social Sharing Image URL */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Social Sharing Thumbnail (og:image) URL
              </label>
              <div className="relative">
                <ImageIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... or absolute image URL"
                  value={seo.ogImage || ""}
                  onChange={(e) => handleSeoChange("ogImage", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-[#510047] focus:ring-1 focus:ring-[#ffd7f0] font-mono text-gray-600"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5">
                Provide an absolute image URL for beautiful preview card layouts
                on Slack, LinkedIn, and Facebook.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column - SEO Previews (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* GOOGLE SEARCH PREVIEW */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h5 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Search className="w-4 h-4 text-[#510047]" />
              Google Search Result Preview
            </h5>

            <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm space-y-2.5 text-left font-sans">
              <div className="flex items-center gap-2.5">
                {/* Simulated Google Favicon */}
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200">
                  <Globe className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] text-gray-800 leading-tight font-normal">
                    {previewDomain}
                  </p>
                  <p className="text-[10px] text-gray-400 truncate leading-none mt-0.5">
                    {previewDomain}
                    {previewPath}
                  </p>
                </div>
              </div>

              {/* Clickable blue link */}
              <h6 className="text-lg text-[#1a0dab] hover:underline cursor-pointer font-normal leading-tight break-words">
                {previewTitle}
              </h6>

              {/* Description snippet */}
              <p className="text-[13px] text-[#4d5156] leading-relaxed break-words font-normal">
                <span className="text-gray-400 text-xs font-mono">
                  {seo.indexInSearch !== false ? "" : "⚠️ [NOINDEXED] "}
                </span>
                {previewDesc}
              </p>
            </div>
            <p className="text-[10px] text-gray-400 text-center italic">
              * Simulated Google Desktop view. Real placement depends on rank,
              device, and engine preferences.
            </p>
          </div>

          {/* Facebook / LinkedIn Card Preview (Rich Landscape) */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h5 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-[#01AC9F]" />
              Facebook & LinkedIn Card Preview
            </h5>

            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-gray-50">
              <div className="aspect-[1.91/1] w-full bg-gray-100 relative overflow-hidden">
                <img
                  src={previewImage}
                  alt="Social Card cover"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-4 bg-white border-t border-gray-100 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono">
                  {previewDomain}
                </p>
                <h6 className="text-sm font-bold text-gray-800 line-clamp-1 leading-snug">
                  {previewTitle}
                </h6>
                <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                  {previewDesc}
                </p>
              </div>
            </div>
          </div>

          {/* X (Twitter) Preview */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h5 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-gray-800" />X Card Config
              </h5>

              <select
                value={seo.xCardType || "Large Summary Card"}
                onChange={(e) => handleSeoChange("xCardType", e.target.value)}
                className="bg-gray-100 border-none rounded-lg px-2.5 py-1 text-[10px] font-bold text-gray-600 focus:outline-none cursor-pointer"
              >
                <option value="Large Summary Card">
                  Summary with Large Image
                </option>
                <option value="Standard Summary">Standard Summary Card</option>
              </select>
            </div>

            {seo.xCardType === "Large Summary Card" ? (
              <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm bg-white p-3 space-y-2">
                <div className="aspect-[2/1] rounded-xl overflow-hidden bg-gray-100">
                  <img
                    src={previewImage}
                    alt=""
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="px-1.5 space-y-0.5">
                  <p className="text-[10px] text-gray-400 font-mono">
                    {previewDomain}
                  </p>
                  <h6 className="text-xs font-bold text-gray-800 line-clamp-1">
                    {previewTitle}
                  </h6>
                  <p className="text-[10px] text-gray-500 line-clamp-1 leading-normal">
                    {previewDesc}
                  </p>
                </div>
              </div>
            ) : (
              <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm bg-white p-3 flex gap-3 items-center">
                <img
                  src={previewImage}
                  alt=""
                  className="w-16 h-16 rounded-xl object-cover bg-gray-100 shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="space-y-0.5 min-w-0">
                  <p className="text-[10px] text-gray-400 font-mono">
                    {previewDomain}
                  </p>
                  <h6 className="text-xs font-bold text-gray-800 line-clamp-1">
                    {previewTitle}
                  </h6>
                  <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed">
                    {previewDesc}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
