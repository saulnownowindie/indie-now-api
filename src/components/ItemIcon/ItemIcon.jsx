import { 
  Music, 
  Shirt, 
  Star, 
  Disc, 
  Mic, 
  Video, 
  Newspaper,
  Instagram,
  Youtube,
  Radio,
  Headphones,
  ShoppingBag
} from "lucide-react";

const icons = {
  Music,
  Shirt,
  Star,
  Disc,
  Mic,
  Video,
  Newspaper,
  Instagram,
  Youtube,
  Radio,
  Headphones,
  ShoppingBag,
};

export default function ItemIcon({ name, size = 16, className = "" }) {
  const IconComponent = icons[name] || Star; // Si no encuentra el icono, muestra una estrella
  return <IconComponent size={size} className={className} />;
}
