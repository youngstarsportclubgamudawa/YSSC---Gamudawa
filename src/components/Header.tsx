import React, { useState } from 'react';
import { Trophy, Users, Shield, Calendar, DollarSign, Camera, FileText, Globe, Share2, Menu, X } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  lang: 'en' | 'si';
  onLangToggle: () => void;
  liveMatchCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  lang,
  onLangToggle,
  liveMatchCount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    {
      id: 'scorecard',
      labelEn: 'Live Scores',
      labelSi: 'සජීවී ලකුණු',
      icon: Trophy,
      badge: liveMatchCount > 0 ? 'LIVE' : undefined,
    },
    {
      id: 'members',
      labelEn: 'Members',
      labelSi: 'සාමාජිකයින්',
      icon: Users,
    },
    {
      id: 'squads',
      labelEn: 'Squads & Teams',
      labelSi: 'කණ්ඩායම්',
      icon: Shield,
    },
    {
      id: 'tournaments',
      labelEn: 'Tournaments',
      labelSi: 'තරඟාවලි',
      icon: Calendar,
    },
    {
      id: 'finances',
      labelEn: 'Weekly Dues',
      labelSi: 'සති මුදල්',
      icon: DollarSign,
    },
    {
      id: 'gallery',
      labelEn: 'Media Gallery',
      labelSi: 'ඡායාරූප',
      icon: Camera,
    },
    {
      id: 'committee',
      labelEn: 'Committee & Docs',
      labelSi: 'කාරක සභාව',
      icon: FileText,
    },
  ];

  const handleShareToWhatsApp = () => {
    const text = encodeURIComponent(
      `🏆 Young Star Sports Club Gamudawa (තරුණ තරු ක්‍රීඩා සමාජය ගම්උදාව)\nCheck out our official portal for live match scorecards, tournaments, and member updates!\n${window.location.href}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      {/* Top Banner strip with club identity */}
      <div className="bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-semibold tracking-wide flex justify-between items-center">
        <div className="flex items-center gap-2 truncate">
          <span className="w-2 h-2 rounded-full bg-emerald-700 animate-ping inline-block" />
          <span>{lang === 'si' ? 'තරුණ තරු ක්‍රීඩා සමාජය ගම්උදාව · නිල කළමනාකරණ පද්ධතිය' : 'Young Star Sports Club Gamudawa · Official Sports & Club Portal'}</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium shrink-0">
          <span className="hidden sm:inline">Reg: DS/SP/2018/14</span>
          <span>Gamudawa, Sri Lanka</span>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Club Name */}
          <div
            className="flex items-center gap-3.5 cursor-pointer"
            onClick={() => onTabChange('scorecard')}
          >
            {/* Club Crest */}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-lg border border-amber-300 text-slate-950 font-black text-xl tracking-tighter">
              <span className="text-xl">⭐</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-bold tracking-tight text-white leading-tight">
                  Young Star SC
                </span>
                <span className="text-xs bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded border border-amber-400/30 font-semibold tracking-wider">
                  GAMUDAWA
                </span>
              </div>
              <p className="text-xs text-amber-200/90 font-medium tracking-normal">
                {lang === 'si' ? 'තරුණ තරු ක්‍රීඩා සමාජය ගම්උදාව' : 'Tharuna Tharu Sports Club · Est. 2018'}
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2.5">
            {/* WhatsApp Share */}
            <button
              onClick={handleShareToWhatsApp}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition shadow-sm active:scale-95"
              title="Share portal to WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            {/* Language Switcher */}
            <button
              onClick={onLangToggle}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition"
              title="Toggle Sinhala / English"
            >
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === 'en' ? 'සිංහල' : 'English'}</span>
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 border-t border-slate-800/80 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>{lang === 'si' ? item.labelSi : item.labelEn}</span>
                {item.badge && (
                  <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-red-600 text-white rounded-full font-bold animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-950 border-b border-slate-800 px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{lang === 'si' ? item.labelSi : item.labelEn}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] px-2 py-0.5 bg-red-600 text-white rounded-full font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                handleShareToWhatsApp();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-lg"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Portal via WhatsApp</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
