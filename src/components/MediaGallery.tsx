import React, { useState } from 'react';
import { MediaItem } from '../types';
import { Camera, Plus, X, Image as ImageIcon, Calendar } from 'lucide-react';

interface MediaGalleryProps {
  media: MediaItem[];
  onAddMedia: (item: MediaItem) => void;
  lang: 'en' | 'si';
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({ media, onAddMedia, lang }) => {
  const [selectedAlbum, setSelectedAlbum] = useState<string>('All');
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Upload Form
  const [title, setTitle] = useState('');
  const [album, setAlbum] = useState('Cricket 2026');
  const [sport, setSport] = useState<any>('Cricket');
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [photographer, setPhotographer] = useState('Club Media Team');

  const albums = ['All', 'Trophy Gallery', 'Cricket 2026', 'Volleyball Cup', 'Club Life'];

  const filteredMedia = media.filter((m) => {
    return selectedAlbum === 'All' || m.album === selectedAlbum;
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    const newItem: MediaItem = {
      id: `media-${Date.now()}`,
      title: title.trim(),
      album,
      sport,
      date: new Date().toISOString().split('T')[0],
      url: url.trim(),
      caption: caption.trim() || title.trim(),
      photographer: photographer.trim() || 'Club Archive',
    };

    onAddMedia(newItem);
    setIsUploadOpen(false);
    setTitle('');
    setUrl('');
    setCaption('');
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            {lang === 'si' ? 'ක්‍රීඩා සමාජ ඡායාරූප සහ මතක එකතුව' : 'Photo & Media Gallery'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'si'
              ? 'ශූරතා කුසලාන, තරඟ අවස්ථා සහ ප්‍රජා සත්කාරක වැඩසටහන්'
              : 'Match action photos, trophy celebrations, and community shramadana albums'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Photo</span>
          </button>
        </div>
      </div>

      {/* Album Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {albums.map((alb) => (
          <button
            key={alb}
            onClick={() => setSelectedAlbum(alb)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              selectedAlbum === alb
                ? 'bg-slate-900 text-amber-400 shadow-sm border border-slate-700'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {alb}
          </button>
        ))}
      </div>

      {/* Photos Masonry / Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMedia.map((item) => (
          <div
            key={item.id}
            onClick={() => setPreviewItem(item)}
            className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition cursor-pointer flex flex-col justify-between"
          >
            <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
              <img
                src={item.url}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                loading="lazy"
              />
              <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-amber-300 text-[10px] font-bold px-2.5 py-1 rounded-md">
                {item.album}
              </span>
            </div>

            <div className="p-4 space-y-1.5">
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition leading-snug">
                {item.title}
              </h3>
              <p className="text-xs text-slate-500 line-clamp-2">{item.caption}</p>

              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-amber-500" />
                  {item.date}
                </span>
                <span>{item.photographer || 'Club Archive'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="relative">
              <img
                src={previewItem.url}
                alt={previewItem.title}
                className="w-full max-h-[60vh] object-cover"
              />
              <button
                onClick={() => setPreviewItem(null)}
                className="absolute top-3 right-3 p-1.5 bg-slate-900/70 hover:bg-slate-900 text-white rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-600">{previewItem.album}</span>
                <span className="text-xs text-slate-400">{previewItem.date}</span>
              </div>
              <h3 className="text-lg font-black text-slate-900">{previewItem.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{previewItem.caption}</p>
              {previewItem.photographer && (
                <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                  Photo credit: {previewItem.photographer}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Photo Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Camera className="w-5 h-5 text-amber-500" />
              <span>Add Photo to Club Gallery</span>
            </h3>

            <form onSubmit={handleUploadSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Photo Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Volleyball Victory Celebrations"
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Image URL *</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Album</label>
                  <select
                    value={album}
                    onChange={(e) => setAlbum(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="Cricket 2026">Cricket 2026</option>
                    <option value="Volleyball Cup">Volleyball Cup</option>
                    <option value="Trophy Gallery">Trophy Gallery</option>
                    <option value="Club Life">Club Life</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Sport</label>
                  <select
                    value={sport}
                    onChange={(e) => setSport(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="Cricket">Cricket</option>
                    <option value="Volleyball">Volleyball</option>
                    <option value="Football">Football</option>
                    <option value="Club Life">Club Life</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Caption / Story</label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={2}
                  placeholder="Details about the match, score, or event..."
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm"
                >
                  Save Photo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
