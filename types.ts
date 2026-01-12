
export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  genre: string | null;
  file_url: string;
  cover_url: string | null;
  duration: number;
  embed_code: string | null;
  created_at: string;
  is_featured?: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  song_count?: number;
}

export interface Ad {
  id: string;
  image_url: string;
  link_url?: string;
  created_at: string;
}

export interface GenreBranding {
  id: string;
  name: string;
  image_url: string;
  color: string;
}

export interface UISection {
  id: string;
  type: 'banner' | 'genres' | 'tracks' | 'playlist' | 'ads';
  title: string;
  order_index: number;
  settings?: any;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'super-admin';
}
