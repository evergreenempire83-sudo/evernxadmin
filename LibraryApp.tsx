import React, { useState, createContext, useContext, useEffect, useRef } from 'react';
import { Routes, Route, Link, useLocation, Outlet } from 'react-router-dom';
import { 
  Home as HomeIcon, 
  Compass, 
  Library as LibraryIcon, 
  Search, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  Heart,
  MoreHorizontal,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Music,
  PlusCircle,
  Repeat,
  Repeat1,
  FastForward,
  Rewind,
  Plus,
  Check
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Song, Playlist, Ad, GenreBranding, UISection } from '../types';

const LOGO_URL = "https://vinxbbpboupirnyxwghz.supabase.co/storage/v1/object/public/Ever-Music/file_00000000535c71f4a154bd2a598fddd0.png";

const FALLBACK_GENRES: GenreBranding[] = [
  { id: '1', name: 'RnB', color: 'from-rose-600', image_url: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?auto=format&fit=crop&q=80&w=800' },
  { id: '2', name: 'Pop', color: 'from-blue-600', image_url: 'https://images.unsplash.com/photo-1514525253361-bee8718a747c?auto=format&fit=crop&q=80&w=800' },
  { id: '3', name: 'HipHop', color: 'from-amber-600', image_url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=800' },
  { id: '4', name: 'EDM', color: 'from-purple-600', image_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800' },
];

interface AudioContextType {
  currentSong: Song | null;
  queue: Song[];
  isPlaying: boolean;
  repeatMode: 'none' | 'one' | 'all';
  activeAd: Ad | null;
  playSong: (song: Song, songsList?: Song[]) => void;
  togglePlay: () => void;
  skipForward: () => void;
  skipBackward: () => void;
  toggleRepeat: () => void;
  seek: (seconds: number) => void;
  openPlaylistSelector: (song: Song) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);
const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) throw new Error("useAudio must be used within AudioProvider");
  return context;
};

const LibraryApp: React.FC = () => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [queue, setQueue] = useState<Song[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none');
  const [ads, setAds] = useState<Ad[]>([]);
  const [activeAd, setActiveAd] = useState<Ad | null>(null);
  const [selectingSong, setSelectingSong] = useState<Song | null>(null);

  useEffect(() => {
    supabase.from('ads').select('*').then(({ data }) => {
      if (data && data.length > 0) {
        setAds(data);
        setActiveAd(data[0]);
      }
    });
  }, []);

  const playSong = (song: Song, songsList?: Song[]) => {
    setCurrentSong(song);
    if (songsList) setQueue(songsList);
    setIsPlaying(true);
    if (ads.length > 0) {
      const nextAdIdx = (ads.findIndex(a => a.id === activeAd?.id) + 1) % ads.length;
      setActiveAd(ads[nextAdIdx]);
    }
  };

  const skipForward = () => {
    if (!currentSong || queue.length === 0) return;
    const idx = queue.findIndex(s => s.id === currentSong.id);
    if (idx < queue.length - 1) playSong(queue[idx + 1]);
    else if (repeatMode === 'all') playSong(queue[0]);
  };

  const skipBackward = () => {
    if (!currentSong || queue.length === 0) return;
    const idx = queue.findIndex(s => s.id === currentSong.id);
    if (idx > 0) playSong(queue[idx - 1]);
    else if (repeatMode === 'all') playSong(queue[queue.length - 1]);
  };

  const toggleRepeat = () => {
    setRepeatMode(prev => prev === 'none' ? 'all' : prev === 'all' ? 'one' : 'none');
  };

  const seek = (seconds: number) => {
    const audio = document.querySelector('audio') as HTMLAudioElement;
    if (audio) audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds));
  };

  const openPlaylistSelector = (song: Song) => setSelectingSong(song);

  return (
    <AudioContext.Provider value={{ currentSong, queue, isPlaying, repeatMode, activeAd, playSong, togglePlay: () => setIsPlaying(!isPlaying), skipForward, skipBackward, toggleRepeat, seek, openPlaylistSelector }}>
      {selectingSong && <PlaylistSelectorModal song={selectingSong} onClose={() => setSelectingSong(null)} />}
      <Routes>
        <Route element={<LibraryLayout />}>
          <Route index element={<LibraryHome />} />
          <Route path="explore" element={<LibraryExplore />} />
          <Route path="playlists" element={<LibraryCollections />} />
        </Route>
      </Routes>
    </AudioContext.Provider>
  );
};

const LibraryLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const SidebarContent = ({ onNavClick }: any) => {
    const NavItem = ({ to, icon: Icon, label }: any) => (
      <Link 
        to={to} 
        onClick={onNavClick}
        className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all group ${location.pathname === to ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30' : 'text-slate-600 hover:text-white hover:bg-white/5'} ${collapsed && !mobileMenuOpen ? 'justify-center px-0' : ''}`}
      >
        <Icon size={22} className={location.pathname === to ? 'text-white' : 'text-slate-600 group-hover:text-indigo-400'} />
        {(!collapsed || mobileMenuOpen) && <span>{label}</span>}
      </Link>
    );

    return (
      <div className="flex flex-col h-full text-left">
        <div className={`flex items-center ${collapsed && !mobileMenuOpen ? 'justify-center' : 'gap-3 px-2'} h-12`}>
          <img src={LOGO_URL} className="w-10 h-10" alt="Logo" />
          {(!collapsed || mobileMenuOpen) && <h1 className="text-2xl font-black tracking-tighter text-white uppercase">EvernX Music</h1>}
        </div>
        <nav className="flex-1 space-y-2 mt-12">
          <NavItem to="/" icon={HomeIcon} label="Home" />
          <NavItem to="/explore" icon={Compass} label="Discover" />
          <NavItem to="/playlists" icon={LibraryIcon} label="Library" />
        </nav>
        {(!collapsed || mobileMenuOpen) && (
          <div className="p-8 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[35px] relative overflow-hidden shadow-2xl mb-8">
             <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 relative z-10">Premium Member</p>
             <h4 className="text-lg font-black text-white mt-1 relative z-10">Exclusive Pass</h4>
             <Music size={100} className="absolute -right-10 -bottom-10 text-white/10 -rotate-12" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-[#01030a] text-slate-200 overflow-x-hidden">
      <aside className={`hidden md:flex flex-col ${collapsed ? 'w-24' : 'w-80'} bg-[#05070a] border-r border-white/5 p-8 transition-all duration-500 h-screen sticky top-0`}>
        <SidebarContent />
        <button onClick={() => setCollapsed(!collapsed)} className="mt-6 w-full flex items-center justify-center p-4 bg-white/5 hover:bg-white/10 text-slate-600 rounded-2xl transition-all">
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </aside>
      <div className={`fixed inset-0 z-[100] md:hidden transition-all duration-500 ${mobileMenuOpen ? 'visible' : 'invisible'}`}>
        <div className={`absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity duration-500 ${mobileMenuOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setMobileMenuOpen(false)}></div>
        <div className={`absolute top-0 left-0 w-80 h-full bg-[#05070a] p-8 transition-transform duration-500 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <SidebarContent onNavClick={() => setMobileMenuOpen(false)} />
        </div>
      </div>
      <main className="flex-1 overflow-y-auto px-6 md:px-16 pt-8 md:pt-12 no-scrollbar relative custom-scrollbar">
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-3 bg-white/5 rounded-xl text-white active:scale-90 transition-transform"><Menu size={20} /></button>
            <div className="relative w-48 sm:w-80 md:w-[450px]">
              <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-700" />
              <input type="text" placeholder="Search for tracks..." className="w-full bg-[#080a15] border border-white/5 rounded-2xl py-4 pl-14 pr-8 text-sm outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all font-bold" />
            </div>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center font-black shadow-xl">U</div>
        </header>
        <div className="max-w-[1400px] mx-auto text-left"><Outlet /></div>
      </main>
      <LibraryPlayer />
    </div>
  );
};

const LibraryPlayer = () => {
  const { currentSong, isPlaying, togglePlay, skipForward, skipBackward, repeatMode, toggleRepeat, seek } = useAudio();
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.play().catch(() => {});
      else audioRef.current.pause();
    }
  }, [isPlaying, currentSong]);

  const onTimeUpdate = () => {
    if (audioRef.current) setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
  };

  const handleEnded = () => {
    if (repeatMode === 'one' && audioRef.current) {
      audioRef.current.currentTime = 0; audioRef.current.play();
    } else skipForward();
  };

  if (!currentSong) return null;

  return (
    <footer className="fixed bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 w-[94%] max-w-7xl flex flex-col gap-4 z-50 animate-in slide-in-from-bottom-10 duration-700">
      <div className="h-20 md:h-24 glass border border-white/10 rounded-[28px] md:rounded-[40px] px-4 md:px-10 flex items-center justify-between shadow-[0_32px_80px_rgba(0,0,0,0.9)]">
        <audio key={currentSong.id} ref={audioRef} src={currentSong.file_url} onTimeUpdate={onTimeUpdate} onEnded={handleEnded} />
        <div className="flex items-center gap-3 md:gap-5 flex-1 min-w-0 md:w-1/4 text-left">
          <img src={currentSong.cover_url || ""} className="w-12 h-12 md:w-16 md:h-16 rounded-2xl object-cover shadow-xl" />
          <div className="min-w-0">
            <p className="font-black text-white truncate text-xs md:text-base tracking-tight">{currentSong.title}</p>
            <p className="text-[9px] md:text-xs font-extrabold text-indigo-400 truncate mt-0.5 uppercase tracking-widest">{currentSong.artist}</p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2 md:gap-3 flex-1 md:max-w-xl px-2 md:px-12">
          <div className="flex items-center gap-3 md:gap-6">
            <button onClick={toggleRepeat} className={`transition-colors ${repeatMode !== 'none' ? 'text-indigo-400' : 'text-slate-700 hover:text-white'}`}>
              {repeatMode === 'one' ? <Repeat1 size={20} /> : <Repeat size={20} />}
            </button>
            <button onClick={() => seek(-10)} className="text-slate-600 hover:text-white transition-colors"><Rewind size={22} fill="currentColor" /></button>
            <button onClick={skipBackward} className="text-slate-600 hover:text-white transition-colors"><SkipBack size={24} fill="currentColor" /></button>
            <button onClick={togglePlay} className="w-10 h-10 md:w-14 md:h-14 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-2xl">
              {isPlaying ? <Pause size={28} fill="black" /> : <Play size={28} fill="black" className="ml-1" />}
            </button>
            <button onClick={skipForward} className="text-slate-600 hover:text-white transition-colors"><SkipForward size={24} fill="currentColor" /></button>
            <button onClick={() => seek(10)} className="text-slate-600 hover:text-white transition-colors"><FastForward size={22} fill="currentColor" /></button>
            <button className="hidden sm:block text-slate-700 hover:text-white transition-colors"><Heart size={20} /></button>
          </div>
          <div className="w-full flex items-center gap-3">
            <div className="flex-1 h-1 bg-white/5 rounded-full relative overflow-hidden cursor-pointer group" onClick={(e) => {
              if (!audioRef.current) return;
              const rect = e.currentTarget.getBoundingClientRect();
              audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * audioRef.current.duration;
            }}>
              <div className="absolute left-0 top-0 h-full bg-indigo-500 shadow-[0_0_10px_#6366f1]" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </div>
        <div className="hidden lg:flex items-center justify-end gap-8 w-1/4">
          <Volume2 size={18} className="text-slate-600" />
          <MoreHorizontal size={20} className="text-slate-600 cursor-pointer hover:text-white" />
        </div>
      </div>
    </footer>
  );
};

const LibraryHome = () => {
  const [sections, setSections] = useState<UISection[]>([]);
  const { playSong, openPlaylistSelector, activeAd } = useAudio();

  useEffect(() => {
    supabase.from('ui_sections').select('*').order('order_index').then(({ data }) => {
      if (data && data.length > 0) setSections(data);
      else setSections([
        { id: '1', type: 'banner', title: 'Featured Banner', order_index: 0 },
        { id: '2', type: 'genres', title: 'Popular Genres', order_index: 1 },
        { id: '3', type: 'tracks', title: 'Weekly Discovery', order_index: 2 }
      ]);
    });
  }, []);

  return (
    <div className="space-y-16 pb-40 animate-in fade-in duration-1000">
      {sections.map(section => {
        switch (section.type) {
          case 'banner': return <BannerSection key={section.id} playSong={playSong} />;
          case 'genres': return <GenreRow key={section.id} />;
          case 'tracks': return <TrackGrid key={section.id} title={section.title} playSong={playSong} openPlaylistSelector={openPlaylistSelector} />;
          case 'ads': return <AdSection key={section.id} activeAd={activeAd} />;
          default: return null;
        }
      })}
    </div>
  );
};

const BannerSection = ({ playSong }: any) => {
  const [featured, setFeatured] = useState<Song[]>([]);
  useEffect(() => {
    supabase.from('songs').select('*').eq('is_featured', true).limit(1).then(({ data }) => {
      if (data) setFeatured(data);
    });
  }, []);
  if (featured.length === 0) return null;
  return (
    <section className="relative h-64 md:h-[500px] rounded-[32px] md:rounded-[50px] overflow-hidden group shadow-2xl">
      <img src={featured[0]?.cover_url || ""} className="w-full h-full object-cover brightness-[0.4] scale-105 group-hover:scale-110 transition-transform duration-[10s]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#01030a] via-[#01030a]/20 to-transparent"></div>
      <div className="absolute bottom-6 left-6 md:bottom-16 md:left-16 space-y-4 md:space-y-6 max-w-2xl text-left">
        <h1 className="text-3xl md:text-7xl font-black text-white tracking-tighter leading-none">{featured[0]?.title}</h1>
        <p className="text-slate-400 text-sm md:text-xl font-bold tracking-tight">by <span className="text-white">{featured[0]?.artist}</span></p>
        <button onClick={() => playSong(featured[0], featured)} className="bg-white text-black font-black px-8 py-3 md:px-12 md:py-5 rounded-2xl flex items-center gap-3 hover:scale-105 transition-all shadow-2xl text-xs md:text-sm uppercase tracking-widest"><Play size={20} fill="black" /> LISTEN NOW</button>
      </div>
    </section>
  );
};

const GenreRow = () => {
  const [genres, setGenres] = useState<GenreBranding[]>([]);
  useEffect(() => {
    supabase.from('genre_branding').select('*').order('name').then(({ data }) => {
      if (data && data.length > 0) setGenres(data);
      else setGenres(FALLBACK_GENRES);
    });
  }, []);
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between text-left"><h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Popular Genres</h2></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {genres.map(genre => (
          <Link key={genre.id} to={`/explore?genre=${genre.name}`} className="relative group h-32 md:h-48 rounded-[32px] overflow-hidden shadow-2xl transition-transform active:scale-95">
            <img src={genre.image_url} className="w-full h-full object-cover brightness-50 group-hover:scale-110 transition-transform duration-700" />
            <div className={`absolute inset-0 bg-gradient-to-t ${genre.color || 'from-indigo-600'} to-transparent opacity-40`}></div>
            <div className="absolute inset-0 flex items-center justify-center"><h3 className="text-xl md:text-3xl font-black text-white tracking-tighter drop-shadow-2xl">{genre.name}</h3></div>
          </Link>
        ))}
      </div>
    </section>
  );
};

const TrackGrid = ({ title, playSong, openPlaylistSelector }: any) => {
  const [songs, setSongs] = useState<Song[]>([]);
  useEffect(() => {
    supabase.from('songs').select('*').limit(6).then(({ data }) => { if (data) setSongs(data); });
  }, []);
  return (
    <section className="space-y-8">
      <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight text-left">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {songs.map(song => (
          <div key={song.id} className="group bg-[#080a15] border border-white/5 p-4 rounded-[30px] flex items-center gap-4 hover:bg-white/[0.04] transition-all shadow-xl">
            <div className="relative w-16 h-16 flex-shrink-0 cursor-pointer" onClick={() => playSong(song, songs)}>
              <img src={song.cover_url || ""} className="w-full h-full object-cover rounded-2xl shadow-lg" />
              <div className="absolute inset-0 bg-indigo-600/60 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-2xl transition-all"><Play size={24} fill="white" className="text-white" /></div>
            </div>
            <div className="flex-1 min-w-0 text-left cursor-pointer" onClick={() => playSong(song, songs)}><p className="font-black text-white text-base truncate tracking-tight">{song.title}</p><p className="text-xs font-bold text-slate-500 mt-0.5 uppercase tracking-widest">{song.artist}</p></div>
            <div className="flex items-center gap-2">
              <button onClick={() => openPlaylistSelector(song)} className="p-2 text-slate-800 hover:text-indigo-400 transition-colors"><Plus size={20} /></button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const AdSection = ({ activeAd }: any) => {
  if (!activeAd) return null;
  return (
    <section className="w-full flex justify-center">
      <div className="w-full max-w-4xl relative aspect-[16/5] rounded-[40px] overflow-hidden shadow-2xl border border-white/5 group">
        <img src={activeAd.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[10s]" />
      </div>
    </section>
  );
};

const LibraryExplore = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const { playSong, openPlaylistSelector } = useAudio();
  useEffect(() => {
    supabase.from('songs').select('*').then(({ data }) => { if (data) setSongs(data); });
  }, []);
  return (
    <div className="space-y-12 pb-40 animate-in fade-in duration-700">
      <div className="text-left"><h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter">Global Discovery</h2></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {songs.map(song => (
          <div key={song.id} className="group bg-[#080a15] border border-white/5 p-5 rounded-[40px] flex items-center gap-5 hover:bg-white/[0.04] transition-all shadow-2xl">
            <div className="relative w-20 h-20 flex-shrink-0 cursor-pointer" onClick={() => playSong(song, songs)}>
              <img src={song.cover_url || ""} className="w-full h-full object-cover rounded-3xl shadow-xl" />
              <div className="absolute inset-0 bg-indigo-600/60 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-3xl transition-all"><Play size={28} fill="white" /></div>
            </div>
            <div className="flex-1 min-w-0 text-left cursor-pointer" onClick={() => playSong(song, songs)}><p className="font-black text-white text-lg truncate tracking-tight">{song.title}</p><p className="text-[10px] font-black text-slate-500 mt-1 uppercase tracking-widest">{song.artist}</p></div>
            <div className="flex items-center gap-2"><button onClick={() => openPlaylistSelector(song)} className="p-3 bg-white/5 rounded-2xl text-slate-600 hover:text-indigo-400 transition-all"><Plus size={20} /></button></div>
          </div>
        ))}
      </div>
    </div>
  );
};

const LibraryCollections = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  useEffect(() => {
    supabase.from('playlists').select('*').then(({ data }) => data && setPlaylists(data));
  }, []);
  return (
    <div className="space-y-12 pb-40 animate-in fade-in duration-700">
      <div className="text-left"><h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter">Library</h2></div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-8 text-left">
        {playlists.map(pl => (
          <div key={pl.id} className="group cursor-pointer">
            <div className="relative aspect-square mb-4 overflow-hidden rounded-[40px] bg-[#080a10] border border-white/5 shadow-2xl transition-all hover:translate-y-[-8px]">
              <div className="absolute inset-0 flex items-center justify-center text-indigo-500/5 group-hover:scale-110 transition-transform"><LibraryIcon size={120} /></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all"><div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-2xl text-black"><Play fill="black" size={24} /></div></div>
            </div>
            <h4 className="text-base md:text-lg font-black text-white group-hover:text-indigo-400 transition-colors mb-1 tracking-tight">{pl.name}</h4>
            <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-widest">{pl.song_count || 0} Songs</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const PlaylistSelectorModal = ({ song, onClose }: { song: Song; onClose: () => void }) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('playlists').select('*').then(({ data }) => {
      if (data) setPlaylists(data);
      setLoading(false);
    });
  }, []);

  const addToPlaylist = async (playlistId: string) => {
    try {
      await supabase.from('playlist_songs').insert({ playlist_id: playlistId, song_id: song.id });
    } catch (e) {
      console.warn("junction table might not exist");
    }
    setAddedId(playlistId);
    setTimeout(() => {
      setAddedId(null);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in">
      <div className="bg-[#080a15] border border-white/10 rounded-[40px] p-10 w-full max-w-md shadow-2xl space-y-8">
        <div className="flex justify-between items-center text-left">
          <div>
            <h3 className="text-2xl font-black text-white">Add to Playlist</h3>
            <p className="text-slate-500 text-xs font-bold mt-1 truncate max-w-[200px]">{song.title}</p>
          </div>
          <X className="text-slate-500 cursor-pointer hover:text-white transition-colors" onClick={onClose} />
        </div>
        <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
          {playlists.length === 0 && !loading && <p className="text-slate-600 text-center py-4 font-bold">No playlists found.</p>}
          {playlists.map(pl => (
            <button 
              key={pl.id} 
              onClick={() => addToPlaylist(pl.id)}
              className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center text-indigo-400">
                  <Music size={18} />
                </div>
                <span className="font-bold text-white text-sm">{pl.name}</span>
              </div>
              {addedId === pl.id ? <Check className="text-emerald-500" size={18} /> : <Plus className="text-slate-600 group-hover:text-white" size={18} />}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="w-full py-4 rounded-2xl font-black text-slate-500 hover:text-white transition-colors uppercase tracking-widest text-xs">Cancel</button>
      </div>
    </div>
  );
};

export default LibraryApp;